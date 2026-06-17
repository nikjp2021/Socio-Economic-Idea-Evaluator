# MEMORY — Socio-Economic Evaluator

Project memory for Claude sessions. Updated each session.

---

## Quick Context

If you're reading this, you've already read CLAUDE.md. Good. This file tells you what happened in each session and what the current state is. EVENT-LOG.md tells you why decisions were made. Read both before touching code.

---

## Last Updated: 2026-06-17 (Session 10+)

## Project State

- **Location:** `/home/nikhil/Claude-Fl/socio-economic-evaluator/`
- **Type:** Full-stack web application — Python evaluator engine + Node.js API + Neon PostgreSQL + vanilla JS frontend
- **Purpose:** 7-layer social impact idea evaluator — evaluates if a social impact idea can work, what's in the way, and what to do on Day 1
- **Data:** 136 countries (Hofstede), 72 case studies + 70 figures (library.json), 110 zone-based case studies + 57 figures (zones-library.json), 20 mentor personas, 10 zones
- **Status:** Well past MVP — has database persistence, user auth, community features, innovation toolkit, and 20-mentor persona council

## Key Files

| File | Lines | Purpose |
|---|---|---|
| evaluator.py | 2502 | Full 7-layer evaluation pipeline + innovation features + report formatter |
| app.js | 2901 | Frontend SPA — auth, results rendering, innovation panel, community features, standout features |
| styles.css | 3996 | Full design system (warm cream theme, Lora/Lexend fonts, responsive) |
| index.html | 648 | Landing page HTML structure |
| api/eval.mjs | 514 | Gemini Flash-Lite evaluation handler (Vercel + Netlify dual-handler) |
| api/auth.mjs | 281 | JWT authentication (register/login/logout, bcrypt) |
| api/db.mjs | 255 | Neon PostgreSQL connection + schema init (11 tables) |
| api/evaluations.mjs | 319 | Evaluations CRUD (save, list, upvote) |
| api/reference.mjs | 316 | Reference data endpoints (leaderboard, similar, country, personas) |
| api/seed.mjs | 362 | Database seeding (personas, case studies, figures, countries, SDGs) |
| server.py | ~198 | Local dev server (stdlib HTTP, port 8080) |
| app.py | ~184 | Flask wrapper for Render deployment |
| SHIZUOKA-METHOD.md | ~183 | Canonical definition of the Shizuoka Method |
| OUTPUT-FORMAT.md | ~500 | Strict 8-section output format spec |

## Architecture

### Two Evaluation Systems

1. **Python engine** (`evaluator.py`) — deterministic 7-layer pipeline, no LLM calls, pure heuristic scoring against local JSON data. Used via CLI or local server.
2. **Node.js API** (`api/eval.mjs`) — Gemini 3.1 Flash-Lite with Google Search grounding. Used by the web frontend. Returns structured JSON.

Both produce the same output structure (8 sections + innovation features).

### Database (Neon PostgreSQL)

11 tables defined in `api/db.mjs`:
- **Core:** `users`, `user_profiles`, `evaluations`, `mentor_matches`, `favorites`
- **Community:** `marketplace_listings` (with upvotes)
- **Analytics:** `evaluation_analytics`
- **Reference:** `mentor_personas`, `case_studies`, `countries`, `sdg_data`, `idea_templates`, `figures`

### API Endpoints (Vercel serverless)

| Route | File | Purpose |
|---|---|---|
| `/api/eval` | eval.mjs | Core evaluation (Gemini + static mocks) |
| `/api/auth` | auth.mjs | JWT auth (register/login/logout) |
| `/api/evaluations` | evaluations.mjs | CRUD for saved evaluations |
| `/api/reference` | reference.mjs | Reference data API |
| `/api/seed` | seed.mjs | Database seeding |

### Frontend Features

- **Gate screen** — Access code `9999`, persisted in localStorage
- **Auth** — JWT login/register modal, user menu with dashboard/evaluations/favorites
- **Innovation panel** — Tabbed: lean canvas, competitive positioning, heatmap, marketplace, mentors
- **Community** — Leaderboard, figures gallery, SDG explorer, similar ideas panel
- **Quick Evaluate** — Pre-computed results without AI calls
- **Cultural Lookup** — Country selector with Hofstede dimensions

## Design System

