-- Every professional should be able to offer an "urgent" quote-based
-- service without having to opt in manually via /profil. This adds one
-- "Service urgent" catalog entry per trade, backfills it onto every
-- existing professional, and auto-attaches it to every future one.

insert into services (name, slug, description, category, default_pricing_type, active, sort_order, trade_id)
select
  'Service urgent',
  t.slug_singular || '-service-urgent',
  'Intervention urgente — devis rapide sous 24h.',
  'urgence',
  'quote',
  true,
  -1,
  t.id
from trades t
on conflict (slug) do nothing;

insert into professional_services (professional_id, service_id, pricing_type, price_cents, active)
select p.profile_id, s.id, 'quote', null, true
from professionals p
join services s on s.trade_id = p.trade_id and s.name = 'Service urgent'
on conflict (professional_id, service_id) do nothing;

create or replace function add_urgent_service_for_professional()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into professional_services (professional_id, service_id, pricing_type, price_cents, active)
  select new.profile_id, s.id, 'quote', null, true
  from services s
  where s.trade_id = new.trade_id and s.name = 'Service urgent'
  on conflict (professional_id, service_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_professional_created_add_urgent_service on professionals;

create trigger on_professional_created_add_urgent_service
  after insert on professionals
  for each row execute function add_urgent_service_for_professional();
