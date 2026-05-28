# MEMORY — Socio-Economic Evaluator

Project memory for Claude sessions. Updated each session.

---

## Quick Context

If you're reading this, you've already read CLAUDE.md. Good. This file tells you what happened in each session and what the current state is. EVENT-LOG.md tells you why decisions were made. Read both before touching code.

---

## Last Updated: 2026-05-29 (Session 4)

## Project State

- **Location:** `/home/nikhil/socio-economic-evaluator/`
- **Type:** Python CLI tool + web frontend (zero dependencies, stdlib only)
- **Purpose:** 7-layer social impact idea evaluator — evaluates if a social impact idea can work, what's in the way, and what to do on Day 1
- **Data:** 136 countries (Hofstede), 165 case studies, 57 figures, 10 zones
- **Status:** MVP complete, output rewritten with plain language, expert-reviewed

## Key Files

| File | Lines | Purpose |
|---|---|---|
| evaluator.py | ~1500 | Full 7-layer evaluation pipeline + 8-section report formatter |
| server.py | ~180 | HTTP server, `/api/eval` JSON endpoint |
| app.py | ~170 | Flask wrapper for Render deployment |
| api/index.py | ~180 | Vercel serverless handler |
| index.html | ~1500 | Landing page + client-side evaluator + settings |
| SHIZUOKA-METHOD.md | ~183 | Canonical definition of the Shizuoka Method |
| OUTPUT-FORMAT.md | ~500 | Strict 8-section output format spec |
| COFOUNDER-PLAYBOOK.md | ~250 | How Claude amplifies the system |
| EVENT-LOG.md | ~200 | Decision & change log (tech + business) |
| CLAUDE.md | ~210 | Project instructions for Claude |
| CHANGELOG.md | ~220 | Change history across sessions |

## Session History

### Session 1 (2026-05-28) — MVP PRD, Bug Fix, Landing Page
- Created PRD-MVP.md
- Fixed critical bug: evaluator now loads hofstede-database.json (136 countries) instead of countries.json (10)
- Built 1320-line landing page with client-side evaluator

### Session 2 (2026-05-28) — Personalized Elevator Pitch
- Rewrote elevator pitch to use user's actual input text
- Four verdict templates now read as co-founder briefings
- Added `_input` field to server API response
- Created CHANGELOG.md

### Session 3 (2026-05-29) — Vercel/Netlify Deployment + API Key Settings
- Created api/index.py, vercel.json, netlify.toml
- Added settings gear with API key modal
- Rewrote README.md with deployment instructions
- Pushed to GitHub

### Session 4 (2026-05-29) — Expert Reviews + Content Strategy Rewrite
- Created SHIZUOKA-METHOD.md — canonical definition of the methodology
- Created OUTPUT-FORMAT.md — strict 8-section output format spec
- Created COFOUNDER-PLAYBOOK.md — how Claude amplifies the system
- Created EVENT-LOG.md — decision & change log with before/after tracking
- Created CLAUDE.md — project instructions for Claude
- Fixed scoring formula (removed double-counting of community score)
- Added HOFSTEDE_ADVICE dictionary for practical barrier advice
- Added get_funding_by_score() for score-aware funding
- Rewrote format_report() — 8 sections with plain language
- Deployed 4 expert agents (PM, Marketing, UX/UI, Content Strategist)
- Rewrote all section names: YOUR PITCH→YOUR IDEA, THE VERDICT→YOUR SCORE, etc.
- Renamed "Nikhil's Take" → "Our Honest Opinion"
- Removed all hollow encouragement ("you're closer than you think", etc.)
- Updated hero title: "Tell us your idea. We will be honest."
- Added "Good to Know" positioning statement
- Updated OUTPUT-FORMAT.md section headers
- Updated server.py, api/index.py, app.py with practical_advice and funding_by_score

## Architecture Decisions

- **No frameworks** — vanilla JS, Python stdlib only
- **No build tools** — works from `file://` or `python3 -m http.server`
- **Dual database** — hofstede-database.json (136 countries) + countries.json (10 with cultural profiles)
- **Hook extraction** — smart truncation at natural clause boundaries, max 100 chars
- **Verdict types:** GO / GO_WITH_EDUCATION / PIVOT / SHELVE (internal enum)
- **Verdict labels (user-facing):** READY TO TEST / GOOD BUT FIX ONE THING FIRST / CHANGE YOUR APPROACH / HIGH BARRIERS RIGHT NOW
- **Scoring formula:** `(community × 0.30) + (cultural × 0.15) + (education × 0.15) + (bootstrapper × 0.20) + (impact × 0.20)`
- **Section names (plain language):** YOUR IDEA / YOUR SCORE / WHO YOU HELP / IS THIS A REAL PROBLEM? / YOUR STRENGTHS / WHAT IS IN YOUR WAY / CAN YOU START WITH NOTHING? / YOUR FIRST 14 DAYS
- **No jargon in output** — no "Hofstede", "FAD", "SDG numbers", "proof-of-work", "bootstrapper"
- **No hollow encouragement** — no "you're closer than you think", no "Ship it"
- **No trademarked language** — no "Harvard", "Shark Tank", "Y Combinator"

## Known Issues

- Cultural profiles only for 10 countries (rest have Hofstede scores only)
- Funding pathways hardcoded for 10 countries
- Scoring is heuristic, not calibrated against real outcomes
- Case study matching can match irrelevant studies
- Single-sentence input parsing doesn't extract problem/goal (shows "you did not describe this")
- Expert wireframes documented but not yet implemented (collapsible sections, shareable card, mobile optimization)

## How to Run

```bash
# CLI
python3 evaluator.py "your idea here"

# Server
python3 server.py
# Open http://localhost:8080
```

---

*Auto-maintained by Claude*
