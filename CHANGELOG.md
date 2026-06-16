# CHANGELOG — Socio-Economic Idea Evaluator

All notable changes to this project are documented here.

---

## 2026-06-17 — Session 6: Full Frontend Rebuild & Design System Extraction

### What Changed

Major frontend rebuild: extracted monolithic `index.html` (1599 lines of inline CSS+JS) into three clean, maintainable files. Implemented a complete design system with premium animations, collapsible results, sticky tab navigation, share/download functionality, and comprehensive mobile responsiveness.

### Architecture — File Extraction

- **`styles.css`** (1500 lines): Full design system with CSS custom properties (tokens), scroll reveal system, nav with blur/shadow transitions, hero with animated glow gradients, trust bar, section headers, how-it-works cards with top-border hover effect, proof section, SDG grid, input form with focus ring states, loading overlay with step-by-step progress indicators, results with sticky tab bar and collapsible sections, verdict animations, report cards/items/scores/bars, case study, 14-day plan, funding, first-step CTA, footer, gate screen, toast notifications, responsive breakpoints (900px, 600px, 380px), and `prefers-reduced-motion` support.
- **`app.js`** (580 lines): Extracted and enhanced JavaScript with IIFE pattern. Gate screen auth, nav scroll effect, IntersectionObserver-based scroll reveal, counter animations, example chip auto-fill, character counter, intent filtering (BLOCKED_PATTERNS), toast notifications, loading overlay with step animation, full `renderResult()` function with collapsible sections, score count-up animation, sticky tab navigation, share (Web Share API / clipboard fallback), download (text file export), print (auto-expand before print), section toggle, and verdict score animations.
- **`index.html`** (344 lines): Clean semantic HTML — no inline `<style>` or `<script>`. References `styles.css` and `app.js` via external links. Preserves gate screen (9999 passcode, investor-only access), nav, hero with animated preview card, trust bar (scrolling marquee), how-it-works (3 steps), proof section (dark, 6 stats), SDG section (11 goals), evaluator form (5 fields + 4 example chips), results container, and footer.

### Design System — Premium Visual Enhancements

- **CSS Custom Properties**: Full token system — colors (cream, forest, amber, terracotta, sky), shadows (4 levels), radii (5 levels), fonts, easing curves.
- **Hero Section**: Animated golden-hour radial gradient glow, perspective-tilted preview card with hover-to-level animation, gradient underline on italic text, dot pulse badge.
- **Scroll Reveals**: IntersectionObserver-driven fade-up animations with staggered delays.
- **How-It-Works Cards**: Top-border gradient hover effect, number opacity, lift-on-hover.
- **Proof Section (dark)**: Top rainbow gradient bar, radial gradient ambient glow, card lift hover.
- **SDG Cards**: Border color transition, shadow elevation on hover.
- **Input Form**: Focus ring with 3px green shadow, character counter that turns green at minimum, shake animation on error, chip hover glow.
- **Loading Overlay**: Spinner + step-by-step progress dots with glow animation.
- **Results**: Verdict card entrance animation, collapsible sections with chevron rotation, sticky tab bar with backdrop-blur, score count-up animation (eased), share/download/print action bar.
- **Footer**: Dark section with brand, links, and attribution.
- **Typography**: Instrument Serif (display), DM Sans (body), JetBrains Mono (numbers), 1.25 ratio scale.
- **Texture**: SVG noise overlay at 2% opacity for paper feel.
- **Responsive**: 3 breakpoints (900px, 600px, 380px) + reduced-motion media query.

### Gate Screen — Intentionally Preserved

The 9999 passcode gate screen is **intentional** and was NOT removed. It serves as investor-preview access control. `localStorage` persistence keeps it dismissed for returning visitors.

### Documentation — Updated

- **CLAUDE.md**: Updated directory structure to reflect `styles.css`, `app.js`, `api/eval.mjs`. Updated file priority reading order for new architecture.

