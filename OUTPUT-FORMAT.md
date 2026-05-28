# Output Format Specification

## The Standard

Every evaluation output — CLI text, JSON API, and web UI — must follow this exact structure. No exceptions. If a section cannot be populated with real data, it must state why honestly. It must never be omitted or filled with placeholder text.

**Quality rule:** If the output is not good enough to print and frame, it's not good enough to ship. No half-baked sections. No "Inferred from context." No raw numbers without interpretation.

---

## Output Structure (8 Sections)

Every evaluation produces these 8 sections in this order:

```
1. YOUR IDEA               — Echo back what they said
2. YOUR SCORE              — Score + action
3. WHO YOU HELP            — What global goals this serves
4. IS THIS A REAL PROBLEM? — FAD risk + buzz signals
5. YOUR STRENGTHS          — Strengths (community + cultural)
6. WHAT IS IN YOUR WAY     — Barriers with practical workarounds
7. CAN YOU START WITH NOTHING? — Can you start with $0?
8. YOUR FIRST 14 DAYS      — Day-by-day proof of work
```

---

## Section 1: YOUR IDEA

**Purpose:** Echo back the user's idea in structured form. This confirms the evaluator understood them correctly.

**Fields:**
- Problem — their words, cleaned up but not rewritten
- Goal — their words, cleaned up but not rewritten
- Country — detected name + code
- Budget — extracted amount or "Not specified"
- Constraints — team size, time, tools (or "Not specified")

**Rules:**
- NEVER output "Inferred from context." If the user didn't specify a field, say "Not specified" and note that the evaluation has limited information for this dimension.
- If the user's input is a single sentence, extract what you can and mark the rest as "Not specified."
- The Problem and Goal fields must use the user's actual words, not a summary.

**Format (CLI):**
```
YOUR IDEA
  Problem:    [user's words]
  Goal:       [user's words]
  Country:    [name] ([code])
  Budget:     [amount or "Not specified"]
  Constraints: [details or "Not specified"]
```

**Format (JSON):**
```json
{
  "problem": "string — user's words",
  "goal": "string — user's words",
  "country": "string — detected name",
  "country_code": "string — ISO code",
  "budget": "string — extracted amount or null",
  "constraints": "string — details or null"
}
```

---

## Section 2: YOUR SCORE

**Purpose:** The single most important section. Score, verdict, and a personalized explanation.

**Fields:**
- Total Score (X/10)
- Verdict (GO / GO WITH EDUCATION / PIVOT / SHELVE)
- Verdict Detail (personalized paragraph)

**Rules:**
- The score must be a single number with one decimal (e.g., 7.8, not 7.83).
- The verdict must be one of exactly four values: GO, GO WITH EDUCATION, PIVOT, SHELVE.
- The verdict detail must use the user's own words (from their input). It must reference specific barriers, specific scores, and specific next steps. No generic language.
- NEVER say "this will succeed." Say "this is worth testing" (GO) or "this needs work before testing" (PIVOT).
- The tone is a co-founder briefing, not an academic assessment.

**Verdict tone by score:**
- **8+:** "This is ready to test. Stop planning. Here's Day 1."
- **6–7.9:** "You're close. One thing is holding you back. Fix it, then test."
- **4–5.9:** "The idea is good. The approach needs to change. Here's what to try instead."
- **Below 4:** "This is hard. But here's someone who did harder. Here's what to learn from them."

**Format (CLI):**
```
YOUR SCORE
  Score: X.X/10
  Verdict: [VERDICT]
  [Personalized paragraph — 3-5 sentences, uses user's words, references specific barriers and scores]
```

**Format (JSON):**
```json
{
  "total_score": 7.8,
  "verdict": "GO_WITH_EDUCATION",
  "verdict_detail": "string — personalized paragraph"
}
```

---

## Section 3: WHO YOU HELP

**Purpose:** Connect the idea to global impact frameworks. Shows the user their idea matters beyond their community.

**Fields:**
- Primary SDG (name + number + specific target)
- Secondary SDG (name + number + specific target, if applicable)
- Impact Score (X/100)
- Impact Interpretation (one sentence)

**Rules:**
- Every idea must map to at least one SDG. The mapping is based on idea type, not guesswork.
- The specific target must be cited (e.g., "Target 3.8: Universal health coverage," not just "SDG 3").
- The impact score formula: `(sdg_weight × 10) × cultural_fit × (estimated_reach / 1000) × 10`, capped at 100.
- The interpretation must be honest: "If you serve 100 people, here's your estimated impact" — not "you will change the world."
- If the idea type doesn't map cleanly to an SDG, say so. Don't force a connection.

**SDG Mapping (by idea type):**

