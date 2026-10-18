# Transactional email and booking notifications

All application email goes through `lib/email/send.ts` and the existing Resend
SDK. The module is marked `server-only`. `lib/email/config.ts` owns the identity:

- From: `LaMain2 <contact@lamain2.com>`
- Reply-To: `contact@lamain2.com`

`EMAIL_FROM` and `EMAIL_REPLY_TO`, when provided, must match these values. A stale
or test identity fails explicitly. There is no `onboarding@resend.dev` fallback.
`RESEND_API_KEY` remains a server-only secret. OVH remains the incoming mailbox
provider. No Resend Receiving feature, root MX or website DNS is changed.

## Flow inventory

| Flow | Existing trigger and recipient | Transport |
| --- | --- | --- |
| Client welcome | Successful customer registration; registered email | Shared Resend helper |
| Artisan welcome | Successful artisan registration; registered email | Shared Resend helper |
| Booking / quote request | Successfully saved request; assigned artisan and submitted client contact email | Shared Resend helper |
| Booking acceptance/update | Artisan accepts; client booking contact email | Shared Resend helper |
| Cancellation | Client cancels: artisan; artisan cancels: client | Shared Resend helper |
| Reminder | Protected daily cron; client and assigned artisan | Shared Resend helper |
| Review request | Artisan completes booking; client | Shared Resend helper |
| Artisan approval/activation | Admin transition; artisan contact email | Shared Resend helper |
| Contact and GDPR requests | Submitted form; configured support recipient | Required-email wrapper around shared transport |
| Chatbot personal follow-up | Submitted contact request; configured support recipient | Required-email wrapper around shared transport |
| Registration confirmation, recovery, email change and other Auth messages | Supabase Auth; authenticated flow's recipient | Separate hosted Supabase SMTP configuration; not controlled by the app helper |
| Generated quote/invoice PDFs | Existing download workflow | No existing email-send trigger or PDF attachment delivery was found; downloads remain intact |

There is no separate rescheduling email trigger in the inspected repository.
Email subjects, HTML, recipients, signed booking-photo links and confirmation
links remain in the existing callers/templates. The transport also preserves
optional file attachments and provider idempotency keys. Support/chat visitor
emails remain in message content; their Reply-To now uses the OVH mailbox.

After a booking or quote request is saved, LaMain2 attempts artisan email, SMS
and an in-account notification independently. Booking retries do not trigger
another set of messages. The current private contact email takes precedence
over the login email; the current professional phone takes precedence over
the registration phone. Customer confirmations use the contact information
saved on the booking.

## Production setup

1. In the Resend account/team belonging to the **deployed API key**, add and
   verify `lamain2.com` for **Sending**. Add only the required sending DNS records
   shown by that domain. A bounce/return-path MX on a dedicated sending subdomain
   is distinct from the root MX records serving OVH. Preserve the OVH root MX,
   existing SPF configuration and website records; keep Receiving disabled.
2. In Vercel's production and preview environments set
   `EMAIL_FROM=LaMain2 <contact@lamain2.com>` and
   `EMAIL_REPLY_TO=contact@lamain2.com`. Configure the existing valid
   `RESEND_API_KEY`, then redeploy. Never put API keys in public variables, logs
   or Git. Missing or rejected credentials are failures, not successful sends.
3. Configure the existing Twilio account using `TWILIO_ACCOUNT_SID`,
   `TWILIO_AUTH_TOKEN` and an SMS-capable `TWILIO_PHONE_NUMBER` in international
   format. Trial accounts restrict recipients; also check credit and geographic
   permissions for the countries to which messages are sent. SMS incurs provider
   usage charges.
4. In **Admin → Paramètres**, enable the required channels and inspect the
   notification status section. The checks read provider configuration and
   account status; they do not send messages or reveal credentials. Production
   build logs also contain these safe configuration statuses.

## Verify delivery

Create one reservation and one quote request using test customer information
and an artisan account whose inbox and phone you control. Check the artisan's
account notification, inbox/spam folder, and SMS inbox. Check the corresponding
Resend and Twilio delivery logs. A provider accepting a message is not proof
that a recipient received it. Booking confirmation still succeeds when a
channel fails; server logs identify the booking ID, channel and safe error code.