- **Theme:** Warm cream/light (`--cream: #faf7f2`)
- **Fonts:** Lora (display), Lexend (body), JetBrains Mono (code)
- **Colors:** Forest green, amber, terracotta, sky blue
- **Breakpoints:** 900px, 600px, 380px

## Session History

### Sessions 1-4 (2026-05-28 to 2026-05-29)
See EVENT-LOG.md for detailed entries. Key work: MVP, personalized pitch, Vercel/Netlify deployment, expert reviews, content strategy rewrite.

### Sessions 5-10+ (2026-05-30 to 2026-06-17)
28 commits. Major additions (not logged in EVENT-LOG.md):
- Neon PostgreSQL backend with auth (bcryptjs + JWT)
- Innovation Toolkit (lean canvas, competitive positioning, global heatmap, marketplace, mentor council)
- 20-mentor persona council with case-study-to-persona matching
- Community Leaderboard, Figures Gallery, SDG Explorer, Similar Ideas panel
- User Dashboard with evaluation history
- Database-backed reference data (zero-AI-call features)
- Landing page redesign with Unsplash imagery
- Canvas export (PNG + text) with upvote system
- 9 new case studies enriched from Wikipedia

### Session 11 (2026-06-17) — Standout Features + Doc Sync
- Full documentation audit: MEMORY.md, CLAUDE.md, OUTPUT-FORMAT.md, EVENT-LOG.md synced to actual code
- Multi-agent research: 4 agents analyzed competitive landscape, user journey, data moats, AI/tech opportunities
- Added 6 new features (all zero API cost, client-side):
  1. **Cultural Fit Passport** — radar chart + cultural twin + adaptation tips, exportable as PNG
  2. **Impact Story Engine** — auto-generated LinkedIn post, 60-sec pitch, WhatsApp status with copy buttons
  3. **SDG Alignment Certificate** — beautifully designed certificate exportable as PNG
  4. **Post-Eval Account Prompt** — save banner for non-authenticated users
  5. **Interactive 14-Day Progress Tracker** — checkboxes with localStorage persistence + progress bar
  6. **What-If Mode** — country selector showing score deltas across Hofstede dimensions

## Architecture Decisions

- **No frontend framework** — vanilla JS for zero build tool dependency
- **Neon PostgreSQL** — serverless Postgres for persistence (replaced localStorage-only)
- **JWT auth** — bcryptjs for password hashing, jsonwebtoken for session tokens
- **Dual evaluation** — Python engine for CLI, Gemini API for web (same output format)
- **Design direction** — Warm cream theme (NOT the dark theme in EXPERIENCE-DESIGN.md)
- **Fonts** — Lora/Lexend (NOT Rajdhani/Inter as originally spec'd)
- **Scoring formula:** `(community × 0.30) + (cultural × 0.15) + (education × 0.15) + (bootstrapper × 0.20) + (impact × 0.20)`
- **Verdict types:** GO / GO_WITH_EDUCATION / PIVOT / SHELVE (internal enum)
- **Section names:** YOUR IDEA / YOUR SCORE / WHO YOU HELP / IS THIS A REAL PROBLEM? / YOUR STRENGTHS / WHAT IS IN YOUR WAY / CAN YOU START WITH NOTHING? / YOUR FIRST 14 DAYS

## Known Issues

- Cultural profiles only for 10 countries (rest have Hofstede scores only)
- Funding pathways hardcoded for ~10 countries (expanded from 5 but still limited)
- Scoring is heuristic, not calibrated against real outcomes
- Case study matching can match irrelevant studies
- Single-sentence input parsing doesn't extract problem/goal (shows "you did not describe this")
- OUTPUT-FORMAT.md has 3 stale section names in CLI format blocks (code uses newer plain-language names)
- EXPERIENCE-DESIGN.md describes a dark theme that was never implemented (actual is cream/light)
- INNOVATION-FEATURES.md describes features at ~60% completion (heatmap has no SVG map, no positioning scatter plot, marketplace has badge-only filtering)
- EVENT-LOG.md has no entries after 2026-05-29 (28 commits undocumented)
- JWT secret defaults to dev value — needs env var in production

## How to Run

```bash
# CLI
python3 evaluator.py "your idea here"

# Server
python3 server.py
# Open http://localhost:8080

# Flask (for Render)
gunicorn app:app
```

---

*Auto-maintained by Claude*
