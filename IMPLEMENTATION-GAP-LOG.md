# Implementation Gap Log — Socio-Economic Evaluator

*Generated: 2026-06-17*
*Purpose: Complete audit of features discussed, designed, or specified but NOT yet implemented*

---

## Legend

| Status | Meaning |
|--------|---------|
| 🔴 BROKEN | Exists in code but broken/wrong |
| 🟡 DEAD LINK | UI element exists but no handler |
| ⚪ NOT WIRED | Backend exists, frontend doesn't call it |
| ⬜ NOT STARTED | Described in docs, no code |
| ✅ DONE | Fully working |

---

## SECTION A: Critical Bugs (Fix Immediately)

### A1. 🔴 Form Field ID Mismatch — Evaluation Restore Broken
**File:** `app.js:2243`
**Bug:** Restoring a returning user's last evaluation uses wrong element IDs. All 5 selectors return `null`, so form fields never repopulate.
**Wrong:** `$('#problemInput')`, `$('#goalInput')`, `$('#countryInput')`, `$('#budgetInput')`, `$('#constraintsInput')`
**Correct:** `$('#fieldProblem')`, `$('#fieldGoal')`, `$('#fieldCountry')`, `$('#fieldBudget')`, `$('#fieldConstraints')`
**Impact:** HIGH — returning users see their old result but can't see or edit what they originally submitted.

### A2. 🔴 Frontend Never Saves Evaluations to Database
**File:** `app.js:283-289`
**Bug:** After a successful evaluation, the code calls `saveToMarketplace()` and `saveLastEvaluation()` — both localStorage-only. It never calls `POST /api/evaluations?action=save` which exists and works in `api/evaluations.mjs`. The only DB save is a fire-and-forget `maybeSaveToDB()` inside `api/eval.mjs` that silently skips if `DATABASE_URL` is not set.
**Impact:** CRITICAL — evaluations are lost on cache clear, no cross-device sync, no database history for logged-in users.

### A3. 🔴 `maybeSaveToDB()` Silently Skips Without DATABASE_URL
**File:** `api/eval.mjs:17`
**Bug:** `if (!process.env.DATABASE_URL) return;` — silently exits. `.env.local` has no `DATABASE_URL`. Zero feedback to user.
**Impact:** CRITICAL — even when user is logged in, nothing is persisted server-side.

### A4. 🔴 Upvote Buttons Are Static Text (Not Interactive)
**File:** `app.js:1413`, `app.js:1980`
**Bug:** Upvotes render as `<div>` and `<span>` with no click handler, no API call, no cursor pointer. The backend `POST /api/evaluations` with `action=upvote` exists but is never called.
**Impact:** MEDIUM — marketplace and leaderboard feel broken.

### A5. 🟡 `#navMyFavorites` — Dead Link
**File:** `index.html:103`
**Bug:** "Favorites" dropdown item exists but has zero event listener in `app.js`. Clicking scrolls to top.
**Impact:** MEDIUM — confusing UX for logged-in users.

### A6. 🟡 `#navMyProfile` — Dead Link
**File:** `index.html:104`
**Bug:** "Profile" dropdown item exists but has zero event listener. Same behavior as Favorites.
**Impact:** MEDIUM — confusing UX.

### A7. 🟡 `#navMyDashboard` — Dead Link
**File:** `index.html:102`
**Bug:** "Dashboard" dropdown item exists but likely has no handler (needs verification).
**Impact:** MEDIUM — confusing UX.

### A8. 🔴 Duplicate `showToast()` — First Definition Is Dead Code
**File:** `app.js:181` (simple version), `app.js:1614` (auth version with type parameter)
**Bug:** Second definition shadows the first. The simple version at line 181 is dead code.
**Impact:** LOW — still works because the auth version handles missing `type` gracefully.

---

## SECTION B: Backend Exists, Frontend Not Wired (Cheapest Wins)

These features have working API endpoints but the frontend never calls them:

