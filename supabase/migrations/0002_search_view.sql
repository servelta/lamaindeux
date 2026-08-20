-- =============================================================================
-- Search view: only ACTIVE plumbers with an active service are ever returned.
-- This is the single place that encodes "who is visible in public search" —
-- Phase 2's search feature should query this view, never the raw tables,
-- so a suspended plumber disappears from search the instant their status changes.
-- =============================================================================

create or replace view active_plumbers as
select
  p.profile_id,
  p.company_name,
  p.slug,
  p.description,
  p.business_city,
  p.rating_avg,
  p.rating_count,
  p.completed_jobs_count,
  prof.avatar_url,
  prof.first_name,
  prof.last_name,
  ps.id as plumber_service_id,
  ps.service_id,
  s.name as service_name,
  s.slug as service_slug,
  ps.pricing_type,
  ps.price_cents,
  ps.duration_minutes,
  psa.city_id,
  c.slug as city_slug,
  c.name as city_name,
  psa.postcodes
from plumbers p
join profiles prof on prof.id = p.profile_id
join plumber_services ps on ps.plumber_id = p.profile_id and ps.active = true
join services s on s.id = ps.service_id and s.active = true
join plumber_service_areas psa on psa.plumber_id = p.profile_id
join cities c on c.id = psa.city_id and c.active = true
where p.status = 'ACTIVE';

comment on view active_plumbers is
  'Denormalized read model for public search (Phase 2). One row per plumber x service x service-area combination.';
