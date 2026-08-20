# Deploying LaMainDeux

A checklist for taking this from local development to a live, low-cost
production deployment. Follow in order — several steps depend on earlier
ones.

## 1. Supabase (production project)

1. Create a new project at [supabase.com](https://supabase.com) (free tier
   is sufficient to start).
2. Link and push the schema:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
   This applies every migration in `supabase/migrations/` in order — the
   full schema, RLS policies, triggers, and storage buckets.
3. **Do not run `supabase/seed.sql` against production** — it's clearly
   demo data (see the file's own header comment). Instead, use
   `/admin/villes` and `/admin/services` to add your real initial cities
   and services once the admin account exists (step 4).
4. In the Supabase dashboard, confirm the three storage buckets exist and
   are correctly public/private: `avatars` (public), `plumber-documents`
   (private), `booking-photos` (private). The migrations create these
   automatically, but it's worth a visual check before launch.
5. Under Authentication → Email Templates, consider customizing the
   confirmation/recovery email templates to match LaMainDeux's branding
   (optional — Supabase's defaults work fine to start).

## 2. Environment variables

Set every variable from `.env.example` in your Vercel project settings
(Project → Settings → Environment Variables), for the Production
environment:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` — from the Supabase project's API settings.
- `NEXT_PUBLIC_SITE_URL` — your real production domain, e.g.
  `https://lamaindeux.fr`. This feeds canonical URLs, the sitemap, OG
  images, and email links — get it right before launch.
- `RESEND_API_KEY`, `EMAIL_FROM` — see step 3.
- `ADMIN_SETUP_SECRET` — a long random string, used once (step 4).
- `CRON_SECRET` — a long random string, used by the reminder cron (step 5).
- `TWILIO_*`, `SMS_ENABLED` — optional; leave unset to launch email-only.
- `STRIPE_PAYMENT_LINK_URL` — optional fallback; the platform default is
  better set via `/admin/parametres` instead once the admin account exists.

## 3. Email (Resend)

1. Create a free [Resend](https://resend.com) account (3,000 emails/month
   free).
2. Verify your sending domain (or use Resend's shared domain to start,
   though a verified domain improves deliverability).
3. Set `EMAIL_FROM` to an address on that domain, e.g.
   `"LaMainDeux <contact@lamaindeux.fr>"`.

## 4. Deploy to Vercel

1. Push this repository to GitHub/GitLab and import it in Vercel — the
   framework preset (Next.js) is detected automatically.
2. Confirm environment variables (step 2) are set before the first deploy.
3. Deploy.

## 5. Create the first admin account

Run this **once**, from your local machine, pointed at the production
Supabase project (use production values in a temporary `.env.local`, or
pass them inline):

```bash
npm run create-admin -- --email=you@example.com --password="a-strong-password" --secret=<your ADMIN_SETUP_SECRET>
```

Log in at `https://your-domain/connexion` and confirm you land on
`/admin`.

## 6. Configure the platform via the admin dashboard

At `/admin/parametres`, set:
- Platform name, support email
- Default plumber subscription price (e.g. €29/month)
- Your real Stripe Payment Link (create one at
  [dashboard.stripe.com/payment-links](https://dashboard.stripe.com/payment-links)
  for the subscription amount — no Stripe Connect, no code changes needed)

At `/admin/villes` and `/admin/services`, add your real launch cities and
services (the seed data is demo-only, per step 1.3).

## 7. Vercel Cron (booking reminders)

`vercel.json` already declares the daily reminder job. Nothing further is
needed beyond `CRON_SECRET` being set (step 2) — Vercel picks up
`vercel.json` automatically on deploy. Confirm it under Project → Cron
Jobs after the first deploy.

## 8. Verify before announcing launch

- [ ] Sign up as a test customer and a test plumber; confirm both welcome
      emails arrive.
- [ ] Approve the test plumber through the full admin flow (approve → mark
      contract signed → mark payment received → activate) and confirm they
      appear in search once active.
- [ ] Create a real booking end-to-end and confirm both the customer and
      plumber receive their emails.
- [ ] Check `https://your-domain/sitemap.xml` and
      `https://your-domain/robots.txt` resolve correctly.
- [ ] Submit the sitemap in Google Search Console.
- [ ] Confirm `/conditions-utilisation`, `/confidentialite`, and `/cookies`
      have had a legal review — the shipped copy is explicitly a
      placeholder (see the `TODO` comments in each page).

## Ongoing costs at this scale

| Service | Expected cost |
|---|---|
| Vercel | €0 (Hobby tier) |
| Supabase | €0 (Free tier, until ~500MB DB or meaningful traffic) |
| Resend | €0 (under 3,000 emails/month) |
| Twilio | Pay-per-SMS only, if/when enabled |
| Stripe | Only its standard payment-processing fee on each plumber's subscription charge — no platform fee |
| Domain | The one genuinely unavoidable cost |
