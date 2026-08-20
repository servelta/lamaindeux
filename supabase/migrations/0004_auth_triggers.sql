-- =============================================================================
-- When a user signs up via Supabase Auth, automatically create their `profiles`
-- row (and the matching `customers` or `plumbers` row) from the metadata
-- passed at sign-up time (see lib/validation/auth.ts + the sign-up Server Actions).
-- This runs with elevated privilege (security definer) since the client does
-- not have insert rights on `profiles` directly.
-- =============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role user_role;
  company text;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data->>'role')::user_role,
    'customer'
  );

  -- Admin role can never be self-assigned at signup — only created via the
  -- create-admin script or by another admin, never through public sign-up.
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
  elsif requested_role = 'plumber' then
    company := coalesce(new.raw_user_meta_data->>'company_name', 'Mon entreprise');
    insert into plumbers (profile_id, company_name, slug)
    values (
      new.id,
      company,
      -- temporary unique slug; refined into a clean human slug in the
      -- plumber-registration Server Action once company_name is finalized
      lower(regexp_replace(company, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8)
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
