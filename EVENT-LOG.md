# EVENT-LOG — Socio-Economic Evaluator

Decision & change log. Every significant decision is recorded here with both tech and business context. Updated after every session.

**Why this exists:** So you don't re-litigate decisions. Every "why did we do it this way?" is answered here. Every before/after change is documented. Read this before proposing changes.

---

### 2026-05-29 — Expert Reviews: PM, Marketing, UX/UI, Content Strategy

**What happened:** 4 expert agents reviewed the evaluator from different perspectives. All reviews converged on the same core problems: jargon, hollow encouragement, no shareable output, broken mobile experience.

**Tech (bugs found):**
- Single-sentence input parsing broken ("Problem: Not specified" on clear input)
- Raw Hofstede field names leak into output (`power_distance`, `masculinity`)
- Case study truncated mid-sentence ("more effect...")
- Reality Check section is a stub (2 lines, spec requires 5 fields)
- No shareable artifact (no badge, no link, no image)
- No mobile optimization (touch targets, lazy rendering)

**Business (positioning issues):**
- Hero title overpromises ("Your idea could change thousands of lives") — contradicts SHELVE verdicts
- "Nikhil's Take" naming — users don't know who Nikhil is, reads as ego
- "GO WITH EDUCATION" label is meaningless to non-English speakers
- "you're closer than you think" — hollow encouragement the playbook says to avoid
- Silicon Valley jargon for developing-country audience ("proof-of-work", "bootstrapper", "pitch")
- No "this is not" positioning statement
- Footer "By Nikhil Tiwari & Claude" kills institutional credibility

---

#### BEFORE → AFTER CHANGES (Expert-Recommended)

| Element | Before | After | Source |
|---|---|---|---|
| Hero title | "Your idea could change thousands of lives" | "Tell us your idea. We will be honest." | Content Strategist |
| Section 1 | "YOUR PITCH" | "YOUR IDEA" | Content Strategist |
| Section 2 | "THE VERDICT" | "YOUR SCORE" | Content Strategist |
| Section 3 | "YOUR SDG IMPACT" | "WHO YOU HELP" | Content Strategist |
| Section 4 | "REALITY CHECK" | "IS THIS A REAL PROBLEM?" | Content Strategist |
| Section 5 | "WHAT'S WORKING FOR YOU" | "YOUR STRENGTHS" | Content Strategist |
| Section 6 | "WHAT'S HOLDING YOU BACK" | "WHAT IS IN YOUR WAY" | Content Strategist |
| Section 7 | "BOOTSTRAPPER ASSESSMENT" | "CAN YOU START WITH NOTHING?" | Content Strategist |
| Section 8 | "YOUR 2-WEEK PLAN" | "YOUR FIRST 14 DAYS" | Content Strategist |
| Verdict label | "GO WITH EDUCATION" | "GOOD, BUT FIX ONE THING FIRST" | Content Strategist |
| "Nikhil's Take" | "Nikhil's Take" | "Our Honest Opinion" | Marketing + Content |
| Barrier display | "power_distance" | "People follow leaders" | PM + UX/UI |
| Case study | Truncated at 500 chars | No truncation, full text | PM |
| "Not specified" | "Not specified" | "(you did not describe this)" + note | Content Strategist |
| Hollow phrase | "you're closer than you think" | Removed, replaced with specific numbers | Marketing + Content |
| Hollow phrase | "3 points of upside waiting" | Removed, replaced with action | Content Strategist |
| SDG format | "SDG 5 — Gender Equality" | "Making life fairer for women and girls" | Content Strategist |
| FAD format | "FAD Risk: LOW" | "Is this a trend or a real problem? REAL PROBLEM" | Content Strategist |
| Funding labels | "Likelihood: MEDIUM" | "likely" / "possible" / "hard to get" | Content Strategist |
| Hero subtitle | "Tell us what you want to do..." | "Describe your idea in 5 questions..." | Content Strategist |
| "This is not" | (missing) | "This is not a guarantee. Not a business plan. Not a funding application." | Marketing + Content |
| Shareable output | (none) | 1080x1080 PNG + WhatsApp link + copy link | UX/UI |
| Mobile layout | Grid columns only | Full mobile-first, 48px touch targets, lazy rendering | UX/UI |
| Results page | Wall of text | Collapsible sections + sticky tab bar | UX/UI |
| 2-week plan | Read-only text | Interactive checkboxes with localStorage | UX/UI |

#### UX/UI Wireframes Delivered (for future implementation)

