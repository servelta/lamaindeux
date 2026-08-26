-- =============================================================================
-- Tracks whether a booking reminder has already been sent, so the daily
-- cron job (app/api/cron/booking-reminders) is idempotent even if it runs
-- more than once or is retried.
-- =============================================================================

alter table bookings add column reminder_sent_at timestamptz;
