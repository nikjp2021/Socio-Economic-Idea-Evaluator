# The Case Study Knowledge Engine
## How It Works — Search, Verify, Create

---

## THE THREE-MODE SYSTEM

The knowledge engine operates in three modes, in order of preference:

### MODE 1: EXACT MATCH (Library)
Search the existing library for a case study that matches the user's idea exactly.

**When it works:** The idea is similar to a well-documented organization.
**Output:** Full case study with real numbers, real founder, real impact.
**Confidence:** HIGH — verified data.

### MODE 2: WEB SEARCH (Dynamic)
If no exact match, search the web for real organizations working on this problem in this country.

**When it works:** There ARE organizations doing this, they're just not in our library yet.
**How it works:**
1. Search: "[idea type] social enterprise [country]"
2. Search: "[problem] startup [country]"
3. Search: "[solution type] NGO [country]"
4. Verify: Check multiple sources (org website, news, academic papers)
5. Extract: Name, founder, year, model, impact numbers
6. Rate: Source reliability (HIGH = org website + academic paper, MEDIUM = news report, LOW = blog/social)

**Output:** Case study with source attribution and confidence rating.
**Confidence:** MEDIUM — web-sourced, may need verification.

### MODE 3: HYPOTHETICAL (Grounded)
If no real match exists ANYWHERE, create a hypothetical case study that's GROUNDED in real evidence.

