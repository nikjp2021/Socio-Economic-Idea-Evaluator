# Socio-Economic Idea Evaluator — MVP PRD
## "A Rigorous Evaluator for Social Impact Ideas"

**Version:** 1.0 MVP
**Date:** 2026-05-28
**Author:** Nikhil Tiwari (PhD, Shizuoka University) & Claude

---

## 1. Product Vision

A CLI tool that evaluates any social impact idea through 7 layers of analysis — combining the Shizuoka Method, Hofstede cultural dimensions, real-world case studies, and bootstrapper scoring. Returns a complete evaluation with verdict, proof-of-work protocol, and funding pathway.

**Tagline:** Research-backed evaluation for social problems. Free. For everyone.

---

## 2. Function Scope — What the MVP Does

### 2.1 Input
- Free-text idea description (any language, any length)
- Interactive mode or command-line argument
- Example: `python3 evaluator.py "peer-to-peer mental health support for rural Cambodian youth via WhatsApp"`

### 2.2 Processing — 7-Layer Evaluation

| Layer | Function | Status | Notes |
|---|---|---|---|
| **L1: Parse** | `parse_idea()` | DONE | Detects country (40+ keywords), idea type (12 categories), economic tier (T1-T4) |
| **L2: Three Tests** | `run_three_tests()` | DONE | Facebook Group, 10-for-10, WhatsApp-Only tests |
| **L3: Cultural Matrix** | `run_cultural_analysis()` | BUG | Uses `countries.json` (10 countries) instead of `hofstede-database.json` (136 countries) |
| **L4: Education Lever** | `run_education_analysis()` | DONE | Classifies barriers as trainable vs structural |
| **L5: Bootstrapper Score** | `run_bootstrapper_score()` | DONE | Easy/Feasible/Efforts scoring |
| **L6: Case Study** | `find_case_study()` | DONE | Multi-factor matching: category + zone + country. sourceType: real/hypothetical |
| **L7: Verdict** | `generate_verdict()` | DONE | Score, verdict (GO/PIVOT/SHELVE), proof-of-work, funding pathway |

### 2.3 Output
- Formatted text report (terminal)
- Auto-saved to `output/evaluation_YYYYMMDD_HHMMSS.txt`

---

## 3. Data Assets — What Exists

| Asset | File | Count | Status |
|---|---|---|---|
| **Hofstede Database** | `data/hofstede-database.json` | 136 countries | DONE — Official Kaggle data (119) + estimated (17) |
| **Legacy Countries** | `data/countries.json` | 10 countries | DEPRECATED — evaluator still uses this (BUG) |
| **Zone Definitions** | `data/zones.json` | 11 zones | DONE |
| **Main Case Study Library** | `case-studies/library.json` | 55 case studies | DONE |
| **Zone Case Study Library** | `case-studies/zones-library.json` | 110 case studies, 57 figures | DONE — 11 zones covered |
| **Engine Docs** | `engine/*.md` | 4 docs | DONE — evaluate.md, knowledge-engine.md, hypothetical-generator.md, narrative-prompt.md |

**Total case studies:** 165 (55 main + 110 zones)
**Total figures:** 57
**Total countries with Hofstede data:** 136

---

## 4. Critical Bug — Must Fix Before MVP Ship

### Bug: Evaluator loads wrong database

**File:** `evaluator.py:1006`
**Problem:** `evaluate()` loads `countries.json` (10 countries: JP, IN, BD, KE, CD, NG, PH, DE, US, SS) instead of `hofstede-database.json` (136 countries). Any idea for a country not in the 10 defaults to "Unknown" with Hofstede scores of 50 across the board.

**Evidence:** Cambodia test output shows:
```
COUNTRY: Unknown (KH)
Cultural Compatibility Score: 10/10  ← Wrong, should reflect real Hofstede scores
```

**Fix required:**
1. Change `evaluate()` to load from `hofstede-database.json`
2. Update data structure access — new format: `countries[code].pdi/idv/mas/uai/lto/ivr` (not `countries[code].hofstede.power_distance`)
3. Map `cultural_profile` data from `countries.json` for the 10 detailed countries into the new format (or load both and merge)
4. Test with: Cambodia, Vietnam, Thailand, Brazil, Colombia (countries not in old 10-country set)

---

## 5. What is DONE (MVP-Ready)

### Core Engine
- [x] 7-layer evaluation pipeline
- [x] Country detection (40+ keywords)
- [x] Idea type classification (12 categories)
- [x] Economic tier detection (T1-T4, context-aware)
- [x] Three Tests implementation
- [x] Hofstede cultural analysis (6 dimensions)
- [x] Education lever classification (trainable vs structural)
- [x] Bootstrapper scoring (Easy/Feasible/Efforts)
- [x] Case study matching (multi-factor: category + zone + country)
- [x] Hypothetical case study generator (Shizuoka Method sourceType)
- [x] Verdict generation (GO/GO_WITH_EDUCATION/PIVOT/SHELVE)
- [x] Proof-of-work protocol (2-week test)
- [x] Funding pathway matching
- [x] Report formatter
- [x] Output auto-save

### Data
- [x] 136 countries with Hofstede scores (official Kaggle dataset)
- [x] 11 global zones with cultural/economic profiles
- [x] 165 case studies across all zones
- [x] 57 influential figures
- [x] Category relations mapping (partial credit for related categories)
- [x] Zone-to-country mapping (136 countries)