- **Desktop results page:** Score circle (140px) + verdict badge + quick summary + share buttons above fold. Collapsible sections below. Sticky tab bar for navigation.
- **Mobile layout (360px):** 8 screens wireframed — Verdict, Summary, Pitch, SDG, Barriers, Bootstrapper, Plan, Funding. 48px touch targets, single-column flow.
- **Shareable card:** 1080x1080 PNG with score circle, verdict, idea quote, SDG icons, first step. WhatsApp-friendly.
- **Input form:** Hero title fix, "this is not" box, verdict expectations preview, jargon-free field labels.
- **Performance:** Lazy rendering via IntersectionObserver, collapse all sections by default, reduce DOM size ~70%.

**Files:** `EVENT-LOG.md` (this entry), `evaluator.py` (rewrite in progress), `index.html` (pending), `OUTPUT-FORMAT.md` (pending update)

### 2026-05-29 — Content Strategy Implementation (Expert Review Fixes)

**Tech:**
- Rewrote `format_report()` with all 8 section names changed to plain language:
  - "YOUR PITCH" → "YOUR IDEA"
  - "THE VERDICT" → "YOUR SCORE: X out of 10"
  - "YOUR SDG IMPACT" → "WHO YOU HELP"
  - "REALITY CHECK" → "IS THIS A REAL PROBLEM?"
  - "WHAT'S WORKING FOR YOU" → "YOUR STRENGTHS"
  - "WHAT'S HOLDING YOU BACK" → "WHAT IS IN YOUR WAY"
  - "BOOTSTRAPPER ASSESSMENT" → "CAN YOU START WITH NOTHING?"
  - "YOUR 2-WEEK PLAN" → "YOUR FIRST 14 DAYS"
- Renamed "Nikhil's Take" → "Our Honest Opinion"
- Replaced verdict label "GO WITH EDUCATION" → "GOOD, BUT FIX ONE THING FIRST"
- Removed all hollow encouragement: "you're closer than you think", "3 points of upside waiting", "Ship it"
- Replaced raw barrier names with practical meaning (no more "power_distance" in output)
- Removed case study character truncation — full text now displayed
- Added plain language verdict labels: READY TO TEST, GOOD BUT FIX ONE THING FIRST, CHANGE YOUR APPROACH, HIGH BARRIERS RIGHT NOW
- Replaced "Likelihood: MEDIUM" with "likely" / "possible" / "hard to get"
- Added "Note" for single-sentence inputs explaining limited information
- Removed "By Nikhil Tiwari & Claude" from footer
- Updated `generate_personalized_verdict()` — all 4 verdict messages rewritten
- Updated elevator pitch templates — removed hollow phrases
- Updated hero title: "Your idea could change thousands of lives" → "Tell us your idea. We will be honest."
- Updated hero subtitle with concrete positioning
- Added "Good to know" box below hero (this is not a guarantee, not a business plan, not a funding application)
- Updated `OUTPUT-FORMAT.md` section headers to match new names

**Business:**
- Output now reads like a partner conversation, not an academic report
- Target audience (social entrepreneurs in India, Bangladesh, Kenya) can understand every word
- No Silicon Valley jargon (no "pitch", "bootstrapper", "proof-of-work", "FAD")
- Hero sets honest expectations before the tool runs
- "This is not" positioning prevents误解 about what the tool does
- Verdict labels tell the user what to DO, not just what the score IS

**Why:** 4 expert agents (PM, Marketing, UX/UI, Content Strategist) all identified the same problems: jargon, hollow encouragement, no shareable output, broken mobile experience. This implements the content strategy fixes. UI/UX wireframes are documented for future implementation.

**Files:** `evaluator.py` (MODIFIED: format_report, generate_personalized_verdict, elevator pitches), `index.html` (MODIFIED: hero title, subtitle, "this is not" box), `OUTPUT-FORMAT.md` (MODIFIED: section headers), `EVENT-LOG.md` (this entry)

### 2026-05-29 — Evaluator Output Rewrite (Phase 2 Implementation)

