# Socio-Economic Idea Evaluator

**"Virtual Shark Tank for Social Impact"** — A 7-layer evaluation pipeline for social impact ideas. Combines the Shizuoka Method, Hofstede cultural dimensions (136 countries), 165 case studies, and bootstrapper scoring.

**Tagline:** Harvard knowledge for social problems. Free. For everyone.

---

## Quick Start

```bash
# CLI evaluation
python3 evaluator.py "peer-to-peer mental health support for rural Cambodian youth via WhatsApp"

# Interactive mode
python3 evaluator.py --interactive

# Web server
python3 server.py
# Open http://localhost:8080
```

---

## Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root
3. Set optional env vars in Vercel dashboard:
   - `SERPER_API_KEY` — for web search (Phase 2, get key at [serper.dev](https://serper.dev))

---

## Deploy to Netlify (static + Vercel API)

1. Deploy to Netlify with publish directory set to `.`
2. Update the Vercel URL in `netlify.toml` redirect rule
3. Or use Netlify UI redirect rules

---

## What It Does

| Layer | Function | What It Tests |
|---|---|---|
| L1: Parse | `parse_idea()` | Country, idea type, economic tier |
| L2: Three Tests | `run_three_tests()` | Facebook Group, 10-for-10, WhatsApp-Only |
| L3: Cultural Matrix | `run_cultural_analysis()` | 6 Hofstede dimensions |
| L4: Education Lever | `run_education_analysis()` | Trainable vs structural barriers |
| L5: Bootstrapper Score | `run_bootstrapper_score()` | Easy / Feasible / Efforts |
| L6: Case Study | `find_case_study()` | Multi-factor matching |
| L7: Verdict | `generate_verdict()` | GO / GO WITH EDUCATION / PIVOT / SHELVE |

---

## Data Assets

- **136 countries** with Hofstede cultural dimension scores
- **165 case studies** (55 main + 110 zone-based)
- **57 influential figures**
- **11 global zones** with cultural/economic profiles
- **Zero dependencies** — Python stdlib only

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SERPER_API_KEY` | No | Serper API key for web search (Phase 2) |
| `PORT` | No | Server port (default: 8080) |

For Vercel: set in dashboard under Settings > Environment Variables.
For local: create `.env` file (see `.env.example`).

---

## Project Structure

```
evaluator.py          # 7-layer evaluation engine
server.py             # HTTP server (local dev)
api/index.py          # Vercel serverless handler
index.html            # Landing page + client-side evaluator
vercel.json           # Vercel deployment config
netlify.toml          # Netlify deployment config
data/
  hofstede-database.json   # 136 countries
  countries.json           # 10 countries (detailed cultural profiles)
  zones.json               # 11 zones
case-studies/
  library.json             # 55 case studies
  zones-library.json       # 110 zone-based case studies
engine/                    # Design documentation
```

---

*By Nikhil Tiwari (PhD, Shizuoka University) & Claude*
