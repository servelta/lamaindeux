-- =============================================================================
-- MonPlombier — Initial schema (Phase 1)
-- =============================================================================
-- Conventions:
--   - UUID primary keys, default gen_random_uuid()
--   - created_at / updated_at timestamptz on every table
--   - Enums for closed status sets; text for open-ended small lookup fields
--   - RLS is enabled on every table; policies live in 0002_rls_policies.sql
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

create type user_role as enum ('customer', 'plumber', 'admin');

create type plumber_status as enum (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED'
);

create type booking_status as enum (
  'PENDING',
  'CONFIRMED',
  'ACCEPTED',
  'COMPLETED',
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_PLUMBER',
  'NO_SHOW',
  'DISPUTED'
);

create type pricing_type as enum ('fixed', 'quote');

create type contract_status as enum ('not_signed', 'signed');

create type payment_status as enum ('not_received', 'received');

create type document_type as enum ('identity', 'qualification', 'insurance', 'other');

-- -----------------------------------------------------------------------------
-- PROFILES (1:1 with auth.users)
-- -----------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  first_name text not null,
  last_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'One row per auth.users row. Role drives all RBAC in middleware and RLS.';

-- -----------------------------------------------------------------------------
-- CUSTOMERS
-- -----------------------------------------------------------------------------