**When it works:** The idea is genuinely novel — nobody has done exactly this.
**How it works:**
1. Find the 3 closest real case studies (even if they're in different countries/categories)
2. Extract the PRINCIPLES that made them work
3. Apply those principles to the user's specific context
4. Create a hypothetical that says: "No one has done exactly this, but..."

**Output:** Hypothetical case study with explicit grounding in real evidence.
**Confidence:** LOW — hypothetical, but grounded in real principles.

---

## THE HYPOTHETICAL CASE STUDY FORMAT

```
⚠️ HYPOTHETICAL CASE STUDY — Grounded in Real Evidence

No organization has done exactly [user's idea] in [country].
But three real organizations prove the underlying principles work:

1. [Organization A] proved [principle X] works in [context].
   Impact: [real numbers]
   Source: [real source]

2. [Organization B] proved [principle Y] works in [context].
   Impact: [real numbers]
   Source: [real source]

3. [Organization C] proved [principle Z] works in [context].
   Impact: [real numbers]
   Source: [real source]

Combining these principles, [user's idea] could work because:
- [Principle X] applies because [reason]
- [Principle Y] applies because [reason]
- [Principle Z] applies because [reason]

The key risk is: [what could go wrong, based on what failed for A, B, C]
The key success factor is: [what worked for A, B, C that applies here]

This is a HYPOTHETICAL assessment. The principles are proven.
The specific combination is not. Test it with a 2-week proof-of-work.
```

---

## WEB SEARCH INTEGRATION

### Search Queries (in order)

For a given idea + country, the system generates these search queries:

1. **Direct match:** "[idea keyword] social enterprise [country]"
2. **Problem match:** "[problem keyword] startup [country] impact"
3. **Solution match:** "[solution type] NGO [country] verified"
4. **Academic:** "[idea keyword] randomized controlled trial [country]"
5. **Funder perspective:** "[idea keyword] grant [country] Ashoka Echoing Green"

### Source Reliability Rating

| Rating | Sources | Trust Level |
|---|---|---|
| HIGH | Org website (.org/.com), academic paper, government report, GiveWell/SSIR | Use directly |
| MEDIUM | News article (Reuters, BBC, Al Jazeera), Wikipedia with citations, Forbes | Use with attribution |
| LOW | Blog post, social media, unverified claim | Use only to find leads, verify before using |
| REJECT | No source, anonymous claim, obvious marketing | Don't use |

### Verification Checklist

Before using a web-sourced case study, verify:
- [ ] Organization name is real (has website, social media, or news coverage)
- [ ] Founder name is real (LinkedIn, bio on org website)
- [ ] Impact numbers are cited (not self-reported without source)
- [ ] Multiple sources confirm the same facts
- [ ] Organization is currently active (or clearly marked as historical)

---

## INFLUENTIAL FIGURES DATABASE

Each figure entry includes:
- **Name** (real)
- **Country** (primary country of impact)
- **Role** (founder, activist, politician, academic, funder)
- **Organization** (if applicable)
- **Specific Impact** (numbers, achievements)
- **Why They Matter** (one sentence)
- **Quote** (if available)
- **Source** (verification)

### How Figures Are Used

1. **In narratives:** "Dr. Denis Mukwege treated 30,000 survivors of sexual violence. His approach proves that..."
2. **As expert insight:** Quote from a relevant figure reinforces the idea
3. **As case study anchor:** The figure IS the story — their personal pain creates authentic purpose
4. **As credibility marker:** "This approach aligns with what [Figure] proved in [context]"

---

## THE MATCHING ALGORITHM

### Step 1: Idea Decomposition
Break the user's idea into components:
- **Problem:** What suffering exists?
- **Solution:** What's the proposed intervention?
- **Community:** Who benefits?
- **Country:** Where?
- **Economic Tier:** What tech is possible?

### Step 2: Multi-Factor Search
Search the library using weighted matching:

| Factor | Weight | Match Logic |
|---|---|---|
| Category (idea type) | 5 points | Exact match: +5, Related: +3 |
| Country | 3 points | Exact match: +3, Same region: +1 |
| Economic Tier | 2 points | Exact match: +2, Adjacent: +1 |
| Problem similarity | 3 points | Same problem: +3, Related problem: +1 |
| Solution similarity | 3 points | Same approach: +3, Similar approach: +1 |

### Step 3: Rank and Select
- Score all case studies
- Select top 3 matches
- If top score ≥ 8: use as primary case study (MODE 1)
- If top score 5-7: use top 3 as supporting evidence (MODE 1/2)
- If top score < 5: trigger web search (MODE 2)
- If web search returns nothing: generate hypothetical (MODE 3)

### Step 4: Narrative Generation
For each selected case study, generate a narrative following the structure:
1. The Hook (human moment)
2. The Problem (scale + specificity)
3. The Idea (what + how + why different)
4. The Case Study (real org + real numbers + key lesson)
5. The Expert Wisdom (quote)
6. The Verdict (score + action)

---

## DATA SOURCES FOR VERIFICATION

| Source | Type | Trust |
|---|---|---|
| GiveWell | Charity evaluator | HIGH |
| Stanford SSIR | Academic journal | HIGH |
| Harvard Business School | Case studies | HIGH |
| Ashoka | Fellowship database | HIGH |
| Echoing Green | Fellowship database | HIGH |
| Acumen | Investment portfolio | HIGH |
| Nobel Prize | Award database | HIGH |
| World Bank | Data + reports | HIGH |
| UNDP/UNICEF/WHO | Data + reports | HIGH |
| Reuters/BBC/Al Jazeera | News | MEDIUM |
| Forbes/Fortune | Business press | MEDIUM |
| TechCrunch/Disrupt Africa | Tech press | MEDIUM |
| Wikipedia (with citations) | Encyclopedia | MEDIUM |
| Org websites | Self-reported | MEDIUM (verify) |
| Social media | Unverified | LOW |

---

## EXAMPLE: THREE-MODE WALKTHROUGH

### User Idea:
"I want to create a peer-to-peer tutoring network for rural Cambodian children using WhatsApp."

### MODE 1: Library Search
Search for: education + Cambodia + WhatsApp + peer-to-peer
Result: No exact match in library. Closest matches:
- Teach for Philippines (education, different country)
- KATARIBA (education, Japan, different model)
- Evidence Action (education, different approach)
Score: 3/10 — not close enough.

### MODE 2: Web Search
Search: "peer tutoring WhatsApp Cambodia education"
Search: "rural education technology Cambodia NGO"
Search: "Cambodia education social enterprise"
Result: Found "Kampuchea Action for Primary Education" and "Room to Read Cambodia"
Verification: Both have org websites, news coverage, and academic citations.
Extract: Model, impact numbers, what worked, what didn't.

### MODE 3: Hypothetical (if web search fails)
Find closest principles:
- Teach for Philippines proved: cross-sector recruitment works for education
- KATARIBA proved: diagonal relationships (peer, not teacher) create trust
- Evidence Action proved: government partnership enables scale

Generate hypothetical:
"No one has done exactly peer-to-peer WhatsApp tutoring in Cambodia. But Teach for Philippines proved cross-sector recruitment works. KATARIBA proved peer relationships create unique trust. Evidence Action proved government partnership enables scale. Combining these: recruit Cambodian university students as tutors, use WhatsApp for delivery, partner with Ministry of Education for credibility. Key risk: WhatsApp adoption in rural Cambodia. Key success factor: peer tutors who speak local dialects."

---

*Knowledge Engine Design — 2026-05-28*
*By Nikhil Tiwari & Claude*
