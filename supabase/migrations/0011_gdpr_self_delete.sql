-- =============================================================================
-- Self-service account deletion (Section 32) needs to write to plumbers.status
-- and status_reason — both blocked for non-admins by the guard trigger from
-- migration 0006/0009. Rather than have the Server Action fight that guard,
-- this function does the anonymization from inside a SECURITY DEFINER
-- context with the same transaction-local bypass flag used for rating
-- recalculation, but checks auth.uid() = p_plumber_id first so it can only
-- ever act on the caller's own row — this is not a general-purpose admin
-- bypass, it's scoped to "a user deleting themselves".
-- =============================================================================

create or replace function anonymize_own_plumber_account(p_plumber_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is distinct from p_plumber_id then
    raise exception 'Vous ne pouvez anonymiser que votre propre compte.';
  end if;

  perform set_config('app.bypass_plumber_guard', 'true', true); -- local to this transaction only

  update plumbers
  set
    status = 'SUSPENDED',
    status_reason = 'Compte supprimé par l''utilisateur (RGPD)',
    company_name = 'Compte supprimé',
    description = null,
    business_address = null,
    siret = null,
    siren = null,
    website = null
  where profile_id = p_plumber_id;
end;
$$;