### Files Modified

| File | Action |
|---|---|
| `index.html` | **Rebuilt** — from 1599-line monolith to 344-line semantic HTML |
| `styles.css` | **Created** — 1500 lines, full design system extracted from index.html |
| `app.js` | **Created** — 580 lines, enhanced JS extracted from index.html |
| `CLAUDE.md` | **Updated** — directory structure and file reading order |

---

## 2026-05-29 — Session 5: Vercel & Netlify Deployment Overrides and API Key Fixes

### What Changed

Fixed Vercel build failures and resolved Netlify API runtime errors, creating a bulletproof dual-platform deployment pipeline. Added strict, proactive debugging tools to prevent future developer credential mismatches.

### Vercel — Overriding Legacy Build Presets

- **Build Preset Conflict:** Overrode legacy Vercel dashboard "Flask" presets by adding an explicit `"builds"` definition in `vercel.json`. This tells Vercel's compile environment to build `index.html` as a static file (`@vercel/static`) and `api/eval.mjs` as a Node.js serverless function (`@vercel/node`), avoiding Python compilation crashes.
- **Python Bypass:** Created `.vercelignore` to completely omit Python scripts (`api/index.py`, `evaluator.py`, `app.py`, etc.) during Vercel's build phase to bypass import resolution and packaging failures.
- **Node.js Build Script:** Added a dummy `"build"` command in `package.json` to safely fulfill Node environment build requirements.

### Netlify & Vercel — API Key & CORS Resolution

- **Dual-Handler API Export:** Completely refactored `api/eval.mjs` to use Node.js standard serverless compilation. It now exports both a default handler signature for Vercel and a named `handler` signature for Netlify's standard AWS Lambda runtime.
- **Support for Google's New `AQ.` Keys:** Expanded API key format validation to support both traditional `AIzaSy` keys and Google's newly introduced 2026 `AQ.` format for Gemini API developer keys.
- **Dynamic CORS Origin Support:** Removed hardcoded origins in favor of a dynamic matching system that mirrors `Origin` headers (or falls back to `*`). This immediately resolved browser CORS policy blocking errors on the new custom domain `see2026.netlify.app`.
- **CORS Header Merging:** Merged CORS headers into Node's `res.writeHead` responses in Vercel to prevent browsers from blocking 4xx/5xx API errors as CORS violations, making errors transparent and debuggable.
- **Passcode Gate Protection:** Integrated a beautiful, secure-looking client-side 4-digit passcode gate lock screen (`9999`) in `index.html` with glassmorphic overlay, input shake animations, and `localStorage` persistence (`see_unlocked`) to lock down private preview deployments.

### Files Modified

| File | Action |
|---|---|
| vercel.json | MODIFIED (Added builds config, removed hardcoded CORS headers) |
| netlify.toml | MODIFIED (Configured esbuild bundler) |
| package.json | MODIFIED (Added dummy build script) |
| api/eval.mjs | REWRITTEN (Dual-handler architecture, dynamic CORS origin, expanded environment checks, AQ. prefix validation) |
| .vercelignore | CREATED (Python exclusion list) |

## 2026-05-29 — Session 4: Expert Reviews + Content Strategy Rewrite

### What Changed

The evaluator output was completely rewritten based on reviews from 4 expert agents (PM, Marketing, UX/UI, Content Strategist). All jargon removed, hollow encouragement replaced with specific actions, section names rewritten in plain language for non-English speakers.

### evaluator.py — Content Strategy Rewrite

**Section names (before → after):**
- "YOUR PITCH" → "YOUR IDEA"
- "THE VERDICT" → "YOUR SCORE: X out of 10"
- "YOUR SDG IMPACT" → "WHO YOU HELP"
- "REALITY CHECK" → "IS THIS A REAL PROBLEM?"
- "WHAT'S WORKING FOR YOU" → "YOUR STRENGTHS"
- "WHAT'S HOLDING YOU BACK" → "WHAT IS IN YOUR WAY"
- "BOOTSTRAPPER ASSESSMENT" → "CAN YOU START WITH NOTHING?"
- "YOUR 2-WEEK PLAN" → "YOUR FIRST 14 DAYS"

