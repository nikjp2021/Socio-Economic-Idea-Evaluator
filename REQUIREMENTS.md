# SEE — Future Feature Requirements

> Features to build next. All backend endpoints already exist in `/api/reference.mjs` and `/api/evaluations.mjs`. Frontend and wiring remain.

---

## 1. Wire Marketplace to Database

**Status:** Pending
**Backend:** `GET /api/reference?data=leaderboard` — already returns marketplace listings joined with evaluation data, ordered by upvotes.
**What to do:**
- Replace `renderMarketplaceGallery()` in `app.js` — currently uses localStorage/inline data.
- Fetch from `/api/reference?data=leaderboard&badge=<filter>` when filter buttons are clicked.
- Map returned fields: `hook`, `badge_label`, `idea_type`, `region`, `sdg_tags`, `upvotes`, `score`, `verdict`.
- Wire upvote button to `POST /api/evaluations` with `action=upvote`.
- Graceful fallback if API returns empty (show "No ideas yet — be the first!").

**Files:** `app.js` (renderMarketplaceGallery function)

---

## 2. Idea Similarity Search

**Status:** Pending
**Backend:** `GET /api/reference?data=similar&idea_type=<type>&country=<code>&limit=5` — returns past evaluations matching idea type and/or country.
**What to do:**
- After a user completes an evaluation, show a "Similar Ideas" panel below the result.
- Call `/api/reference?data=similar` with the evaluation's `idea_type` and `country`.
- Display as a horizontal scroll of cards: idea text (truncated), score, verdict badge, country flag.
- Click to expand (could use a modal or inline accordion).
- Also add a standalone "Explore Similar" button on the result page.

**Files:** `index.html` (result section), `app.js` (post-eval logic), `styles.css`

---

## 3. Country Explorer (Interactive Page)

**Status:** Pending
**Backend:** `GET /api/reference?data=country&code=<CODE>` — returns full country data including cultural_profile, funding_sources, case_studies, personas, recent_evaluations.
**What to do:**
- Build a full-page or modal view accessible from the Cultural Lookup section.
- Show: Hofstede 6D radar chart (canvas/SVG), cultural profile text, funding sources list, case studies from that country, mentor personas from that country, recent evaluations.
- Add a "Deep Dive" button next to each country in the Cultural Lookup dropdown result.
- Consider a world map or zone grid as an alternative entry point.

**Files:** New section in `index.html`, new JS module/section in `app.js`, `styles.css`

---

## 4. Evaluation Detail View

**Status:** Pending
**Backend:** Existing `GET /api/evaluations?id=<uuid>` or store full result_json in DB.
**What to do:**
- When user clicks an evaluation in "My Evaluations" or the leaderboard, show the full result.
- Render all sections: score, verdict, cultural fit, case studies, mentor matches, SDG alignment, action plan, funding options.
- Reuse the existing result rendering logic from `renderResult()` but in a read-only mode (no "save" button).
- Add shareable URL: `/eval/<uuid>` (requires a new rewrite in vercel.json).

**Files:** `app.js`, `index.html`, `vercel.json`, `styles.css`

---

## 5. Leaderboard + Community Stats

**Status:** Pending
**Backend:** `GET /api/reference?data=leaderboard` and `GET /api/reference?data=stats`.
**What to do:**
- Build a leaderboard section showing top ideas by upvotes.
- Show community stats: total evaluations, total users, top idea types, top countries, verdict distribution.
- Filter by badge tier (gold/silver/bronze/developing).
- Consider a "Trending" sort (recent + upvotes).

**Files:** New section in `index.html`, `app.js`, `styles.css`

---

## 6. Mentor Personas from Database

**Status:** Pending
**Backend:** `GET /api/reference?data=personas&zone=<zone>` — returns all 20 personas with full playbook data.
**What to do:**
- Replace the current inline mentor gallery with DB-fetched data.
- Show mentor details on click: bio, philosophy, quote, playbook steps, specialties, barrier strengths.
- Link mentor cards to their matching case studies.
- Add "Find My Mentors" flow: after evaluation, show top 3 persona matches with playbook excerpts.

**Files:** `app.js` (renderMentorsGallery), `index.html`, `styles.css`

---

## 7. Seed Database (One-Time)

**Status:** Blocked on deploy
**Endpoint:** `POST /api/seed?key=see-seed-2024`
**What to do:**
- After deploying the new API files, call the seed endpoint once.
- Seeds: 20 personas, 165+ case studies, 57+ figures, 136 countries, 17 SDGs, 6 idea templates.
- Idempotent — safe to re-run.
- Update `SEE_SEED_SECRET` env var in Vercel if needed.

---

## 8. SDG Explorer

**Status:** Idea
**Backend:** `GET /api/reference?data=sdgs` — returns all 17 SDGs with idea_types mapping.
**What to do:**
- Make SDG cards clickable → show which idea types map to that SDG.
- Show number of evaluations per SDG (from stats endpoint).
- Link to filtered case studies by SDG-adjacent category.

---

## 9. Figures / Influential People Gallery

**Status:** Idea
**Backend:** `GET /api/reference?data=figures&country=<code>` — returns 57+ influential figures.
**What to do:**
- Build a gallery section showing key figures in social impact.
- Filter by country or zone.
- Show: name, role, organization, impact summary, quote.
- Could integrate into the "Evidence" section or stand alone.

---

## Technical Notes

- All reference endpoints are cached (`Cache-Control: public, max-age=300` = 5 min).
- The `neon()` driver returns flat arrays — use `sql.query(text, params)` for parameterized calls.
- `escHtml()` is defined in `app.js` for XSS-safe rendering.
- The `.hidden` class is used for show/hide toggling on result containers.
- Vercel serverless functions use `.mjs` extension with `export default async function handler(req, res)`.
