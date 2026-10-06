-- Update the platform brand without changing contact addresses or other settings.
alter table public.platform_settings
  alter column platform_name set default 'Plan b';

update public.platform_settings
set platform_name = 'Plan b'
where id = true;
