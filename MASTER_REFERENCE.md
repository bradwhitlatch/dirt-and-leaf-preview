# Dirt & Leaf — App Master Reference

Last updated: July 6, 2026

This is the single source of truth for how the Dirt & Leaf plant care app is built, hosted, and controlled. Keep a copy of this document somewhere safe (email, Google Drive, notes app) — it is not stored anywhere except where you save it.

---

## 1. What This App Is

- Product: Dirt & Leaf — take a photo of a houseplant, get instant AI identification, then get personalized watering/feeding/placement schedules based on your exact location (altitude, humidity, temperature, hardiness zone), plus push notifications when it's time to water or feed, plus affiliate links to the right fertilizer/soil/tools on Amazon.
- Owner: Brad Whitlatch — bradwhitlatch@gmail.com
- Pricing: Free tier (unlimited scans, track up to 3 plants) and Premium — $4.99/month or $39.99/year (33% discount vs. monthly), unlimited tracked plants. Payment processing is currently **stubbed/mocked** — upgrading just flips a database flag; no real money changes hands yet (see Section 7).
- Live app: [https://dirt-and-leaf.vercel.app](https://dirt-and-leaf.vercel.app)

---

## 2. The Places This Project Lives

| # | Where | What it's for | Owner account |
|---|---|---|---|
| 1 | **GitHub — private backup** | Permanent, private source-of-truth copy of every file and every change ever made. | `bradwhitlatch` GitHub account |
| 2 | **GitHub — public preview mirror** | Public mirror of the same code (no live preview site attached — this app needs a real backend/database, unlike the static Anasazi Security site, so it can't run on GitHub Pages). | `bradwhitlatch` GitHub account |
| 3 | **Vercel** | Actually serves the live app (frontend + backend API as a serverless function). | `bradwhitlatch-1176` Vercel account, team/scope `anasazi` |
| 4 | **Neon (via Vercel Marketplace)** | Hosts the production Postgres database — all plant data, users, care schedules, seeded plant-care knowledge base. | Provisioned through the Vercel `anasazi` team; billed/managed inside the Vercel dashboard's Storage tab |

**Why multiple places instead of one?** If any single service has an outage or becomes inaccessible, the code and its full history survive somewhere else. None of these depend on "the sandbox" (the AI assistant's temporary workspace) — the sandbox is disposable and gets wiped between sessions. Everything durable lives in these four accounts.

### Exact links and IDs

- Private GitHub repo: [github.com/bradwhitlatch/dirt-and-leaf-app](https://github.com/bradwhitlatch/dirt-and-leaf-app)
- Public GitHub repo: [github.com/bradwhitlatch/dirt-and-leaf-preview](https://github.com/bradwhitlatch/dirt-and-leaf-preview)
- Vercel account: `bradwhitlatch-1176`
- Vercel team/scope: `anasazi`
- Vercel project name: `dirt-and-leaf`
- Vercel project ID: `prj_X6lCPRFBfMQESPvFc8OBNUuBMAOq`
- Vercel org ID: `team_svcTP4Xcx5W9JP8TonZTrRxP`
- Vercel dashboard: [vercel.com/anasazi/dirt-and-leaf](https://vercel.com/anasazi/dirt-and-leaf)
- Live production URL: [https://dirt-and-leaf.vercel.app](https://dirt-and-leaf.vercel.app)
- No custom domain is attached yet — it's on Vercel's free `*.vercel.app` subdomain. A custom domain (e.g. `dirtandleaf.app`) can be added later via the Vercel dashboard's Domains tab, same process as was done for Anasazi Security.
- Database: Neon Postgres, provisioned via Vercel Marketplace (Free tier — 0.5GB storage), Neon project name "neon-charcoal-jacket", region Washington D.C./us-east-1. Managed entirely from the Vercel dashboard's Storage tab under the `dirt-and-leaf` project — no separate Neon login needed for day-to-day use.

---

## 3. How the App Is Built (Architecture)

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components. Dark-mode plant-app aesthetic, single-photo-to-identify flow, bottom nav (Home / Plants / Shop / Account).
- **Backend**: Express.js, running as a single Vercel serverless function (`api/index.js`, bundled from `script/api-entry.ts`).
- **Database**: Postgres (Neon), accessed via Drizzle ORM + the `postgres` driver. 9 tables: `users`, `rooms`, `care_profiles` (55 seeded plant species with watering/feeding/light/soil/toxicity data), `plants`, `reminders`, `progress_photos`, `notification_log`, `affiliate_links` (10 seeded product categories), `push_subscriptions`.
- **Plant identification**: `server/plant-id.ts` — calls the Plant.id (kindwise.com) API when `PLANT_ID_API_KEY` is set; falls back to clearly-labeled mock suggestions otherwise (see Section 7).
- **Location-aware care**: `server/weather.ts` (Open-Meteo, no API key needed) + `server/care-scheduling.ts` compute a care schedule adjusted for the user's actual altitude, humidity, temperature, and season.
- **Nearby nurseries**: `server/nurseries.ts` (OpenStreetMap Nominatim + Overpass, no API key needed).
- **Push notifications**: `server/push.ts`, using the Web Push / VAPID protocol. Real permanent VAPID keys are already set in production (see Section 6) — do not regenerate them, or all existing users' push subscriptions break.
- **Affiliate links**: `server/affiliate.ts` builds Amazon search/product links tagged with `AMAZON_ASSOCIATES_TAG` on every "buy fertilizer/soil/tools" call-to-action.
- **Subscription/paywall**: free tier capped at 3 tracked plants (unlimited scans); Premium unlocks unlimited. Enforced server-side in `server/routes.ts`.

---

## 4. How to Make Future Changes

Any AI assistant session (or a developer) can pick this up from scratch as follows:

### To edit the app:
1. Clone the private backup repo: `git clone https://github.com/bradwhitlatch/dirt-and-leaf-app.git`
2. Install dependencies: `npm install`
3. For local development, create a `.env` file (see `.env.example`) with at minimum a `DATABASE_URL` pointing at any Postgres instance (local or a Neon branch). Run `npm run db:push` once to create the schema, then `npm run dev`.
4. Make your edits.
5. Commit and push to **both** remotes so the backups stay in sync:
   ```
   git add -A
   git commit -m "describe the change"
   git push origin main      (private backup)
   git push preview main     (public preview mirror)
   ```
6. Deploy the change live via the Vercel CLI:
   ```
   vercel deploy --prod --scope anasazi --token <VERCEL_TOKEN> --yes
   ```
   (Requires being logged into the `bradwhitlatch-1176` Vercel account, or having an access token for it.)

### Design philosophy to preserve (Brad's standing preference):
- **Make small, targeted edits — never a full redesign** unless explicitly requested. `reference/approved-ui-reference.html` is the authoritative source of truth for the UI/UX — preserve its exact wording, layout, and spacing unless a change is explicitly asked for.
- Keep the core promise intact: the user should only ever need to take one photo. Don't add setup steps, forms, or required fields beyond that.

### Critical technical gotcha to remember (cost real time to debug — do not repeat):
The backend deploys as a single Vercel serverless function built from `script/api-entry.ts`. It **cannot** be deployed as raw TypeScript directly in `api/`, for two stacked reasons:
1. **Vercel's Node function builder does not resolve the `@shared/*` TypeScript path alias** (that alias only works inside Vite's client bundle and `tsx`'s local dev loader). `script/build-api.ts` pre-bundles the function with esbuild, resolving `@shared` to a real path, before every deploy.
2. **The project's `package.json` has `"type": "module"`**, so Node treats every `.js` file as ESM by default — but the esbuild bundle output is CommonJS (`module.exports`). A bare `api/index.js` under an ESM-typed package crashes at load time with an opaque `FUNCTION_INVOCATION_FAILED` on every single API route, before any application code (even a try/catch) can run. The fix: `api/package.json` contains `{"type": "commonjs"}`, which scopes CommonJS treatment to just the `api/` directory without touching the rest of the app.

`vercel.json`'s `buildCommand` runs `npx tsx script/build-api.ts && vite build` — this regenerates `api/index.js` fresh on every deploy. The committed `api/index.js` in git is a checked-in build artifact (needed because Vercel's `functions` config in `vercel.json` validates against the file existing in the repo pre-build) — always let the build step regenerate it; never hand-edit it.

---

## 5. Current Design Details

- **Aesthetic**: dark-mode-first, calm and organic (deep greens/near-black surfaces), simple single-action home screen ("Take a photo" is the primary action).
- **Navigation**: bottom tab bar — Home, Plants, Shop, Account.
- **Default rooms**: "Living room" and "Office" are seeded automatically so a freshly-scanned plant always has somewhere to go — the user is never asked to set up rooms manually.
- **Care knowledge base**: 55 species pre-loaded (`server/care-profile-seed.ts`) covering common houseplants across US climate regions, each with watering interval range, feeding schedule (active/dormant season), light requirement, soil type, ideal temp/humidity range, toxicity notes, and source citations.

---

## 6. Accounts, Keys, and Environment Variables

All production environment variables are set in the Vercel dashboard under `dirt-and-leaf` → Settings → Environment Variables (Production). Do not regenerate or lose these without a plan — some are irreplaceable without breaking existing users:

| Variable | Status | Notes |
|---|---|---|
| `DATABASE_URL` (+ related `DATABASE_*` vars) | ✅ Set | Auto-provided by the Neon Postgres Marketplace integration. **Never regenerate the database** — this is where all real user data lives. |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_CONTACT_EMAIL` | ✅ Set (real, permanent keys) | Used for push notifications. **Never regenerate these once real users have subscribed to push** — it invalidates every existing subscription. |
| `AMAZON_ASSOCIATES_TAG` | ⚠️ Placeholder (`YOUR-ASSOCIATES-TAG-20`) | Replace with your real Amazon Associates tag once you've signed up at [affiliate-program.amazon.com](https://affiliate-program.amazon.com/) to start earning commission on every fertilizer/soil/tool link in the app. Update via `vercel env rm AMAZON_ASSOCIATES_TAG production` then `vercel env add AMAZON_ASSOCIATES_TAG production` with the real tag, then redeploy. |
| `PLANT_ID_API_KEY` | ⚠️ Not set — using mock plant ID | The app is fully functional right now, but plant identification returns deterministic **mock** suggestions (clearly labeled to the user as "Using demo identification"), not real AI identification. Get a real key at [web.plant.id](https://web.plant.id/), then add it the same way as above. **This is the single most important upgrade before real customers use the app**, since accurate plant ID was the top priority requirement. |
| `STRIPE_SECRET_KEY` / etc. | ❌ Not implemented | Real payment processing is not wired up yet — see Section 7. |

---

## 7. What's Stubbed / Not Yet Real (Do This Before Launch)

The app is fully built, deployed, and functionally complete end-to-end — but three integrations are intentionally mocked so the app was buildable and testable without external signups blocking progress. Before accepting real customers:

1. **Real plant identification** — sign up at [web.plant.id](https://web.plant.id/) and set `PLANT_ID_API_KEY`. Without this, every scan returns the same mock candidate plants regardless of the actual photo.
2. **Real payments** — the Premium upgrade currently just flips a database flag for free, with no actual charge. Before charging real customers, integrate Stripe Checkout + webhooks (web) and/or Apple/Google in-app purchase receipt validation (if this becomes a native app). See `README.md` and `.env.example` in the repo for the exact variables this needs.
3. **Real Amazon Associates tag** — sign up at [affiliate-program.amazon.com](https://affiliate-program.amazon.com/) and set `AMAZON_ASSOCIATES_TAG` to start earning commission; right now the links work but credit a placeholder tag that pays no one.

---

## 8. Database Snapshot (as of this deployment)

Confirmed via direct query against the production Neon database on July 6, 2026:

| Table | Rows | Notes |
|---|---|---|
| `users` | 1 | Single default free-tier user (single-user app design; no login/signup flow — the app is scoped to whoever has it installed) |
| `care_profiles` | 55 | Seeded plant species knowledge base |
| `affiliate_links` | 10 | Seeded product categories (fertilizer, soil, pots, tools, etc.) |
| `rooms` | 2 | Default "Living room" and "Office" |
| `plants` | 0 | Empty until a real plant is scanned and saved |
| `reminders` | 0 | Generated automatically once plants exist |

---

## 9. Quick Recovery Checklist

If everything is ever lost except this document:

1. `git clone https://github.com/bradwhitlatch/dirt-and-leaf-app.git` — get the code back.
2. Log into Vercel (`bradwhitlatch-1176` account, team `anasazi`) — the project, its database connection, and all env vars are still there; nothing needs to be recreated.
3. If the Vercel project itself is somehow gone: create a new project, link it to the GitHub repo, re-provision a Neon Postgres database via the Storage tab (Marketplace → Neon → Create), which auto-sets `DATABASE_URL`. Re-add `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_CONTACT_EMAIL` from wherever they were backed up (if lost, generate new ones with `npx web-push generate-vapid-keys` — existing push subscribers will need to resubscribe).
4. Run `npm run db:push` once against the new `DATABASE_URL` to create the schema, then run the app once (`npm run dev` or trigger any API request in production) to auto-seed `care_profiles`, `affiliate_links`, and default `rooms`.
5. Deploy: `vercel deploy --prod --scope anasazi --token <TOKEN> --yes`.
