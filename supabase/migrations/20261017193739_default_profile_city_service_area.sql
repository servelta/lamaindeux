-- Keep the profile city searchable without a second form submission.
create or replace function private.sync_profile_city_service_area()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.professional_service_areas (professional_id, city_id)
  select new.profile_id, c.id
  from public.cities c
  where c.active and lower(btrim(c.name)) = lower(btrim(new.business_city))
  on conflict (professional_id, city_id) do nothing;
  return new;
end;
$$;
revoke all on function private.sync_profile_city_service_area() from public, anon, authenticated;

create trigger sync_profile_city_service_area
  after insert or update of business_city on public.professionals
  for each row execute function private.sync_profile_city_service_area();

-- Preserve existing intervention cities and postcode restrictions.
insert into public.professional_service_areas (professional_id, city_id)
select p.profile_id, c.id
from public.professionals p
join public.cities c on c.active and lower(btrim(c.name)) = lower(btrim(p.business_city))
on conflict (professional_id, city_id) do nothing;
