# SEE — Experience Design Document
## "Virtual Shark Tank for Social Impact"
### By Nikhil Tiwari & Claude | 2026-05-28

---

## 1. Product Vision

**What it is:** A web tool that evaluates any social impact idea — from street food shops to community health programs — and tells you: can this work, what's in your way, and exactly what to do on Day 1.

**Who it's for:** Anyone with an idea to help their community. Not consultants. Not academics. Real people with real constraints — $0 budget, solo, evenings only, no tech skills.

**What makes it different:** It doesn't just score your idea. It tells you WHY it scored that way, WHAT specifically to fix, and HOW to fix it. Like a mentor who's done it before.

---

## 2. The Shizuoka Method — What We Learned

The Shizuoka Method app taught us 5 things:

### 2.1 Structured Input, Not Free Text
The app asks 3 fields: Problem, Goal, Constraints. Not one textarea.
- **Problem** = What's broken? What suffering exists?
- **Goal** = What does success look like? Measurable.
- **Constraints** = Budget, team, time, skills, limitations.

We extend this to 5 fields: Problem, Goal, Country/Location, Budget, Constraints.

### 2.2 FAD Filtering
The app checks if the idea is a trend vs. a real problem.
- **Real problem**: Persistent, structural, will exist in 5 years
- **FAD**: Trendy, might disappear, dependent on hype

We add a "Reality Check" layer that classifies the problem type and flags FAD risk.

### 2.3 Personalized Verdicts, Not Generic Labels
The app gives different tones for different scores:
- **8+**: "Pure Gold! Go get 'em!" — Celebratory, action-oriented
- **6-7.9**: "Promising Angle! Almost there." — Encouraging, identifies the gap
- **4-5.9**: "Needs Work." — Honest, specific about what to fix
- **Below 4**: "Tough one." — Compassionate, suggests pivots

### 2.4 Case Studies + Expert Quotes
Every idea gets matched to a real example and a real quote. Grounded in evidence.

### 2.5 High-Energy, Direct Tone
Not academic. Not corporate. Like talking to a smart friend who's been there.

---

## 3. The Experience Flow

### 3.1 Landing (Hero)
- **Headline**: "Your idea. Your city. Your budget. Let's see if it works."
- **Sub**: "Tell us what you want to do, where, and what you have. We'll tell you if it can work."
- **CTA**: "Evaluate My Idea" → scrolls to input form
- **Social proof**: "165 real examples. 136 countries. Free."

### 3.2 Input Form
5 structured fields:
1. **What's the problem?** (required, textarea)
2. **What do you want to achieve?** (required, textarea)
3. **Where?** (required, text input — country/city)
4. **Budget** (optional, text input)
5. **Your constraints** (optional, textarea)

**Example chips** — Click to auto-fill:
- "Indian street food in London"
- "Elder care WhatsApp in Japan"
- "Sanitary pads in Bangladesh"
- "Coding classes in Nairobi"

**Validation**: Problem + Goal must be 50+ characters combined.

### 3.3 The Report — 7 Sections

#### Section 1: THE VERDICT (Top — this is what they came for)
- Score (X/10)
- One-line headline based on score level
- Personalized paragraph explaining WHY this score
- Tone changes by score level (see 2.3)

#### Section 2: YOUR PITCH (echo back what they told us)
- Problem (their words)
- Goal (their words)
- Where, Budget, Constraints
- Shows we listened

#### Section 3: REALITY CHECK (is this a real problem?)
- FAD Risk: LOW / MEDIUM / HIGH
- Explanation of why
- "Is this a real problem?" — self-check question
- Problem persistence analysis

#### Section 4: WHAT'S WORKING FOR YOU
- Green checkmarks for strengths
- Community readiness, cultural fit, tech simplicity
- "You're not starting from zero"

#### Section 5: WHAT'S HOLDING YOU BACK (for scores < 8)
- Specific barriers with practical workarounds
- Not labels — actionable advice
- "People don't challenge authority" → "Partner with local leaders"
- Gap to score 8

#### Section 6: CAN YOU START ALONE?
- Easy / Feasible / Effort scores
- Nikhil's Take — direct advice
- Someone Who Did Something Similar — real case study

#### Section 7: YOUR 2-WEEK PLAN
- Day-by-day, idea-type-specific
- $0 budget
- "How You Know It's Working" — success criteria
- Where to Find Money — funding sources
- "Do This Today" — one clear first step

---

## 4. Design System

