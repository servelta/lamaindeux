# LaMainDeux

Marketplace connecting French customers with verified home-service
professionals — plumbers, electricians, painters, HVAC technicians, general
contractors. Customers search free and book directly; professionals pay a
monthly subscription (manual Stripe Payment Link for now) to appear in
search once approved and active. The platform launches with a single trade
active (**Plomberie**) — every other trade already exists in the database,
inactive, so switching one on later is an admin toggle plus adding its
services, not a schema change.

**Status: all 10 phases complete**, plus a subsequent generalization pass
(originally built plumbing-only as "MonPlombier", then generalized to
multi-trade and rebranded to "LaMainDeux" — see "Multi-trade
generalization" below for exactly what that involved).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres,
Auth, Storage) · Resend (email) · Twilio (SMS, optional) · Stripe Payment
Links · Vercel.

## 1. Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- (Optional for now) Resend and Twilio accounts — the app runs fine without
  them; SMS/email sending just no-ops with a log line until configured.

## 2. Install

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
  Supabase project's API settings.
- `SUPABASE_SERVICE_ROLE_KEY` — same page, **server-only**, never expose to
  the client or commit it.
- `ADMIN_SETUP_SECRET` — make up any long random string; used only to gate
  the admin-bootstrap script below.

## 3. Set up the database

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli)
installed and linked to your project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/*.sql in order
```

For local development with the Supabase CLI's local stack instead:

```bash
supabase start
supabase db reset         # applies migrations + supabase/seed.sql
```

The migrations run in order:
1. `0001_init_schema.sql` — enums, tables, indexes, constraints, booking
   number generator.
2. `0002_search_view.sql` — `active_plumbers` view (the only thing public
   search should ever query).
3. `0003_rls_policies.sql` — Row Level Security policies on every table.
4. `0004_auth_triggers.sql` — auto-creates `profiles`/`customers`/`plumbers`
   rows when someone signs up via Supabase Auth.

`supabase/seed.sql` loads demo cities and services (clearly non-production
data — no fake plumber accounts are seeded here since Supabase Auth users
can't be created via plain SQL; that seed script arrives in Phase 3).

## 4. Generate TypeScript types (recommended)

`types/database.ts` currently ships as a hand-written placeholder. Once your
Supabase project has the schema applied, regenerate real types:

```bash
export SUPABASE_PROJECT_ID=<your-project-ref>
npm run db:types
```

## 5. Create your first admin account

There is no public "become an admin" flow — by design, the sign-up trigger
never allows self-assigning the `admin` role. Instead:

```bash
npm run create-admin -- --email=you@example.com --password="a-strong-password" --secret=$ADMIN_SETUP_SECRET
```

This uses the service role key to create the auth user directly and then
promotes their profile to `admin`.

## 6. Run locally

```bash
npm run dev
```

- `/` — homepage placeholder (full design in Phase 2)
- `/inscription` — customer sign-up
- `/inscription/professionnel` — professional sign-up (trade selectable; only Plomberie is active at launch)
- `/connexion` — login (redirects to `/mon-compte`, `/dashboard`, or `/admin`
  based on role)

## 7. Run tests

```bash
npm test               # unit tests only — pure validation logic, no DB needed
npm run test:integration  # requires a running local Supabase (see below)
npm run test:all       # both
```

**Unit tests** (`lib/**/*.test.ts`) cover every Zod validation schema in the
app — auth, booking, plumber profile/services, reviews. No database
required.

**Integration tests** (`tests/integration/`) exercise real RLS policies,
triggers, and constraints against an actual Supabase instance — the thing
that actually matters for security-critical logic like "can a customer
read another customer's data" (answer should always be no). They create
and delete real (disposable) auth users, so **never point them at a
production project**. To run them locally:

```bash
supabase start                          # spins up local Postgres + Auth
cp .env.test.local.example .env.test.local
# fill in the values `supabase start` printed
npm run test:integration
```

They cover the critical flows from the original spec: customer/plumber
registration creates the right rows, admin role can never be
self-assigned, RLS blocks cross-account reads (customer↔customer,
plumber↔customer, unauthenticated↔private documents), the plumber
protected-column guard holds even on a plumber's own row, search only
surfaces `ACTIVE` plumbers and respects city/service/active-service
filtering, booking creation generates a valid booking number, double-
booking is rejected at the database level, reviews are gated to completed
bookings with one per booking, and submitting a review recalculates the
plumber's rating.

`.github/workflows/ci.yml` runs both suites — plus lint, a type check, and
a production build — against a fresh local Supabase stack on every push,
so this isn't just documentation nobody runs.

**Honesty note**: I wrote and carefully hand-reviewed every test in this
repository, but this sandbox has no network access, so I was never able to
actually execute them against a real Supabase instance before shipping —
the same limitation noted in every earlier phase's README updates. Run
`npm run test:all` yourself as a first step; if anything fails, it's a
real bug in either the test or the code, not a display issue.

## Project structure

```
app/
  (public)/              # homepage, search, plumber profiles — Phase 2+
  (auth)/                # connexion, inscription, inscription/professionnel
  (customer)/            # mon-compte, mes-reservations — role-protected
  (plumber)/              # dashboard, profil, calendrier — role-protected
  (admin)/admin/          # admin dashboard — role-protected
