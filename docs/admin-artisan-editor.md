# Admin artisan editor

Open **Administration → Professionnels → an artisan → Modifier l’artisan**.

Each section saves separately: public company profile and category; logo/avatar and
six gallery photos; account name and phone; private notification and login emails;
service descriptions, prices, durations and activation; intervention cities; weekly
hours, day periods and blocked date ranges. Status, contracts and payments remain
on the artisan's detail page. Passwords are never displayed; the existing reset
flow remains available.

Changing category atomically deactivates incompatible services, preserving their
IDs and existing bookings. Administrators can then add services from the new
category. Reactivating an incompatible service is rejected by the database.
Changing the profile slug changes its public URL; the form explains this before
saving. Notification emails remain in private Auth app metadata, not public rows.
Login email changes require explicit confirmation in the editor.

The migration `20261018181625_admin_artisan_editing.sql` enables admin updates of
allowed profile contact columns, daily availability and artisan media storage.
Existing role-column restrictions remain intact. New trigger functions run with
the caller's permissions and cannot be invoked as public RPCs. Each admin server
action checks the current database role and validates its target before writing;
the admin stays logged in as themselves. Successful edits record an admin audit
event without copying email addresses or other form contents into the log.

Verification includes unit checks for unauthorized and missing targets, private
metadata preservation, failed saves, forged identity fields and invalid images.
Live database checks run with temporary records inside a rolled-back transaction:
admin profile/schedule updates, foreign-user write denial, role escalation denial,
category retirement and incompatible-service rejection. Browser journeys use an
isolated in-memory backend and fake storage/Auth, never customer accounts or
notifications. Production verification checks deployment readiness and logged-out
route protection. An authenticated production smoke check of an intentional
artisan edit remains available to the account owner.
