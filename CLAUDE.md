# CLAUDE.md — Socio-Economic Evaluator Project

## START HERE — Read These Files First

When entering this project, read these files in this order before doing anything else. They will tell you what happened, what was decided, and what the current state is.

**Priority 1 — Understand the project (read in order):**
1. `CLAUDE.md` — this file. Project overview, architecture, patterns, rules.
2. `MEMORY.md` — session history. What was done in each session, known issues, current state.
3. `EVENT-LOG.md` — decision log. Every significant decision with tech + business context and before/after changes.

**Priority 2 — Understand the methodology (read as needed):**
4. `SHIZUOKA-METHOD.md` — the Shizuoka Method. Origin, 5 principles, V3 Framework, 7-layer pipeline.
5. `OUTPUT-FORMAT.md` — the 8-section output spec. What the evaluator must produce.
6. `COFOUNDER-PLAYBOOK.md` — how Claude amplifies the system as co-founder.

**Priority 3 — Understand the code (read when making changes):**
7. `evaluator.py` — the 7-layer evaluation engine. Start with `format_report()` (the output formatter).
8. `index.html` — the landing page. Start with the hero section and `renderResult()` function.
9. `server.py` / `api/index.py` / `app.py` — the API layer. All three serve the same pipeline.

**Why this order:** MEMORY.md and EVENT-LOG.md contain the context that prevents you from repeating mistakes or re-litigating decisions. Read them before touching any code.

---

## Project Overview

The Socio-Economic Evaluator is a "Virtual Evaluator for Social Impact Ideas" — a tool that evaluates social enterprise ideas through 7 layers of analysis, scoring them against 136 countries, 165 real-world case studies, and the UN Sustainable Development Goals.

**Built by:** Nikhil Tiwari (PhD researcher, Shizuoka University, Nagayoshi Lab) & Claude (Anthropic).

**Philosophy:** "Order and Creation" (秩序と創造) — the user brings structured input (the Order), the engine brings evaluation and insight (the Creation).

## Directory Structure

```
socio-economic-evaluator/
├── evaluator.py              # 7-layer evaluation engine (1433 lines)
├── server.py                 # Local dev server (stdlib HTTP)
├── app.py                    # Flask wrapper for Render deployment
├── index.html                # Landing page + client-side evaluator
├── api/
│   └── index.py              # Vercel serverless handler
├── netlify/
│   └── functions/
│       └── gemini-eval.mjs   # Netlify function (Gemini Flash alternative)
├── data/
│   ├── hofstede-database.json   # 136 countries with Hofstede scores
│   ├── countries.json           # 10 countries with rich cultural profiles
│   └── zones.json               # 10 global zones
├── case-studies/
│   ├── library.json             # 55 case studies (flat structure)
│   └── zones-library.json       # 110 zone-based case studies + 57 figures
├── engine/
│   ├── evaluate.md              # 7-layer prompt chain design
│   ├── knowledge-engine.md      # Case study matching system docs
│   └── hypothetical-generator.md # Hypothetical case study spec
├── prompts/
│   └── narrative-prompt.md      # 6-part narrative structure for storytelling
├── templates/                   # (empty — reserved)
├── output/                      # Evaluation output files (timestamped)
├── COFOUNDER-PLAYBOOK.md        # How Claude amplifies the system
├── SHIZUOKA-METHOD.md           # Canonical definition of the Shizuoka Method
├── OUTPUT-FORMAT.md             # Strict 8-section output format spec
├── CHANGELOG.md                 # Change history across sessions
├── MEMORY.md                    # Session memory for Claude
├── PRD-MVP.md                   # Product requirements document
├── EXPERIENCE-DESIGN.md         # Product vision & design system
├── INNOVATION-PLAN.md           # Strategic roadmap
├── README.md                    # Public-facing documentation
├── CLAUDE.md                    # This file — project instructions
├── EVENT-LOG.md                 # Decision & change log (tech + business)
├── vercel.json                  # Vercel deployment config
├── netlify.toml                 # Netlify deployment config
├── render.yaml                  # Render deployment config
├── requirements.txt             # flask, flask-cors
├── .env.example                 # SERPER_API_KEY, PORT
└── .gitignore                   # .env, .vercel/, .netlify/, __pycache__
```

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

