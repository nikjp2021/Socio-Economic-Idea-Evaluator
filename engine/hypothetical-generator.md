# Hypothetical Case Study Generator
## Grounded in Real Evidence, Honest About What's Proven

---

## THE PROBLEM

Sometimes a user's idea is genuinely novel. Nobody has done exactly this, in exactly this country, for exactly this community. The temptation is to either:
1. Say "no case study found" (unhelpful)
2. Make up a fake case study (dishonest)

The hypothetical generator does neither. It says: **"Nobody has done exactly this. But here's the evidence that the principles work."**

---

## THE METHOD (Inspired by Nikhil's Research Protocol)

### Step 1: Decompose the Idea
Break the user's idea into its component principles:
- **The problem:** What suffering exists?
- **The solution:** What's the proposed intervention?
- **The mechanism:** HOW does it work? (trust, technology, behavior change, economic incentive)
- **The community:** WHO benefits? WHO delivers?
- **The context:** WHERE? What cultural, economic, political factors?

### Step 2: Find the Closest Real Principles
Search the case study library for organizations that share ONE OR MORE principles with the user's idea, even if the overall idea is different.

**Example:** User wants "peer-to-peer mental health support via WhatsApp for rural Cambodian youth."

Principles:
- Peer-to-peer support → KATARIBA (Japan): diagonal relationships create trust
- Mental health via phone → "Someone Will Listening" helpline model
- WhatsApp delivery → M-Pesa (Kenya): mobile money on basic phones
- Rural youth → Pratham (India): Teaching at the Right Level in rural areas
- Cambodia context → Shapla Neer (Bangladesh): 50+ years in similar context

### Step 3: Extract Proven Principles
For each matching case study, extract the SPECIFIC principle that's been proven:

```
PRINCIPLE: Peer relationships create unique trust
PROVEN BY: KATARIBA (Japan)
EVIDENCE: 98,935 students served; Time Magazine cover; Prime Minister's Commendation
SOURCE: katariba.or.jp/english/
APPLIES BECAUSE: [Why this principle applies to the user's idea]
```

### Step 4: Build the Hypothetical Narrative
Structure:

```
⚠️ HYPOTHETICAL CASE STUDY — Grounded in Real Evidence

No organization has done exactly [user's idea] in [country].

But [N] real organizations prove the underlying principles work:

1. [Organization A] proved [principle X].
   Evidence: [real numbers, real source]
   This applies to your idea because: [specific connection]

2. [Organization B] proved [principle Y].
   Evidence: [real numbers, real source]
   This applies to your idea because: [specific connection]

3. [Organization C] proved [principle Z].
   Evidence: [real numbers, real source]
   This applies to your idea because: [specific connection]

COMBINING THESE PRINCIPLES:
Your idea could work because:
- [Principle X] suggests [what it implies for the user's idea]
- [Principle Y] suggests [what it implies]
- [Principle Z] suggests [what it implies]

KEY RISKS (from what failed for A, B, C):
- [Risk 1]: [Organization A] failed because [reason]. Your idea faces the same risk because [reason].
- [Risk 2]: [Organization B] failed because [reason]. Your idea faces the same risk because [reason].

KEY SUCCESS FACTORS (from what worked for A, B, C):
- [Factor 1]: [Organization A] succeeded because [reason]. Apply this by [specific action].
- [Factor 2]: [Organization B] succeeded because [reason]. Apply this by [specific action].

CONFIDENCE LEVEL: [LOW/MEDIUM/HIGH]
- LOW: No direct precedent. Principles are proven but combination is novel.
- MEDIUM: Similar ideas exist in other contexts. Adaptation needed.
- HIGH: Very close precedent exists. Main difference is geography/culture.

RECOMMENDATION: [Test with 2-week proof-of-work / Apply for funding / Pivot approach]
```

---

## QUALITY RULES (From Research Protocol)

### Rule 1: Cite Real Sources
Every claim must have a source. "KATARIBA served 98,935 students" needs the source URL.

### Rule 2: Distinguish Proven from Hypothetical
The PRINCIPLES are proven. The COMBINATION is hypothetical. Never blur this line.

