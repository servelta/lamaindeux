-- =============================================================================
-- Storage buckets (Phase 3)
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('plumber-documents', 'plumber-documents', false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- avatars: public read, owner can upload/update only into their own folder
-- (convention: <profile_id>/<filename>)
-- -----------------------------------------------------------------------------

create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- plumber-documents: strictly private. Only the owning plumber (their own
-- folder) or an admin can read; only the owning plumber can upload.
-- Convention: <plumber_profile_id>/<doc_type>-<timestamp>.<ext>
-- -----------------------------------------------------------------------------

create policy "plumber_documents_owner_or_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'plumber-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

create policy "plumber_documents_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'plumber-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
