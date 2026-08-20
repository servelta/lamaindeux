-- =============================================================================
-- LaMainDeux generalization: from a plumber-only marketplace to a
-- multi-trade one (plumbers, electricians, painters, HVAC, general
-- contractors...). Launching with only "Plomberie" active — every other
-- trade already exists in the schema, inactive, so switching one on later
-- is an admin toggle, not a migration.
--
-- Renames throughout: plumbers -> professionals, plumber_id -> professional_id
-- (everywhere it appears), plumber_documents -> professional_documents,
-- plumber_services -> professional_services,
-- plumber_service_areas -> professional_service_areas,
-- plumber_status enum -> professional_status, active_plumbers view ->
-- active_professionals, and the user_role enum value 'plumber' -> 'professional'.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TRADES
-- -----------------------------------------------------------------------------

create table trades (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- "Plomberie"
  name_singular text not null,        -- "Plombier" (for badges, "Plombier vérifié")
  slug_singular text not null unique, -- "plombier" (used in copy)
  slug_plural text not null unique,   -- "plombiers" (used in URLs: /plombiers/paris)
  icon text,                          -- lucide-react icon name, for the trade picker UI
  active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into trades (name, name_singular, slug_singular, slug_plural, icon, active, sort_order) values
  ('Plomberie', 'Plombier', 'plombier', 'plombiers', 'Wrench', true, 1),
  ('Électricité', 'Électricien', 'electricien', 'electriciens', 'Zap', false, 2),
  ('Peinture', 'Peintre', 'peintre', 'peintres', 'Paintbrush', false, 3),
  ('Chauffage & Climatisation', 'Chauffagiste', 'chauffagiste', 'chauffagistes', 'Flame', false, 4),
  ('Travaux généraux', 'Artisan', 'artisan', 'artisans', 'Hammer', false, 5);

-- -----------------------------------------------------------------------------
-- 2. user_role: 'plumber' -> 'professional'
-- -----------------------------------------------------------------------------

alter type user_role rename value 'plumber' to 'professional';

-- -----------------------------------------------------------------------------
-- 3. plumber_status -> professional_status
-- -----------------------------------------------------------------------------

alter type plumber_status rename to professional_status;

-- -----------------------------------------------------------------------------
-- 4. Rename tables and their plumber_id columns
-- -----------------------------------------------------------------------------

alter table plumbers rename to professionals;
alter table professionals rename column profile_id to profile_id; -- unchanged, no-op for clarity

alter table plumber_documents rename to professional_documents;
alter table professional_documents rename column plumber_id to professional_id;

alter table plumber_services rename to professional_services;
alter table professional_services rename column plumber_id to professional_id;

alter table plumber_service_areas rename to professional_service_areas;
alter table professional_service_areas rename column plumber_id to professional_id;

alter table availability rename column plumber_id to professional_id;
alter table availability_exceptions rename column plumber_id to professional_id;
alter table bookings rename column plumber_id to professional_id;
alter table reviews rename column plumber_id to professional_id;
alter table subscriptions rename column plumber_id to professional_id;
alter table contracts rename column plumber_id to professional_id;

-- Rename indexes for consistency (cosmetic, but keeps \d output sane)
alter index idx_plumbers_status rename to idx_professionals_status;
alter index idx_plumbers_city rename to idx_professionals_city;
alter index idx_plumber_documents_plumber rename to idx_professional_documents_professional;
alter index idx_plumber_services_plumber rename to idx_professional_services_professional;
alter index idx_plumber_services_service rename to idx_professional_services_service;
alter index idx_plumber_services_active rename to idx_professional_services_active;
alter index idx_plumber_service_areas_city rename to idx_professional_service_areas_city;
alter index idx_availability_plumber rename to idx_availability_professional;
alter index idx_availability_exceptions_plumber_date rename to idx_availability_exceptions_professional_date;
alter index idx_bookings_plumber rename to idx_bookings_professional;
alter index idx_reviews_plumber rename to idx_reviews_professional;
alter index idx_subscriptions_plumber rename to idx_subscriptions_professional;
alter index idx_contracts_plumber rename to idx_contracts_professional;
alter index uq_plumber_slot_not_cancelled rename to uq_professional_slot_not_cancelled;

-- -----------------------------------------------------------------------------
-- 5. Add trade_id to professionals and services
-- -----------------------------------------------------------------------------

alter table professionals add column trade_id uuid references trades(id);
alter table services add column trade_id uuid references trades(id);

-- Backfill: every existing row (all plumbing, pre-generalization) belongs to Plomberie.
update professionals set trade_id = (select id from trades where slug_singular = 'plombier');
update services set trade_id = (select id from trades where slug_singular = 'plombier');

alter table professionals alter column trade_id set not null;
alter table services alter column trade_id set not null;

create index idx_professionals_trade on professionals(trade_id);
create index idx_services_trade on services(trade_id);

-- -----------------------------------------------------------------------------
-- 6. Rebuild the search view as active_professionals (trade-aware)
-- -----------------------------------------------------------------------------

drop view if exists active_plumbers;

create or replace view active_professionals as
select
  p.profile_id,
  p.trade_id,
  t.slug_singular as trade_slug_singular,
  t.slug_plural as trade_slug_plural,
  t.name_singular as trade_name_singular,
  p.company_name,
  p.slug,
  p.description,
  p.business_city,
  p.rating_avg,
  p.rating_count,
  p.completed_jobs_count,
  prof.avatar_url,
  prof.first_name,
  prof.last_name,
  ps.id as professional_service_id,
  ps.service_id,
  s.name as service_name,
  s.slug as service_slug,
  ps.pricing_type,
  ps.price_cents,
  ps.duration_minutes,
  psa.city_id,
  c.slug as city_slug,
  c.name as city_name,
  psa.postcodes
from professionals p
join trades t on t.id = p.trade_id and t.active = true
join profiles prof on prof.id = p.profile_id
join professional_services ps on ps.professional_id = p.profile_id and ps.active = true
join services s on s.id = ps.service_id and s.active = true
join professional_service_areas psa on psa.professional_id = p.profile_id
join cities c on c.id = psa.city_id and c.active = true
where p.status = 'ACTIVE';

comment on view active_professionals is
  'Denormalized read model for public search. One row per professional x service x service-area combination. Only surfaces professionals whose trade is currently active.';

-- -----------------------------------------------------------------------------
-- 7. Rebuild the auth trigger to create `professionals` (with trade_id) instead of `plumbers`
-- -----------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role user_role;
  company text;
  requested_trade_slug text;
  resolved_trade_id uuid;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'customer'
  );

  if requested_role = 'admin' then
    requested_role := 'customer';
  end if;

  insert into profiles (id, role, first_name, last_name, phone)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.raw_user_meta_data->>'phone'
  );

  if requested_role = 'customer' then
    insert into customers (profile_id) values (new.id);
  elsif requested_role = 'professional' then
    company := coalesce(new.raw_user_meta_data->>'company_name', 'Mon entreprise');
    requested_trade_slug := coalesce(new.raw_user_meta_data->>'trade_slug', 'plombier');

    select id into resolved_trade_id from trades where slug_singular = requested_trade_slug;
    if resolved_trade_id is null then
      select id into resolved_trade_id from trades where slug_singular = 'plombier';
    end if;

    insert into professionals (profile_id, trade_id, company_name, slug)
    values (
      new.id,
      resolved_trade_id,
      company,
      lower(regexp_replace(company, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8)
    );
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Rebuild the column-protection guard trigger on `professionals`
-- -----------------------------------------------------------------------------

drop trigger if exists trg_guard_plumber_protected_columns on professionals;

create or replace function guard_professional_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() or coalesce(current_setting('app.bypass_professional_guard', true), 'false') = 'true' then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.status_reason is distinct from old.status_reason
    or new.contract_status is distinct from old.contract_status
    or new.contract_signed_at is distinct from old.contract_signed_at
    or new.payment_status is distinct from old.payment_status
    or new.payment_date is distinct from old.payment_date
    or new.subscription_start is distinct from old.subscription_start
    or new.subscription_end is distinct from old.subscription_end
    or new.stripe_payment_link_url is distinct from old.stripe_payment_link_url
    or new.rating_avg is distinct from old.rating_avg
    or new.rating_count is distinct from old.rating_count
    or new.completed_jobs_count is distinct from old.completed_jobs_count
  then
    raise exception 'Ces champs ne peuvent être modifiés que par un administrateur.';
  end if;

  return new;
end;
$$;

create trigger trg_guard_professional_protected_columns
  before update on professionals
  for each row execute function guard_professional_protected_columns();

-- -----------------------------------------------------------------------------
-- 9. Rebuild the rating-recalculation trigger to use the renamed column/flag
-- -----------------------------------------------------------------------------

create or replace function recalculate_professional_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_professional_id uuid;
  new_avg numeric(2,1);
  new_count int;
begin
  target_professional_id := coalesce(new.professional_id, old.professional_id);

  select
    coalesce(round(avg(rating)::numeric, 1), 0.0),
    count(*)
  into new_avg, new_count
  from reviews
  where professional_id = target_professional_id
    and hidden_by_admin = false;

  perform set_config('app.bypass_professional_guard', 'true', true);

  update professionals
  set rating_avg = new_avg, rating_count = new_count
  where profile_id = target_professional_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalculate_plumber_rating on reviews;

create trigger trg_recalculate_professional_rating
  after insert or delete or update of rating, hidden_by_admin on reviews
  for each row execute function recalculate_professional_rating();

-- -----------------------------------------------------------------------------
-- 10. Rebuild the GDPR self-deletion bypass function under the new name
-- -----------------------------------------------------------------------------

drop function if exists anonymize_own_plumber_account(uuid);

create or replace function anonymize_own_professional_account(p_professional_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_professional_id then
    raise exception 'Vous ne pouvez anonymiser que votre propre compte.';
  end if;

  perform set_config('app.bypass_professional_guard', 'true', true);

  update professionals
  set
    status = 'SUSPENDED',
    status_reason = 'Compte supprimé par l''utilisateur (RGPD)',
    company_name = 'Compte supprimé',
    description = null,
    business_address = null,
    siret = null,
    siren = null,
    website = null
  where profile_id = p_professional_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11. RLS policies — recreate the ones whose names/definitions referenced
-- the old table/column names. (Policies survive table renames automatically
-- since they're attached by OID, but several reference `plumber_id` columns
-- in *other* tables' policies, e.g. bookings — those need updating.)
-- -----------------------------------------------------------------------------

-- professionals (formerly plumbers) — policy bodies are unaffected by the
-- table rename itself since `profile_id` didn't change, but drop/recreate
-- for clean naming.
drop policy if exists "plumbers_select_active_public" on professionals;
drop policy if exists "plumbers_select_own_or_admin" on professionals;
drop policy if exists "plumbers_insert_own" on professionals;
drop policy if exists "plumbers_update_own_limited" on professionals;
drop policy if exists "plumbers_update_admin" on professionals;

create policy "professionals_select_active_public"
  on professionals for select
  using (status = 'ACTIVE');

create policy "professionals_select_own_or_admin"
  on professionals for select
  using (profile_id = auth.uid() or is_admin());

create policy "professionals_insert_own"
  on professionals for insert
  with check (profile_id = auth.uid());

create policy "professionals_update_own_limited"
  on professionals for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "professionals_update_admin"
  on professionals for update
  using (is_admin())
  with check (is_admin());

-- profiles: the "public active plumber profile" policy referenced `plumbers`
drop policy if exists "profiles_select_public_active_plumber" on profiles;
create policy "profiles_select_public_active_professional"
  on profiles for select
  using (
    exists (
      select 1 from professionals pr
      where pr.profile_id = profiles.id and pr.status = 'ACTIVE'
    )
  );

-- professional_documents (formerly plumber_documents)
drop policy if exists "plumber_documents_owner_or_admin" on professional_documents;
drop policy if exists "plumber_documents_insert_own" on professional_documents;
drop policy if exists "plumber_documents_admin_manage" on professional_documents;

create policy "professional_documents_owner_or_admin"
  on professional_documents for select
  using (professional_id = auth.uid() or is_admin());
create policy "professional_documents_insert_own"
  on professional_documents for insert
  with check (professional_id = auth.uid());
create policy "professional_documents_admin_manage"
  on professional_documents for update
  using (is_admin());

-- professional_services (formerly plumber_services)
drop policy if exists "plumber_services_select_active_public" on professional_services;
drop policy if exists "plumber_services_select_own_or_admin" on professional_services;
drop policy if exists "plumber_services_manage_own_or_admin" on professional_services;

create policy "professional_services_select_active_public"
  on professional_services for select using (active = true);
create policy "professional_services_select_own_or_admin"
  on professional_services for select
  using (professional_id = auth.uid() or is_admin());
create policy "professional_services_manage_own_or_admin"
  on professional_services for all
  using (professional_id = auth.uid() or is_admin())
  with check (professional_id = auth.uid() or is_admin());

-- professional_service_areas (formerly plumber_service_areas)
drop policy if exists "plumber_service_areas_select_public" on professional_service_areas;
drop policy if exists "plumber_service_areas_manage_own_or_admin" on professional_service_areas;

create policy "professional_service_areas_select_public"
  on professional_service_areas for select using (true);
create policy "professional_service_areas_manage_own_or_admin"
  on professional_service_areas for all
  using (professional_id = auth.uid() or is_admin())
  with check (professional_id = auth.uid() or is_admin());

-- availability / availability_exceptions
drop policy if exists "availability_manage_own_or_admin" on availability;
create policy "availability_manage_own_or_admin"
  on availability for all
  using (professional_id = auth.uid() or is_admin())
  with check (professional_id = auth.uid() or is_admin());

drop policy if exists "availability_exceptions_manage_own_or_admin" on availability_exceptions;
create policy "availability_exceptions_manage_own_or_admin"
  on availability_exceptions for all
  using (professional_id = auth.uid() or is_admin())
  with check (professional_id = auth.uid() or is_admin());

-- bookings
drop policy if exists "bookings_select_participant_or_admin" on bookings;
drop policy if exists "bookings_update_participant_or_admin" on bookings;

create policy "bookings_select_participant_or_admin"
  on bookings for select
  using (customer_id = auth.uid() or professional_id = auth.uid() or is_admin());
create policy "bookings_update_participant_or_admin"
  on bookings for update
  using (customer_id = auth.uid() or professional_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or professional_id = auth.uid() or is_admin());

-- messages (references bookings.plumber_id in its policy bodies)
drop policy if exists "messages_select_participant_or_admin" on messages;
drop policy if exists "messages_insert_participant" on messages;

create policy "messages_select_participant_or_admin"
  on messages for select
  using (
    is_admin() or exists (
      select 1 from bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.professional_id = auth.uid())
    )
  );
create policy "messages_insert_participant"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.professional_id = auth.uid())
    )
  );