### 4.1 Visual Language
- **Dark theme** — slate-950 background, sky-400 accents
- **Glow effects** — text-glow on headings, button-glow on CTAs
- **Rajdhani headings** — bold, technical, strong
- **Inter body** — clean, readable, professional
- **Glassmorphism** — backdrop-blur on nav, cards
- **Gradient borders** — sky-to-cyan on important elements

### 4.2 Color Coding
- **Emerald** — GO, strengths, "you're ready"
- **Amber** — GO WITH EDUCATION, warnings, "almost there"
- **Sky** — PIVOT, neutral, "needs work"
- **Red** — SHELVE, barriers, "this is tough"

### 4.3 Typography
- **Headings**: Rajdhani 700, tracking-tight
- **Body**: Inter 400-600, leading-relaxed
- **Labels**: Inter 700, uppercase, tracking-wider, text-[10px]
- **Quotes**: Inter italic, text-slate-300

### 4.4 Card Pattern
```html
<div class="p-5 bg-slate-800/40 rounded-xl border border-slate-700/30">
  <div class="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">LABEL</div>
  <p class="text-sm text-slate-300 leading-relaxed">Content</p>
</div>
```

### 4.5 Responsive
- Mobile: single column, full-width cards
- Tablet: 2-column grid for cards
- Desktop: 3-column grid, max-w-3xl for content

---

## 5. The Engine — What Runs Underneath

### 5.1 Input Processing
```
User Input → Parse Problem/Goal/Country/Budget/Constraints
           → Detect country (40+ keywords)
           → Detect idea type (12 categories)
           → Detect economic tier (T1-T4)
```

### 5.2 Evaluation Layers
```
Layer 1: Parse & Structure (Shizuoka Method)
Layer 2: Three Tests (Community Viability)
  - Facebook Group Test
  - 10-for-10 Test
  - WhatsApp-Only Test
Layer 3: Cultural Matrix (Hofstede 6 dimensions)
Layer 4: Education Lever (trainable vs structural barriers)
Layer 5: Bootstrapper Score (Easy/Feasible/Efforts)
Layer 6: Case Study Matching (165 examples, 11 zones)
Layer 7: Verdict (personalized, grounded)
```

### 5.3 Scoring Formula
```
Total = (Community × 0.20) + (Cultural × 0.15) + (Education × 0.15) +
        (Bootstrapper × 0.20) + (Impact × 0.20) + (Community × 0.10)
```

### 5.4 Data Assets
- 136 countries with Hofstede scores (official Kaggle dataset)
- 165 case studies across 11 global zones
- 57 influential figures
- 12 idea categories
- 4 economic tiers

---

## 6. What's Missing (Phase 2)

### 6.1 FAD Detection via Web Search
- Search Reddit, Twitter, Google Trends for the idea keywords
- Check: is this being discussed? Is the discussion growing or dying?
- If dying trend → flag as FAD risk
- Requires: Serper API or Gemini grounding

### 6.2 Market Buzz Score
- Search volume trend for the problem
- Competitor count
- Pricing data
- Requires: web search integration

### 6.3 More Case Studies
- Current: 165
- Target: 500+
- Zones to expand: Central Asia, MENA, Central Africa

### 6.4 Multi-Language Support
- Current: English
- Priority: Japanese, Hindi, Bangla, Swahili
- Approach: i18n keys in the frontend

### 6.5 WhatsApp Bot
- Maximum reach for T2-T3 countries
- Send idea via WhatsApp → get evaluation back
- Requires: WhatsApp Business API

### 6.6 Save & Share
- Save evaluation to localStorage
- Share via link (URL params)
- PDF export

---

## 7. Success Metrics

| Metric | Target | How to Measure |
|---|---|---|
| Ideas evaluated | 100 in first month | Server logs |
| Score distribution | Bell curve (most 5-7) | Analytics |
| Return rate | 30% come back | localStorage tracking |
| Action taken | 50% click "Do This Today" | Click tracking |
| Time on report | 2+ minutes | Analytics |
| Share rate | 10% share their evaluation | Share button clicks |

---

## 8. The Philosophy

**秩序と創造 — Order and Creation**

Order = Structure. Problem, Goal, Constraints. Clear fields. No ambiguity.
Creation = The evaluation. The insights. The "I never thought of that" moment.

The user brings the Order. We bring the Creation.

Every person who comes to this tool has a dream. Our job is to honor that dream while being honest about what it takes. Not to crush it. Not to inflate it. To GROUND it.

"Your idea is good. Here's what's in your way. Here's how to get around it. Now go."

---

*Experience Design Document — 2026-05-28*
*By Nikhil Tiwari & Claude*
