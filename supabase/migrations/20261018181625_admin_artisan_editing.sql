-- Existing column grants still prevent authenticated users from changing roles.
create policy profiles_admin_edit_contact
on public.profiles for update to authenticated
using ((select public.is_admin()) and exists (select 1 from public.professionals p where p.profile_id = profiles.id))
with check ((select public.is_admin()) and exists (select 1 from public.professionals p where p.profile_id = profiles.id));

create policy daily_availability_admin_manage
on public.daily_availability for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

-- Restrict admin media writes to the public avatar bucket and an artisan folder.
create policy avatars_admin_artisan_manage
on storage.objects for all to authenticated
using (bucket_id = 'avatars' and (select public.is_admin()) and exists (
  select 1 from public.professionals p where p.profile_id::text = (storage.foldername(name))[1]
))
with check (bucket_id = 'avatars' and (select public.is_admin()) and exists (
  select 1 from public.professionals p where p.profile_id::text = (storage.foldername(name))[1]
));

-- Run under the caller's RLS. Category changes and retiring incompatible offers
-- commit together. Historical assignments and their bookings are never deleted.
create function public.guard_artisan_trade_edit() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.trade_id is distinct from old.trade_id then
    if not public.is_admin() then raise exception 'Admin required' using errcode = '42501'; end if;
    update public.professional_services ps set active = false
    where ps.professional_id = old.profile_id
      and exists (select 1 from public.services s where s.id = ps.service_id and s.trade_id <> new.trade_id);
  end if;
  return new;
end;
$$;
revoke all on function public.guard_artisan_trade_edit() from public, anon, authenticated;
create trigger guard_artisan_trade_edit before update of trade_id on public.professionals
for each row execute function public.guard_artisan_trade_edit();

create function public.guard_artisan_service_trade() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.active and not exists (
    select 1 from public.professionals p join public.services s on s.trade_id = p.trade_id
    where p.profile_id = new.professional_id and s.id = new.service_id
  ) then
    raise exception 'Service incompatible avec le métier de cet artisan' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_artisan_service_trade() from public, anon, authenticated;
create trigger guard_artisan_service_trade before insert or update of active, service_id, professional_id on public.professional_services
for each row execute function public.guard_artisan_service_trade();
