# Internship Application Guidelines
_Last updated: 2026-06-21_

---

## What already exists

The CAMS app (`src/app/data/recruitingPrograms.ts`) has a full recruiting calendar:
- Goldman Sachs, BofA, JPM, Morgan Stanley, Evercore, Lazard, Blackstone, KKR, etc.
- Each entry has `applicationLink` → direct company career portal URL
- Fields: `firm`, `role`, `category` (SA/FT/Insight/Diversity), `deadline`, `status`, `classYears`, `rolling`

The `internships.ts` file (593KB) has a broader program database with compensation, GPA cutoffs, locations.

Email templates live in `src/app/data/emailTemplates.ts` — cold IB analyst, recruiter outreach, PE networking, post-interview thank-you.

---

## Application workflow

### Step 1 — Triage the list

Open `recruitingPrograms.ts` (or the CAMS Recruiting page at localhost:5173). Filter by:
- `status: "open"` or `"rolling"`
- `classYears` includes `"Junior"` (or your year)
- `cycleYear: 2027` (summer 2027 = the next recruiting cycle)

Sort by `deadline` ascending — rolling deadlines fill fast, treat them like hard deadlines.

### Step 2 — Apply directly through company websites

Every `applicationLink` goes to the firm's own career portal. These are the real ones:
- **Goldman**: goldmansachs.com/careers
- **BofA**: careers.bankofamerica.com
- **JPM**: careers.jpmorgan.com
- **Blackstone**: blackstone.com/careers
- etc.

**Do NOT rely on Handshake for competitive finance roles** — bulge brackets and top boutiques post directly on their own sites. Handshake is used by regional firms and for on-campus events, not Goldman/Blackstone summer analyst programs.

### Step 3 — Track in CAMS Pipeline

The app has a Pipeline page — use it to log each application with status (applied, screen, superday, offer, rejected).

### Step 4 — Send networking emails within 48h of applying

Use the templates in `emailTemplates.ts`. Variable slots:
- `{{firm_name}}`, `{{first_name}}`, `{{your_name}}`, `{{year}}`, `{{your_school}}`, `{{sector}}`
- `{{specific_deal_or_news}}` — check Bloomberg / firm press releases for a recent deal

Best targets: analysts 1-2 years out from UA (check LinkedIn → UA alumni → filter by firm).

---

## Handshake — verdict: manual only

**Can we scrape or auto-apply?** No — not worth attempting.

- Cloudflare protection + login wall; bot detection is aggressive
- ToS explicitly bans scraping and automated applications
- Risk: account suspended (kills your ability to RSVP to on-campus events, info sessions)
- The finance roles you want are NOT on Handshake — they're on firm career portals

**Where Handshake IS useful (manually):**
- RSVP to on-campus info sessions and coffee chats that firms post specifically for UA
- Regional bank / boutique postings that don't have their own ATS
- Corporate finance / F500 roles (P&G, Amazon, etc.) if you want a backup

---

## Platforms beyond Handshake

| Platform | Use case | Auto-apply? |
|---|---|---|
| **Simplify** (simplify.jobs) | Browser extension that auto-fills application forms on company sites using your resume. Works with Workday, Greenhouse, Lever. | Yes — install the extension |
| **LinkedIn** | Networking + "Easy Apply" for some roles. Good for finding analysts to cold email. | Yes via Easy Apply for eligible postings |
| **WayUp** | Internship-specific, lighter bot detection. Less relevant for top finance. | Possible with Playwright |
| **RippleMatch** | Auto-matches profile to roles, used by some finance firms for diversity recruiting. | Platform does it for you |
| **Forage** (theforage.com) | Free virtual job simulations (Goldman, JPM, Citi, Blackstone). Not a real application but builds familiarity and sometimes fast-tracks to recruiter. | No, do the sim manually |
| **Levels.fyi** | Compensation benchmarking. Not for applying. | N/A |
| **Wall Street Oasis job board** | Forum posts + job board. Has some boutique postings. | No |
| **Extern** | Short-term project internships. Good gap-filler. | Yes, straightforward forms |

**Best automation target: Simplify + direct company career pages.** Install the Simplify Chrome extension — it reads your resume and auto-fills Workday/Greenhouse forms when you open an `applicationLink`. Free, legit, works on 95%+ of finance firm career portals.

---

## Direct-to-company automation (Playwright)

For programmatic opens/tracking, we can build a script that:
1. Reads `recruitingPrograms.ts` (status=open, deadline approaching)
2. Opens each `applicationLink` in the browser
3. Optionally uses Playwright to fill standard fields (name, email, school, GPA, graduation year)

This is legal — you're using your own account on public career portals. Workday and Greenhouse have consistent form structures so a single Playwright script covers most of them.

**Status: not yet built — flag to Claude when ready to build.**

---

## Email outreach — daily action

1. Pick 3-5 firms applied to that day
2. Find 2 analysts/associates on LinkedIn who went to UA or a peer school
3. Fill in the cold outreach template from `emailTemplates.ts`
4. Send from `danielkudryavtseva@gmail.com`
5. Follow up in 5-7 days if no reply

Track in CAMS Connect page (contacts) or a simple spreadsheet.

---

## Open deadlines as of 2026-06-21

From `recruitingPrograms.ts` (open/rolling, Summer 2027, Junior):
- Goldman Sachs SA 2027 Americas — rolling, fills before Nov 2026
- Goldman Virtual Insight — rolling through Dec 2026
- BofA Global IB SA 2027 — deadline Mar 31 2026 (likely closed, confirm on site)

**Action: run through the full list in the CAMS app and verify which portals are live.**