### B1. ⚪ Wire Marketplace to Database
**Source:** `REQUIREMENTS.md`, `INNOVATION-FEATURES.md`
**Backend:** `GET /api/reference?data=leaderboard` — returns DB-backed marketplace listings
**Frontend Status:** Uses localStorage + inline seed data only. `renderMarketplaceGallery()` at `app.js:1387` never fetches from API.
**Effort:** LOW — swap localStorage reads for API fetch, wire upvote to `POST /api/evaluations`
**Impact:** HIGH — transforms marketplace from demo to live product

### B2. ⚪ Wire Idea Similarity Search
**Source:** `REQUIREMENTS.md`, `INNOVATION-FEATURES.md`
**Backend:** `GET /api/reference?data=similar` — returns similar ideas
**Frontend Status:** `showSimilarIdeas()` at `app.js` fetches but the panel rendering may be incomplete
**Effort:** LOW — verify frontend panel renders the API response
**Impact:** HIGH — "discover related ideas" after every evaluation

### B3. ⚪ Wire Country Explorer
**Source:** `REQUIREMENTS.md`, `INNOVATION-FEATURES.md`
**Backend:** `GET /api/reference?data=country` — returns full country profile (Hofstede 6D, funding, case studies, personas)
**Frontend Status:** No frontend page/modal exists
**Effort:** MEDIUM — need full page or modal with Hofstede radar chart, cultural profile, funding sources
**Impact:** HIGH — standalone feature + strong SEO asset

### B4. ⚪ Wire Mentor Personas from Database
**Source:** `REQUIREMENTS.md`, `INNOVATION-FEATURES.md`
**Backend:** `GET /api/reference?data=personas` — returns full mentor profiles
**Frontend Status:** `initFiguresGallery()` at `app.js:1990` fetches from API but basic gallery only
**Effort:** LOW — enhance gallery with full bio, playbook, specialties, barrier strengths
**Impact:** MEDIUM

### B5. ⚪ Wire SDG Explorer from Database
**Source:** `REQUIREMENTS.md`
**Frontend Status:** `initSDGExplorer()` at `app.js:2072` exists but basic
**Effort:** LOW — make SDG cards clickable, show evaluations per SDG, link to filtered case studies
**Impact:** MEDIUM

### B6. ⚪ Seed Database (One-Time)
**Source:** `REQUIREMENTS.md`
**Backend:** `POST /api/seed?key=see-seed-2024` — seeds 20 personas, 165+ case studies, 57+ figures, 136 countries, 17 SDGs, 6 idea templates
**Frontend Status:** Never called. Without this, database is empty.
**Effort:** LOW — one-time POST call
**Impact:** HIGH — blocks all database-dependent features

---

## SECTION C: Planned Features — Not Started

### C1. Interactive SVG World Map for Heatmap
**Source:** `INNOVATION-FEATURES.md` §4.3
**Description:** Color-fill each of 136 countries based on score. Hover for tooltip, click for detail panel, zoom by region. THE signature "wow" feature.
**Current State:** Heatmap renders as text-based horizontal bars
**Backend Support:** `score_idea_globally()` already returns per-country scores
**Impact:** HIGH (highest differentiation globally)
**Effort:** HIGH

### C2. Canvas PDF Export
**Source:** `INNOVATION-FEATURES.md` §2.4
**Description:** Clean A4 printable layout. Canvas on page 1, detailed notes on page 2.
**Current State:** Lean Canvas renders but cannot be exported
**Impact:** HIGH — primary use case for sharing with co-founders and funders
**Effort:** MEDIUM

### C3. Canvas PNG Export
**Source:** `INNOVATION-FEATURES.md` §2.4
**Description:** 1200×900 image optimized for WhatsApp/social sharing
**Current State:** Same as PDF — canvas renders but no export
**Impact:** HIGH
**Effort:** LOW (html2canvas or native canvas)

### C4. Canvas Edit Mode
**Source:** `INNOVATION-FEATURES.md` §2.4
**Description:** Click any block to edit. contenteditable with save/cancel. "edited" badge on customized blocks.
**Current State:** Read-only blocks
**Impact:** MEDIUM
**Effort:** MEDIUM

