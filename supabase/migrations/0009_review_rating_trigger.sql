-- =============================================================================
-- Rating aggregation. plumbers.rating_avg / rating_count were columns with
-- no writer — this migration is what actually keeps them correct.
--
-- Because migration 0006 blocks non-admin writes to rating_avg/rating_count
-- (to stop a plumber setting their own rating), and a customer submitting a
-- review is not an admin, we need this trigger's own update to plumbers to
-- bypass that guard. We do that with a transaction-local GUC flag rather
-- than weakening the guard itself — the bypass only ever applies to this
-- specific system-computed update.
-- =============================================================================

create or replace function guard_plumber_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() or coalesce(current_setting('app.bypass_plumber_guard', true), 'false') = 'true' then
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

create or replace function recalculate_plumber_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_plumber_id uuid;
  new_avg numeric(2,1);
  new_count int;
begin
  target_plumber_id := coalesce(new.plumber_id, old.plumber_id);

  select
    coalesce(round(avg(rating)::numeric, 1), 0.0),
    count(*)
  into new_avg, new_count
  from reviews
  where plumber_id = target_plumber_id
    and hidden_by_admin = false;

  perform set_config('app.bypass_plumber_guard', 'true', true); -- local to this transaction only

  update plumbers
  set rating_avg = new_avg, rating_count = new_count
  where profile_id = target_plumber_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_recalculate_plumber_rating
  after insert or delete or update of rating, hidden_by_admin on reviews
  for each row execute function recalculate_plumber_rating();
