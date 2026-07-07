# Dirt & Leaf

A "one photo, that's it" houseplant care app: snap a picture, confirm the species from a
short list of visual matches, and get an automatically-built watering/feeding/placement
schedule that adjusts for your location, local weather, and the season — plus product
recommendations and nearby nursery links.

## Tech stack

- **Frontend:** React + Vite + Tailwind CSS + shadcn/ui, hash-based routing via `wouter`, data
  fetching via TanStack Query.
- **Backend:** Express (single process, serves the API and the built frontend).
- **Database:** SQLite via `better-sqlite3` + Drizzle ORM (`shared/schema.ts` is the single
  source of truth for the data model; tables are created on boot in `server/storage.ts`).
- **Fonts:** Satoshi (body) and Zodiak (display), loaded from Fontshare — matches the approved
  reference UI (`reference/approved-ui-reference.html`), which is the design source of truth
  for color, type, spacing, and screen flow in this build.

## Setup & running

```bash
npm install
npm run dev        # starts Express + Vite on one port, http://localhost:5000
```

Production build:

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

Copy `.env.example` to `.env` and fill in real keys before production use — see that file
for what each variable does and where to get it. **The app runs and is fully testable with
zero env vars set** — every external integration has a clearly-labeled mock/fallback path
(see "Deviations from spec" below).

## Where things live

| Feature | Frontend | Backend |
| --- | --- | --- |
| Home (spaces, reminders) | `client/src/pages/home.tsx` | `GET /api/rooms`, `/api/plants`, `/api/reminders` |
| Scan → identify → save | `client/src/pages/scan.tsx` | `POST /api/identify` (`server/plant-id.ts`), `POST /api/plants` |
| Plant identification | — | `server/plant-id.ts` (Plant.id / kindwise.com, mock fallback) |
| Care schedule computation | — | `server/care-scheduling.ts` + `server/weather.ts` (Open-Meteo) |
| Care profile reference data | `client/src/pages/plant-profile.tsx` | `server/care-profile-seed.ts` → `care_profiles` table |
| Plants list / room screens | `pages/plants.tsx`, `pages/room.tsx` | `/api/plants`, `/api/plants/room/:roomId`, `/api/rooms/:id` |
| Plant profile detail | `pages/plant-profile.tsx` | `/api/plants/:id`, `/api/care-profiles` |
| Progress photos | `pages/progress-photo.tsx` | `/api/plants/:id/progress-photos` |
| Shop (affiliate + nurseries) | `pages/shop.tsx` | `server/affiliate.ts`, `server/nurseries.ts` (OSM) |
| Push notifications | `lib/push.ts`, `public/sw.js` | `server/push.ts`, `/api/push/*` |
| Account / plan | `pages/account.tsx` | `/api/account`, `/api/account/upgrade`, `/api/account/downgrade` |
| Paywall / upgrade | `pages/upgrade.tsx` | same as above |
| Pricing constants | `shared/pricing.ts` (imported by both client & server) | — |

## Data model

See `shared/schema.ts` for full field-level docs. Tables: `rooms`, `care_profiles`, `plants`,
`reminders`, `progress_photos`, `notification_log`, `affiliate_links`, `push_subscriptions`,
`users`.

Two rooms ("Living room", "Office") are seeded on first run so a freshly-scanned plant has
somewhere to go without asking the user to configure anything first — consistent with the
"just take a picture, boom, it's done" requirement.

## Care data research process

`care_profiles` is intentionally NOT a thin pass-through of a single API response. Each row
represents a synthesized best estimate — informed by the kind of guidance found across
university extension horticulture programs, established houseplant reference books, and
specialist grower guidance — of how that species should be watered, fed, placed, and
repotted, plus environmental tolerances and toxicity notes.

**Current state (this build):** 55 species are seeded in `server/care-profile-seed.ts`,
covering the most commonly kept houseplants across the continental US (tropical foliage,
succulents/cacti, ferns, flowering houseplants, and common "hard to kill" starter plants).
Every row has:

- `sourceCitations` — a JSON array of `{ label, url }` describing the *type* of source that
  informed the synthesis (e.g. university extension, established reference guide).
- `researchStatus` — `"seed"` for all 55 rows in this build. No row has been flipped to
  `"verified"` yet.
- `researchNotes` — free-text flags for follow-up (e.g. regional variation callouts).

**What still needs a dedicated deep-research pass before treating this as authoritative:**

1. **Fact-check every numeric interval** (`waterIntervalDays*`, `feedIntervalDays*`,
   `repotIntervalMonths`, `idealTempMinF/MaxF`, `idealHumidityPct`) against live extension
   publications and grower sources per species, and attach real URLs to `sourceCitations`.