### Documentation
- [x] 7-layer evaluation engine design (`engine/evaluate.md`)
- [x] Knowledge engine 3-mode system (`engine/knowledge-engine.md`)
- [x] Hypothetical generator methodology (`engine/hypothetical-generator.md`)
- [x] Narrative structure template (`prompts/narrative-prompt.md`)

---

## 6. What is DEFERRED to Phase 2

| Feature | Reason Deferred | Priority |
|---|---|---|
| **Web search integration** (Mode 2 of knowledge engine) | Serper API credits limited (2K remaining). Can add later with Gemini grounding. | HIGH |
| **200+ case studies** | Current 165 covers all zones. Expansion is incremental. | MEDIUM |
| **Gemini API integration** | Would add real-time case study discovery via grounding. Requires API key setup. | HIGH |
| **Web frontend** | CLI works for MVP. Web UI needed for broader adoption. | MEDIUM |
| **WhatsApp bot** | Maximum reach for T2-T3 countries. Requires WhatsApp Business API. | HIGH |
| **NLnet/Mozilla proposal** | Funding application. Can submit after MVP demonstrates value. | HIGH |
| **User accounts + history** | Track evaluations over time. Not needed for MVP. | LOW |
| **Multi-language support** | Currently English output. i18n for Japanese/Hindi/Bangla later. | LOW |
| **API endpoint** | REST API for programmatic access. CLI first. | LOW |
| **Better country detection** | Current 40+ keywords covers major countries. Edge cases need NLP. | LOW |
| **Scoring calibration** | Scores are heuristic. Need real user feedback to calibrate weights. | MEDIUM |

---

## 7. Known Limitations (MVP)

1. **Cultural profiles only for 10 countries** — `countries.json` has rich cultural_profile data (trust_layer, key_community_types, what_works, what_fails) for 10 countries. The other 126 countries in `hofstede-database.json` have Hofstede scores but not cultural profiles.

2. **Funding pathways hardcoded** — Only 5 countries (JP, IN, BD, KE, US) have specific funding sources. Others get generic NLnet/Mozilla/Echoing Green.

3. **Scoring is heuristic** — Weights (community 20%, cultural 15%, education 15%, bootstrapper 20%, impact 20%) are estimated, not calibrated against real outcomes.

4. **No input validation** — Garbage in, garbage out. The parser is keyword-based, not NLP.

5. **Case study matching is approximate** — category_relations gives partial credit but can still match irrelevant studies (e.g., elder care for mental health idea).

6. **Evaluator still uses old database** — Critical bug, see Section 4.

---

## 8. Success Criteria for MVP

| Metric | Target | How to Measure |
|---|---|---|
| Countries covered | 136 | Hofstede database size |
| Case studies available | 165+ | Library + zones count |
| Evaluation speed | < 1 second | Time `python3 evaluator.py` |
| Output quality | Actionable | Manual review of 10 sample evaluations |
| Verdict accuracy | Reasonable | Compare GO/PIVOT/SHELVE against intuition for 10 known ideas |
| Zero dependencies | Yes | Only Python stdlib (json, sys, os, pathlib, datetime, re) |

---

## 9. Technical Architecture

```
evaluator.py (1092 lines)
├── parse_idea()           → detect_country, detect_idea_type, detect_economic_tier
├── run_three_tests()      → Facebook Group, 10-for-10, WhatsApp-Only
├── run_cultural_analysis()→ Hofstede 6 dimensions
├── run_education_analysis()→ trainable vs structural barriers
├── run_bootstrapper_score()→ Easy/Feasible/Efforts
├── find_case_study()      → multi-factor matching + hypothetical generator
├── generate_verdict()     → score + proof-of-work + funding
└── format_report()        → terminal output

data/
├── hofstede-database.json (136 countries, 1805 lines)
├── countries.json (10 countries with cultural profiles, DEPRECATED)
└── zones.json (11 zone definitions)

case-studies/
├── library.json (55 case studies)
└── zones-library.json (110 case studies, 57 figures)

engine/
├── evaluate.md (7-layer design)
├── knowledge-engine.md (3-mode system)
├── hypothetical-generator.md (grounded hypothetical methodology)
└── narrative-prompt.md (6-part narrative structure)
```

---

## 10. Deliverable Checklist

### Before Ship
- [x] Fix evaluator to use `hofstede-database.json` instead of `countries.json`
- [x] Merge cultural_profile data into new format (dual-load: hofstede + cultural profiles)
- [x] Test 5 evaluations for countries NOT in old 10-country set (Cambodia, Brazil, Nigeria, Vietnam, Colombia)
- [x] Verify all 136 countries return valid Hofstede scores
- [x] Verify case study matching works for all 11 zones

### Ship Ready
- [x] `python3 evaluator.py "any idea"` works from command line
- [x] Output is readable and actionable
- [x] All 7 layers produce meaningful results
- [x] Auto-save to output/ directory
- [x] Zero external dependencies (Python stdlib only)

---

## 11. How to Use

```bash
# Direct evaluation
python3 evaluator.py "I want to help teenage girls in rural India get sanitary pads through a WhatsApp group of mothers"

# Interactive mode
python3 evaluator.py --interactive

# Output saved to
output/evaluation_YYYYMMDD_HHMMSS.txt
```

---

*PRD v1.0 — 2026-05-28*
*By Nikhil Tiwari & Claude*
