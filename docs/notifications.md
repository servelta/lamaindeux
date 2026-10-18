# Booking and quote-request notifications

After a booking or quote request is saved, LaMain2 attempts artisan email, SMS
and an in-account notification independently. Booking retries do not trigger
another set of messages. The current private contact email takes precedence
over the login email; the current professional phone takes precedence over
the registration phone. Customer confirmations use the contact information
saved on the booking.

## Production setup

1. In Resend, add and verify `lamain2.com` using the DNS records Resend supplies.
   A `resend.dev` sender can only send test mail to the account owner's address.
2. In Vercel's production environment, set `EMAIL_FROM` to an address on the
   verified domain, such as `LaMain2 <notifications@lamain2.com>`. Configure a
   valid `RESEND_API_KEY`, then redeploy. Never put API keys in public variables.
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

## WhatsApp

WhatsApp is not enabled by this change. Automated business notifications need
a configured WhatsApp Business sender, recipient opt-in and approved message
templates. Twilio/Meta charges can apply; a browser `wa.me` link cannot provide
automatic server notifications. Complete that provider setup before adding
WhatsApp as another independent channel.