| Idea Type | Primary SDG | Target | Secondary SDG | Target |
|---|---|---|---|---|
| health | SDG 3 | 3.8 Universal health coverage | SDG 1 | 1.3 Social protection |
| education | SDG 4 | 4.6 Literacy | SDG 10 | 10.2 Social inclusion |
| women | SDG 5 | 5.5 Women's leadership | SDG 3 | 3.7 Reproductive health |
| food | SDG 2 | 2.1 End hunger | SDG 3 | 3.9 Safe food |
| water | SDG 6 | 6.1 Safe drinking water | SDG 3 | 3.9 Safe water |
| safety | SDG 16 | 16.1 Reduce violence | SDG 5 | 5.2 End violence |
| elderly | SDG 3 | 3.8 Universal health coverage | SDG 10 | 10.2 Social inclusion |
| mental_health | SDG 3 | 3.4 Mental health | SDG 10 | 10.2 Social inclusion |
| work | SDG 8 | 8.5 Full employment | SDG 4 | 4.4 Skills |
| financial | SDG 8 | 8.10 Financial access | SDG 1 | 1.4 Equal rights |
| disaster | SDG 13 | 13.1 Climate resilience | SDG 11 | 11.5 Reduce deaths |
| community | SDG 11 | 11.4 Cultural heritage | SDG 16 | 16.7 Inclusive decisions |

**Format (CLI):**
```
YOUR SDG IMPACT
  Primary: SDG [N] — [Name] | Target [N.N]: [Description]
  Secondary: SDG [N] — [Name] | Target [N.N]: [Description]
  Impact Score: [X]/100
  [One sentence: what this means in practical terms]
```

**Format (JSON):**
```json
{
  "primary_sdg": {"number": 5, "name": "Gender Equality", "target": "5.5", "target_desc": "Women's leadership"},
  "secondary_sdg": {"number": 3, "name": "Good Health", "target": "3.7", "target_desc": "Reproductive health"},
  "impact_score": 42,
  "impact_interpretation": "string — one sentence"
}
```

---

## Section 4: IS THIS A REAL PROBLEM?

**Purpose:** FAD and buzz signal detection. Checks whether the TOPIC AREA has momentum — not whether the exact idea exists.

**Fields:**
- Buzz Level (TRENDING / EMERGING / QUIET / SATURATED)
- Buzz Evidence (2-3 specific signals)
- FAD Risk (LOW / MEDIUM / HIGH)
- FAD Explanation (one sentence)
- What the Buzz Tells You (interpretation for the user)

**Rules:**
- Search the TOPIC, not the exact idea. "Sanitary pads in Bangladesh" → search "menstrual health South Asia," "period poverty."
- The buzz level classification:
  - **TRENDING** — Topic is in the news, getting funding, has cultural momentum. Tailwind.
  - **EMERGING** — Early signals, NGO activity, some media. You're early — advantage if you move fast.
  - **QUIET** — No buzz. Either ahead of the curve or the problem isn't on anyone's radar.
  - **SATURATED** — Lots of solutions already. Differentiation is critical.
- FAD risk by idea type:
  - LOW: health, food, water, elderly, safety, women, disaster, financial
  - MEDIUM: mental_health, work, community
- NEVER fabricate buzz signals. If you can't find data, say "We don't have enough data to assess buzz level for this topic in this country."
- The "What the Buzz Tells You" section must be actionable, not descriptive.

**Format (CLI):**
```
REALITY CHECK
  Buzz Level: [LEVEL]
  Evidence:
    - [Signal 1]
    - [Signal 2]
  FAD Risk: [LOW/MEDIUM/HIGH] — [one sentence explanation]
  What This Means: [2-3 sentences of actionable interpretation]
```

**Format (JSON):**
```json
{
  "buzz_level": "TRENDING",
  "buzz_evidence": ["string", "string"],
  "fad_risk": {"level": "LOW", "explanation": "string"},
  "interpretation": "string — actionable"
}
```

---

## Section 5: YOUR STRENGTHS

**Purpose:** Strengths. What's in the user's favor. Motivating without misleading.

**Fields:**
- Community Strengths (from the 3 tests that passed)
- Cultural Strengths (from Hofstede dimensions that are favorable)
- Bootstrapper Strengths (what makes this easy to start)

**Rules:**
- Only list things that are genuinely in the user's favor. Don't manufacture strengths.
- Each strength must be specific: "Bangladesh's low individualism (20) means community networks will spread this fast" — not "community support is important."
- If nothing is working, say so honestly — but frame it as "here's what you need to create" rather than "nothing is working."

