# MEMORY — Socio-Economic Evaluator

Project memory for Claude sessions. Updated each session.

---

## Last Updated: 2026-05-28 (Session 2)

## Project State

- **Location:** `/home/nikhil/socio-economic-evaluator/`
- **Type:** Python CLI tool + web frontend (zero dependencies, stdlib only)
- **Purpose:** 7-layer social impact idea evaluator (Parse → Three Tests → Cultural Matrix → Education Lever → Bootstrapper Score → Case Study → Verdict)
- **Data:** 136 countries (Hofstede), 165 case studies, 57 figures, 11 zones
- **Status:** MVP complete, 2 sessions of work done

## Key Files

| File | Lines | Purpose |
|---|---|---|
| evaluator.py | ~1375 | Full 7-layer evaluation pipeline |
| server.py | 177 | HTTP server, `/api/eval` JSON endpoint |
| index.html | ~1320 | Landing page + client-side evaluator |
| PRD-MVP.md | ~228 | Product requirements document |
| CHANGELOG.md | ~150 | Change history across sessions |
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
