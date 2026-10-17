-- Roles and identity are server-managed; users may edit only contact fields.
revoke update on public.profiles from public, anon, authenticated;
revoke update(role,id,created_at,updated_at) on public.profiles from public, anon, authenticated;
grant update(first_name,last_name,phone,avatar_url) on public.profiles to authenticated;