An email rejection must not block SMS or in-account notifications. Changing the
contact email/phone in the artisan account should update the next notification's
destination. Failed bookings and repeated submissions must not send new alerts.

Old requests are not resent automatically when a channel is enabled. This
avoids surprising customers and artisans with duplicate historical messages.

The reminder job records `reminder_sent_at` only once both email requests have
been accepted by Resend. Its response uses `remindersAccepted` and failure
counts, not a claim of inbox delivery. A rejection produces HTTP 502 and leaves
the reminder retryable. Stable per-recipient provider idempotency keys prevent
duplicate emails on retries within Resend's idempotency window; in-app reminders
and customer SMS are not repeated during those retries.

## Supabase authentication: separate, not verified by the app deployment

The repository calls Supabase `auth.signUp` and `auth.resetPasswordForEmail`.
Changing Vercel email variables does **not** configure hosted Auth SMTP. The
checked-in `supabase/config.toml` enables confirmation but does not configure
custom SMTP; it is not evidence of the hosted project's current SMTP state.

In project `kfkqsbkxtjsixqagffkv`, open **Authentication → Email → SMTP Settings**
(Custom SMTP), enable it, and set:

| Setting | Value |
| --- | --- |
| Sender email | `contact@lamain2.com` |
| Sender name | `LaMain2` |
| Host | `smtp.resend.com` |
| Port | `465` with implicit TLS (or `587` with STARTTLS) |
| Username | `resend` |
| Password | A sending-capable Resend API key for the same verified domain; enter only in the private dashboard |

Keep email confirmations, existing secure-change settings, redirect URLs and
rate limits intact. Hosted SMTP cannot be inferred from public Auth settings or
the database and is not claimed connected until that dashboard and controlled
signup/recovery tests are verified. Supabase's SMTP settings do not expose an
independent Reply-To field: if its Auth mail omits that header, replies use the
From address `contact@lamain2.com`. An explicit custom Reply-To on Auth mail
would require a separately configured Send Email Hook; none exists here.

Use a controlled mailbox for signup confirmation and password recovery, inspect
the received From/Reply-To and token/callback behavior, then check Resend's SMTP
email records. Do not test with real customers or disable email confirmation to
work around delivery errors. Recovery responses remain generic to avoid account
enumeration and do not assert that an email was delivered.

## Acceptance, delivery and incoming replies

1. A Resend message ID means **accepted**, not delivered.
2. A provider `delivered` event means the recipient mail server accepted it,
   not proof that it appeared in the primary inbox or was read.
3. Confirm actual inbox/spam receipt using only an operator-controlled mailbox.
4. Reply to the received email and verify arrival at the OVH mailbox separately.

Resend's `delivered@resend.dev` and `bounced@resend.dev` addresses are controlled
provider test targets that simulate delivery outcomes; they do not verify OVH
inbox receipt. If Sending is unverified, do not claim live message acceptance or
delivery. The safe readiness check reports a missing domain, pending DNS records,
restricted API-key visibility or provider failures explicitly. DNS missing from
the receiving side must be confirmed in Cloudflare/OVH; this change never adds or
replaces root MX records.

With authorized server credentials already present in the process environment,
`npm run email:verify` uses the same server-only app transport and a hardcoded
Resend simulation recipient. It first checks Sending verification, exits with
code 2 if blocked/rejected, and distinguishes provider acceptance from events.
It does not load or export production secrets into a local file. For a controlled
production build check, temporarily enable `EMAIL_SMOKE_TEST=true` in Vercel,
deploy, inspect `[email-test]` logs, then remove that flag. Only the build helper
uses this opt-in flag; no customer recipient can be supplied. A green website
build is not evidence that an email test passed: inspect the explicit test result.

References: [Resend SMTP](https://resend.com/docs/send-with-smtp),
[Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp),
[Resend test addresses](https://resend.com/docs/dashboard/emails/send-test-emails).

## WhatsApp

WhatsApp is not enabled by this change. Automated business notifications need
a configured WhatsApp Business sender, recipient opt-in and approved message
templates. Twilio/Meta charges can apply; a browser `wa.me` link cannot provide
automatic server notifications. Complete that provider setup before adding
WhatsApp as another independent channel.