**Verdict labels (before → after):**
- "GO WITH EDUCATION" → "GOOD, BUT FIX ONE THING FIRST"
- "Nikhil's Take" → "Our Honest Opinion"
- "FUNDING PATHWAY" → "WHERE TO FIND MONEY"
- "Likelihood: MEDIUM" → "possible"

**Removed hollow encouragement:**
- "you're closer than you think" → replaced with specific score
- "3 points of upside waiting" → replaced with action
- "Ship it" → removed
- "I won't sugarcoat it" → removed
- "every 'impossible' idea was impossible" → removed

**Other changes:**
- Barriers now show practical meaning, not raw field names ("power_distance" → "People follow leaders")
- Case study text no longer truncated (was 500 chars, now full text)
- Single-sentence input gets helpful note explaining limited information
- Footer: removed "By Nikhil Tiwari & Claude" (kept 秩序と創造)
- Verdict messages rewritten: all 4 score ranges now use specific numbers, not encouragement
- Elevator pitch templates rewritten: all 4 templates use score, not feelings
- Added plain language verdict labels mapping
- Added plain language funding likelihood mapping
- Added dimension name mapping (lowercase → abbreviation) for HOFSTEDE_ADVICE lookup
- Fixed LTO/IVR advice inversion (low score = barrier for these dimensions)
- Added "farmers", "crop", "agriculture", "harvest", "famine" to food keyword detection

### New Documentation Files

| File | Purpose |
|---|---|
| `SHIZUOKA-METHOD.md` | Canonical definition of the Shizuoka Method (origin, 5 principles, V3 Framework, 7-layer pipeline) |
| `OUTPUT-FORMAT.md` | Strict 8-section output format spec with quality checklist |
| `COFOUNDER-PLAYBOOK.md` | How Claude amplifies the system as co-founder and innovation lead |
| `EVENT-LOG.md` | Decision & change log with tech + business context and before/after tracking |
| `CLAUDE.md` | Project instructions for Claude sessions |

### index.html — Hero Section

- Hero title: "Your idea could change thousands of lives" → "Tell us your idea. We will be honest."
- Hero subtitle: Updated with concrete positioning (136 countries, 165 examples, 17 SDGs)
- Added "Good to know" box below hero (this is not a guarantee, not a business plan, not a funding application)

### server.py, api/index.py, app.py — JSON Response Updates

- Added `practical_advice` to cultural response (meaning + workaround for each dimension)
- Added `funding_by_score` to verdict response (score-aware funding sources)
- Imported `HOFSTEDE_ADVICE` and `get_funding_by_score`

### Expert Reviews (4 agents deployed)

**PM Review:** Found broken single-sentence parsing, stub Reality Check, raw field names in output, truncated case studies, generic funding.

**Marketing Review:** Found hero overpromises, "Nikhil's Take" naming problem, hollow encouragement, no trust signals, Silicon Valley jargon for developing-country audience.

**UX/UI Review:** Delivered wireframes for desktop results page (collapsible sections, sticky tab bar), mobile layout (360px, 8 screens), shareable card (1080x1080 PNG), input form improvements.

**Content Strategist Review:** Delivered complete jargon replacement table, section name rewrite, hero alternatives, "this is not" statement, full sample output rewrite in plain language.

### Files Modified