## Key Architecture

### The 7-Layer Pipeline

```
User Input (5 fields)
    → parse_idea()              # Layer 1: country/type/tier detection
    → load_country_data()       # hofstede-database.json (136) + countries.json (10)
    → run_three_tests()         # Layer 2: Facebook/10-for-10/WhatsApp tests
    → run_cultural_analysis()   # Layer 3: 6 Hofstede dimensions
    → run_education_analysis()  # Layer 4: trainable vs structural barriers
    → run_bootstrapper_score()  # Layer 5: Easy/Feasible/Efforts + nikhils_take
    → find_case_study()         # Layer 6: 165 case studies, 3-mode matching
    → generate_verdict()        # Layer 7: score, verdict, pitch, proof-of-work, funding
    → map_to_sdgs() + assess_fad_risk() + calculate_impact_score()
    → format_report() / JSON response
```

### Three Server Entry Points (Same Pipeline)

| File | Platform | Port |
|---|---|---|
| `server.py` | Local dev (stdlib) | 8080 |
| `app.py` | Render (Flask) | PORT env |
| `api/index.py` | Vercel (serverless) | N/A |

### Key Functions in evaluator.py

| Function | Line | Purpose |
|---|---|---|
| `parse_idea()` | 27 | Parse raw text → structured idea |
| `detect_country()` | 50 | Keyword matching → ISO code |
| `detect_idea_type()` | 115 | Classify into 12 categories |
| `detect_economic_tier()` | 145 | Assign T1-T4 tier |
| `run_three_tests()` | 187 | Community viability tests |
| `run_cultural_analysis()` | 234 | 6 Hofstede dimensions |
| `run_education_analysis()` | 300 | Trainable vs structural barriers |
| `run_bootstrapper_score()` | 375 | Easy/Feasible/Efforts scoring |
| `find_case_study()` | 426 | 3-mode case study matching |
| `generate_verdict()` | 898 | Score, verdict, pitch, proof-of-work |
| `map_to_sdgs()` | 779 | UN SDG mapping |
| `calculate_impact_score()` | 852 | Impact scoring formula |
| `format_report()` | 1129 | Text report assembly |
| `evaluate()` | 1342 | Main pipeline orchestrator |

## Key Patterns

- **Country detection:** Keyword matching against 45 countries using city names, brand names, cultural references
- **Idea types:** 12 categories (women, safety, elderly, mental_health, disaster, health, food, water, financial, work, education, community)
- **Economic tiers:** T1 (developed) → T4 (extreme poverty), adjusted by context keywords
- **Verdict types:** GO / GO_WITH_EDUCATION / PIVOT / SHELVE (no spaces in enum values)
- **Case study matching:** 3-mode system (exact match → hypothetical grounded → novel)
- **Hook extraction:** Smart truncation at natural clause boundaries, max 100 chars
- **Scoring formula:** `(community × 0.30) + (cultural × 0.15) + (education × 0.15) + (bootstrapper × 0.20) + (impact × 0.20)`
- **Verdict labels (user-facing):** READY TO TEST / GOOD BUT FIX ONE THING FIRST / CHANGE YOUR APPROACH / HIGH BARRIERS RIGHT NOW
- **Output section names (plain language):** YOUR IDEA / YOUR SCORE / WHO YOU HELP / IS THIS A REAL PROBLEM? / YOUR STRENGTHS / WHAT IS IN YOUR WAY / CAN YOU START WITH NOTHING? / YOUR FIRST 14 DAYS
- **No jargon in output** — no "Hofstede", "FAD", "SDG numbers", "proof-of-work", "bootstrapper", "pitch"
- **No hollow encouragement** — no "you're closer than you think", no "Ship it", no "upside waiting"

