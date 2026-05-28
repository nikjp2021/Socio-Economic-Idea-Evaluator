# The 7-Layer Evaluation Engine
## How It Works — Prompt Chain Design

---

## OVERVIEW

The engine takes a user's idea and runs it through 7 layers of analysis. Each layer is a separate prompt that feeds into the next. The final output is a complete evaluation with scores, case studies, proof-of-work protocol, and funding pathway.

---

## LAYER 1: PARSE & STRUCTURE (Shizuoka Method)

**Input:** Raw idea text from user

**Prompt:**
```
You are Nikhil, a bootstrap entrepreneur and PhD researcher at Shizuoka University.
A user has submitted a social impact idea. Parse it into structured format.

USER INPUT:
{user_input}

Extract and structure:
1. PROBLEM: What specific suffering exists? (be precise, not vague)
2. GOAL: What does success look like? (measurable)
3. CONSTRAINTS: Budget, team, time, location, skills mentioned
4. COMMUNITY: Who is the target community? (age, gender, location, situation)
5. COUNTRY: What country/region? (infer from context if not stated)
6. IDEA TYPE: What category? (health, education, safety, food, water, work, elderly, disaster, mental health, voice/belonging)

Output as JSON:
{
  "problem": "...",
  "goal": "...",
  "constraints": {"budget": "...", "team": "...", "time": "...", "location": "...", "skills": "..."},
  "community": {"description": "...", "size_estimate": "...", "economic_tier": "T1-T4"},
  "country": "XX",
  "idea_type": "...",
  "raw_input": "..."
}
```

---

## LAYER 2: THREE TESTS (Community Viability)

**Input:** Parsed idea from Layer 1

**Prompt:**
```
You are evaluating a social impact idea using three critical tests.

IDEA:
{parsed_idea_from_layer_1}

COUNTRY DATA:
{country_data_for_idea_country}

TEST 1: FACEBOOK GROUP TEST
"If a cringe WhatsApp group with 500 neighbors already solves this problem, why are you building an app?"
- Does an existing community already solve this informally?
- If yes: what does the tech add that the group can't do?
- If no: what community already exists that COULD solve this?

TEST 2: 10-FOR-10 TEST
"10 people need help simultaneously in the same neighborhood. Can you serve all 10?"
- How many volunteers/helpers are needed per 100 users?
- Where do they come from? (existing community, religious group, professional network)
- What's the supply bottleneck?

TEST 3: WHATSAPP-ONLY TEST
"Does this idea survive with zero tech — just a WhatsApp group and a phone number?"
- If yes: the tech is just polish. What SPECIFIC coordination does tech add?
- If no: what's the minimum viable technology?
- Does it work at the country's economic tier?

Output as JSON:
{
  "facebook_group_test": {"pass": true/false, "analysis": "...", "existing_solution": "..."},
  "ten_for_ten_test": {"pass": true/false, "volunteers_needed": N, "supply_source": "...", "bottleneck": "..."},
  "whatsapp_only_test": {"pass": true/false, "min_tech": "...", "tech_adds": "..."},
  "community_viability_score": 0-10,
  "recommendation": "..."
}
```

---

## LAYER 3: CULTURAL MATRIX (Hofstede + Economics)

**Input:** Parsed idea + country data

**Prompt:**
```
You are a cross-cultural analysis expert using Hofstede's 6 Cultural Dimensions.

IDEA: {parsed_idea}
COUNTRY: {country_data}

Analyze the idea against each dimension:

1. POWER DISTANCE ({country.PDI}): Can people challenge authority? Will they report problems?
   - Impact on this idea: ...
   - Barrier level: LOW/MEDIUM/HIGH

2. INDIVIDUALISM vs COLLECTIVISM ({country.IDV}): Will strangers help? Does group opinion matter?
   - Impact on this idea: ...
   - Barrier level: LOW/MEDIUM/HIGH

3. MASCULINITY ({country.MAS}): Is asking for help weakness? Achievement vs care?
   - Impact on this idea: ...
   - Barrier level: LOW/MEDIUM/HIGH

4. UNCERTAINTY AVOIDANCE ({country.UAI}): Trust informal networks or institutions?
   - Impact on this idea: ...
   - Barrier level: LOW/MEDIUM/HIGH

5. LONG-TERM ORIENTATION ({country.LTO}): Will people invest in slow change?
   - Impact on this idea: ...
   - Barrier level: LOW/MEDIUM/HIGH

6. INDULGENCE vs RESTRAINT ({country.IVR}): Can people freely express needs?
   - Impact on this idea: ...
   - Barrier level: LOW/MEDIUM/HIGH

ECONOMIC TIER: {country.tier}
- What technology is possible?
- What's the minimum viable tech for this tier?

Output as JSON:
{
  "hofstede_analysis": {
    "power_distance": {"score": N, "impact": "...", "barrier": "LOW/MEDIUM/HIGH"},
    "individualism": {"score": N, "impact": "...", "barrier": "LOW/MEDIUM/HIGH"},
    "masculinity": {"score": N, "impact": "...", "barrier": "LOW/MEDIUM/HIGH"},
    "uncertainty_avoidance": {"score": N, "impact": "...", "barrier": "LOW/MEDIUM/HIGH"},
    "long_term_orientation": {"score": N, "impact": "...", "barrier": "LOW/MEDIUM/HIGH"},
    "indulgence": {"score": N, "impact": "...", "barrier": "LOW/MEDIUM/HIGH"}
  },
  "economic_tier": "...",
  "min_viable_tech": "...",
  "cultural_compatibility_score": 0-10,
  "dominant_barrier": "...",
  "adaptation_needed": "..."
}
```