| File | Action |
|---|---|
| evaluator.py | MODIFIED (format_report, generate_personalized_verdict, elevator pitches, HOFSTEDE_ADVICE, get_funding_by_score, food keywords) |
| index.html | MODIFIED (hero title, subtitle, "this is not" box) |
| server.py | MODIFIED (imports, practical_advice, funding_by_score) |
| api/index.py | MODIFIED (same as server.py) |
| app.py | MODIFIED (same as server.py) |
| OUTPUT-FORMAT.md | MODIFIED (section headers) |
| MEMORY.md | REWRITTEN |
| CLAUDE.md | MODIFIED (scoring formula, output patterns) |
| EVENT-LOG.md | CREATED + MODIFIED (expert reviews, implementation log) |
| SHIZUOKA-METHOD.md | CREATED |
| COFOUNDER-PLAYBOOK.md | CREATED |

---

## 2026-05-29 — Session 3: Vercel/Netlify Deployment + API Key Settings

### What Changed

The evaluator is now deployable to Vercel (serverless Python) and Netlify (static + API proxy). A settings screen lets users configure API keys from the browser.

### New Files

| File | Purpose |
|---|---|
| `api/index.py` | Vercel Python serverless handler — mirrors server.py evaluation pipeline |
| `vercel.json` | Vercel routing: `/api/*` → Python function, `/*` → static index.html |
| `netlify.toml` | Netlify static hosting + API redirect to Vercel deployment |
| `.env.example` | Documents `SERPER_API_KEY` and `PORT` environment variables |

### index.html — Settings Modal (lines 1010, 1227–1269, 1343–1344)

- **Settings gear** in nav bar (between nav-links and CTA button)
- **Settings modal** with API key input (password field, localStorage persistence)
- **X-API-Key header** sent with fetch requests when key is set
- **Privacy text fixed**: "Your idea is sent to our server for evaluation. API keys stay in your browser." (was misleading before)

### server.py — API Key Awareness (line 40)

- Reads `X-API-Key` header for local dev parity with deployed behavior
- Key available for future Serper integration (Phase 2)

### evaluator.py — Serverless Guard (lines 1388–1395)

- Output file write wrapped in try/except for serverless environments
- Falls back silently when OUTPUT_DIR is read-only

### .gitignore — Added

- `.env`, `.vercel/`, `.netlify/`

### README.md — Full Rewrite

- Local dev, Vercel deploy, Netlify deploy instructions
- Data assets summary, environment variables table, project structure

### API Key Flow

```
Frontend (localStorage 'see_api_key')
  → X-API-Key header in fetch request
    → server.py / api/index.py reads header
      → Available for future Serper web search integration
```

### Files Modified

| File | Action |
|---|---|
| api/index.py | CREATED (171 lines) |
| vercel.json | CREATED |
| netlify.toml | CREATED |
| .env.example | CREATED |
| index.html | MODIFIED (+136 lines: settings CSS/HTML/JS, fetch headers) |
| server.py | MODIFIED (+3 lines: X-API-Key header) |
| evaluator.py | MODIFIED (output write guard) |
| .gitignore | MODIFIED (+3 entries) |
| README.md | REWRITTEN |

---

## 2026-05-28 — Session 2: Personalized Elevator Pitch + API Wiring

### What Changed

The elevator pitch — previously generic boilerplate — now uses the user's actual idea text, framed as a co-founder briefing.

### evaluator.py — Elevator Pitch Rewrite (lines ~1058–1115)

**Before:**
```
"Your mental_health idea in Cambodia is ready. Find 3 people who face this problem..."
```

**After:**
```
"peer-to-peer mental health support for rural Cambodian youth via WhatsApp groups"
— you're closer than you think. The gap is shame in asking for help.
Run a 2-week education sprint: Find 3 people who face this problem...
Then re-evaluate. You're not starting from zero — there's 12 points of upside waiting.
```

**How it works:**
1. Hook extraction: `raw_input` split at first sentence, then smart-truncated at natural clause boundaries (commas, conjunctions like "so", "and", "but", "connecting", "who", "that") — max 100 chars
2. Barrier phrase cleaning: strips `Restraint —` prefix from `dominant_barrier`, lowercases for natural grammar
3. Four verdict templates (GO / GO WITH EDUCATION / PIVOT / SHELVE) — each reads as a direct co-founder conversation
4. `edu_delta` variable added to surface education upside in GO WITH EDUCATION pitch