-- subscriptions / contracts
drop policy if exists "subscriptions_select_own_or_admin" on subscriptions;
create policy "subscriptions_select_own_or_admin"
  on subscriptions for select using (professional_id = auth.uid() or is_admin());

drop policy if exists "contracts_select_own_or_admin" on contracts;
create policy "contracts_select_own_or_admin"
  on contracts for select using (professional_id = auth.uid() or is_admin());

-- -----------------------------------------------------------------------------
-- 12. trades RLS (public read, admin write)
-- -----------------------------------------------------------------------------

alter table trades enable row level security;

create policy "trades_select_all" on trades for select using (true);
create policy "trades_admin_write"
  on trades for all
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- 14. Storage policy fix: booking-photos referenced bookings.plumber_id
-- directly in its USING clause, which no longer exists as a column name.
-- -----------------------------------------------------------------------------

drop policy if exists "booking_photos_owner_read" on storage.objects;

create policy "booking_photos_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'booking-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (
        select 1 from bookings b
        where b.professional_id = auth.uid()
          and name = any(b.photo_urls)
      )
    )
  );

-- -----------------------------------------------------------------------------
-- NOTE ON STORAGE BUCKET NAMES: the bucket id `plumber-documents` is kept
-- as-is rather than renamed to `professional-documents`. Supabase Storage
-- doesn't support renaming a bucket in place (it would mean creating a new
-- bucket and copying every object across), and the bucket id is an internal
-- implementation detail never shown to users — not worth the migration risk
-- for a cosmetic rename. All trades' verification documents continue to be
-- stored in `plumber-documents`; only column names and RLS conditions
-- needed updating.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 15. Rebrand: MonPlombier -> LaMainDeux. Updates both the column default
-- (for any future fresh install) and the existing platform_settings row.
-- -----------------------------------------------------------------------------

alter table platform_settings alter column platform_name set default 'LaMainDeux';

update platform_settings
set platform_name = 'LaMainDeux'
where platform_name = 'MonPlombier';

-- -----------------------------------------------------------------------------
-- 16. booking_status enum: CANCELLED_BY_PLUMBER -> CANCELLED_BY_PROFESSIONAL
-- -----------------------------------------------------------------------------

alter type booking_status rename value 'CANCELLED_BY_PLUMBER' to 'CANCELLED_BY_PROFESSIONAL';