### C5. Expand Funding Matching to 136 Countries
**Source:** `INNOVATION-PLAN.md`
**Description:** Currently hardcoded for 5 countries (JP, IN, BD, KE, US). All others get generic funding.
**Current State:** `funding_matcher.py` has `FUNDING_MAP` with only 5 entries
**Impact:** HIGH — core value for users outside those 5 countries
**Effort:** MEDIUM

### C6. Heatmap Country Detail Panel
**Source:** `INNOVATION-FEATURES.md` §4.3
**Description:** Slide-in panel: country name, score vs. origin (delta), 6-dimension mini-bars, top barrier/workaround, top strength, economic tier.
**Current State:** No panel exists
**Impact:** HIGH
**Effort:** MEDIUM

### C7. Heatmap Score Comparison Slider
**Source:** `INNOVATION-FEATURES.md` §4.3
**Description:** Compare two countries side by side
**Current State:** Not implemented
**Impact:** MEDIUM
**Effort:** MEDIUM

### C8. Marketplace Detail Pages
**Source:** `INNOVATION-FEATURES.md`
**Description:** Dedicated page per listing: full canvas, cultural fit radar, case study matches, "Connect with Founder" button
**Current State:** Marketplace is a flat gallery, no detail view
**Impact:** HIGH
**Effort:** HIGH

### C9. Marketplace "Connect with Founder" Modal
**Source:** `INNOVATION-FEATURES.md`
**Description:** Email/WhatsApp form, stored server-side. Introduces if founder is interested.
**Current State:** Not implemented
**Impact:** HIGH
**Effort:** MEDIUM

### C10. Evaluation Detail View (Shareable URL)
**Source:** `REQUIREMENTS.md`
**Description:** Click evaluation to see full result. Reuse `renderResult()` in read-only mode. Shareable URL: `/eval/<uuid>`
**Current State:** No detail view, no URL sharing for evaluations
**Impact:** HIGH — enables sharing, bookmarking, marketplace detail pages
**Effort:** MEDIUM

### C11. Multi-Language Support
**Source:** `INNOVATION-PLAN.md`, `EXPERIENCE-DESIGN.md`
**Description:** Translate UI to top 10 languages (Japanese, Hindi, Bangla, Swahili priority). i18n keys in frontend.
**Current State:** English only
**Impact:** HIGH
**Effort:** HIGH

### C12. WhatsApp Bot
**Source:** `INNOVATION-PLAN.md`, `EXPERIENCE-DESIGN.md`
**Description:** Evaluate ideas via WhatsApp message. Maximum reach for T2-T3 countries.
**Current State:** Not implemented
**Impact:** HIGH
**Effort:** HIGH

### C13. Web Search Integration (FAD Detection)
**Source:** `INNOVATION-PLAN.md`, `EXPERIENCE-DESIGN.md`
**Description:** Real-time FAD detection via Reddit/Twitter. Serper API or Gemini grounding.
**Current State:** FAD assessment is template-based only
**Impact:** HIGH
**Effort:** MEDIUM

### C14. Market Buzz Scoring
**Source:** `INNOVATION-PLAN.md`, `EXPERIENCE-DESIGN.md`
**Description:** Google Trends integration, competitor count, pricing data
**Current State:** Not implemented
**Impact:** MEDIUM
**Effort:** HIGH

### C15. Test Suite for evaluator.py
**Source:** `INNOVATION-PLAN.md`
**Description:** Basic tests for evaluator.py pipeline and API handler
**Current State:** Zero automated tests
**Impact:** HIGH — any change to 2500-line evaluator risks silent regressions
**Effort:** LOW

### C16. Idea Comparison Mode
**Source:** `COFOUNDER-PLAYBOOK.md`
**Description:** Compare two ideas side by side
**Current State:** Not implemented
**Impact:** MEDIUM
**Effort:** MEDIUM

### C17. Multi-Round Evaluation Flow
**Source:** `COFOUNDER-PLAYBOOK.md`
**Description:** Iterative refinement, not just input→score→done
**Current State:** Single-shot evaluation only
**Impact:** HIGH
**Effort:** HIGH