**Format (CLI):**
```
WHAT'S WORKING FOR YOU
  Community:
    - [Strength 1 — specific, with data]
    - [Strength 2]
  Cultural:
    - [Strength 1 — specific, with Hofstede dimension and practical meaning]
  Bootstrapper:
    - [Strength 1]
```

**Format (JSON):**
```json
{
  "community_strengths": ["string"],
  "cultural_strengths": ["string"],
  "bootstrapper_strengths": ["string"]
}
```

---

## Section 6: WHAT IS IN YOUR WAY

**Purpose:** Barriers with practical workarounds. This is where the evaluator earns trust — by being honest AND helpful.

**Fields:**
- Barriers (list of 2-4 specific barriers)
- Each barrier: Name → Practical Meaning → Workaround → Trainable (YES/PARTIAL/NO)
- Education Lever: Score today / Score after education / Delta / ROI
- Gap to Score 8: What specific improvements would raise the score

**Rules:**
- NEVER output raw Hofstede numbers without interpretation. Not "Power Distance: 70." Instead: "People here don't challenge authority. Partner with the temple/mosque/church — they already have trust."
- Each barrier must have a practical workaround. "This is a problem" without "here's how to deal with it" is incomplete.
- The education lever must show the math: "Your score is X today. Training could add Y points. That's a Z% improvement."
- "Gap to Score 8" must be specific: "To reach 8/10, you need to [specific action]. That would add [X] points."

**Barrier conversion rules (Hofstede → Practical):**

| Dimension | High Score Means | Practical Translation | Workaround |
|---|---|---|---|
| PDI > 75 | Can't challenge authority | "People follow leaders. Get a leader on your side." | Partner with local authority figure |
| IDV > 60 | Low community obligation | "People look out for themselves. Make it personal." | Frame benefits individually, not collectively |
| MAS > 70 | Asking for help = weakness | "People won't admit they need help. Make it private." | Anonymous or discreet channels |
| UAI > 70 | Needs institutional trust | "People won't trust a stranger. Get endorsed." | Partner with a trusted institution |
| LTO < 40 | Needs quick wins | "People want results now. Show fast impact." | Start with a 2-week pilot, not a 2-year plan |
| IVR < 40 | Shame in expressing needs | "People won't ask for help publicly. Make it discreet." | Private channels, trusted intermediaries |

**Format (CLI):**
```
WHAT'S HOLDING YOU BACK
  Barriers:
    1. [Name]
       Practical meaning: [what this means for the user]
       Workaround: [specific action]
       Trainable: [YES/PARTIAL/NO] (timeline if YES)

  Education Lever:
    Score today:    [X]/50
    Score after:    [Y]/50
    Delta:          +[Z]
    ROI:            [HIGH/MEDIUM/LOW]

  Gap to Score 8:
    [Specific action that would add X points]
```

**Format (JSON):**
```json
{
  "barriers": [
    {
      "name": "string",
      "practical_meaning": "string",
      "workaround": "string",
      "trainable": true,
      "timeline": "string"
    }
  ],
  "education": {
    "score_today": 35,
    "score_after": 41,
    "delta": 6,
    "roi": "HIGH"
  },
  "gap_to_8": "string — specific action"
}
```

---

## Section 7: CAN YOU START WITH NOTHING?

**Purpose:** Can you start this with $0, a phone, and 3 friends?

**Fields:**
- Easy (X/10) — How simple to start
- Feasible (X/10) — How practical
- Efforts (X/10) — Ongoing work (10 = low effort)
- Bootstrapper Score (weighted average)
- Our Honest Opinion (one direct, opinionated line)
- Case Study (matched real-world example)

**Rules:**
- The scores must reflect real constraints. A 2-person team in a T3 economy with no budget should not score 9/10 on "Easy."
- Our Honest Opinion must be a direct, opinionated one-liner. Not a summary. Not a hedge. A take.
- The case study section must ALWAYS have content. If no exact match: use hypothetical mode. If no hypothetical: use novel mode. Never output "No matching case study found."
- Case study format: Title → What they did → What worked → What didn't → One key lesson → Expert quote.
- If the case study is hypothetical, it must be explicitly marked as such.

**Our Honest Opinion by tier:**
- T1: "Full tech stack available. Build an app if it adds real coordination."
- T2: "SMS and WhatsApp are your tools. Keep it simple. Keep it human."
- T3: "One shared phone. One WhatsApp group. One person coordinating. That's your entire product."
- T4: "Legs, loudspeakers, word of mouth. Technology is not the answer here. People are."

**Format (CLI):**
```
CAN YOU START WITH NOTHING?
  Easy:      [X]/10
  Feasible:  [X]/10
  Efforts:   [X]/10 (10 = low effort)
  Score:     [X]/10

  Our Honest Opinion: [one direct line]

  CASE STUDY [sourceType: real/hypothetical/novl]:
    [Title]
    [What they did — 2-3 sentences]
    What worked: [1-2 points]
    What didn't: [1-2 points]
    Key lesson: [one sentence]

    "[Expert quote]" — [Attribution]
```