## Canonical References

| Document | Purpose |
|---|---|
| `SHIZUOKA-METHOD.md` | The Shizuoka Method — origin, principles, V3 Framework, 7-layer pipeline |
| `OUTPUT-FORMAT.md` | Strict 8-section output format spec with quality checklist |
| `COFOUNDER-PLAYBOOK.md` | How Claude amplifies the system as co-founder |
| `INNOVATION-PLAN.md` | Strategic roadmap and business model |
| `EXPERIENCE-DESIGN.md` | Product vision and design system |
| `engine/evaluate.md` | 7-layer prompt chain design |
| `prompts/narrative-prompt.md` | 6-part narrative structure for storytelling |

When making changes to the evaluator output, consult `OUTPUT-FORMAT.md` first. It defines the standard the code must meet.

## Language Guidelines — CRITICAL

**Never use trademarked brands, institutions, or shows in system output.** This protects the project from legal risk.

| Never say | Why | Say instead |
|---|---|---|
| "Shark Tank" | Trademarked TV show | "A rigorous evaluation" |
| "Harvard-level" | Implies institutional affiliation | "Research-backed" |
| "Y Combinator for X" | Implies affiliation | "A structured path from idea to test" |
| "Tesla of X" | Trademarked brand | "A technology-first approach" |
| "Uber for Y" | Trademarked brand | "A platform connecting X with Y" |

**The rule:** Describe what the system DOES, not what it's LIKE. "We evaluate your idea through 7 layers" is safe. "We're the Shark Tank of social impact" is a lawsuit.

**When users make comparisons:** Their language is fine. The system itself never initiates brand comparisons.

## Tone — Honest Encouragement

The system must motivate without misleading.

1. **Never kill the spirit.** Even harsh feedback ends with a path forward.
2. **Never set false expectations.** GO means "worth testing," not "will succeed."
3. **Always show the path forward.** No dead ends. Every verdict has a next step.
4. **Be specific about uncertainty.** "We don't know" is better than a fake projection.
5. **Celebrate the attempt.** Describing an idea and seeking feedback is itself valuable.

## Data Assets

| Asset | Count | File |
|---|---|---|
| Countries (Hofstede) | 136 | `data/hofstede-database.json` |
| Countries (rich profiles) | 10 | `data/countries.json` |
| Global zones | 10 | `data/zones.json` |
| Case studies (flat) | 55 | `case-studies/library.json` |
| Case studies (zone-based) | 110 | `case-studies/zones-library.json` |
| Influential figures | 57 | `case-studies/zones-library.json` |

## Known Issues

- Cultural profiles only for 10 countries (rest have Hofstede scores only)
- Funding pathways hardcoded for 5 countries (JP, IN, BD, KE, US)
- Scoring is heuristic, not calibrated against real outcomes
- Case study matching can match irrelevant studies
- Reality Check has context leakage (analyzes wrong topic)

## Co-Founder Dynamic

**Nikhil** = Visionary + Domain Expert (PhD research, Shizuoka Method, cultural knowledge, final decisions)
**Claude** = Co-Founder + Innovation Lead (execution, code, pattern matching, tireless iteration)

Nikhil defines the "what" and "why." Claude builds the "how." Claude generates options; Nikhil decides.

---

## Decision & Change Log

Every significant decision is logged in `EVENT-LOG.md` with both tech and business context. Update that file after every session that changes the codebase, strategy, or direction.

Format:
```
### [DATE] — [DECISION TITLE]
**Tech:** What changed in code/architecture
**Business:** What changed in strategy/positioning/direction
**Why:** The reasoning behind the decision
**Files:** Which files were modified
```

---

*秩序と創造 — Order and Creation*