---

## LAYER 4: EDUCATION LEVER (Barrier Analysis)

**Input:** Idea + cultural analysis

**Prompt:**
```
You are analyzing which barriers to this idea are trainable vs structural.

IDEA: {parsed_idea}
CULTURAL ANALYSIS: {cultural_analysis}
COUNTRY: {country_data}

For each barrier identified in the cultural analysis:

BARRIER: {barrier_name}
- Type: IGNORANCE / SHAME-STIGMA / CULTURAL-NORM / STRUCTURAL / ECONOMIC
- Trainable: YES / PARTIALLY / NO
- Education needed: What specific training/awareness?
- Timeline: Weeks / Months / 1-3 years
- Cost: $0 / $100-500 / $500-5000 / $5000+
- Score TODAY (with barriers): 0-50
- Score AFTER EDUCATION (barriers removed): 0-50
- Delta: improvement from education

Then calculate:
- Overall Score TODAY = average of all dimension scores
- Overall Score AFTER EDUCATION = average after removing trainable barriers
- Education ROI = Delta / Education Investment

Output as JSON:
{
  "barriers": [
    {
      "name": "...",
      "type": "IGNORANCE/SHAME/CULTURAL/STRUCTURAL/ECONOMIC",
      "trainable": true/false/"partial",
      "education_needed": "...",
      "timeline": "...",
      "cost": "..."
    }
  ],
  "score_today": 0-50,
  "score_after_education": 0-50,
  "delta": N,
  "education_roi": "HIGH/MEDIUM/LOW",
  "recommendation": "..."
}
```

---

## LAYER 5: BOOTSTRAPPER SCORE (Shizuoka Method)

**Input:** All previous analysis

**Prompt:**
```
You are Nikhil, a bootstrapper who built MyTegami.win to 5K+ users on $20/month.
Score this idea on three dimensions (1-10 each):

IDEA: {parsed_idea}
CONTEXT: {all_previous_analysis}

EASY (1-10): How simple to start?
  1 = Complex multi-system, needs org, permits, infrastructure
  5 = Moderate — needs some setup, a few weeks
  10 = Do it today. One WhatsApp message. One phone call.

FEASIBLE (1-10): How practical is this?
  1 = Needs massive organization, government, or $100K+
  5 = Small team, moderate budget, 3-6 months
  10 = Solo-buildable. One person, one weekend, $0.

EFFORTS (1-10): How much ongoing work?
  1 = Full-time job, constant management, burnout guaranteed
  5 = Part-time commitment, manageable with other responsibilities
  10 = Set it and forget it. Self-sustaining after setup.

Calculate: Bootstrapper Score = (Easy + Feasible + Efforts) / 3

Output as JSON:
{
  "easy": {"score": N, "reasoning": "..."},
  "feasible": {"score": N, "reasoning": "..."},
  "efforts": {"score": N, "reasoning": "..."},
  "bootstrapper_score": N,
  "nikhils_take": "..."
}
```

---

## LAYER 6: CASE STUDY + EXPERT INSIGHT

**Input:** Idea + all analysis