**Tech:**
- Fixed scoring formula: removed double-counting of community_score (was 0.20+0.10, now 0.30 single weight)
- Added `HOFSTEDE_ADVICE` dictionary — maps all 6 Hofstede dimensions × HIGH/LOW to practical meaning and workaround
- Added `get_funding_by_score()` — returns funding sources matched to score level (GO/GO_WITH_EDUCATION/PIVOT/SHELVE) + country
- Rewrote `format_report()` from 7-layer scorecard to 8-section format matching OUTPUT-FORMAT.md:
  - Section 1: YOUR PITCH (echo back user's input)
  - Section 2: THE VERDICT (score + personalized paragraph + elevator pitch)
  - Section 3: YOUR SDG IMPACT (primary + secondary SDG with specific targets)
  - Section 4: REALITY CHECK (FAD risk level + explanation)
  - Section 5: WHAT'S WORKING (community strengths, cultural strengths, bootstrapper strengths)
  - Section 6: WHAT'S HOLDING YOU BACK (barriers with practical advice, education lever, gap to score 8)
  - Section 7: BOOTSTRAPPER ASSESSMENT (easy/feasible/efforts, Nikhil's Take, case study)
  - Section 8: YOUR 2-WEEK PLAN (proof of work, score-aware funding, first step)
- Added dimension name mapping (lowercase → abbreviation) for HOFSTEDE_ADVICE lookup
- Fixed LTO/IVR advice inversion (low score = barrier for these dimensions)
- Added "farmers", "crop", "agriculture", "harvest", "famine" to food keyword detection
- Updated server.py, api/index.py, app.py JSON responses with practical_advice and funding_by_score

**Business:**
- Evaluator output now reads like a mentor conversation, not a scorecard
- Every barrier has a practical workaround — no raw numbers without interpretation
- Funding pathway adapts to score level (GO gets full funding sources, SHELVE gets research grants)
- SDG and FAD sections are now visible in CLI output (were computed but hidden)
- The "Not specified" label replaces "Inferred from context" — honest about missing data

**Why:** The OUTPUT-FORMAT.md spec defined the standard. The code now meets it. Half-baked output undermines credibility.

**Files:** `evaluator.py` (MODIFIED: scoring formula, HOFSTEDE_ADVICE, get_funding_by_score, format_report), `server.py` (MODIFIED: imports, practical_advice, funding_by_score), `api/index.py` (MODIFIED: same), `app.py` (MODIFIED: same)

### 2026-05-29 — Shizuoka Method Documentation & Output Format Spec

**Tech:**
- Created `SHIZUOKA-METHOD.md` — canonical definition of the Shizuoka Method (origin, 5 principles, V3 Framework, 7-layer pipeline, data foundation)
- Created `OUTPUT-FORMAT.md` — strict 8-section output format specification with exact CLI/JSON formats for each section
- Documented all 7 known bugs/inconsistencies in the current evaluator output:
  1. SDG, FAD Risk, Impact Score computed but never displayed in CLI output
  2. Layer 1 often produces "Inferred from context" (empty)
  3. Layer 3 outputs raw Hofstede numbers without practical interpretation
  4. Report reads like a scorecard, not a letter
  5. Case study section output varies dramatically by matching mode
  6. Scoring formula double-counts community score (0.20 + 0.10)
  7. Funding pathway not matched to score level
- Defined corrected scoring formula: `(Community × 0.30) + (Cultural × 0.15) + (Education × 0.15) + (Bootstrapper × 0.20) + (Impact × 0.20)`
- Created barrier conversion table (Hofstede → practical advice) for all 6 dimensions
- Created SDG mapping table for all 12 idea types with specific targets

**Business:**
- The Shizuoka Method now has a single canonical document — no more fragmented references across 6 files
- The output format is now a strict specification — every section has exact fields, rules, and quality standards
- Quality rule established: "If the output is not good enough to print and frame, it's not good enough to ship"
- This is docs + spec only — code changes to `format_report()` deferred to next session

**Why:** The evaluator's output had 7 inconsistencies between what the docs promised and what the code delivered. The Shizuoka Method was referenced everywhere but defined nowhere. Half-baked output undermines the product's credibility. These two documents establish the standard that the code must meet.

**Files:** `SHIZUOKA-METHOD.md` (CREATED), `OUTPUT-FORMAT.md` (CREATED)

---

### 2026-05-29 — Co-Founder Playbook & Language Cleanup

**Tech:**
- Created `COFOUNDER-PLAYBOOK.md` — documents how Claude amplifies the Maverick evaluator as co-founder and innovation lead
- Created `CLAUDE.md` — project instructions for Claude sessions (architecture, patterns, guidelines)
- Created `EVENT-LOG.md` — this file
- Fixed trademarked references in 6 files: `README.md`, `evaluator.py`, `index.html`, `EXPERIENCE-DESIGN.md`, `PRD-MVP.md`, `COFOUNDER-PLAYBOOK.md`
- "Virtual Shark Tank for Social Impact" → "A Rigorous Evaluator for Social Impact Ideas"
- "Harvard-level knowledge" → "Research-backed evaluation"

**Business:**
- Established language guidelines: never use trademarked brands (Shark Tank, Harvard, Y Combinator, Tesla, Uber) in system output
- Established tone rules: honest encouragement — motivate without misleading, never kill the spirit, never set false expectations
- Reframed Reality Check as FAD & Buzz Signal Detection (not problem validation)
- Defined 3-take diversity framework: Safe Bet / Growth Play / Bold Move

**Why:** The Maverick output (from .mht file) revealed the system's potential but also exposed issues: duplicate takes, context leakage in Reality Check, and risky branded language. These changes protect the project legally and improve output quality.

**Files:** `COFOUNDER-PLAYBOOK.md` (CREATED), `CLAUDE.md` (CREATED), `EVENT-LOG.md` (CREATED), `README.md` (MODIFIED), `evaluator.py` (MODIFIED), `index.html` (MODIFIED), `EXPERIENCE-DESIGN.md` (MODIFIED), `PRD-MVP.md` (MODIFIED)

---

### 2026-05-29 — Session 3: Vercel/Netlify Deployment + API Key Settings

**Tech:**
- Created `api/index.py` — Vercel Python serverless handler mirroring server.py
- Created `vercel.json` — routing: `/api/*` → Python function, `/*` → static
- Created `netlify.toml` — static hosting + API redirect to Vercel
- Created `.env.example` — documents `SERPER_API_KEY` and `PORT`
- Added settings gear in nav with API key modal (localStorage persistence)
- Fetch now sends `X-API-Key` header when key is set
- Guarded evaluator output write for serverless environments (try/except)
- Full README rewrite with deployment instructions

**Business:**
- Product is now deployable to production (Vercel + Netlify)
- API key infrastructure ready for Phase 2 web search integration
- GitHub repo live: https://github.com/nikjp2021/Socio-Economic-Idea-Evaluator

**Why:** MVP was local-only. Deployment makes it accessible to real users. API key settings prepare for Serper web search integration (richer case studies).

**Files:** `api/index.py` (CREATED), `vercel.json` (CREATED), `netlify.toml` (CREATED), `.env.example` (CREATED), `index.html` (MODIFIED), `server.py` (MODIFIED), `evaluator.py` (MODIFIED), `.gitignore` (MODIFIED), `README.md` (REWRITTEN)

---

### 2026-05-28 — Session 2: Personalized Elevator Pitch

**Tech:**
- Rewrote elevator pitch to use user's actual idea text (hook extraction with smart truncation)
- Four verdict templates now read as co-founder briefings
- Added `_input` field to server API response
- Frontend pitch display in verdict card (colored border by verdict type)
- Bug fixes: hook truncation mid-word, awkward barrier phrasing, comma-less sentence breaking

**Business:**
- The pitch is the signature feature — it makes the evaluation feel personal, not generic
- Users see their own words reflected back in a co-founder voice
- Differentiates from any other evaluation tool

**Why:** Generic pitches ("Your mental_health idea in Cambodia is ready...") don't feel personal. Using the user's own words creates emotional connection and trust.

**Files:** `evaluator.py` (MODIFIED), `server.py` (MODIFIED), `index.html` (MODIFIED), `CHANGELOG.md` (CREATED)

---

### 2026-05-28 — Session 1: MVP PRD, Bug Fix, Landing Page

**Tech:**
- Created `PRD-MVP.md` — full product requirements document
- Fixed critical bug: evaluator now loads `hofstede-database.json` (136 countries) instead of `countries.json` (10)
- Created `index.html` — 1320-line landing page with client-side evaluator
- Added `load_country_data()` function that merges Hofstede database with cultural profiles

**Business:**
- The evaluator now works for 136 countries instead of 10 — massive scope expansion
- Landing page makes the product real and shareable
- PRD defines the MVP scope and prevents scope creep

**Why:** The bug was critical — any country not in the 10-country list defaulted to "Unknown" with scores of 50. Cambodia, Brazil, and dozens of other countries were broken.

**Files:** `PRD-MVP.md` (CREATED), `evaluator.py` (MODIFIED), `index.html` (CREATED), `SESSION-LOG-2026-05-28.md` (CREATED)

---

*Event log maintained by Nikhil Tiwari & Claude*
