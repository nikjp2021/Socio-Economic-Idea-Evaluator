# CHANGELOG — Socio-Economic Idea Evaluator

All notable changes to this project are documented here.

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
