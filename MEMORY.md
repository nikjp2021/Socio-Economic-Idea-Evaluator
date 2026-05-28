# MEMORY — Socio-Economic Evaluator

Project memory for Claude sessions. Updated each session.

---

## Last Updated: 2026-05-29 (Session 3)

## Project State

- **Location:** `/home/nikhil/socio-economic-evaluator/`
- **Type:** Python CLI tool + web frontend (zero dependencies, stdlib only)
- **Purpose:** 7-layer social impact idea evaluator (Parse → Three Tests → Cultural Matrix → Education Lever → Bootstrapper Score → Case Study → Verdict)
- **Data:** 136 countries (Hofstede), 165 case studies, 57 figures, 11 zones
- **Status:** MVP complete, 3 sessions of work done

## Key Files

| File | Lines | Purpose |
|---|---|---|
| evaluator.py | ~1390 | Full 7-layer evaluation pipeline |
| server.py | 180 | HTTP server, `/api/eval` JSON endpoint |
| api/index.py | 171 | Vercel serverless handler |
| index.html | ~1460 | Landing page + client-side evaluator + settings |
| vercel.json | 9 | Vercel deployment config |
| netlify.toml | 15 | Netlify deployment config |
| PRD-MVP.md | ~228 | Product requirements document |
| CHANGELOG.md | ~220 | Change history across sessions |
| SESSION-LOG-2026-05-28.md | ~170 | Session 1 detailed log |

## Session History

### Session 1 (2026-05-28) — MVP PRD, Bug Fix, Landing Page
- Created PRD-MVP.md
- Fixed critical bug: evaluator now loads hofstede-database.json (136 countries) instead of countries.json (10)
- Built 1320-line landing page with client-side evaluator

### Session 2 (2026-05-28) — Personalized Elevator Pitch
- Rewrote elevator pitch to use user's actual input text (hook extraction with smart truncation)
- Four verdict templates now read as co-founder briefings
- Added `_input` field to server API response
- Frontend pitch display in verdict card
- Bug fixes: hook truncation, barrier phrasing
- Created CHANGELOG.md

### Session 3 (2026-05-29) — Vercel/Netlify Deployment + API Key Settings
- Created api/index.py: Vercel Python serverless handler
- Created vercel.json and netlify.toml deployment configs
- Added settings gear in nav with API key modal (localStorage)
- Fetch now sends X-API-Key header when key is set
- Guarded evaluator output write for serverless environments
- Created .env.example documenting SERPER_API_KEY and PORT
- Rewrote README.md with deployment instructions
- Pushed to GitHub: https://github.com/nikjp2021/Socio-Economic-Idea-Evaluator

## Architecture Decisions

- **No frameworks** — vanilla JS, Python stdlib only
- **No build tools** — works from `file://` or `python3 -m http.server`
- **Dual database** — hofstede-database.json (136 countries) + countries.json (10 with cultural profiles)
- **Hook extraction** — smart truncation at natural clause boundaries (commas, conjunctions), max 100 chars
- **Verdict types:** GO / GO_WITH_EDUCATION / PIVOT / SHELVE (not GO WITH EDUCATION with spaces)

## Known Issues

- Cultural profiles only for 10 countries (rest have Hofstede scores only)
- Funding pathways hardcoded for 5 countries (JP, IN, BD, KE, US)
- Scoring is heuristic, not calibrated against real outcomes
- Case study matching can match irrelevant studies

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
