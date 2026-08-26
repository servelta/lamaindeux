-- Finish the rename that migration 0012 started.
--
-- 0012 generalised the schema from plumbing-only to multi-trade, renaming
-- plumbers -> professionals along with every FK column that referenced it.
-- It missed exactly one: bookings.plumber_service_id. A sweep of
-- information_schema for '%plumber%' columns returns that column and
-- nothing else.
--
-- The consequence was not cosmetic. The application has written
-- professional_service_id since 0012 (lib/booking/create-action.ts), and
-- the active_professionals view already exposes the new name — so search
-- and profile reads worked normally while every booking insert failed
-- against a column that does not exist. Nobody had hit it only because the
-- bookings table was still empty.

alter table bookings rename column plumber_service_id to professional_service_id;

-- Rename the FK constraint to match. PostgREST derives embedded-resource
-- names from constraints, so leaving it as bookings_plumber_service_id_fkey
-- would keep the old vocabulary visible in the API surface.
alter table bookings
  rename constraint bookings_plumber_service_id_fkey
  to bookings_professional_service_id_fkey;
