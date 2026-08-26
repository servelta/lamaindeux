-- =============================================================================
-- Row Level Security policies
-- Defense-in-depth: even if application code has a bug, these policies are
-- the last line of defense preventing cross-user data access.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions (security definer to safely check role without recursive RLS)
-- -----------------------------------------------------------------------------

create or replace function auth_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

alter table profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Public plumber profile pages need first/last name + avatar of ACTIVE plumbers.
-- Handled via the active_plumbers view (security invoker not needed since the
-- view itself only exposes ACTIVE plumbers, and views run with definer's
-- underlying table grants scoped through this policy):
create policy "profiles_select_public_active_plumber"
  on profiles for select
  using (
    exists (
      select 1 from plumbers pl
      where pl.profile_id = profiles.id and pl.status = 'ACTIVE'
    )
  );

-- Profile row creation happens via a trigger on auth.users (see below),
-- not directly by the client, so no insert policy is needed for normal users.

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------

alter table customers enable row level security;

create policy "customers_select_own_or_admin"
  on customers for select
  using (profile_id = auth.uid() or is_admin());

create policy "customers_update_own_or_admin"
  on customers for update
  using (profile_id = auth.uid() or is_admin());

create policy "customers_insert_own"
  on customers for insert
  with check (profile_id = auth.uid());

-- -----------------------------------------------------------------------------
-- plumbers
-- -----------------------------------------------------------------------------

alter table plumbers enable row level security;

create policy "plumbers_select_active_public"
  on plumbers for select
  using (status = 'ACTIVE');

create policy "plumbers_select_own_or_admin"
  on plumbers for select
  using (profile_id = auth.uid() or is_admin());

create policy "plumbers_insert_own"
  on plumbers for insert
  with check (profile_id = auth.uid());

create policy "plumbers_update_own_limited"
  on plumbers for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
  -- NOTE: application code (Server Actions) must restrict which columns a
  -- plumber can update themselves (e.g. description, not status/payment
  -- fields). Enforcing column-level write restriction fully in SQL requires
  -- a BEFORE UPDATE trigger — added in Phase 3 alongside the profile-edit form.

create policy "plumbers_update_admin"
  on plumbers for update
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- plumber_documents (never public — owner or admin only)
-- -----------------------------------------------------------------------------

alter table plumber_documents enable row level security;

create policy "plumber_documents_owner_or_admin"
  on plumber_documents for select
  using (plumber_id = auth.uid() or is_admin());

create policy "plumber_documents_insert_own"
  on plumber_documents for insert
  with check (plumber_id = auth.uid());

create policy "plumber_documents_admin_manage"
  on plumber_documents for update
  using (is_admin());

-- -----------------------------------------------------------------------------
-- services (public read, admin write)
-- -----------------------------------------------------------------------------

alter table services enable row level security;

create policy "services_select_all" on services for select using (true);

create policy "services_admin_write"
  on services for all
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- cities (public read, admin write)
-- -----------------------------------------------------------------------------

alter table cities enable row level security;

create policy "cities_select_all" on cities for select using (true);

create policy "cities_admin_write"
  on cities for all
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- platform_settings (public read of non-sensitive fields via view in app layer;
-- for MVP simplicity we allow read-all and restrict write to admin)
-- -----------------------------------------------------------------------------

alter table platform_settings enable row level security;

create policy "platform_settings_select_all" on platform_settings for select using (true);

create policy "platform_settings_admin_write"
  on platform_settings for update
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- plumber_services (public read of active rows, owner/admin manage)
-- -----------------------------------------------------------------------------

alter table plumber_services enable row level security;

create policy "plumber_services_select_active_public"
  on plumber_services for select
  using (active = true);

create policy "plumber_services_select_own_or_admin"
  on plumber_services for select
  using (plumber_id = auth.uid() or is_admin());

create policy "plumber_services_manage_own_or_admin"
  on plumber_services for all
  using (plumber_id = auth.uid() or is_admin())
  with check (plumber_id = auth.uid() or is_admin());