### evaluator.py — Report Formatter (lines ~1222–1260)

- Layer 7 header changed from "VERDICT" to "VERDICT & YOUR PITCH"
- New section: "YOUR PITCH (co-founder briefing)" between verdict and proof-of-work

### server.py — API Response (lines 84–90)

- Added `_input` field to `/api/eval` JSON response:
  - `problem`: parsed problem statement
  - `goal`: parsed goal
  - `country`: resolved country name
  - `budget`: extracted budget constraint
  - `constraints`: full constraints JSON
- Enables frontend "Your Pitch" section (index.html line 1247) which checks `if (d._input)`

### index.html — Verdict Card (line 1244)

- Pitch displayed as styled block inside verdict card
- Colored left border matches verdict type: green (GO), amber (EDU), blue (PIVOT), terracotta (SHELVE)
- Italic text, uppercase label "Your Pitch", 12px rounded corners

### Bug Fixes (during development)

| Bug | Cause | Fix |
|---|---|---|
| Hook truncated mid-word ("university...") | 120-char limit with only `rsplit` fallback | Added separator-based break points, reduced to 100 chars |
| Awkward barrier phrasing ("The Restraint — shame in asking for help is...") | `dominant_barrier` returned "Restraint — shame in..." | Split on "—", take right side, lowercase |
| Hook didn't break for comma-less sentences | Separator list only had comma-based entries | Added " so ", " so that ", " and ", " but " to separator list |

### Files Modified

| File | Action | Details |
|---|---|---|
| evaluator.py | MODIFIED | Elevator pitch rewrite, edu_delta variable, report formatter update |
| server.py | MODIFIED | Added `_input` field to API response |
| index.html | MODIFIED | Pitch display block in verdict section |
| CHANGELOG.md | CREATED | This file |

---

## 2026-05-28 — Session 1: MVP PRD, Bug Fix, Landing Page

### Summary

Three major deliverables:
1. **PRD-MVP.md** — Product Requirements Document
2. **Critical Bug Fix** — Evaluator now uses 136-country Hofstede database
3. **Landing Page** — 1320-line marketing website with client-side evaluator

### evaluator.py — Critical Bug Fix

**Bug:** `evaluate()` loaded `countries.json` (10 countries) instead of `hofstede-database.json` (136 countries). Any country not in the 10 defaulted to "Unknown" with scores of 50.

**Fix:** Added `load_country_data()` that loads from `hofstede-database.json` and enriches with cultural profiles from `countries.json`.

| Country | Before | After |
|---|---|---|
| Cambodia (KH) | Unknown, all 50 | PDI=70, IDV=20, IVR=35 |
| Brazil (BR) | Unknown, all 50 | PDI=69, IDV=36, UAI=76 |
| Japan (JP) | IDV=46 (estimated) | IDV=62 (official) |

### PRD-MVP.md — CREATED

Full product requirements document covering: function scope, data assets, architecture, success criteria, deliverable checklist.

### index.html — CREATED (1320 lines)

Self-contained landing page with:
- 10 sections (hero, methodology, try-it, case studies, zones, verdicts, CTA)
- Client-side evaluator (20 countries, simplified scoring)
- Dark/light mode, glassmorphism, scroll animations
- Security: input escaping, rate limiting, no server calls

### Files Modified

| File | Action | Lines |
|---|---|---|
| PRD-MVP.md | CREATED | ~200 |
| evaluator.py | MODIFIED | +40 lines (load_country_data) |
| index.html | CREATED | 1320 |
| SESSION-LOG-2026-05-28.md | CREATED | ~170 |

---

*CHANGELOG maintained by Nikhil Tiwari & Claude*

---

## 2026-06-17 — Session 7: Innovation Toolkit — 4 New Features

### What Added