**Format (JSON):**
```json
{
  "easy": {"score": 7, "reasoning": "string"},
  "feasible": {"score": 8, "reasoning": "string"},
  "efforts": {"score": 6, "reasoning": "string"},
  "bootstrapper_score": 7.0,
  "nikhils_take": "string — one direct line",
  "case_study": {
    "source_type": "real",
    "title": "string",
    "narrative": "string",
    "what_worked": ["string"],
    "what_didnt": ["string"],
    "key_lesson": "string",
    "expert_quote": "string",
    "expert_attribution": "string"
  }
}
```

---

## Section 8: YOUR FIRST 14 DAYS

**Purpose:** A day-by-day proof-of-work protocol. What to do, when, and how to measure success.

**Fields:**
- Week 1 (Day 1-2, Day 3-4, Day 5-7)
- Week 2 (Day 8-10, Day 11-12, Day 13-14)
- Success Criteria (measurable)
- Funding Pathway (matched to score level + country)
- First Step (one specific action for today)

**Rules:**
- Each day block must be a specific action, not a category. Not "Do research." Instead: "Find 3 women in Dhaka University hostels. Ask: 'How do you currently get sanitary pads?'"
- Success criteria must be measurable: "If 7 out of 10 people say 'I'd tell a friend about this' — you have proof."
- Funding pathway must be matched to the score level:
  - GO (8+): Full funding sources, application tips
  - GO WITH EDUCATION (6-7.9): Seed funding, incubators
  - PIVOT (4-5.9): Grants for prototyping, pitch competitions
  - SHELVE (<4): Research grants, academic partnerships
- Funding must also be country-specific (use the funding database).
- The first step must be something the user can do TODAY, not next week.

**Format (CLI):**
```
YOUR 2-WEEK PLAN
  Week 1:
    Day 1-2: [specific action]
    Day 3-4: [specific action]
    Day 5-7: [specific action]
  Week 2:
    Day 8-10: [specific action]
    Day 11-12: [specific action]
    Day 13-14: [specific action]
  Success: [measurable criteria]

  FUNDING PATHWAY
    - [Source]: [Amount] (Likelihood: [HIGH/MEDIUM/LOW])
    - [Source]: [Amount] (Likelihood: [HIGH/MEDIUM/LOW])

  FIRST STEP: [one action for today]
```

**Format (JSON):**
```json
{
  "proof_of_work": {
    "week_1": {
      "day_1_2": "string",
      "day_3_4": "string",
      "day_5_7": "string"
    },
    "week_2": {
      "day_8_10": "string",
      "day_11_12": "string",
      "day_13_14": "string"
    },
    "success_criteria": "string"
  },
  "funding": [
    {"source": "string", "amount": "string", "likelihood": "HIGH"}
  ],
  "first_step": "string — do this today"
}
```

---

## Footer

Every output ends with:

```
秩序と創造 — Order and Creation
By Nikhil Tiwari & Claude | [date]
```

---

## Scoring Formula

The total score is calculated as:

```
Total = (Community × 0.30) + (Cultural × 0.15) + (Education × 0.15)
      + (Bootstrapper × 0.20) + (Impact × 0.20)
```

Where:
- **Community** = average of 3 test scores (Facebook Group, 10-for-10, WhatsApp-Only)
- **Cultural** = `max(1, 10 - high_barriers × 2)` from 6 Hofstede dimensions
- **Education** = `score_today / 5` (normalized to 0-10 scale)
- **Bootstrapper** = weighted average of Easy, Feasible, Efforts
- **Impact** = from `calculate_impact_score()` (0-100, normalized to 0-10)

**Known bug (to be fixed):** The current code uses `community_score` twice (0.20 + 0.10), double-counting community viability. The second weight should be `education_score × 0.10` or removed entirely.

---

## Quality Checklist

Before shipping any output, verify:

- [ ] No "Inferred from context" anywhere
- [ ] No raw Hofstede numbers without practical interpretation
- [ ] No generic advice ("try harder," "do more research")
- [ ] Every barrier has a workaround
- [ ] Every verdict uses the user's own words
- [ ] Every case study has what worked AND what didn't
- [ ] Every score has a one-sentence interpretation
- [ ] Funding pathway is matched to score level, not just country
- [ ] First step is doable TODAY
- [ ] No trademarked language anywhere
- [ ] Tone is honest encouragement — motivating without misleading

---

*秩序と創造 — Order and Creation*