-- -----------------------------------------------------------------------------
-- plumber_service_areas
-- -----------------------------------------------------------------------------

alter table plumber_service_areas enable row level security;

create policy "plumber_service_areas_select_public"
  on plumber_service_areas for select using (true);

create policy "plumber_service_areas_manage_own_or_admin"
  on plumber_service_areas for all
  using (plumber_id = auth.uid() or is_admin())
  with check (plumber_id = auth.uid() or is_admin());

-- -----------------------------------------------------------------------------
-- availability / availability_exceptions
-- -----------------------------------------------------------------------------

alter table availability enable row level security;

create policy "availability_select_public"
  on availability for select using (true); -- needed to render booking calendar

create policy "availability_manage_own_or_admin"
  on availability for all
  using (plumber_id = auth.uid() or is_admin())
  with check (plumber_id = auth.uid() or is_admin());

alter table availability_exceptions enable row level security;

create policy "availability_exceptions_select_public"
  on availability_exceptions for select using (true);

create policy "availability_exceptions_manage_own_or_admin"
  on availability_exceptions for all
  using (plumber_id = auth.uid() or is_admin())
  with check (plumber_id = auth.uid() or is_admin());

-- -----------------------------------------------------------------------------
-- bookings — the most sensitive table: strictly customer-own or plumber-assigned
-- -----------------------------------------------------------------------------

alter table bookings enable row level security;

create policy "bookings_select_participant_or_admin"
  on bookings for select
  using (customer_id = auth.uid() or plumber_id = auth.uid() or is_admin());

create policy "bookings_insert_own_customer"
  on bookings for insert
  with check (customer_id = auth.uid());

create policy "bookings_update_participant_or_admin"
  on bookings for update
  using (customer_id = auth.uid() or plumber_id = auth.uid() or is_admin())
  with check (customer_id = auth.uid() or plumber_id = auth.uid() or is_admin());
  -- NOTE: status-transition rules (e.g. only a plumber can set ACCEPTED,
  -- only admin can set DISPUTED) are enforced in Server Actions in Phase 4,
  -- not just here — RLS here only guarantees *which rows*, not *which values*.

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------

alter table reviews enable row level security;

create policy "reviews_select_public"
  on reviews for select using (hidden_by_admin = false or is_admin());

create policy "reviews_insert_own_customer_completed_booking"
  on reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.status = 'COMPLETED'
    )
  );

create policy "reviews_admin_moderate"
  on reviews for update
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------

alter table notifications enable row level security;

create policy "notifications_select_own"
  on notifications for select using (user_id = auth.uid());

create policy "notifications_update_own"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts happen via service-role (server-side notification service), no
-- client insert policy is defined intentionally.

-- -----------------------------------------------------------------------------
-- subscriptions / contracts (plumber can view own, only admin writes)
-- -----------------------------------------------------------------------------

alter table subscriptions enable row level security;

create policy "subscriptions_select_own_or_admin"
  on subscriptions for select using (plumber_id = auth.uid() or is_admin());

create policy "subscriptions_admin_write"
  on subscriptions for all
  using (is_admin())
  with check (is_admin());

alter table contracts enable row level security;

create policy "contracts_select_own_or_admin"
  on contracts for select using (plumber_id = auth.uid() or is_admin());

create policy "contracts_admin_write"
  on contracts for all
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- admin_actions (admin-only, audit trail)
-- -----------------------------------------------------------------------------

alter table admin_actions enable row level security;

create policy "admin_actions_admin_only"
  on admin_actions for all
  using (is_admin())
  with check (is_admin());

-- -----------------------------------------------------------------------------
-- messages (booking participants only)
-- -----------------------------------------------------------------------------

alter table messages enable row level security;

create policy "messages_select_participant_or_admin"
  on messages for select
  using (
    is_admin() or exists (
      select 1 from bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.plumber_id = auth.uid())
    )
  );

create policy "messages_insert_participant"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.plumber_id = auth.uid())
    )
  );