2. **Expand beyond 55 species.** The spec asks for "all regions of the US" coverage; this
   build prioritized breadth-of-common-species over exhaustive coverage given the build
   constraints. Regional/rare houseplants, and less common cultivars/varieties of the seeded
   species, are not yet covered — `findCareProfileByName` will fail to match and the plant
   will save without a computed schedule.
3. **Cross-check toxicity claims** against ASPCA / Pet Poison Helpline for every species —
   currently synthesized from general knowledge, not independently verified per row.
4. **Regional nuance.** `idealHumidityPct`/`idealTempMinF/MaxF` are single global ranges per
   species; a true deep-research pass would branch care notes by hardiness zone / climate
   (e.g. arid Southwest vs. humid Southeast) rather than relying solely on the live
   Open-Meteo adjustment in `server/care-scheduling.ts`.
5. Flip `researchStatus` to `"verified"` per row only after (1)-(3) are done for that row —
   the Premium paywall copy ("deep care profile data") assumes this distinction will
   eventually be real, not just a schema placeholder.

## Pricing & subscriptions

Freemium + subscription model, no one-time purchase:

- **Free:** unlimited scans/identifications (never gated), up to `FREE_PLANT_LIMIT` (3)
  actively tracked plants with reminders. Defined once in `shared/pricing.ts` and imported by
  both the client (paywall copy) and server (`POST /api/plants` limit check) so they can never
  drift out of sync.
- **Premium — $4.99/mo or $39.99/yr** (yearly ≈ 33% cheaper per month, "Best value" badge).
  Unlocks: unlimited tracked plants, full progress-photo history (free tier sees only the
  latest photo), advanced notification customization (UI entry point stubbed in Account —
  see below), and priority access to deeper care-profile data as it's produced.
- Plant scanning/identification is **never** behind the paywall — only the *tracking* of more
  than 3 plants and the listed Premium extras are gated, per the requirement that core ID
  functionality stay free.

**Payments are stubbed, not real.** `POST /api/account/upgrade` just flips
`users.subscriptionTier` in SQLite and sets a fake `subscriptionExpiresAt` — there is no
Stripe/IAP integration and no real charge occurs anywhere in this build. This is called out
explicitly in the UI (`pages/upgrade.tsx` "Demo mode" disclosure) and in code
(`// TODO(payments)` comment in `server/routes.ts`). **Before accepting real money:**

- **Web:** integrate Stripe Checkout + webhooks to set `subscriptionTier`/`subscriptionExpiresAt`
  from a verified webhook event, not a client-triggered call.
- **Native iOS/Android (future):** validate Apple/Google in-app-purchase receipts
  server-side instead of (or in addition to) Stripe for in-app subscriptions.

"Advanced notification customization" (custom schedules, snooze) has a paywall entry point in
Account but the actual custom-schedule editor UI is not built in this pass — flagged as a
deviation below.

## Reminders & notifications

Real Web Push (Notification/Push API) via `client/public/sw.js` + `server/push.ts`
(VAPID/`web-push` library). A user opts in from the Account screen ("Push reminders" toggle),
which requests permission, registers the service worker, and posts the subscription to
`POST /api/push/subscribe`.

There is no background cron running inside this app process. `POST /api/push/check-reminders`
computes due reminders and sends pushes to all subscriptions — in production this should be
invoked on a schedule (e.g. an external cron hitting that endpoint every 15–60 minutes).

## Deviations from SPEC.md

1. **Care profile depth:** 55 species with `researchStatus: "seed"` synthesis rather than a
   live, per-species deep-research crawl of Reddit/Facebook/books (not possible from within
   this sandboxed build). See "Care data research process" above for the explicit follow-up
   plan and what to verify before calling this data authoritative.
2. **100% accurate plant ID** is not achievable by any identification service, including
   Plant.id — this build mitigates the "mismatched plant" failure mode from the spec by always
   surfacing 3–5 ranked candidates with confidence scores and visual compare tiles for user
   confirmation, rather than silently trusting the top match.
3. **Single-user app, no login.** The spec didn't request multi-user auth, so `users` holds
   exactly one row (id 1) representing the app owner's subscription state. The table is
   modeled as a real table specifically so adding auth later is additive.
4. **Advanced notification customization UI** (custom per-plant schedules, snooze) is gated
   and mentioned in paywall copy but the editor itself is not built — only the toggle-on-push
   flow is implemented in this pass.
5. **Payments are mocked**, as required by the pricing follow-up instructions — see "Pricing &
   subscriptions" above.
6. **No native iOS/Android wrapper.** This is a responsive web app (PWA-ready manifest +
   service worker); Apple/Google in-app purchase only becomes relevant if/when it's wrapped
   for app stores.

## Environment variables

See `.env.example` for the full list with descriptions and where to obtain each key
(`PLANT_ID_API_KEY`, `AMAZON_ASSOCIATES_TAG`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
`VAPID_CONTACT_EMAIL`).