### Rule 3: Include What Failed
Don't just cite successes. Include what failed and why. This is more valuable than success stories.

### Rule 4: Be Specific About Risks
"Something could go wrong" is useless. "KATARIBA couldn't scale beyond Japan because cultural specificity limits exportability" is useful.

### Rule 5: Give Actionable Recommendations
"This could work" is useless. "Test with a 2-week proof-of-work: join the existing WhatsApp group, ask 10 people, serve 3" is useful.

---

## EXAMPLE: Hypothetical Case Study

### User Idea:
"I want to create a peer-to-peer tutoring network for rural Cambodian children using WhatsApp."

### Generated Hypothetical:

```
⚠️ HYPOTHETICAL CASE STUDY — Grounded in Real Evidence

No organization has done exactly peer-to-peer WhatsApp tutoring in rural Cambodia.

But 3 real organizations prove the underlying principles work:

1. KATARIBA (Japan) proved that PEER RELATIONSHIPS create unique trust.
   Evidence: 98,935 students served. "Diagonal relationships" (older peers, not
   teachers) created trust that parents and teachers couldn't. Time Magazine cover.
   Prime Minister's Commendation (2016).
   Source: katariba.or.jp/english/
   This applies to your idea because: Peer tutors (not professional teachers) may
   create more trust with rural Cambodian children than formal instruction.

2. Pratham (India) proved that SIMPLE REMEDIAL EDUCATION at the right level works.
   Evidence: 34M+ children reached. "Teaching at the Right Level" validated by
   MIT J-PAL. Adopted by 15+ countries.
   Source: pratm.org
   This applies to your idea because: The key insight is teaching at the CHILD'S
   level, not the curriculum's level. Peer tutors can assess and adapt faster than
   formal teachers.

3. M-Pesa (Kenya) proved that BASIC PHONES are sufficient for complex services.
   Evidence: 194,000 households lifted out of poverty. Works on $10 phones via
   SMS/USSD. No smartphone needed.
   Source: safaricom.co.ke/personal/m-pesa
   This applies to your idea because: WhatsApp works on basic smartphones. You
   don't need an app — WhatsApp IS the app.

COMBINING THESE PRINCIPLES:
Your idea could work because:
- Peer tutors create trust (KATARIBA principle)
- Teaching at the child's level works (Pratham principle)
- WhatsApp on basic phones is sufficient (M-Pesa principle)

KEY RISKS:
- KATARIBA couldn't scale beyond Japan. Cultural specificity limited exportability.
  Your idea faces the same risk: Cambodian rural culture may respond differently
  than Japanese urban culture.
- Pratham's volunteer retention was a challenge. Your tutors may drop out.
  Mitigation: make it reciprocal (tutor gets something too).

KEY SUCCESS FACTORS:
- KATARIBA succeeded because "diagonal relationships" were structured, not
  informal. Structure the peer matching, don't leave it to chance.
- Pratham succeeded because they partnered with government. Explore Cambodia's
  Ministry of Education for credibility and reach.

CONFIDENCE LEVEL: MEDIUM
Similar ideas exist in other contexts (Pratham in India, KATARIBA in Japan).
Main difference: Cambodia's rural context + WhatsApp delivery.

RECOMMENDATION: Test with 2-week proof-of-work.
Week 1: Find 5 university students in Phnom Penh willing to tutor via WhatsApp.
Week 2: Connect them with 10 rural children. Measure: do children show up?
do tutors stay? do parents approve?
```

---

## INTEGRATION WITH EVALUATOR

The hypothetical generator is triggered when:
1. Mode 1 (library match) returns score < 5
2. Mode 2 (web search) returns no results
3. The idea has identifiable principles that ARE proven elsewhere

The generator is NOT triggered when:
1. The idea is completely novel with no related principles
2. The idea is harmful or unethical
3. The idea violates laws of physics or economics

---

*Hypothetical Case Study Generator — 2026-05-28*
*Inspired by Nikhil's Research Protocol*
*By Nikhil Tiwari & Claude*
