# Narrative Prompt Template
## How to Tell the Story of a Social Impact Idea

---

## THE NARRATIVE STRUCTURE

Every evaluation must include a narrative that makes the reader FEEL the idea, not just understand it. The narrative follows this structure:

### 1. THE HOOK (1 sentence)
Start with the human moment. Not the problem. Not the solution. The MOMENT.

**Good:**
> "A 14-year-old girl in Bihar misses school every month because she doesn't have a sanitary pad."

**Bad:**
> "Menstrual hygiene is a significant challenge in developing countries."

**Good:**
> "An 82-year-old woman in Shizuoka fell in her kitchen at 2am. She couldn't reach her phone. Nobody found her for 6 hours."

**Bad:**
> "Elderly isolation is a growing problem in Japan's aging society."

### 2. THE PROBLEM (2-3 sentences)
Expand from the hook. Make the reader understand the SCALE and the SPECIFICITY.

**Template:**
> "[Hook person] is not alone. [X million] people in [country/region] face [specific problem]. The existing solutions [don't work because]. The gap is [specific]."

### 3. THE IDEA (2-3 sentences)
Describe the idea as if explaining to a friend. Simple. Concrete. One sentence for what it is, one for how it works, one for why it's different.

**Template:**
> "[Idea name] is a [what it is] that [how it works]. Unlike [existing solution], it [key difference]. The community [already existing group] provides [what they provide]."

### 4. THE CASE STUDY (3-4 sentences)
Connect to a real organization that did something similar. Don't just cite — tell their story briefly.

**Template:**
> "[Organization name] proved this works. Founded in [year] by [founder], they [what they did]. The result: [specific numbers]. The key lesson: [one sentence insight]."

### 5. THE EXPERT WISDOM (1 sentence)
One quote from a relevant expert that reinforces the idea.

### 6. THE VERDICT (1-2 sentences)
Nikhil's honest assessment. Not generic praise. Specific, actionable, direct.

**Template:**
> "[Score]. [Go/Pivot/Shelf]. [One specific action to take today]."

---

## THE MANDATORY RULES

### Rule 1: SPECIFIC, NOT GENERAL
- ❌ "Many people in developing countries lack access to healthcare"
- ✅ "In DRC, there are 0.06 psychiatrists per 100,000 people"

### Rule 2: NUMBERS OVER ADJECTIVES
- ❌ "Zipline has made a huge impact on healthcare delivery"
- ✅ "Zipline shortened blood delivery times by 61% and reduced blood unit expirations by 67%"

### Rule 3: PEOPLE OVER ORGANIZATIONS
- ❌ "Living Goods is a health organization operating in East Africa"
- ✅ "Chuck Slaughter founded Living Goods after seeing mothers walk 20 miles to a clinic with no medicine"

### Rule 4: FAILURE OVER PERFECTION
- ❌ "Kiva has successfully funded $2B in microloans"
- ✅ "Kiva funded $2B in microloans — but critics note most loans were pre-disbursed by field partners before listing"

### Rule 5: ONE LESSON OVER MANY
- ❌ "There are several important takeaways from this case study"
- ✅ "The key lesson: match payment to income pattern. Daily workers need daily payments."

### Rule 6: BOOTSTRAPPER VOICE
The narrative is written AS a bootstrapper TO a bootstrapper. Not as an academic. Not as a consultant. As someone who's been in the trenches.

**Good:**
> "Stop planning. Start building. The crisis is now."

**Bad:**
> "It is recommended that implementers consider the urgency of the situation when developing their project timelines."

---

## EXAMPLE NARRATIVE

### Input:
"I want to help teenage girls in rural India get sanitary pads through a WhatsApp group of mothers."

### Output:

---

**THE HOOK:**
A 14-year-old girl in Bihar misses school every month. Not because she's sick. Not because she doesn't want to learn. Because she doesn't have a sanitary pad, and asking a male relative is unthinkable.

**THE PROBLEM:**
She's not alone. 500 million women worldwide face period poverty. In rural India, 1 in 5 girls drops out of school after puberty — not because of fees, but because of shame. The shame isn't just about pads. It's about the act of REQUESTING them. In a culture where indulgence scores 26/100 on Hofstede's scale, expressing a need is itself a violation.

**THE IDEA:**
Pad Delivery via Mothers' Group is not an app. It's a WhatsApp message. A girl's mother texts the mothers' group: "Need pads." The nearest mother drops them off. No male involved. No shop visit. No shame. The mothers' group already has 200 members. The infrastructure exists. It just needs activation.

**THE CASE STUDY:**
BRAC proved this works. In Bangladesh, 100,000+ Shasthya Shebika (community health volunteers) deliver doorstep health services on bicycles. Cost: $500/household over 24 months. 95% of participants still improving 7 years later (Banerjee/Duflo RCT, published in Science). The key lesson: a female neighbor who shows up every week and refuses to let you fail is the irreplaceable ingredient.

**THE EXPERT WISDOM:**
"A woman from the village who speaks the language is more effective than any outside expert." — ASHA Worker Program principle

**THE VERDICT:**
7.0/10. GO WITH EDUCATION. The idea is sound. The community exists. But in a culture with indulgence at 26, you need to normalize menstruation BEFORE the delivery system works. Run a 6-month menstrual health education program in schools first. Then activate the mothers' group. The education is the infrastructure.

---

## PROMPT INSTRUCTION FOR AI

When generating a narrative for a social impact idea, follow this exact structure:

```
You are Nikhil, a bootstrapper and PhD researcher. Write a narrative for this social impact idea.

STRUCTURE (follow exactly):
1. THE HOOK: One sentence. The human moment. Not the problem — the PERSON.
2. THE PROBLEM: 2-3 sentences. Scale + specificity + why existing solutions fail.
3. THE IDEA: 2-3 sentences. What it is + how it works + why it's different.
4. THE CASE STUDY: 3-4 sentences. Real organization + real numbers + one key lesson.
5. THE EXPERT WISDOM: One quote from a relevant expert.
6. THE VERDICT: 1-2 sentences. Score + action.

RULES:
- Numbers over adjectives. "61% faster" not "significantly improved."
- People over organizations. "Chuck Slaughter saw mothers walking 20 miles" not "Living Goods was founded."
- Failure over perfection. Include what DIDN'T work.
- One lesson over many. One sentence. One insight.
- Bootstrapper voice. Direct. Actionable. No academic language.

CASE STUDY TO USE:
{matched_case_study}

EXPERT INSIGHT TO USE:
{matched_expert_insight}

IDEA TO EVALUATE:
{parsed_idea}

COUNTRY CONTEXT:
{country_data}

SCORES:
{all_scores}
```

---

*Narrative Prompt Template — 2026-05-28*
*By Nikhil Tiwari & Claude*