create table customers (
  profile_id uuid primary key references profiles(id) on delete cascade,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- CITIES
-- -----------------------------------------------------------------------------

create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  -- postcode prefixes this city page should match against, e.g. {'750'} for all Paris arrondissements
  postcode_prefixes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_cities_active on cities(active);

-- -----------------------------------------------------------------------------
-- SERVICES (platform-wide catalog, admin-managed)
-- -----------------------------------------------------------------------------

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category text,
  default_pricing_type pricing_type not null default 'fixed',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_active on services(active);

-- -----------------------------------------------------------------------------
-- PLATFORM SETTINGS (singleton row)
-- -----------------------------------------------------------------------------

create table platform_settings (
  id boolean primary key default true constraint platform_settings_singleton check (id),
  platform_name text not null default 'MonPlombier',
  logo_url text,
  support_email text not null default 'contact@monplombier.fr',
  default_subscription_price_cents int not null default 2900, -- €29.00 default, configurable
  stripe_payment_link_url text,
  cancellation_policy text,
  sms_enabled boolean not null default false,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into platform_settings (id) values (true);

-- -----------------------------------------------------------------------------
-- PLUMBERS
-- -----------------------------------------------------------------------------

create table plumbers (
  profile_id uuid primary key references profiles(id) on delete cascade,
  company_name text not null,
  slug text not null unique, -- used in /plombier/[slug]
  siret text,
  siren text,
  business_address text,
  business_postcode text,
  business_city text,
  website text,
  description text,
  years_experience int,
  status plumber_status not null default 'PENDING',
  status_reason text, -- e.g. rejection reason, admin note

  -- Contract & payment (manual process, Section 22)
  contract_status contract_status not null default 'not_signed',
  contract_signed_at timestamptz,
  payment_status payment_status not null default 'not_received',
  payment_date timestamptz,
  subscription_start date,
  subscription_end date,
  stripe_payment_link_url text, -- can override the platform default per plumber if needed

  rating_avg numeric(2,1) not null default 0.0,
  rating_count int not null default 0,
  completed_jobs_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_plumbers_status on plumbers(status);
create index idx_plumbers_city on plumbers(business_city);

comment on column plumbers.status is
  'Only ACTIVE plumbers are joined into the public active_plumbers view used by search.';

-- -----------------------------------------------------------------------------
-- PLUMBER DOCUMENTS (private — never public)
-- -----------------------------------------------------------------------------

create table plumber_documents (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  doc_type document_type not null,
  storage_path text not null, -- path in the private Supabase Storage bucket
  verified_at timestamptz,
  verified_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

create index idx_plumber_documents_plumber on plumber_documents(plumber_id);

-- -----------------------------------------------------------------------------
-- PLUMBER SERVICES (services a given plumber offers, with their own price)
-- -----------------------------------------------------------------------------

create table plumber_services (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  pricing_type pricing_type not null default 'fixed',
  price_cents int, -- null when pricing_type = 'quote'
  duration_minutes int,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (plumber_id, service_id),
  constraint fixed_price_requires_amount check (
    (pricing_type = 'quote') or (pricing_type = 'fixed' and price_cents is not null)
  )
);

create index idx_plumber_services_plumber on plumber_services(plumber_id);
create index idx_plumber_services_service on plumber_services(service_id);
create index idx_plumber_services_active on plumber_services(active);

-- -----------------------------------------------------------------------------
-- PLUMBER SERVICE AREAS
-- -----------------------------------------------------------------------------

create table plumber_service_areas (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  city_id uuid not null references cities(id) on delete cascade,
  postcodes text[] not null default '{}', -- specific postcodes within the city; empty = whole city
  created_at timestamptz not null default now(),

  unique (plumber_id, city_id)
);

create index idx_plumber_service_areas_city on plumber_service_areas(city_id);

-- -----------------------------------------------------------------------------
-- AVAILABILITY (recurring weekly hours + one-off exceptions)
-- -----------------------------------------------------------------------------

create table availability (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),

  check (end_time > start_time)
);

create index idx_availability_plumber on availability(plumber_id);

create table availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  date date not null,
  start_time time, -- null = whole day blocked
  end_time time,
  reason text,
  created_at timestamptz not null default now()
);

create index idx_availability_exceptions_plumber_date on availability_exceptions(plumber_id, date);

-- -----------------------------------------------------------------------------
-- BOOKINGS
-- -----------------------------------------------------------------------------

create sequence booking_number_seq;

create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique,

  customer_id uuid not null references customers(profile_id) on delete restrict,
  plumber_id uuid not null references plumbers(profile_id) on delete restrict,
  plumber_service_id uuid not null references plumber_services(id) on delete restrict,

  status booking_status not null default 'CONFIRMED',

  scheduled_date date not null,
  scheduled_time time not null,

  -- Snapshot of customer-provided contact/address at booking time
  -- (kept even if the customer later edits their profile).
  contact_first_name text not null,
  contact_last_name text not null,
  contact_phone text not null,
  contact_email text not null,
  address_line text not null,
  postcode text not null,
  city text not null,

  description text,
  photo_urls text[] not null default '{}',

  -- Snapshot pricing at time of booking (price may change later on plumber_services)
  price_cents int,
  is_quote_request boolean not null default false,

  cancelled_reason text,
  cancelled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_plumber on bookings(plumber_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_date on bookings(scheduled_date);

-- Prevent double-booking: a plumber can't have two non-cancelled bookings
-- at the exact same date/time. Enforced at the DB layer as a hard guarantee,
-- in addition to the availability check done in application code before insert.
create unique index uq_plumber_slot_not_cancelled
  on bookings (plumber_id, scheduled_date, scheduled_time)
  where status not in ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PLUMBER', 'NO_SHOW');

-- -----------------------------------------------------------------------------
-- REVIEWS
-- -----------------------------------------------------------------------------

create table reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete cascade,
  customer_id uuid not null references customers(profile_id) on delete cascade,
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  moderated_at timestamptz,
  hidden_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_reviews_plumber on reviews(plumber_id);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS (in-app)
-- -----------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- e.g. 'booking_new', 'booking_confirmed', 'account_activated'
  title text not null,
  body text,
  related_booking_id uuid references bookings(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, read_at);

-- -----------------------------------------------------------------------------
-- SUBSCRIPTIONS (mirrors the plumber's current billing period)
-- -----------------------------------------------------------------------------

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  amount_cents int not null,
  status text not null default 'pending', -- pending | active | expired | cancelled
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);

create index idx_subscriptions_plumber on subscriptions(plumber_id);

-- -----------------------------------------------------------------------------
-- CONTRACTS
-- -----------------------------------------------------------------------------

create table contracts (
  id uuid primary key default gen_random_uuid(),
  plumber_id uuid not null references plumbers(profile_id) on delete cascade,
  version text not null default 'v1',
  document_url text,
  signed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_contracts_plumber on contracts(plumber_id);

-- -----------------------------------------------------------------------------
-- ADMIN ACTIONS (audit log)
-- -----------------------------------------------------------------------------

create table admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id) on delete restrict,
  action_type text not null, -- e.g. 'plumber_approved', 'payment_marked_received'
  target_table text not null,
  target_id uuid not null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_admin_actions_target on admin_actions(target_table, target_id);

-- -----------------------------------------------------------------------------
-- MESSAGES (simple booking-scoped thread; optional per spec, included for Phase 4+)
-- -----------------------------------------------------------------------------

create table messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index idx_messages_booking on messages(booking_id);

-- -----------------------------------------------------------------------------
-- updated_at trigger helper
-- -----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'customers', 'services', 'plumbers', 'plumber_services',
    'bookings'
  ]
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I
       for each row execute function set_updated_at();', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Booking number generator: PLB-YYYY-NNNNNN
-- -----------------------------------------------------------------------------

create or replace function generate_booking_number()
returns text as $$
declare
  next_val bigint;
  year_part text;
begin
  next_val := nextval('booking_number_seq');
  year_part := to_char(now(), 'YYYY');
  return 'PLB-' || year_part || '-' || lpad(next_val::text, 6, '0');
end;
$$ language plpgsql;

alter table bookings alter column booking_number set default generate_booking_number();
