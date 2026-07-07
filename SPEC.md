# Dirt & Leaf — Full Rebuild Spec

## Context
This is a full rebuild of a houseplant care app called **"Dirt & Leaf"** (brand wordmark shown in the reference UI as "DIRT & LEAF" — confirm this exact spelling is used everywhere, not "Dirt & Leif"). The owner (Brad) previously built a front-end-only prototype with fake/hardcoded data across many chat sessions and lost work multiple times because nothing was durably saved outside a disposable AI sandbox. This rebuild must (a) faithfully preserve the approved UI/UX from `reference/approved-ui-reference.html`, and (b) wire it to a REAL, working backend — no more hardcoded fake data for the core flows.

## Reference UI (must preserve, not redesign)
Open `reference/approved-ui-reference.html` in a browser or read it directly — it is the user-approved baseline look/flow. Preserve:
- Overall app shell: phone-frame layout, top bar with logo ("DIRT & LEAF" in serif display font, tagline "Houseplant care, simplified"), bottom tab bar with 5 tabs: Home, Scan, Plants, Shop, Account.
- Dark mode as default, with a light/dark theme toggle button in the top bar (circle icon).
- Color system: warm earthy palette — dark mode uses near-black surfaces (`#141210`/`#1d1916`) with sage green primary accent (`#86b495`); light mode uses warm cream surfaces (`#f4efe7`/`#fbf8f2`) with forest green primary (`#315e45`). Reuse these tokens.
- Fonts: Satoshi (body) + Zodiak (serif display for headings/logo), loaded via Fontshare — same as reference.
- Home screen: hero image with "Take a picture" CTA copy, a prominent camera/scan button, a "Spaces" section (room cards: Living room, Office, etc. — clicking opens a room screen), a slim full-width "Buy more plants" link/button, and a "Reminders" card listing upcoming water/feed/light tasks that open a bottom sheet with steps + a CTA button linking out to buy the relevant product.
- Scan screen: shows "Best matches" — a primary match plus alternates (**top 3** matches minimum, this is a hard requirement — never show only 1 result), a "Visual compare" section with side-by-side tiles so the user can visually confirm which one is correct, a room picker (chips), and a "Save this plant" card with a Save button. This confirmation step is the core accuracy safety net — the user taps the correct match from the top 3-5 before it saves.
- Plants screen: list of saved plant profiles, each opens a detail/profile screen showing Water/Feed/Placement care cards and a "Update plant progress" button (opens a progress-photo capture flow, comparing new photos against the first saved analysis photo for growth tracking — this progress photo must never replace the plant's main curated/profile photo).
- Room screens (Living room, Office, etc.): list only the plants assigned to that room.
- Shop screen: "Suggested near you" local nursery/retailer links (within a configurable radius, default 15 miles) plus general affiliate product cards.
- Account screen: notification settings, affiliate/monetization settings.
- Bottom sheet component: reusable for task details (water/feed/light/repot), each with numbered steps and an optional CTA button linking to an affiliate product.
- Toast notification on save actions (e.g. "Monstera deliciosa saved to Living room").

**Non-negotiable UX rule from the user's past feedback**: never do a "redesign" pass. Any change must be additive/functional, must not alter existing wording, layout, spacing, or button placement unless explicitly asked. The "Tap to choose" / "Take a picture" language and flow must stay intact.

## Real Functionality To Build (this is the actual deliverable — not a demo)

### 1. Photo-based plant identification (core interaction)
- User takes ONE photo. No other manual entry required at capture time (no species dropdowns, no manual data entry) — this is the top usability requirement.
- Backend calls a real plant identification API: use **Plant.id (kindwise.com)** — https://www.kindwise.com/plant-id — chosen for houseplant-specific accuracy (93% top-1, ~99% top-3 per published benchmarks) over general botanical APIs. Store the returned top 3-5 suggestions (species name, confidence score, similar reference images) and show them in the "Best matches" / "Visual compare" UI so the user can tap the correct one. This human-confirmation step is what achieves near-100% real-world accuracy — pure automated ID alone cannot guarantee that, and the app must not claim otherwise anywhere in copy.
- Plant.id API key: use a custom credential (host `api.plant.id`, header auth `Api-Key`). Do not hardcode.
- After the user confirms a match, look up detailed care data (watering frequency, feeding schedule, light needs, soil, typical mature size, toxicity) — Plant.id's `plant_details` modifiers return some of this; supplement/cross-check with a horticultural reference dataset you build into the schema (see below) covering common houseplants across US climate regions, sourced from reputable extension/university and horticultural sources (cite sources in code comments/docs). Do not rely on Reddit/Facebook scraping for the actual care data used to schedule reminders — that was the source of past mismatches; use it only as directional context if needed, never as the primary care-fact source.

### 2. Location-aware care scheduling
- On first plant save (with permission), capture device geolocation (lat/long). Reverse-geocode to city/region and derive: USDA hardiness zone (via a lookup table/API keyed on lat/long or zip), approximate altitude, and current outdoor conditions.
- Pull current + seasonal weather/humidity/temperature for that location (use a free-tier weather API such as Open-Meteo — no key required, good for this — or OpenWeatherMap if the user has a key). Use this to adjust: watering frequency (increase interval in high humidity/winter dormancy, decrease in hot/dry/growing season), feeding schedule (skip/reduce in dormant winter months, resume in spring/summer), and placement guidance (note if indoor heating/AC dryness is likely at that location/season).
- Re-evaluate and adjust each plant's schedule periodically (e.g. daily cron-style recompute) as season/location conditions change — don't just set it once at save time.

### 3. Reminders & push notifications
- Every plant has computed next-water-date and next-feed-date based on the species' base care profile adjusted by #2.
- Build a notifications table/queue; when a reminder is due, send a push notification ("Time to water your Fiddle Leaf Fig in the Living Room"). Implement via a real push mechanism appropriate to this stack (web push notifications via the Notification/Push API + service worker, since this is a web app — document clearly if a native mobile wrapper would be a future step, but the web push flow must actually work end to end in this build).
- Reminder detail sheets link out to the right product category (watering tools, fertilizer, soil, pots) via affiliate links (#4).

### 4. Amazon Associates affiliate monetization
- Build a small helper/table mapping product categories (fertilizer type, soil mix, pot size, watering tools) to specific Amazon product ASINs or search URLs, all wrapped with an Amazon Associates tracking tag so clicks are attributed to the user's affiliate account.
- The Associates tag itself is a placeholder (`YOUR-ASSOCIATES-TAG-20`) since the user has not created an Amazon Associates account yet — make it a single config value (env var or settings table) that's trivial to swap in once they sign up. Tell the user in your final summary that they still need to create an Amazon Associates account and provide the tag.
- Every "Buy plant food" / "Buy water supplies" / "Buy pot" / "Buy soil" CTA in reminder sheets and plant profiles must route through this affiliate link builder, not raw unbranded links.

### 5. Local retailer suggestions
- On the Shop screen and "new plant" flow, show nearby nurseries/plant shops within ~15 miles of the user's saved location. Use a places lookup (e.g. OpenStreetMap Overpass API / Nominatim — free, no key — searching for shop=garden_centre / plant nurseries) since there's no Google Places connector configured. If a better connector becomes available, this is swappable.

### 6. Data model (SQLite via Drizzle, per template conventions)
Design tables for: users (single-user is fine for v1, but structure to support multiple), rooms, plants (species id, common name, room id, saved photo url, confirmed match confidence, save date, location snapshot at save time), care_profiles (species-level base watering/feeding/light interval, source citation), reminders (plant id, type: water/feed/light/repot, due date, status), progress_photos (plant id, photo url, captured date, for growth comparison — never overwrites the main plant profile photo), notification_log, and a simple product/affiliate_link lookup table.

### 7. What NOT to build as fake/hardcoded
Do not hardcode the demo plants (Monstera, Fiddle leaf fig, Snake plant) as permanent fixtures — those were illustrative examples in the old prototype. The real app starts empty and populates entirely from what the user actually scans. It's fine to seed the care_profiles reference table with real horticultural data for common houseplant species so identification+scheduling works immediately.

## Non-Functional / Durability Requirements (mirrors the Anasazi Security site pattern — see `reference/security-site-master-reference-EXAMPLE.md` for the exact model to replicate)
This is equally important as the features above. The user has lost work before because everything lived only in a disposable AI sandbox.

1. Initialize git in the project root immediately, commit early and often with descriptive messages.
2. This code will be pushed to two GitHub repos after the coding subagent finishes (handled by the parent orchestrator, not by you): a private backup repo and a public preview mirror. Just make sure the repo is clean, has a proper `.gitignore` (node_modules, dist, .env, .vercel), and has no secrets committed anywhere (all API keys must be read from environment variables, never hardcoded).
3. Include a top-level `README.md` explaining what the app is, tech stack, how to run it locally (`npm install && npm run dev`), how to build (`npm run build`), and where each major feature lives in the code (routes, schema, plant-ID integration, notification logic, affiliate link builder).
4. Include a `.env.example` listing every required environment variable (Plant.id API key, weather API config, Amazon Associates tag, any others) with placeholder values and one-line comments on where to obtain each one.
5. Make sure `npm run build` succeeds cleanly with no errors before finishing.

## Design polish
- Preserve the reference palette/fonts exactly as described above — this is a from-scratch codebase (React/Tailwind per the webapp template) recreating that exact visual language, not literally reusing the old single-file HTML.
- Keep the layout dead simple per the user's explicit instruction: the ONLY required input from the customer is taking a photo. Everything else (room assignment can default to "Unsorted" until the user optionally organizes, location capture, care schedule) should happen automatically in the background.
- Mobile-first (this is a phone app experience, deployed as a responsive web app).

## Deliverable
A working full-stack app (Express + Vite + React + Tailwind + Drizzle/SQLite per the standard template) that:
- Builds cleanly (`npm run build`)
- Runs locally (`npm run dev`)
- Implements the full flow above end to end against real APIs (Plant.id, Open-Meteo, OSM Overpass) wired through environment variables
- Has git history, README, and .env.example as described
