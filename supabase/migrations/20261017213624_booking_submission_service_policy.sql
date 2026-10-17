create policy booking_submissions_service_only on private.booking_submissions
for all to service_role using (true) with check (true);