Implemented 4 genuinely innovative features that leverage SEE's unique data assets (136 countries, 165 case studies, Hofstede dimensions, SDG mapping). These are NOT generic SaaS features — they are purpose-built tools that only SEE can provide because of its proprietary evaluation data.

### The 4 Features

1. **Social Impact Lean Canvas** — A one-page business model canvas adapted for social impact. Extracts problem, solution, UVP, unfair advantage, customer segments, key metrics, channels, cost/revenue from the evaluation data into a 9-block grid. Only possible because SEE already analyzes all these dimensions.

2. **Competitive Positioning Engine** — Fuzzy-matches the user's idea against 165 case studies to find the 5 best comparable organizations. Generates a radar chart (cultural fit, community, bootstrapper, impact, education) comparing the user's idea vs. successful case studies. Extracts success/failure patterns with sources.

3. **Global Cultural Heatmap** — Evaluates the user's idea against all 136 countries in the Hofstede database. Shows top 5 best-fit and bottom 5 highest-barrier countries with scores. Includes regional averages across 11 global zones. Takes ~5-8 seconds per country (runs full cultural analysis + bootstrapper scoring for each).

4. **Social Impact Marketplace** — A curated gallery of evaluated ideas. Each evaluation generates a marketplace listing with a badge (gold/silver/bronze/developing based on score), SDG tags, and a hook. The standalone gallery section shows 9 seed ideas + any user-evaluated ideas stored in localStorage. Filterable by badge type.

### Architecture

- **Backend (evaluator.py):** Added 4 new functions (~450 lines) before `format_report()`:
  - `generate_lean_canvas()` — extracts canvas blocks from evaluation data
  - `find_competitive_positioning()` — loads library.json + zones-library.json, fuzzy-matches case studies
  - `score_idea_globally()` — iterates all 136 countries, runs cultural analysis + bootstrapper scoring for each
  - `generate_marketplace_listing()` — creates listing card with badge, SDG tags, hook
  - All 4 integrated into `evaluate()` pipeline after SDG mapping

- **API (api/eval.mjs):** Updated system prompt JSON schema to request `lean_canvas`, `competitive_positioning`, and `marketplace_listing` from Gemini. Updated STATIC_RESULTS demo with new fields.

- **Frontend (styles.css):** Added ~490 lines of new CSS for innovation panel, lean canvas grid, radar chart, heatmap visualization, marketplace cards, responsive breakpoints.

- **Frontend (app.js):** Added ~420 lines of new JS:
  - `renderInnovationPanel()` — tabbed panel shown after evaluation
  - `renderLeanCanvas()` — 3-column grid with 10 blocks
  - `renderCompetitivePositioning()` — SVG radar chart + competitor cards
  - `buildRadarSVG()` — generates pentagonal radar chart with user vs. competitor data
  - `renderGlobalHeatmap()` — summary cards + top/bottom 5 + regional bars
  - `renderMarketplaceCard()` — single listing card
  - `renderMarketplaceGallery()` — standalone gallery with filtering
  - `saveToMarketplace()` — persists evaluations to localStorage

- **Frontend (index.html):** Added marketplace section (always visible), innovation panel container (post-evaluation), nav/footer marketplace links.

### Files Modified

| File | Action | Lines |
|---|---|---|
| `evaluator.py` | MODIFIED | +450 lines (4 new functions + evaluate() integration) |
| `api/eval.mjs` | MODIFIED | +40 lines (system prompt schema + static result) |
| `styles.css` | MODIFIED | +490 lines (innovation panel, canvas, radar, heatmap, marketplace) |
| `app.js` | MODIFIED | +420 lines (rendering functions, gallery, filters) |
| `index.html` | MODIFIED | +25 lines (marketplace section, innovation panel, nav links) |
| `CHANGELOG.md` | MODIFIED | this entry |
| `INNOVATION-FEATURES.md` | CREATED | ~1300 lines (research + specs) |