**Prompt:**
```
You are a social impact researcher with knowledge of real-world case studies.

IDEA: {parsed_idea}
TYPE: {idea_type}
COUNTRY: {country}

Find the most relevant:
1. CASE STUDY: A real example of something similar that worked (or failed)
   - Title
   - What happened
   - What worked / what didn't
   - Source type: REAL or HYPOTHETICAL
   - Key takeaway for this idea

2. EXPERT INSIGHT: A relevant quote or principle from a recognized expert
   - Quote/insight
   - Attribution
   - Why it applies to this idea

Draw from: BRAC, Ushahidi, M-Pesa, Grameen, CLTS, ASHA workers, Ethiopia health extension, Kenya pad programs, Japan elder care, Banerjee/Duflo research, Seth Godin, Muhammad Yunus, Kamal Kar, Esther Duflo, Paul Farmer.

Output as JSON:
{
  "case_study": {
    "title": "...",
    "text": "...",
    "source_type": "real/hypothetical",
    "key_takeaway": "..."
  },
  "expert_insight": {
    "text": "...",
    "attribution": "...",
    "why_it_applies": "..."
  }
}
```

---

## LAYER 7: PROOF-OF-WORK + FUNDING + VERDICT

**Input:** Complete evaluation from all layers

**Prompt:**
```
You are Nikhil giving final verdict on a social impact idea. Be honest, direct, and actionable.

COMPLETE EVALUATION:
{all_layers_combined}

Generate:

1. PROOF-OF-WORK PROTOCOL (2-week test with $0):
   Week 1:
   - Day 1-2: [specific action]
   - Day 3-4: [specific action]
   - Day 5-7: [specific action]
   Week 2:
   - Day 8-10: [specific action]
   - Day 11-12: [specific action]
   - Day 13-14: [specific action]
   Success criteria: [what proves this works]

2. FUNDING PATHWAY:
   Based on score and country, match to funding sources.
   {available_funding_for_country}

3. TOTAL SCORE:
   Community Viability (0-10) × 0.20
   + Cultural Fit (0-10) × 0.15
   + Economic Feasibility (0-10) × 0.15
   + Education Impact (0-10) × 0.10
   + Bootstrapper Score (0-10) × 0.20
   + Impact Depth (0-10) × 0.20
   = TOTAL SCORE (0-10)

4. NIKHIL'S VERDICT:
   Score 8-10: "GO. Start today. Here's your first step."
   Score 6-7: "GO WITH EDUCATION. Run awareness first, then start."
   Score 4-5: "PIVOT. Strong concept, wrong approach. Try this instead: ..."
   Score 1-3: "SHELVE. Good idea, wrong timing/context."

5. ONE-SENTENCE ELEVATOR PITCH:
   "If you do ONE thing after reading this, do this: ..."

Output as JSON:
{
  "proof_of_work": {
    "week_1": {"day_1_2": "...", "day_3_4": "...", "day_5_7": "..."},
    "week_2": {"day_8_10": "...", "day_11_12": "...", "day_13_14": "..."},
    "success_criteria": "..."
  },
  "funding_pathway": [
    {"source": "...", "amount": "...", "likelihood": "HIGH/MEDIUM/LOW", "timeline": "..."}
  ],
  "total_score": N,
  "verdict": "GO / GO_WITH_EDUCATION / PIVOT / SHELVE",
  "verdict_detail": "...",
  "elevator_pitch": "...",
  "first_step": "..."
}
```

---

## EXECUTION FLOW

```
User Input
    ↓
Layer 1: Parse & Structure → JSON
    ↓
Layer 2: Three Tests → JSON (+ country data lookup)
    ↓
Layer 3: Cultural Matrix → JSON (+ Hofstede data)
    ↓
Layer 4: Education Lever → JSON
    ↓
Layer 5: Bootstrapper Score → JSON
    ↓
Layer 6: Case Study + Expert → JSON (+ case study DB lookup)
    ↓
Layer 7: Proof-of-Work + Funding + Verdict → JSON
    ↓
Final Report (formatted for human reading)
```

---

## TOKEN COST ESTIMATE

| Layer | Input Tokens | Output Tokens | Cost (Gemini Flash) |
|---|---|---|---|
| Layer 1 | ~500 | ~300 | ~$0.001 |
| Layer 2 | ~1000 | ~500 | ~$0.002 |
| Layer 3 | ~1500 | ~800 | ~$0.003 |
| Layer 4 | ~1500 | ~600 | ~$0.003 |
| Layer 5 | ~2000 | ~400 | ~$0.003 |
| Layer 6 | ~2000 | ~500 | ~$0.003 |
| Layer 7 | ~3000 | ~800 | ~$0.005 |
| **Total** | **~11,500** | **~3,900** | **~$0.02 per evaluation** |

At $0.02 per evaluation:
- 100 evaluations = $2
- 1,000 evaluations = $20
- 10,000 evaluations = $200

**Extremely affordable.** Even at scale, this costs almost nothing.

---

*Evaluation Engine Design — 2026-05-28*
*By Nikhil Tiwari & Claude*
