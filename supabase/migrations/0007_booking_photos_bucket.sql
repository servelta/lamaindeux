-- =============================================================================
-- booking-photos: private bucket for the optional photos a customer attaches
-- to a booking (Section 12). Convention: <customer_profile_id>/<timestamp>-n.ext
-- Readable by: the uploading customer (folder match), the plumber the
-- booking is assigned to (via the bookings.photo_urls array), or an admin.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', false)
on conflict (id) do nothing;

create policy "booking_photos_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'booking-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "booking_photos_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'booking-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
      or exists (
        select 1 from bookings b
        where b.plumber_id = auth.uid()
          and name = any(b.photo_urls)
      )
    )
  );
