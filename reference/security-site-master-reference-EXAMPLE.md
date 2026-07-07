# Anasazi Security — Website Master Reference

Last updated: July 4, 2026

This is the single source of truth for how the Anasazi Security website is built, hosted, and controlled. Keep this document safe (e.g. save a copy in your email, Google Drive, or notes app) — it is not stored anywhere except where you save it.

---

## 1. What This Site Is

- Business: Anasazi Security — mobile solar-powered camera trailers + after-hours remote monitoring, Southern Utah (St. George, Washington County, Hurricane, Ivins, Santa Clara, Cedar City).
- Owner: Brad Whitlatch — bradwhitlatch@gmail.com — 702-303-1925.
- Live site: [https://anasazisecurity.com](https://anasazisecurity.com) and [https://www.anasazisecurity.com](https://www.anasazisecurity.com)
- The site is a custom-built static website (plain HTML/CSS/JS — no CMS, no page builder like Wix/Squarespace). This is intentional: it's fast, fully controlled, and free to host.

---

## 2. The Three Places This Project Lives

| # | Where | What it's for | Owner account |
|---|---|---|---|
| 1 | **GitHub — private backup** | The permanent, private source-of-truth copy of every file and every change ever made. | `bradwhitlatch` GitHub account |
| 2 | **GitHub — public preview** | A public mirror of the same code, also auto-published as a free preview site via GitHub Pages. | `bradwhitlatch` GitHub account |
| 3 | **Vercel** | Actually serves the live website at anasazisecurity.com. | `bradwhitlatch-1176` Vercel account, team/scope `anasazi` |

Domain registration (`anasazisecurity.com` itself) is a **4th, separate place**: **Network Solutions**, under Brad's own account. This is not Wix, not Domain.com — confirmed directly by logging into Network Solutions.

**Why 3-4 places instead of 1?** So that if any single service ever has an outage, gets suspended, or becomes inaccessible, the site and its full history survive somewhere else. None of these overlap or depend on "the sandbox" (the AI assistant's temporary workspace) — the sandbox is disposable and gets wiped between sessions. Everything durable lives in these accounts, not in the sandbox.

### Exact links and IDs

- Private GitHub repo: [github.com/bradwhitlatch/anasazi-security-website](https://github.com/bradwhitlatch/anasazi-security-website)
- Public GitHub repo: [github.com/bradwhitlatch/anasazi-security-site-preview](https://github.com/bradwhitlatch/anasazi-security-site-preview)
- Public preview site (auto-published from repo #2 via GitHub Pages): [bradwhitlatch.github.io/anasazi-security-site-preview](https://bradwhitlatch.github.io/anasazi-security-site-preview/)
- Vercel account: `bradwhitlatch-1176`
- Vercel team/scope: `anasazi`
- Vercel project name: `anasazi-security`
- Vercel project ID: `prj_Pj1GQ959X6vDbBeDLQSz2CLwi8qd`
- Vercel dashboard: [vercel.com/anasazi/anasazi-security](https://vercel.com/anasazi/anasazi-security)
- Domain registrar: Network Solutions — [networksolutions.com](https://www.networksolutions.com) — account under bradwhitlatch@gmail.com
- Domain renewal date: August 20, 2026 (auto-renew is on)

---

## 3. Domain / DNS Setup (how anasazisecurity.com points to the site)

The domain's nameservers were reverted to Network Solutions' own defaults (`ns1.worldnic.com`, `ns2.worldnic.com`) — no longer using Wix's custom nameservers. DNS records are managed directly in the Network Solutions account.

| Host | Type | Value | Purpose |
|---|---|---|---|
| `@` (root, anasazisecurity.com) | A | `76.76.21.21` | Points root domain to Vercel |
| `www` | A | `76.76.21.21` | Points www subdomain to Vercel |

**76.76.21.21 is Vercel's standard shared IP address for custom domains.** If it's ever necessary to reconnect the domain (e.g. after a DNS reset), these are the two records to recreate.

**Important quirk to remember**: Network Solutions' newer "Manage" DNS editing screen (Advanced Tools → Advanced DNS Records → Manage) has a bug that throws "Submitted host records either contained duplicates..." on edits. The workaround that worked: use the **"Bulk Edit"** button instead, which opens an older "Account Manager" DNS interface — that one works reliably.

**Also**: a `www` CNAME record (pointing to `cname.vercel-dns.com`, Vercel's normal recommended setup) failed with an "A record already exists" conflict on Network Solutions, likely due to a pre-existing wildcard `*` A record. The workaround was to add `www` as a direct **A record** (same IP as root) instead of a CNAME — this works identically for the browser, just a different DNS record type.

---

## 4. How to Make Future Content/Design Changes

Any AI assistant session (or a developer) can pick this up from scratch as follows:

### To edit the website:
1. Clone the private backup repo: `git clone https://github.com/bradwhitlatch/anasazi-security-website.git`
2. This gets the exact live code — plain HTML files (`index.html`, `pages/*.html`), one shared stylesheet (`style.css` + `base.css`), and one shared script (`app.js`).
3. Make edits directly to these files.
4. Commit and push to **both** remotes so the backups stay in sync:
   ```
   git add -A
   git commit -m "describe the change"
   git push origin main      (private backup)
   git push preview main     (public preview)
   ```
5. Deploy the change live via the Vercel CLI:
   ```
   vercel --prod --scope anasazi --token <VERCEL_TOKEN> --yes
   ```
   (Requires being logged into the `bradwhitlatch-1176` Vercel account, or having an access token for it — see Section 6 on tokens/logins.)

### Design philosophy to preserve (Brad's standing preference):
- **Make small, targeted edits — never a full redesign** unless explicitly requested. The layout, spacing, and structure should stay stable; only change what's asked.
- Any global style change (fonts, colors) should be checked against how it cascades across ALL pages and screen sizes (mobile + desktop) before considering it done — several past changes needed a second pass to fix mobile-only side effects (e.g. logo text overlapping a button, hero text too large/small).
- Desktop and mobile are controlled by CSS media queries in `style.css` (`@media (max-width: ...)` blocks) — a fix for one screen size should not be assumed to automatically be correct on the other; verify both.

---

## 5. Current Design Details (as of this update)

- **Fonts**:
  - Body text: "General Sans" (loaded via Fontshare)
  - Headings (h1/h2/h3, prices, stats): "Cabinet Grotesk" (loaded via Fontshare) — bold, condensed, high-impact
  - Logo/brand wordmark only ("ANASAZI SECURITY" in the header): "Cinzel" (Google Fonts) — a thin, wide-spaced serif, matching the original brand logo file's typography. This is intentionally different from all other headings.
- **Colors**: black background, lime-green accent (`--color-primary`), consistent across site.
- **Homepage hero**: full-width background video of a jobsite/camera trailer, with a large two-line heading ("EYES ON YOUR JOBSITE. DAY AND NIGHT."), subtext, two CTA buttons, and a 4-stat row. Mobile has its own scaled-down heading size and spacing so the video stays visible rather than being crowded out by text.
- **Pricing shown on site**: $1,200/mo trailer rental, $1,200/mo timelapse service, custom pricing for multi-trailer jobs.
- **Monitoring claim on site**: after-hours remote monitoring (not 24/7) — this was a deliberate correction to avoid overpromising.

---

## 6. Logins, Tokens, and What the AI Assistant Does NOT Have

This is the most important section for long-term safety.

- The AI assistant (Perplexity Computer) does **not** store or have permanent access to any of your actual passwords for GitHub, Vercel, or Network Solutions. During setup, either:
  - You logged into these services yourself in your own browser, or
  - A secure connector/OAuth flow was used where the assistant never sees your password.
- Any API tokens the assistant used (e.g. a Vercel deploy token) were **session-scoped** — generated temporarily for that conversation and not something you can reuse later, and not something the assistant retains after the session ends.
- **This means: you are the only one who holds durable login access to these three accounts.** Make sure you know your own login credentials (email + password, and any 2FA method) for:
  - GitHub — the account that owns `bradwhitlatch/anasazi-security-website` and `bradwhitlatch/anasazi-security-site-preview`
  - Vercel — the account `bradwhitlatch-1176`
  - Network Solutions — the account managing the `anasazisecurity.com` domain
- **Recommended**: store these three logins in a password manager (e.g. 1Password, Bitwarden, or even your phone's built-in password manager) if you haven't already, so they're never at risk of being lost.

---

## 7. Why This Setup Survives "the sandbox being deleted"

Every AI assistant session runs in a temporary, disposable workspace ("sandbox") that gets wiped between conversations. Nothing stored only in that sandbox survives. That's why the actual project lives in the 3 external accounts in Section 2 — GitHub (private + public), Vercel, and Network Solutions (domain) — none of which are affected by the sandbox resetting.

**Practical result**: in a brand-new AI session with zero memory of past conversations, anyone (Brad or an assistant) can fully reconstruct and continue this project using nothing but:
1. This document
2. Access to the 3 accounts listed in Section 2

Nothing else is needed. The full commit history, every file, and every past change is preserved in Git — nothing is ever silently lost.

---

## 8. Conversation History / "Memory"

Separately from the code backups above, the AI assistant also keeps its own record of past conversations for continuity (so it can recall context like "we already fixed the mobile header overlap" in a future session without you re-explaining). This is a built-in feature of the assistant platform itself, not something stored in this project's files — it's tied to your Perplexity account (bradwhitlatch@gmail.com). It's a helpful convenience layer, but this document plus the 3 external accounts are the real, guaranteed source of truth — treat this document as the backup that works even if that memory layer were ever unavailable.

---

## 9. Quick Command Reference

```bash
# Clone the site to make edits
git clone https://github.com/bradwhitlatch/anasazi-security-website.git

# After making changes:
cd anasazi-security-website
git add -A
git commit -m "your change description"
git push origin main
git push preview main   # (add this remote once: git remote add preview https://github.com/bradwhitlatch/anasazi-security-site-preview.git)

# Deploy to the live site (requires Vercel login/token for bradwhitlatch-1176 / anasazi scope)
vercel --prod --scope anasazi --yes
```

---

## 10. Latest Known-Good State (snapshot at time of writing)

- Latest commit (both GitHub repos, in sync): `6b008d8` — "Fix mobile header: logo text was overlapping Get a Quote button on narrow phones"
- Live DNS: root and www both resolve to `76.76.21.21` (Vercel)
- Live site verified working over HTTPS on both `anasazisecurity.com` and `www.anasazisecurity.com`
- All fixes verified on both desktop and mobile (375px/390px) viewports
