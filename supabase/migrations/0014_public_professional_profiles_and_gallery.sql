-- Security fix: replace the blanket "any active professional, full row"
-- public policy with a curated view exposing only genuinely public
-- fields. The existing "professionals_select_own_or_admin" policy is
-- UNCHANGED and remains correct — owners and admins still get full row
-- access to what they're each allowed to see, as before.

drop policy if exists "professionals_select_active_public" on professionals;

-- New public-facing fields
alter table professionals add column if not exists public_phone text;
alter table professionals add column if not exists public_email text;
alter table professionals add column if not exists google_rating numeric(2,1) default 5.0;
alter table professionals add column if not exists google_review_count int;

update professionals set google_rating = 5.0 where google_rating is null;

-- The only thing public profile pages (and any cross-user lookup, like a
-- customer viewing which professional their booking is with) should ever
-- read from. Deliberately excludes SIRET, contract/payment status, and
-- anything else internal.
create or replace view public_professional_profiles as
select
  p.profile_id,
  p.trade_id,
  t.name_singular as trade_name_singular,
  t.slug_singular as trade_slug_singular,
  t.slug_plural as trade_slug_plural,
  p.company_name,
  p.slug,
  p.description,
  p.business_address,
  p.business_city,
  p.business_postcode,
  p.public_phone,
  p.public_email,
  p.rating_avg,
  p.rating_count,
  p.completed_jobs_count,
  p.google_rating,
  p.google_review_count,
  prof.first_name,
  prof.last_name,
  prof.avatar_url
from professionals p
join trades t on t.id = p.trade_id
join profiles prof on prof.id = p.profile_id
where p.status = 'ACTIVE';

comment on view public_professional_profiles is
  'The only safe source for public/cross-user professional lookups. Do not query the raw professionals table for anyone other than the row owner or an admin.';

-- Gallery photos
create table if not exists professional_gallery_photos (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals(profile_id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table professional_gallery_photos enable row level security;

create policy "professional_gallery_photos_select_public"
  on professional_gallery_photos for select using (true);

create policy "professional_gallery_photos_manage_own_or_admin"
  on professional_gallery_photos for all
  using (professional_id = auth.uid() or is_admin())
  with check (professional_id = auth.uid() or is_admin());