### C18. WhatsApp Summary Export
**Source:** `COFOUNDER-PLAYBOOK.md`
**Description:** Export evaluation as WhatsApp-friendly text
**Current State:** Generic text download exists, not WhatsApp-optimized
**Impact:** MEDIUM
**Effort:** LOW

### C19. Follow-Up Question Generation
**Source:** `COFOUNDER-PLAYBOOK.md`
**Description:** After evaluation, generate questions to deepen the analysis
**Current State:** Not implemented
**Impact:** MEDIUM
**Effort:** MEDIUM

### C20. Leaderboard + Community Stats Enhancement
**Source:** `REQUIREMENTS.md`
**Description:** Top ideas by upvotes. Community stats: total evaluations, users, top types, countries, verdict distribution. Filter by badge tier. "Trending" sort.
**Current State:** Basic leaderboard and community stats display exist but limited
**Impact:** MEDIUM
**Effort:** LOW

### C21. URL-Param Sharing
**Source:** `EXPERIENCE-DESIGN.md`
**Description:** Share evaluation via URL parameters
**Current State:** Share uses Web Share API + clipboard + download text. No URL-param encoding.
**Impact:** MEDIUM
**Effort:** LOW

### C22. Community Stats Counter Animation Fix
**Source:** `app.js:73-84`
**Bug:** `counterObserver` skips elements where `data-count="0"` because `parseFloat("0")` is falsy. Stats show "0" if API fails.
**Impact:** LOW
**Effort:** LOW

---

## SECTION D: Partially Done Features

| # | Feature | What Works | What's Missing |
|---|---------|------------|----------------|
| D1 | Funding Matching | 5 countries have specific sources | 131 countries get generic |
| D2 | Marketplace | localStorage gallery with filters | No DB persistence, no upvotes, no detail pages |
| D3 | Leaderboard | Basic display from API | No upvote interaction, no trending sort |
| D4 | Mentor Gallery | Fetches from API, basic cards | No full bio/playbook, no "Find My Mentors" flow |
| D5 | SDG Explorer | Basic UI exists | No clickable cards, no evaluations per SDG |
| D6 | Figures Gallery | Fetches from API, basic cards | No filtering by country/zone |
| D7 | Share/Save | Web Share API + clipboard + download text | No URL-param sharing, no PDF export |

---

## SECTION E: Impact vs Effort Matrix

### Quick Wins (HIGH impact, LOW effort)
1. Seed Database — one POST call, blocks everything
2. Wire Marketplace to Database — swap localStorage for API fetch
3. Wire Idea Similarity Search — verify panel renders API response
4. Wire Mentor Personas from Database — enhance existing gallery
5. Fix form field ID mismatch — one-line change
6. Fix upvote buttons — add click handler + API call
7. Test Suite for evaluator.py — basic pipeline tests
8. Canvas PNG Export — html2canvas
9. WhatsApp Summary Export — text formatting

### Strategic Investments (HIGH impact, MEDIUM-HIGH effort)
1. Interactive SVG World Map — signature wow feature
2. Expand Funding to 136 Countries — core value expansion
3. Evaluation Detail View (Shareable URL) — enables sharing
4. Country Explorer — standalone feature + SEO
5. Marketplace Detail Pages — transforms marketplace
6. Multi-Language Support — reach expansion
7. Multi-Round Evaluation Flow — deeper analysis

### Long-Term Bets (HIGH impact, HIGH effort)
1. WhatsApp Bot — maximum reach for T2-T3
2. Web Search Integration — real-time FAD detection
3. Market Buzz Scoring — Google Trends

---

## SECTION F: Stats Summary

| Metric | Count |
|--------|-------|
| Total features identified | 82 |
| ✅ DONE | 24 |
| Partially done | 11 |
| 🔴 BROKEN (exists but wrong) | 6 |
| ⚪ Backend ready, frontend not wired | 6 |
| ⬜ NOT STARTED | 35 |
| **Critical bugs to fix** | **3** |
| **Quick wins available** | **9** |

---

*This log should be updated as features are implemented. Cross-reference with CHANGELOG.md for implementation dates.*
