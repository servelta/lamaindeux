-- =============================================================================
-- RLS's "plumbers_update_own_limited" policy (Phase 1) allows a plumber to
-- update their own row, but doesn't restrict *which columns*. This trigger
-- is the column-level enforcement promised in that policy's comment: a
-- plumber can freely update their own description/services/etc, but cannot
-- touch verification, contract, or payment fields — only an admin (via the
-- service role, bypassing RLS in Server Actions) can.
-- =============================================================================

create or replace function guard_plumber_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins (and the service role, which has no session so is_admin() is
  -- false but also never goes through this path in practice — admin writes
  -- happen via the service role client which bypasses RLS/triggers scoped
  -- to auth.uid()) can change anything.
  if is_admin() then
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

create trigger trg_guard_plumber_protected_columns
  before update on plumbers
  for each row execute function guard_plumber_protected_columns();