components/
  ui/                    # hand-written shadcn-style primitives (button, input, card, label)
  auth/                  # submit-button (pending state)
lib/
  supabase/              # client.ts (browser), server.ts (Server Components/Actions), middleware.ts
  auth/                  # actions.ts (Server Actions), roles.ts (RBAC route map)
  validation/            # zod schemas
types/database.ts        # Supabase generated types (placeholder until `npm run db:types`)
supabase/
  migrations/            # schema, search view, RLS, auth triggers — run in order
  seed.sql               # demo cities + services
scripts/
  create-admin.ts        # one-time admin bootstrap
middleware.ts            # session refresh + role-based route protection
```

## Security notes

- **RLS is the source of truth for data isolation**, not just app code —
  every table has row-level policies restricting reads/writes to the owning
  customer/plumber or an admin. Plumber verification documents and customer
  contact details are never publicly readable.
- **`middleware.ts`** additionally blocks navigation into the wrong route
  group (`/admin`, `/dashboard`, `/mon-compte`) before a page even renders,
  as a first line of defense — RLS is what actually protects the data if
  that check is ever bypassed.
- **No admin role can be self-assigned** via public sign-up, at the database
  trigger level, not just in the UI.
- Full details are commented inline in `supabase/migrations/0003_rls_policies.sql`.

## Business rules encoded so far

- Customers pay nothing; platform takes no commission on jobs.
- A plumber only appears in the `active_plumbers` search view once
  `status = 'ACTIVE'` — set manually by an admin after contract + payment
  (Phase 6 builds that admin UI; the DB fields already exist:
  `contract_status`, `payment_status`, `subscription_start/end`).
- Double-booking is prevented at the database level with a partial unique
  index on `(plumber_id, scheduled_date, scheduled_time)`.
- One review per completed booking, enforced by a unique constraint plus an
  RLS insert policy that checks the booking is actually `COMPLETED` and
  belongs to the reviewing customer.

## Admin dashboard (Phase 6)

The full plumber lifecycle from Section 22 is wired end-to-end:
`PENDING → UNDER_REVIEW → APPROVED → (contract signed + payment received) → ACTIVE`,
with `SUSPENDED`/`REJECTED` as side branches. An admin can also manage
customers (suspend/reactivate — which now actually blocks booking
creation), oversee all bookings (search/filter/cancel/resolve disputes),
manage the services and cities catalogs, and edit platform settings
(subscription price, Stripe Payment Link, email/SMS toggles) — the same
`platform_settings` row Phase 5's notification code already reads from.

Every admin action writes an `admin_actions` audit row.

## Notifications (Phase 5)

Email (Resend) and SMS (Twilio) are both optional at the code level — the
app runs fine with neither configured; it just logs and skips. Both also
respect the admin toggles in `platform_settings` (`email_enabled`,
`sms_enabled`), which default to email-on/SMS-off.

Wired in so far: booking created (confirms to customer, notifies plumber),
booking accepted (notifies customer), booking cancelled by either side
(notifies the other party), and a welcome email on sign-up. A daily
reminder job lives at `app/api/cron/booking-reminders`, scheduled via
`vercel.json` (Vercel Cron, free tier allows daily jobs) and protected by a
`CRON_SECRET` you set yourself — set it in your Vercel project's
environment variables too, since Vercel Cron doesn't inject it
automatically.

In-app notifications (the bell icon in the customer/plumber nav) are
written via the service-role client, matching the Phase 1 RLS design where
`notifications` has no client-side insert policy.

## Reviews (Phase 7)

Customers can review a booking once it's `COMPLETED` — one review per
booking, enforced by both a unique constraint and an RLS insert policy that
checks the booking is actually completed and owned by the reviewer (both
from Phase 1). This phase added the actual submission form and something
that was missing since Phase 1: **`plumbers.rating_avg`/`rating_count` were
columns nobody ever wrote to.** A database trigger now recalculates both
whenever a review is inserted, updated, or hidden — using a transaction-
local bypass flag so the Phase 3 "plumbers can't fake their own rating"
guard trigger doesn't block this system-driven update.

Admin can hide/unhide any review (`/admin/avis`); a hidden review drops out
of the public profile and the rating recalculation immediately.

A "leave a review" email fires when a plumber marks a booking completed.

## SEO (Phase 8)

Research-backed choices, not generic boilerplate:

- **Trade-specific schema.org subtypes** (`Plumber`, `Electrician`, `HousePainter`, `HVACBusiness`, falling back to generic `HomeAndConstructionBusiness`) on public profiles, chosen dynamically from the professional's trade — more specific than generic `LocalBusiness`, which helps search and AI engines match the entity to trade-specific intent queries. Deliberately omits phone/email/street address, matching the spec's own privacy rule that contact details stay private until a booking exists.
- **`AggregateRating`** only renders once a plumber has real reviews (`rating_count > 0`) — never a fabricated placeholder rating.
- **`Service` schema** on every `/[trade]/[city]/[service]` page (e.g. `/plombiers/paris/reparation-fuite`) — the actual highest-value SEO surface, representing the service-in-that-city as offered through the marketplace.
- **`BreadcrumbList`** on every city/city-service/profile page.
- **`FAQPage`** on city and city-service pages — with an honest caveat in the code comment: Google restricted FAQ rich-result eligibility to a narrow set of authoritative sources in 2026, so this likely won't win a visible snippet in Google itself, but it still helps other engines and AI answer systems parse the Q&A directly.
- **`Organization` + `WebSite` with `SearchAction`** sitewide, enabling a possible Google sitelinks search box under the homepage result.
- **Dynamic OG images** (`opengraph-image.tsx`, edge runtime, `next/og`) for the homepage, every city+service page, and every plumber profile — most small competitors in this space skip this entirely, and it directly affects click-through when links get shared.
- **`app/sitemap.ts`**: homepage, static pages, every active city, every active city×service combination, every `ACTIVE` plumber profile — regenerated hourly via `revalidate`.
- **`app/robots.ts`**: disallows `/admin`, `/api`, all authenticated dashboards, the booking form, and the transactional confirmation page — nothing session-dependent gets crawl budget.
- **`metadataBase`** set sitewide so every relative canonical/OG URL resolves correctly.

What this phase deliberately does **not** attempt, because it's operational rather than code: Google Business Profile setup is per-plumber (each plumber needs their own GBP listing — the platform can't create one on their behalf), and building topical authority/backlinks takes months regardless of the codebase. Both of those are genuinely the two biggest levers per the research, but they're a content/ops workstream, not something Phase 8 can ship as code.

## Security & GDPR (Phase 9)

**Rate limiting**: a Postgres-backed fixed-window counter (`check_rate_limit`,
migration 0010) rather than an external service — works correctly across
serverless function instances (an in-memory counter wouldn't) and costs
nothing extra. Applied to login (per-account *and* per-IP, so it stops both
targeted brute force and one attacker spraying many accounts), sign-up
(per-IP), password reset requests (per-account and per-IP), and booking
creation (per-user and per-IP). All rate-limit checks fail open — a broken
limiter should never be why the app goes down, since it's defense-in-depth
on top of validation/RLS/unique constraints, not the primary safeguard.

**Password reset**: didn't exist until this phase — a real gap, not a
polish item. `/mot-de-passe-oublie` → email link → `/reinitialiser-mot-de-passe`.
The request endpoint always returns the same message whether or not the
email is registered, so it can't be used to enumerate accounts.

**GDPR self-service** (Section 32): `/api/gdpr/export` returns everything
the platform holds tied to your own account as a downloadable JSON file.
Account deletion has two paths — hard-delete (cascades cleanly via FK) if
you have zero bookings, or anonymize-and-ban if you have booking history,
since `bookings.customer_id`/`plumber_id` are `ON DELETE RESTRICT` by
design (a booking needs to keep referring to *someone*, or the other
party's own transaction history breaks). The anonymization path needed its
own migration (0011) to safely bypass the Phase 3 guard trigger that
otherwise blocks a plumber from writing their own `status` — scoped so it
only ever lets a user act on their own row, via `auth.uid() = p_plumber_id`.

**Consent**: both sign-up forms now require the terms/privacy checkbox
(previously only the plumber one did).

**Fixed while in here**: JSON-LD output wasn't escaping `<`, so a plumber
company name or review comment containing literal `</script>` could have
broken out of the structured-data script tag — a real if narrow XSS vector
from Phase 8, closed in `components/seo/json-ld.tsx`. Added standard
security headers (`X-Frame-Options`, `X-Content-Type-Options`, HSTS,
`Referrer-Policy`) in `next.config.mjs`. CSRF: Next.js Server Actions
already carry built-in origin-checking, so no extra code was needed there
— worth knowing rather than assuming.

**Cookie policy** page added: the platform currently uses only the
strictly-necessary Supabase auth session cookie, which is exempt from
consent requirements under French/EU rules — noted as a `TODO` to revisit
if analytics/marketing cookies are ever added later.

## Tests & deployment (Phase 10)

Every critical flow the original spec called for (Section 47) now has an
integration test exercising the real database — not a mock — plus unit
tests for every validation schema. See "Run tests" above for what's
covered and how to run it, and `.github/workflows/ci.yml` for the CI
pipeline that runs the full suite plus a production build on every push.

`DEPLOYMENT.md` is the step-by-step production checklist: Supabase
project setup, environment variables, Resend/Stripe/Vercel Cron
configuration, first-admin bootstrap, and a pre-launch verification list.

## Multi-trade generalization

The platform was originally built plumbing-only ("MonPlombier"). After all
10 phases were complete, it was generalized to support any home-service
trade and rebranded to LaMainDeux. What that involved, concretely:

- **Database** (`supabase/migrations/0012_multi_trade_generalization.sql`):
  added a `trades` table (Plomberie active; Électricité, Peinture, Chauffage
  & Climatisation, Travaux généraux seeded inactive — flip one on later
  with a single `UPDATE`, no schema change), renamed `plumbers` →
  `professionals` and every table/column that referenced it
  (`plumber_documents`, `plumber_services`, `plumber_service_areas`, every
  `plumber_id` FK column across bookings/reviews/availability/subscriptions/
  contracts), renamed the `plumber` role value to `professional`, renamed
  the `CANCELLED_BY_PLUMBER` booking status to `CANCELLED_BY_PROFESSIONAL`,
  added `trade_id` to `professionals` and `services`, and rebuilt every
  dependent view, trigger, and RLS policy that referenced the old names.
- **Routes**: `/plombiers/[city]` became the dynamic `/[trade]/[city]` (so
  `/plombiers/paris` still works today, and `/electriciens/paris` will work
  the moment that trade is activated, with zero route code changes).
  `/plombier/[slug]` became the trade-agnostic `/artisan/[slug]`.
- **SEO**: the public profile's structured data now picks the correct
  schema.org subtype per trade (`Plumber`, `Electrician`, `HousePainter`,
  `HVACBusiness`, falling back to `HomeAndConstructionBusiness`) instead of
  being hardcoded to `Plumber`. The sitemap loops over active trades so
  each trade only cross-joins with its own services.
- **UI**: the homepage gained a trade-picker section (Plomberie clickable,
  every other trade shown as "Bientôt disponible"), the search form shows a
  trade selector only once a second trade is active (pointless UI with
  just one choice), the professional sign-up form asks for a trade, and
  the verified badge on a public profile now reads dynamically (e.g.
  "Plombier vérifié", "Électricien vérifié" once that trade is live)
  instead of being hardcoded.

Two mistakes I made during this pass and caught before shipping, worth
naming rather than hiding: a bulk find-and-replace briefly turned the SEO
schema's `"@type": "Plumber"` into the invalid schema.org type
`"Professional"` before I replaced it with the proper trade-mapping logic
above; and the same bulk pass initially missed several `/admin/plombiers/...`
links across the admin dashboard (they'd all have 404'd) until a full grep
sweep caught them.

## Where this stands

All 10 phases from the original roadmap are built: auth and the full
database/RLS foundation, public search and SEO-optimized city/service
pages, the professional dashboard (profile, services, calendar, documents),
the end-to-end booking flow with real availability checking, email/SMS
notifications, the admin dashboard covering the full professional
verification→contract→payment→activation lifecycle, reviews with an
actually-computed rating, deep SEO (structured data, sitemap, dynamic OG
images), a security/GDPR hardening pass, tests plus a deployment guide —
and, after all of that, a full generalization from a single-trade
plumbing marketplace to a multi-trade one launching with plumbing first.

What's genuinely still needed before a real launch, stated plainly rather
than glossed over: a professional legal review of the terms/privacy/cookie
pages (marked `TODO` throughout, not silently assumed compliant), and
running the test suite yourself in an environment with actual network
access, since this sandbox never had one.

---
_Legal note: Terms, privacy policy, and cookie policy pages are placeholders
with clear `TODO: legal review required` markers — nothing in this
codebase should be treated as a substitute for professional legal review
before launch._
