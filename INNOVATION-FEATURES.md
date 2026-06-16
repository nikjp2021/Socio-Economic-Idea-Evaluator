# INNOVATION-FEATURES — 4 "Wow" Features for SEE
## Detailed Specs for Social Impact Lean Canvas, Marketplace, Competitive Positioning, and Global Cultural Heatmap

---

**Author:** Nikhil Tiwari & Claude
**Created:** 2026-05-29
**Status:** Spec (ready for implementation)
**Dependencies:** evaluator.py (7-layer pipeline), hofstede-database.json (136 countries), library.json + zones-library.json (165 case studies), countries.json (10 rich profiles), zones.json (11 zones)

---

## How to Read This Document

Each feature has the same structure:
1. **The "Wow" — What Makes It Genuinely Innovative** (vs. what already exists)
2. **Data Pipeline — What Powers It** (exact fields, functions, and data structures)
3. **UI Specification — How It Looks** (components, interactions, layout, responsive behavior)
4. **MVP Implementation — What to Build First** (smallest thing that delivers the wow)
5. **Integration Points — How It Connects to the Rest of SEE**

The features are ordered by dependency: Feature 1 is standalone, Feature 2 depends on Feature 1, Feature 3 depends on the existing pipeline, and Feature 4 depends on the scoring engine.

---

# FEATURE 1: SOCIAL IMPACT LEAN CANVAS

## 1.1 The "Wow" — What Makes It Genuinely Innovative

**What exists today:**
- **Leanstack** ($19/mo) — manual fill-in-the-blank canvas. You type every block yourself. No intelligence.
- **Canvanizer** (free) — collaborative canvas editing. Same: you fill it in.
- **Strategyzer** ($25/mo) — business model canvas with some templates. Still manual.
- **LivePlan, Enloop** — auto-generate business plans from financial inputs. No social impact awareness.

**What none of them do:**
- Auto-generate a complete 9-block Lean Canvas from a plain-language idea description
- Fill the canvas using cultural data from 136 countries and lessons from 165 real social impact case studies
- Adapt the canvas for social impact (SDG targets instead of TAM/SAM/SOM)
- Show the user what they said vs. what the system inferred (honest about gaps)
- Generate the canvas in 3 seconds from a paragraph of text

**The wow moment:** A social entrepreneur in Dhaka types 3 sentences about their idea. In 3 seconds, they get a complete Lean Canvas with their problem statement, their solution, their unfair advantage (from cultural analysis), their customer segments (from economic tier detection), their channels (from case study patterns), their key metrics (from SDG targets), and their cost/revenue model (from bootstrapper score + funding data). They can edit it, export it as PDF, and share it with a potential co-founder. No template. No form. Just their idea, transformed.

**Why this matters for social entrepreneurs:** Most social entrepreneurs in developing countries have never seen a Lean Canvas. They have ideas but no structured way to communicate them. This feature gives them a professional business model document from their own words — the same document that Silicon Valley startups pay consultants to create.

---

## 1.2 Data Pipeline — What Powers It

### Source 1: `parse_idea()` output (Layer 1)

| Canvas Block | Source Field | Mapping Logic |
|---|---|---|
| **Problem** | `parsed["problem"]` | Direct use. If "Inferred from context", show "(you did not describe this)" and suggest the user re-submit with more detail. |
| **Customer Segments** | `parsed["country"]` + `economic_tier` + `parsed["community"]["community_type_detected"]` | Country name + economic tier description + community type. E.g., "Low-income women in rural Bangladesh (economic tier T2-T3, primarily reached through community health networks)" |
| **Solution** | `parsed["goal"]` | Direct use. If missing, synthesize from `idea_type` + `country`. |

### Source 2: `three_tests` (Layer 2)

| Canvas Block | Source Field | Mapping Logic |
|---|---|---|
| **Channels** | `three_tests["facebook_group_test"]` + `three_tests["whatsapp_only_test"]` | If WhatsApp test passes: "WhatsApp groups, community health workers, word of mouth". If Facebook test passes: "Facebook groups, community organizations, local events". Always add case study channels. |
| **Key Metrics** | `three_tests` pass/fail + SDG targets | Derive 3 measurable metrics from the SDG map. E.g., for menstrual health: "Number of women served per month", "Repeat purchase rate", "Community health worker referrals". |

### Source 3: `cultural_analysis` (Layer 3)

| Canvas Block | Source Field | Mapping Logic |
|---|---|---|
| **Unfair Advantage** | Top 2 LOW-barrier Hofstede dimensions + `cultural_profile["what_works"]` | Combine cultural strengths with what works. E.g., "High collectivism (IDV 20) means community word-of-mouth spreads fast. Local trust networks already exist." |
| **Channels** (enrichment) | HIGH-barrier dimensions + workarounds | Add cultural adaptations. E.g., "High power distance (80): partner with local leaders first, not individual users." |

### Source 4: `bootstrapper_score` (Layer 5)

| Canvas Block | Source Field | Mapping Logic |
|---|---|---|
| **Cost Structure** | `bootstrapper["easy"]` + `bootstrapper["feasible"]` + `constraints["budget"]` | Map budget to cost categories. If bootstrapper score is high (7+): "Lean start: < $100 for materials, WhatsApp for communication, community volunteers for distribution". If low: list specific costs from the barriers. |
| **Revenue Streams** | `sdgs` + `economic_tier` + `FUNDING_TIERS` + `COUNTRY_FUNDING` | Tier-based revenue model. T1-T2: "Freemium, subscription, direct sales". T3-T4: "Cross-subsidy, institutional partnerships, micro-payments via mobile money". |

### Source 5: `case_study` (Layer 6)

| Canvas Block | Source Field | Mapping Logic |
|---|---|---|
| **Channels** (validation) | `case_study["case_study"]["what_worked"]` | Extract channel patterns from the matched case study. |
| **Revenue Streams** (validation) | `case_study["case_study"]["the_model"]` | Extract revenue model patterns. |
| **Unfair Advantage** (validation) | `case_study["case_study"]["what_worked"]` | Compare user's advantage with what worked for the case study. |

### Source 6: `verdict` (Layer 7)

| Canvas Block | Source Field | Mapping Logic |
|---|---|---|
| **Problem** (risk assessment) | `fad_risk["level"]` + `fad_risk["text"]` | Add FAD risk note to problem block. "Note: This topic has [REAL PROBLEM / TREND SIGNAL] momentum right now." |

### Data Structure: `generate_canvas()` function

```python
def generate_canvas(parsed: dict, all_analysis: dict) -> dict:
    """Auto-generate a 9-block Lean Canvas from evaluation data."""
    canvas = {
        "problem": {
            "text": str,           # Primary problem statement
            "secondary": [str],    # Additional problems from SDG targets
            "fad_note": str,       # FAD risk assessment
            "confidence": str,     # "user-stated" or "inferred"
        },
        "solution": {
            "text": str,           # Solution from parsed goal or synthesized
            "approach": str,       # From case study model
        },
        "key_metrics": [str],      # 3 measurable metrics derived from SDGs
        "unique_value_proposition": {
            "headline": str,       # One-line UVP synthesized from idea + cultural strengths
            "subheadline": str,    # Supporting detail from case study
        },
        "unfair_advantage": {
            "text": str,           # Cultural strengths + what_works
            "cultural_basis": str, # Which Hofstede dimensions support this
        },
        "channels": [str],         # 3-5 channels from tests + case studies + cultural analysis
        "customer_segments": {
            "primary": str,        # From country + economic tier + community type
            "early_adopters": str, # From case study patterns
        },
        "cost_structure": {
            "startup": str,        # From bootstrapper score
            "ongoing": str,        # From bootstrapper efforts score
        },
        "revenue_streams": [dict], # Tier-based revenue models from FUNDING_TIERS
        "metadata": {
            "idea_type": str,
            "country": str,
            "economic_tier": str,
            "total_score": float,
            "verdict": str,
            "generated_at": str,
        },
    }
    return canvas
```

---

## 1.3 UI Specification — How It Looks

### Desktop Layout (1440px)

```
┌─────────────────────────────────────────────────────────────┐
│  SOCIAL IMPACT CANVAS                            [Export ▼] │
│  "Your idea, structured in 9 blocks"                        │
├────────────────────┬────────────────────┬───────────────────┤
│                    │                    │                   │
│   ★ PROBLEM        │   ★ SOLUTION       │   ★ UVP           │
│   [auto-filled]    │   [auto-filled]    │   [auto-filled]   │
│   [edit icon]      │   [edit icon]      │   [edit icon]     │
│                    │                    │                   │
│   ┌─ FAD NOTE ─┐  │                    │                   │
│   │ REAL PROBLEM│  │                    │                   │
│   └────────────┘  │                    │                   │
├────────────────────┼────────────────────┤                   │
│                    │                    │                   │
│   ★ KEY METRICS    │   ★ UNFAIR         │                   │
│   1. Women served  │     ADVANTAGE      │                   │
│   2. Repeat rate   │   [auto-filled]    │                   │
│   3. Referrals     │   Cultural basis:  │                   │
│                    │   High IDV (20)    │                   │
├────────────────────┼────────────────────┼───────────────────┤
│                    │                    │                   │
│   ★ CHANNELS       │   ★ CUSTOMER       │                   │
│   - WhatsApp       │     SEGMENTS       │                   │
│   - Health workers │   Primary:         │                   │
│   - Word of mouth  │   [auto-filled]    │                   │
│   [from case study]│   Early adopters:  │                   │
│                    │   [from case study]│                   │
├────────────────────┼────────────────────┼───────────────────┤
│                    │                    │                   │
│   ★ COST           │   ★ REVENUE        │                   │
│     STRUCTURE      │     STREAMS        │                   │
│   Startup: <$100   │   - Mobile money   │                   │
│   Ongoing: Volunteer│   - Cross-subsidy  │                   │
│   [bootstrapper]   │   - Institution    │                   │
│                    │   [score-aware]    │                   │
└────────────────────┴────────────────────┴───────────────────┘
│                                                             │
│  SOURCES: Evaluation score 7.2/10 | Bangladesh | T2-T3      │
│  Case study: BRAC | SDG 3, SDG 5                           │
│  [Edit Canvas] [Download PDF] [Share Link] [Copy to Clipboard]│
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (360px)

Single column, stacked blocks. Each block is a collapsible card:
- Tap to expand/collapse
- First 3 blocks (Problem, Solution, UVP) expanded by default
- Sticky footer with: [Edit] [Download] [Share]
- 48px touch targets on all interactive elements

### Interactions

1. **Auto-populate animation:** Blocks fill in one by one with a 200ms stagger, left-to-right, top-to-bottom. Each block shows a brief "Analyzing..." state (skeleton loader) before the text appears. Total animation: ~2 seconds.

2. **Edit mode:** Click any block to edit. Text becomes contenteditable. A small "Save" / "Cancel" pair appears. Edited blocks show a subtle "edited" badge so the user knows which blocks they customized vs. which are auto-generated.

3. **Confidence indicators:** Each block has a small dot:
   - Green dot: "Based on what you told us" (user-stated data)
   - Yellow dot: "Inferred from context" (system guessed)
   - Blue dot: "Based on real examples" (from case study matching)
   
   This teaches the user to provide more detail next time (yellow blocks are the gaps).

4. **Export options:**
   - **PDF:** Clean A4 layout, printable. Canvas on page 1, detailed notes on page 2.
   - **PNG:** 1200x900 image optimized for WhatsApp/social sharing.
   - **Copy text:** Plain text version of all 9 blocks for pasting into emails/docs.

5. **Responsive breakpoints:**
   - 1440px+: 3-column grid (as shown above)
   - 768-1439px: 2-column grid
   - <768px: Single column, collapsible cards

### Design Tokens (from DESIGN.md)

- Background: `#1A1A2E` (dark theme)
- Card background: `#16213E` with 1px border `rgba(255,255,255,0.08)`
- Card header: Forest Green `#2D6A4F` for star icon
- Text: `#E2E8F0` (primary), `#94A3B8` (secondary)
- Edit highlight: Amber `#F5A623` border on edited blocks
- Confidence dots: Green `#2D6A4F`, Yellow `#F5A623`, Blue `#4A90D9`
- Font: DM Sans for body, DM Serif Display for block titles
- Spacing: 16px padding inside cards, 12px gap between cards

---

## 1.4 MVP Implementation — Smallest Thing That Delivers the Wow

### Phase 1: Generate + Display (1-2 days)

1. **`generate_canvas()` function in evaluator.py** (~150 lines)
   - Takes `parsed` + `all_analysis` dicts (same inputs as `format_report()`)
   - Returns 9-block canvas dict
   - Maps each block from existing pipeline data (as specified in 1.2)
   - Handles missing data gracefully (confidence = "inferred")

2. **Canvas display in index.html** (~200 lines HTML/CSS)
   - 9-block grid layout (CSS Grid)
   - Auto-populated from evaluation JSON response
   - No edit mode yet (read-only)
   - Desktop-only initially

3. **API endpoint** (modify server.py / api/index.py)
   - Add `canvas` field to the evaluation response
   - `canvas` contains the 9-block dict
   - No additional API call needed — canvas is generated alongside the report

### Phase 2: Edit + Export (3-4 days)

4. **Edit mode** — contenteditable blocks with save/cancel
5. **PDF export** — canvas-to-PDF using browser print styles or canvas element
6. **PNG export** — HTML5 Canvas to PNG (1200x900)
7. **Mobile responsive** — single column, collapsible cards

### Phase 3: Polish (2-3 days)

8. **Confidence indicators** — colored dots per block
9. **Auto-populate animation** — staggered fill with skeleton loaders
10. **Share link** — encode canvas in URL params or store in localStorage
11. **Copy to clipboard** — plain text version of all 9 blocks

---

## 1.5 Integration Points

- **→ Feature 2 (Marketplace):** The canvas becomes the "product page" for a listed idea. Each marketplace listing links to the full canvas.
- **→ Feature 3 (Competitive Positioning):** The Unfair Advantage block references the competitive positioning data. "Your idea is positioned differently from 80% of similar ideas because..."
- **→ Feature 4 (Heatmap):** The Customer Segments block can link to the heatmap: "See where this segment exists globally →"
- **→ Existing pipeline:** Canvas is generated from the same `evaluate()` output. No new data collection needed.

---

---

# FEATURE 2: SOCIAL IMPACT MARKETPLACE

## 2.1 The "Wow" — What Makes It Genuinely Innovative

**What exists today:**
- **Product Hunt** — tech products, upvoting, maker profiles. No social impact focus. No credibility scoring.
- **Ashoka Fellowship** — curated social entrepreneurs. Expert-selected, not open. No discovery for new ideas.
- **Skoll World Forum** — annual event, elite. Not a discovery platform.
- **GlobalGiving** — donation platform for existing projects. Not for ideas/early-stage.
- **Kickstarter/Indiegogo** — crowdfunding. No impact scoring. No cultural fit analysis.
- **UN SDG Action Campaign** — showcases, not discovery. No upvoting, no filtering by feasibility.

**What none of them do:**
- Auto-generate a credibility-scored listing from an evaluation (no manual form filling)
- Filter ideas by SDG alignment, cultural fit score, bootstrapper feasibility, AND economic tier simultaneously
- Show a "cultural heat score" — how well this idea fits the target culture (not just a category tag)
- Use a research-backed scoring methodology (Shizuoka Method) as the credibility engine
- Let anyone submit an idea and get a data-driven credibility score before it goes live (quality filter)

**The wow moment:** A funder in Nairobi opens the marketplace. They filter by: SDG 3 (Health) + East Africa zone + Bootstrapper score > 7 + Cultural fit > 6. They see 12 ideas, each with a credibility score, a one-line pitch, the country, the SDG targets, and a "cultural fit heatmap" showing how well the idea matches the target culture. They click one idea and see the full Lean Canvas, the evaluation score, the case study match, and a "Connect with Founder" button. No other platform combines research-backed credibility scoring with cultural fit data for social impact discovery.

**Why this matters:** Social impact ideas don't have a Product Hunt. There's no place where a social entrepreneur can showcase their evaluated idea and be discovered by funders, mentors, or co-founders based on data — not just a pitch deck. This creates that place.

---

## 2.2 Data Pipeline — What Powers It

### Listing Data (auto-generated from evaluation)

Every evaluated idea becomes a marketplace listing with these fields:

```python
def generate_listing(parsed: dict, all_analysis: dict, canvas: dict) -> dict:
    """Convert evaluation into a marketplace listing."""
    return {
        # Identity
        "id": uuid4().hex[:8],
        "idea_summary": parsed["hook"],         # 100-char hook from parse_idea
        "idea_type": parsed["idea_type"],
        "country": parsed["country"],
        "country_name": country_data["name"],
        "economic_tier": parsed["community"]["economic_tier"],
        
        # Scores (from pipeline)
        "total_score": verdict["total_score"],
        "verdict": verdict["verdict"],
        "bootstrapper_score": bootstrapper["bootstrapper_score"],
        "cultural_fit": cultural["cultural_score"],
        "community_strength": three_tests["community_score"],
        "impact_score": impact.get("impact_score", 0),
        
        # SDG alignment
        "sdgs": {
            "primary": sdgs["primary"]["name"],
            "primary_targets": sdgs["primary"]["targets"],
            "secondary": sdgs["secondary"]["name"],
        },
        
        # Cultural fit breakdown (for heatmap display)
        "cultural_dimensions": {
            "pdi": {"score": int, "barrier": str},
            "idv": {"score": int, "barrier": str},
            "mas": {"score": int, "barrier": str},
            "uai": {"score": int, "barrier": str},
            "lto": {"score": int, "barrier": str},
            "ivr": {"score": int, "barrier": str},
        },
        
        # Case study reference
        "case_study_match": {
            "title": str,
            "organization": str,
            "relevance": float,   # match score
        },
        
        # Canvas (link to Feature 1)
        "canvas_blocks": canvas,
        
        # Marketplace-specific
        "upvotes": 0,
        "views": 0,
        "founder_id": str,        # anonymous or linked
        "created_at": ISO datetime,
        "status": "active",       # active / funded / pivoted / shelved
        
        # Credibility badge
        "credibility": {
            "level": str,          # "research-validated" / "community-tested" / "idea-stage"
            "badge_color": str,    # Gold / Silver / Bronze
            "basis": str,          # "Scored 7.8/10 via Shizuoka Method | Matched to BRAC case study"
        },
    }
```

### Credibility Badge Logic

| Score Range | Badge | Color | Label |
|---|---|---|---|
| 8.0-10.0 | Gold | `#F5A623` | "Research-Validated" |
| 6.0-7.9 | Silver | `#94A3B8` | "Community-Tested" |
| 4.0-5.9 | Bronze | `#CD7F32` | "Idea-Stage" |
| < 4.0 | (not listed) | — | Show "Needs Refinement" with specific feedback |

**Quality filter:** Ideas scoring below 4.0 are NOT listed in the marketplace. They receive their evaluation but are told: "Your idea needs more development before it's ready for the marketplace. Here's what to work on: [specific blockers]." This maintains quality and protects founders from premature exposure.

### Filtering Dimensions

| Filter | Data Source | Filter Type |
|---|---|---|
| **SDG** | `sdgs["primary"]["name"]` | Multi-select (17 SDGs) |
| **Zone** | `zones.json` zone mapping | Multi-select (11 zones) |
| **Country** | `parsed["country"]` | Multi-select (136 countries) |
| **Economic Tier** | `parsed["community"]["economic_tier"]` | Multi-select (T1-T4) |
| **Score Range** | `verdict["total_score"]` | Slider (4.0-10.0) |
| **Bootstrapper** | `bootstrapper["bootstrapper_score"]` | Slider (0-10) |
| **Cultural Fit** | `cultural["cultural_score"]` | Slider (0-10) |
| **Idea Type** | `parsed["idea_type"]` | Multi-select (12+ types) |
| **Status** | `listing["status"]` | Multi-select |
| **Sort** | — | Dropdown: Score / Recent / Most Viewed / Most Upvoted |

---

## 2.3 UI Specification — How It Looks

### Discovery Page (Main Marketplace)

```
┌─────────────────────────────────────────────────────────────┐
│  IMPACT MARKETPLACE                                         │
│  "Ideas worth testing. Scored by research, not hype."       │
│                                                             │
│  ┌─ FILTERS ──────────────────────────────────────────────┐ │
│  │ SDG: [All ▼]  Zone: [All ▼]  Tier: [All ▼]            │ │
│  │ Score: [====○====] 6.0+   Bootstrapper: [====○====] 5+ │ │
│  │ Sort: [Highest Score ▼]                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  47 ideas found                                             │
│                                                             │
│  ┌─ LISTING CARD ──────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  🥇 Research-Validated              Score: 8.2/10       │ │
│  │                                                         │ │
│  │  "Menstrual health products via community               │ │
│  │   health workers in rural Bangladesh"                   │ │
│  │                                                         │ │
│  │  🇧🇩 Bangladesh  T2-T3  Bootstrapper: 7.5/10           │ │
│  │                                                         │ │
│  │  SDG 3: Good Health  •  SDG 5: Gender Equality         │ │
│  │                                                         │ │
│  │  ┌─ CULTURAL FIT ─┐  ┌─ SIMILAR TO ──────────────────┐ │ │
│  │  │ ████████░░ 7.2  │  │ BRAC Community Health        │ │ │
│  │  │ PDI: ✓  IDV: ✓  │  │ Match: 85%                   │ │ │
│  │  │ UAI: !  MAS: ✓  │  └─────────────────────────────┘ │ │
│  │  └─────────────────┘                                    │ │
│  │                                                         │ │
│  │  👆 23 upvotes  👁 156 views                            │ │
│  │                                                         │ │
│  │  [View Canvas]  [Full Evaluation]  [Connect]            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ LISTING CARD 2 ────────────────────────────────────────┐ │
│  │  ...                                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [Load More]                                                │
└─────────────────────────────────────────────────────────────┘
```

### Listing Detail Page (Click a card)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Marketplace                                      │
│                                                             │
│  🥇 Research-Validated              Score: 8.2/10           │
│  "Menstrual health products via community health            │
│   workers in rural Bangladesh"                              │
│                                                             │
│  ┌─ QUICK STATS ─────────────────────────────────────────┐  │
│  │ Country: Bangladesh  |  Tier: T2-T3  |  Type: Health  │  │
│  │ SDG 3: Good Health   |  SDG 5: Gender Equality        │  │
│  │ Bootstrapper: 7.5/10 |  Cultural Fit: 7.2/10          │  │
│  │ 👆 23 upvotes        |  👁 156 views                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ SOCIAL IMPACT CANVAS ─────────────────────────────────┐  │
│  │  (Feature 1 canvas, embedded)                           │  │
│  │  Problem | Solution | UVP | Unfair Advantage | ...      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ CULTURAL FIT DETAIL ──────────────────────────────────┐  │
│  │  Radar chart showing 6 Hofstede dimensions              │  │
│  │  with barrier/strength annotations                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ SIMILAR IDEAS (from case studies) ────────────────────┐  │
│  │  1. BRAC Community Health — 85% match — Active          │  │
│  │  2. Grameen Bank — 72% match — Active                   │  │
│  │  3. ASHA Workers — 68% match — Active                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ FULL EVALUATION ──────────────────────────────────────┐  │
│  │  [Expand to see 8-section evaluation report]            │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  [👆 Upvote]  [📤 Share]  [💬 Connect with Founder]         │
│  [📊 View Global Heatmap]  [📄 Download Canvas PDF]        │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (360px)

- Filters: collapsible drawer (tap "Filters" to expand)
- Listing cards: full-width, stacked
- Cultural fit: horizontal bar instead of radar chart
- Detail page: single column, all sections collapsible
- Sticky bottom bar: [Upvote] [Share] [Connect]

### Interactions

1. **Upvote:** Click once to upvote (toggle). Visual feedback: number increments with a brief scale animation. No login required (localStorage-based, with future account system).

2. **Filter:** Real-time filtering as user adjusts. No "Apply" button. Listing count updates immediately. URL reflects filters (shareable filtered views).

3. **Connect:** Opens a modal: "Leave your email or WhatsApp number. We'll introduce you if the founder is interested." Stored server-side, not displayed publicly.

4. **Share:** Copy link, WhatsApp share, Twitter share. Link includes idea ID and opens the detail page.

5. **Cultural Fit Mini-Chart:** On listing cards, a compact horizontal bar showing overall cultural fit score (0-10). On hover/tap, expand to show 6 dimension dots (one per Hofstede dimension) with barrier icons.

---

## 2.4 MVP Implementation — Smallest Thing That Delivers the Wow

### Phase 1: Static Listings Page (2-3 days)

1. **`generate_listing()` function** (~80 lines in evaluator.py)
   - Converts evaluation output to listing format
   - Assigns credibility badge based on score
   - Returns JSON listing object

2. **Listings storage** — JSON file initially (`data/listings.json`)
   - Each evaluation generates a listing (opt-in: checkbox on submission)
   - Simple append to JSON array
   - No database needed for MVP

3. **Marketplace page** — new `marketplace.html` (~300 lines)
   - Reads listings from JSON
   - Displays listing cards in a grid
   - Basic filtering (SDG, zone, score range)
   - Click card to expand (show full evaluation inline)
   - Upvote with localStorage (no server-side persistence yet)

4. **Integration with evaluation flow** — modify `index.html`
   - After evaluation, show checkbox: "List this idea in the marketplace?"
   - If checked, POST listing data to `/api/list` endpoint
   - New endpoint in server.py: `handle_list()` — saves to listings.json

### Phase 2: Interactive Marketplace (1 week)

5. **Server-side filtering** — `/api/marketplace?sdg=3&zone=south_asia&min_score=6`
6. **Upvote persistence** — simple JSON-based vote tracking (IP + idea ID)
7. **Detail page** — dedicated page per listing with canvas, cultural fit, case studies
8. **Connect modal** — email/WhatsApp form, stored server-side

### Phase 3: Growth Features (2-3 weeks)

9. **Sorting** — by score, recency, views, upvotes
10. **View tracking** — count views per listing
11. **Founder profiles** — optional name/bio/link
12. **Share links** — WhatsApp, Twitter, copy link
13. **Email digest** — weekly "Top 5 New Ideas" email to subscribers

---

## 2.5 Integration Points

- **← Feature 1 (Lean Canvas):** Each listing embeds the full canvas. The canvas is the "product page" of the marketplace.
- **→ Feature 3 (Competitive Positioning):** The "Similar Ideas" section on the detail page uses the competitive positioning engine. Shows case study matches with positioning data.
- **→ Feature 4 (Heatmap):** The "View Global Heatmap" button on the detail page opens the heatmap pre-filtered to this idea's type. Shows where this idea would score highest globally.
- **← Existing pipeline:** Every evaluation can become a marketplace listing. The pipeline is the quality filter (score < 4.0 = not listed).

---

---

# FEATURE 3: COMPETITIVE POSITIONING ENGINE

## 3.1 The "Wow" — What Makes It Genuinely Innovative

**What exists today:**
- **CB Insights** — startup competitive analysis. Focuses on funding, market share, tech. No cultural dimension. No social impact focus.
- **Crunchbase** — company database. Search by industry. No positioning maps. No success/failure pattern analysis.
- **SimilarWeb** — website traffic comparison. Not applicable to social impact ideas.
- **Porter's Five Forces tools** — generic business strategy. No cultural awareness.
- **Social impact databases (Ashoka, Skoll)** — lists of organizations, but no competitive comparison. No "here's how your idea compares to these 5 organizations."

**What none of them do:**
- Auto-find 3-5 similar social impact ideas from a database of 165 real-world case studies based on idea type, category relations, AND cultural context
- Show success/failure patterns: "Of the 5 similar ideas, 3 succeeded because of X, 2 failed because of Y"
- Position the user's idea on a 2D map (ease vs. impact) relative to similar ideas
- Generate a radar chart comparing the user's idea across multiple dimensions (cultural fit, community strength, bootstrapper feasibility, impact potential)
- Use category relations for fuzzy matching ("your health idea is similar to these education ideas because both target women in South Asia")

**The wow moment:** A social entrepreneur submits an idea for "solar-powered water purifiers in rural Kenya." The system finds 4 similar case studies: Liter of Light (solar lighting in Philippines, succeeded), Kopernik (last-mile tech distribution in Indonesia, succeeded), a clean cookstove project in Kenya (failed — distribution model was wrong), and a water filter project in India (succeeded — used ASHA workers). The radar chart shows the user's idea has higher bootstrapper feasibility than all 4, but lower cultural fit than 2 of them. The positioning map shows the user's idea in the "high impact, moderate ease" quadrant — the same quadrant as Liter of Light. The pattern summary says: "Solar technology ideas succeed when they use existing community networks for distribution. The Kenyan clean cookstove failed because it tried to build its own distribution. Partner with existing community health workers."

**Why this matters:** Social entrepreneurs build in isolation. They don't know that someone in the Philippines already solved a similar problem, or that someone in India tried the same approach and failed. This feature gives them a competitive landscape that's grounded in real data, not theory.

---

## 3.2 Data Pipeline — What Powers It

### Step 1: Expand from 1 Match to 3-5 Matches

The existing `find_case_study()` function returns ONE match. We need a new function that returns 3-5 matches with relevance scores.

```python
def find_similar_ideas(parsed: dict, max_results: int = 5) -> list:
    """Find 3-5 similar ideas from the case study library."""
    # Strategy 1: Same category + same zone (exact match)
    # Strategy 2: Related category + same zone (partial match)
    # Strategy 3: Same category + different zone (cross-cultural match)
    # Strategy 4: Related category + different zone (stretch match)
    
    # Score each case study by:
    #   - Category match (exact = 1.0, related = 0.6, same domain = 0.3)
    #   - Zone match (same = +0.2)
    #   - Economic tier match (same = +0.1)
    #   - SDG overlap (if available) (+0.1 per shared SDG)
    
    # Return top N sorted by relevance score
    # Include both successes AND failures (status field)
    
    results = []
    for case in all_case_studies:
        score = calculate_similarity(parsed, case)
        if score > 0.3:  # minimum threshold
            results.append({
                "case_study": case,
                "relevance": score,
                "match_type": classify_match(score),
                "status": case.get("status", "unknown"),
            })
    
    results.sort(key=lambda x: x["relevance"], reverse=True)
    return results[:max_results]
```

### Step 2: Pattern Analysis

```python
def analyze_patterns(similar_ideas: list) -> dict:
    """Extract success/failure patterns from similar ideas."""
    successes = [s for s in similar_ideas if s["case_study"].get("status") == "Active"]
    failures = [s for s in similar_ideas if s["case_study"].get("status") in ("Failed", "Closed", "Merged")]
    
    return {
        "success_count": len(successes),
        "failure_count": len(failures),
        "success_patterns": extract_common_factors(successes, "what_worked"),
        "failure_patterns": extract_common_factors(failures, "what_didnt_work"),
        "key_lessons": [s["case_study"].get("key_lesson", "") for s in similar_ideas],
        "what_works_across": aggregate_what_works(successes),
        "what_fails_across": aggregate_what_fails(failures),
    }
```

### Step 3: Positioning Data

```python
def generate_positioning_data(parsed: dict, all_analysis: dict, similar_ideas: list) -> dict:
    """Generate data for radar chart and positioning map."""
    user_scores = {
        "cultural_fit": all_analysis["cultural_analysis"]["cultural_score"],
        "community_strength": all_analysis["three_tests"]["community_score"],
        "bootstrapper": all_analysis["bootstrapper_score"]["bootstrapper_score"],
        "impact_potential": all_analysis.get("impact_score", {}).get("impact_score", 0) / 10,
        "education_lever": all_analysis["education_analysis"]["score_after_education"] / 5,
    }
    
    comparable_scores = []
    for idea in similar_ideas:
        case = idea["case_study"]
        # Infer scores from case study data (imperfect but useful for positioning)
        comparable_scores.append({
            "name": case.get("organization", case.get("title", "Unknown")),
            "country": case.get("country", "Unknown"),
            "status": case.get("status", "Unknown"),
            "relevance": idea["relevance"],
            # These are estimated from the case study's impact and model
            "estimated_scores": estimate_case_scores(case),
        })
    
    return {
        "user_idea": user_scores,
        "comparables": comparable_scores,
        "positioning_map": {
            "x_axis": "ease_of_starting",    # bootstrapper + community
            "y_axis": "impact_potential",      # impact score + SDG reach
            "user_position": calculate_position(user_scores),
            "comparable_positions": [calculate_position(c["estimated_scores"]) for c in comparable_scores],
        },
    }
```

### Data Structure: Complete Output

```python
competitive_output = {
    "similar_ideas": [
        {
            "title": str,
            "organization": str,
            "country": str,
            "category": str,
            "relevance": float,        # 0.0-1.0
            "match_type": str,         # "exact" / "related" / "cross-cultural"
            "status": str,             # "Active" / "Failed" / "Closed"
            "what_worked": [str],
            "what_didnt_work": [str],
            "key_lesson": str,
            "impact_summary": str,
            "model_summary": str,
        },
        # ... 3-5 items
    ],
    "pattern_analysis": {
        "success_count": int,
        "failure_count": int,
        "success_patterns": [str],     # Common factors in successful ideas
        "failure_patterns": [str],     # Common factors in failed ideas
        "key_lessons": [str],          # Top lessons from all similar ideas
    },
    "positioning": {
        "radar_chart": {
            "dimensions": ["Cultural Fit", "Community", "Bootstrapper", "Impact", "Education Lever"],
            "user_scores": [float, ...],
            "comparable_scores": [{"name": str, "scores": [float, ...]}],
        },
        "positioning_map": {
            "x_label": "Ease of Starting",
            "y_label": "Impact Potential",
            "user": {"x": float, "y": float, "label": str},
            "comparables": [{"x": float, "y": float, "label": str, "status": str}],
        },
    },
    "recommendation": str,  # "Your idea is positioned closest to [X]. Here's what you can learn from their path."
}
```

---

## 3.3 UI Specification — How It Looks

### Competitive Positioning Section (in evaluation results)

```
┌─────────────────────────────────────────────────────────────┐
│  HOW DOES YOUR IDEA COMPARE?                                │
│  "We found 4 similar ideas. Here's what we can learn."      │
│                                                             │
│  ┌─ RADAR CHART ──────────────┐  ┌─ POSITIONING MAP ──────┐ │
│  │         Cultural           │  │  High Impact            │ │
│  │        /    \              │  │     ★ Liter of Light    │ │
│  │  Education  Community      │  │     ● Your Idea         │ │
│  │    |    \  /    |          │  │     ○ Kopernik          │ │
│  │  Bootstrapper  Impact      │  │                         │ │
│  │                           │  │  ○ Cookstove KE (failed) │ │
│  │  ── Your Idea (── Avg)    │  │     ★ Water Filter IN    │ │
│  │  -- Liter of Light        │  │                         │ │
│  │  .. Kopernik              │  │  Low Ease ──── High Ease │ │
│  └───────────────────────────┘  └─────────────────────────┘ │
│                                                             │
│  ┌─ SIMILAR IDEAS ─────────────────────────────────────────┐ │
│  │                                                         │ │
│  │  1. Liter of Light — Solar lighting, Philippines         │ │
│  │     Match: 85%  |  Status: Active  |  Founded: 2011     │ │
│  │     What worked: Ultra-low-cost tech, community training │ │
│  │     What didn't: Limited lifespan of bottle lamps        │ │
│  │     Lesson: "Teach them to build it themselves."         │ │
│  │                                                         │ │
│  │  2. Kopernik — Last-mile tech, Indonesia                 │ │
│  │     Match: 72%  |  Status: Active  |  Founded: 2010     │ │
│  │     What worked: Local distribution networks              │ │
│  │     What didn't: Logistics in remote islands             │ │
│  │     Lesson: "The technology exists. Solve the last mile."│ │
│  │                                                         │ │
│  │  3. Clean Cookstove Project — Kenya                      │ │
│  │     Match: 68%  |  Status: Failed                        │ │
│  │     What didn't: Built own distribution instead of using │ │
│  │     existing community networks                          │ │
│  │     Lesson: "Don't build what already exists."           │ │
│  │                                                         │ │
│  │  [Show all 4 →]                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ PATTERN SUMMARY ───────────────────────────────────────┐ │
│  │  ✅ What works across similar ideas:                     │ │
│  │     • Community-based distribution (3 of 4)              │ │
│  │     • Ultra-low-cost technology (2 of 4)                 │ │
│  │     • Training local people to maintain/operate (3 of 4) │ │
│  │                                                         │ │
│  │  ❌ What fails across similar ideas:                     │ │
│  │     • Building your own distribution network (2 of 4)    │ │
│  │     • Technology that needs specialized maintenance (1 of │ │
│  │       4)                                                 │ │
│  │                                                         │ │
│  │  💡 Top lesson: "The technology exists. The problem is   │ │
│  │     distribution. Solve the last mile."                  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Chart Implementation (MVP)

**Radar Chart:** SVG-based, no library. 5 dimensions plotted as a pentagon. User's idea as a filled polygon. Comparable ideas as outline polygons. Hover/click on a dimension shows the score and explanation.

**Positioning Map:** SVG-based scatter plot. X = Ease of Starting (bootstrapper + community), Y = Impact Potential. User's idea as a filled circle. Case studies as open circles (green = Active, red = Failed). Click a dot to see the case study summary.

Both charts: 400x400px on desktop, 100% width on mobile. Dark theme with color coding from DESIGN.md.

### Mobile Layout (360px)

- Charts: full-width, stacked vertically
- Similar ideas: collapsible cards (tap to expand)
- Pattern summary: always visible (most valuable section)
- Positioning map: simplified (no SVG, just a text-based quadrant description)

---

## 3.4 MVP Implementation — Smallest Thing That Delivers the Wow

### Phase 1: Multi-Match + Pattern Analysis (2-3 days)

1. **`find_similar_ideas()` function** (~100 lines in evaluator.py)
   - Search both library.json (75 cases) and zones-library.json (110+ cases)
   - Score by category match, zone match, economic tier
   - Return top 3-5 with relevance scores
   - Include both successes and failures

2. **`analyze_patterns()` function** (~60 lines)
   - Extract common factors from what_worked / what_didnt_work
   - Generate success/failure pattern summaries
   - Collect key_lessons

3. **Integration with evaluation response**
   - Add `competitive_positioning` field to API response
   - Contains similar_ideas, pattern_analysis, positioning data

### Phase 2: Visual Charts (3-4 days)

4. **SVG radar chart** (~150 lines JS + CSS)
   - 5-dimension pentagon
   - User + up to 3 comparables overlaid
   - Hover for score details
   - Responsive (scales to container width)

5. **SVG positioning map** (~100 lines JS + CSS)
   - Scatter plot with labeled dots
   - Click dot for case study summary
   - Quadrant labels ("High Impact / High Ease" etc.)

6. **Pattern summary cards** (~50 lines HTML/CSS)
   - Success patterns (green checkmarks)
   - Failure patterns (red X marks)
   - Top lesson (highlighted)

### Phase 3: Polish (2 days)

7. **Animated chart rendering** — dots appear one by one
8. **Click-through to case study detail** — expand full case study inline
9. **"Your positioning" summary** — natural language interpretation of the charts
10. **Mobile responsive** — text-based fallback for charts on small screens

---

## 3.5 Integration Points

- **← Existing pipeline:** Uses `find_case_study()` logic expanded to return multiple matches. Uses `CATEGORY_RELATED` map for fuzzy matching. Uses all 165 case studies from both libraries.
- **→ Feature 2 (Marketplace):** The "Similar Ideas" section on marketplace detail pages uses this engine. Each listing shows its competitive positioning.
- **→ Feature 1 (Canvas):** The Unfair Advantage block references the positioning data: "Your idea is positioned differently from 80% of similar ideas because..."
- **→ Feature 4 (Heatmap):** The heatmap can show "where similar ideas succeeded" as an overlay layer.

---

---

# FEATURE 4: GLOBAL CULTURAL HEATMAP

## 4.1 The "Wow" — What Makes It Genuinely Innovative

**What exists today:**
- **Hofstede Insights website** (hofstede-insights.com) — shows country comparison tool. You select 2-3 countries and see their Hofstede scores side by side. No idea scoring. No heatmap. No "where would my idea work best?"
- **World Bank Data** — country-level economic data. No cultural dimensions. No idea scoring.
- **Gapminder** — Hans Rosling's interactive data visualization. Economic/demographic data. No Hofstede. No social impact scoring.
- **Cultural mapping tools** — academic tools for comparing cultures. No application to idea evaluation.
- **Google Trends** — shows where a topic is trending. No cultural fit analysis. No idea scoring.

**What none of them do:**
- Take a specific social impact idea and score it across 136 countries simultaneously
- Visualize on a world map where an idea has the highest cultural fit, community viability, and overall score
- Combine Hofstede cultural dimensions with economic tier data and idea-specific factors in a single heatmap
- Let the user interactively explore: "What if I launched this same idea in a different country?"
- Show the delta: "Your idea scores 7.2 in Bangladesh but 8.1 in Kenya. Here's why."

**The wow moment:** A social entrepreneur submits their menstrual health idea for Bangladesh. The evaluation returns 7.2/10. Below the evaluation, a world map glows. Bangladesh is bright green (7.2). Neighboring India is also green (7.0). Kenya is brighter green (7.8). Japan is yellow (5.2 — high uncertainty avoidance blocks the idea). Sweden is red (3.8 — too individualistic, no community health worker network). The user clicks Kenya. A sidebar appears: "Your idea scores 7.8 in Kenya. +0.6 vs. Bangladesh. Why: Lower power distance (70 vs. 80) means health workers have more autonomy. Higher indulgence (32 vs. 20) means women are more open to discussing health. Stronger mobile money infrastructure for payments." The user thinks: "Maybe I should launch in Kenya first."

**Why this matters:** Social entrepreneurs usually think about their own country. This feature shows them the global landscape — where their idea has tailwinds and where it has headwinds. It turns a single-country evaluation into a global strategy tool.

---

## 4.2 Data Pipeline — What Powers It

### Core Data: 136 Countries with Hofstede Scores

From `data/hofstede-database.json`:
```json
{
  "BD": {"name": "Bangladesh", "code": "BD", "pdi": 80, "idv": 20, "mas": 55, "uai": 60, "lto": 47, "ivr": 20, "region": "South Asia", "income": "Lower-middle", "zone": "south_asia"},
  "KE": {"name": "Kenya", "code": "KE", "pdi": 70, "idv": 25, "mas": 60, "uai": 50, "lto": 38, "ivr": 32, "region": "Sub-Saharan Africa", "income": "Lower-middle", "zone": "sub_saharan_africa"},
  // ... 134 more countries
}
```

### Scoring Algorithm: Score Any Idea Against Any Country

The evaluator already scores an idea against ONE country. We need to run the scoring against ALL 136 countries. The key insight: most of the scoring logic is **idea-dependent, not country-dependent**. The idea type, community viability, and bootstrapper score change slowly across countries. What changes dramatically is the **cultural analysis** (Layer 3).

```python
def score_idea_globally(parsed: dict, all_analysis: dict) -> dict:
    """Score a single idea against all 136 countries."""
    with open(DATA_DIR / "hofstede-database.json") as f:
        hofstede_db = json.load(f)
    
    global_scores = {}
    
    for code, country in hofstede_db["countries"].items():
        # Layer 3 changes per country
        country_cultural = score_cultural_for_country(parsed, country)
        
        # Layer 4 (education) depends on Layer 3
        country_education = score_education_for_country(country_cultural, country)
        
        # Layers 2, 5, 6, 7 are mostly constant (idea-dependent)
        # But we adjust for economic tier differences
        country_tier = map_income_to_tier(country.get("income", ""))
        tier_adjustment = calculate_tier_adjustment(parsed["community"]["economic_tier"], country_tier)
        
        # Composite score with country-specific cultural + education
        country_score = (
            all_analysis["three_tests"]["community_score"] * 0.30 +
            country_cultural["cultural_score"] * 0.15 +
            country_education["score"] * 0.15 +
            all_analysis["bootstrapper_score"]["bootstrapper_score"] * 0.20 +
            all_analysis.get("impact_score", {}).get("impact_score", 50) / 10 * 0.20 +
            tier_adjustment
        )
        
        global_scores[code] = {
            "name": country["name"],
            "score": round(country_score, 1),
            "verdict": score_to_verdict(country_score),
            "cultural_score": round(country_cultural["cultural_score"], 1),
            "top_barrier": country_cultural.get("top_barrier", ""),
            "top_strength": country_cultural.get("top_strength", ""),
            "region": country.get("region", ""),
            "income": country.get("income", ""),
            "zone": country.get("zone", ""),
        }
    
    return global_scores
```

### Performance Optimization

Scoring 136 countries in real-time is feasible because:
- The cultural scoring is simple math (no API calls, no heavy computation)
- Total computation: ~136 × 6 dimension comparisons = ~816 comparisons
- Estimated time: < 1 second on any modern machine
- No external dependencies needed

For the MVP, we compute all 136 scores server-side and return them in the API response. For the web version, we can compute client-side (the hofstede-database.json is ~50KB, easily loaded in browser).

### Output Data Structure

```python
heatmap_output = {
    "idea_summary": str,
    "origin_country": str,
    "origin_score": float,
    "global_average": float,
    "global_median": float,
    "top_5_countries": [
        {"code": str, "name": str, "score": float, "delta": float, "reason": str},
    ],
    "bottom_5_countries": [
        {"code": str, "name": str, "score": float, "delta": float, "reason": str},
    ],
    "country_scores": {
        "BD": {"name": "Bangladesh", "score": 7.2, "verdict": "GO_WITH_EDUCATION", "cultural": 6.8, "barrier": "High power distance", "strength": "Strong community networks", "region": "South Asia", "income": "Lower-middle", "zone": "south_asia"},
        "KE": {"name": "Kenya", "score": 7.8, "verdict": "GO", "cultural": 7.5, "barrier": "Moderate uncertainty avoidance", "strength": "Mobile money infrastructure", "region": "Sub-Saharan Africa", "income": "Lower-middle", "zone": "sub_saharan_africa"},
        # ... 134 more
    },
    "insights": [
        "Your idea scores highest in Sub-Saharan Africa (avg 7.1) and South Asia (avg 6.8).",
        "The biggest barrier in low-scoring countries is [dimension] — [practical meaning].",
        "Consider launching in [top country] first — it scores +0.6 higher than your home country.",
    ],
}
```

---

## 4.3 UI Specification — How It Looks

### Heatmap Section (below evaluation results)

```
┌─────────────────────────────────────────────────────────────┐
│  WHERE IN THE WORLD WOULD YOUR IDEA WORK BEST?              │
│  "Your idea scored 7.2 in Bangladesh. Here's how it         │
│   scores across 136 countries."                             │
│                                                             │
│  ┌─ WORLD MAP ─────────────────────────────────────────────┐ │
│  │                                                         │ │
│  │    ┌─────────────────────────────────────────────┐      │ │
│  │    │                                             │      │ │
│  │    │         [Interactive SVG World Map]          │      │ │
│  │    │                                             │      │ │
│  │    │    Color scale:                              │      │ │
│  │    │    🔴 3-5 (Low)  🟡 5-7 (Medium)  🟢 7-10 (High) │ │
│  │    │                                             │      │ │
│  │    │    Bangladesh: ● 7.2 (your country)          │      │ │
│  │    │    Kenya: ● 7.8 (top scorer)                 │      │ │
│  │    │                                             │      │ │
│  │    └─────────────────────────────────────────────┘      │ │
│  │                                                         │ │
│  │  Legend: 🔴 Low fit (3-5)  🟡 Moderate (5-7)  🟢 Strong (7+)│
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ TOP 5 COUNTRIES ──────────────────────────────────────┐ │
│  │  1. 🇰🇪 Kenya          7.8/10  (+0.6 vs. Bangladesh)   │ │
│  │     "Lower power distance means health workers have     │ │
│  │      more autonomy. Strong mobile money for payments."  │ │
│  │                                                         │ │
│  │  2. 🇧🇩 Bangladesh      7.2/10  (your country)          │ │
│  │     "Strong community networks. High collectivism."     │ │
│  │                                                         │ │
│  │  3. 🇮🇳 India           7.0/10  (-0.2 vs. Bangladesh)   │ │
│  │     "Similar cultural profile. ASHA worker network      │ │
│  │      provides distribution infrastructure."             │ │
│  │                                                         │ │
│  │  4. 🇵🇭 Philippines     6.8/10  (-0.4 vs. Bangladesh)   │ │
│  │     "Community-based distribution works well."          │ │
│  │                                                         │ │
│  │  5. 🇺🇬 Uganda          6.7/10  (-0.5 vs. Bangladesh)   │ │
│  │     "Growing health tech ecosystem. Mobile-first."      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ BOTTOM 5 (Where it's hardest) ─────────────────────────┐ │
│  │  132. 🇸🇪 Sweden         3.8/10  (-3.4)                  │ │
│  │       "Too individualistic for community health model." │ │
│  │  133. 🇯🇵 Japan          3.6/10  (-3.6)                  │ │
│  │       "High uncertainty avoidance blocks new health     │ │
│  │        approaches."                                     │ │
│  │  ...                                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ REGIONAL BREAKDOWN ────────────────────────────────────┐ │
│  │  Sub-Saharan Africa    avg 6.8  ████████████░░░          │ │
│  │  South Asia            avg 6.5  ███████████░░░░          │ │
│  │  Southeast Asia        avg 6.2  ██████████░░░░░          │ │
│  │  Latin America         avg 5.8  █████████░░░░░░          │ │
│  │  Middle East           avg 5.4  ████████░░░░░░░          │ │
│  │  East Asia             avg 4.9  ███████░░░░░░░░          │ │
│  │  Europe East           avg 4.7  ██████░░░░░░░░░          │ │
│  │  Europe West           avg 4.2  █████░░░░░░░░░░          │ │
│  │  North America         avg 4.0  █████░░░░░░░░░░          │ │
│  │  Oceania               avg 3.9  ████░░░░░░░░░░░          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ KEY INSIGHT ───────────────────────────────────────────┐ │
│  │  "Your idea has the strongest cultural fit in           │ │
│  │   Sub-Saharan Africa and South Asia — regions with      │ │
│  │   high collectivism and strong community health         │ │
│  │   networks. Consider Kenya or Uganda as expansion       │ │
│  │   markets after Bangladesh."                            │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Map Interactions

1. **Hover:** Country highlights + tooltip shows: Country name, score, verdict badge, top barrier, top strength
2. **Click:** Country detail panel slides in from right (or expands below on mobile):
   - Country name + flag emoji
   - Score vs. origin country (delta with arrow)
   - Cultural dimension breakdown (6 mini-bars)
   - Top barrier + workaround
   - Top strength
   - Economic tier
   - Zone + region
3. **Zoom:** Click to zoom into a region (Africa, Asia, Europe, Americas). Click again to zoom out.
4. **Filter by score:** Slider to highlight only countries scoring above a threshold (e.g., "Show only countries scoring 6+")

### Color Scale

Using a diverging color scale centered on the origin country's score:

| Score Range | Color | Meaning |
|---|---|---|
| 8.0-10.0 | Deep green `#1B4332` | Strong fit — consider this market |
| 7.0-7.9 | Green `#2D6A4F` | Good fit — viable market |
| 6.0-6.9 | Light green `#52B788` | Moderate fit — some barriers |
| 5.0-5.9 | Yellow `#F5A623` | Mixed — significant barriers |
| 4.0-4.9 | Orange `#E67E22` | Weak fit — major barriers |
| 3.0-3.9 | Red `#E74C3C` | Poor fit — idea needs major adaptation |
| < 3.0 | Dark red `#922B21` | Not viable without fundamental redesign |

### Mobile Layout (360px)

- Map: full-width, simplified (no hover, tap to select)
- Top 5 / Bottom 5: collapsible cards
- Regional breakdown: horizontal bars, scrollable
- Country detail: full-screen overlay on tap
- No zoom (too complex for touch)

---

## 4.4 MVP Implementation — Smallest Thing That Delivers the Wow

### Phase 1: Score Computation + Text Results (1-2 days)

1. **`score_idea_globally()` function** (~120 lines in evaluator.py)
   - Takes `parsed` + `all_analysis`
   - Runs cultural scoring against all 136 countries
   - Returns `heatmap_output` dict
   - Performance: < 1 second for 136 countries

2. **Integration with evaluation response**
   - Add `global_heatmap` field to API response
   - Contains country_scores, top_5, bottom_5, regional_breakdown, insights

3. **Text-based heatmap in CLI** (modify `format_report()`)
   - After Section 8, add: "WHERE YOUR IDEA WORKS BEST"
   - Show top 5 countries with scores and one-line reasons
   - Show regional averages

### Phase 2: Interactive Map (1 week)

4. **SVG world map** (~500 lines JS + CSS)
   - Simplified world map SVG (country paths)
   - Color-fill each country based on score
   - Hover for tooltip
   - Click for detail panel
   - Legend with color scale
   - Responsive (scales to container)

5. **Top 5 / Bottom 5 cards** (~100 lines HTML/CSS)
   - Country flag + name + score + delta + reason
   - Click to highlight on map

6. **Regional breakdown bars** (~80 lines HTML/CSS)
   - Horizontal bar chart
   - Sorted by average score
   - Click region to zoom map

### Phase 3: Polish (3-4 days)

7. **Country detail panel** (~150 lines)
   - Slide-in panel with full country analysis
   - 6-dimension mini-bars
   - Barrier + strength callouts
   - "Why this score" explanation

8. **Score comparison slider** — compare two countries side-by-side
9. **Insight generation** — natural language insights from the data
10. **Animation** — map fills in with a wave effect (scores appear sequentially by region)
11. **Export** — download heatmap as PNG, share link with pre-selected country

### SVG Map Data

For the MVP, use a simplified world map SVG. Options:
- **Natural Earth** (public domain) — detailed but large (~500KB)
- **Simplified 110m** — good balance of detail and size (~100KB)
- **Custom minimal** — hand-simplified for key countries (~50KB)

Recommended: Simplified 110m from Natural Earth, filtered to the 136 countries in hofstede-database.json. Pre-process to reduce SVG size to ~80KB.

---

## 4.5 Integration Points

- **← Existing pipeline:** Uses `run_cultural_analysis()` logic applied to each of 136 countries. Uses the same Hofstede dimension scoring, barrier detection, and HOFSTEDE_ADVICE interpretation.
- **← Feature 1 (Canvas):** The Customer Segments block can link to the heatmap: "See where this segment exists globally."
- **← Feature 2 (Marketplace):** Marketplace listings can show a mini-heatmap (top 3 countries as colored dots). Click "View Full Heatmap" to open the interactive map.
- **← Feature 3 (Competitive Positioning):** The heatmap can overlay "where similar ideas succeeded" as a second layer. Click a country to see which case studies are from that region.
- **→ Existing evaluation:** The heatmap adds strategic value to every evaluation. After the user sees their score, they see where else their idea could work. This extends the evaluation from "can this work here?" to "where should I launch first?"

---

---

# CROSS-FEATURE INTEGRATION MAP

```
┌─────────────────────────────────────────────────────────────┐
│                     USER SUBMITS IDEA                        │
│                         ↓                                    │
│              ┌─── evaluate() ───┐                           │
│              │   7-Layer Pipeline │                          │
│              └────────┬────────┘                            │
│                       │                                      │
│         ┌─────────────┼─────────────┐                       │
│         ↓             ↓             ↓                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ Feature 1 │  │ Feature 3 │  │ Feature 4 │                  │
│  │ Lean     │  │ Competitive│  │ Global   │                  │
│  │ Canvas   │  │ Positioning│  │ Heatmap  │                  │
│  └────┬─────┘  └─────┬────┘  └─────┬────┘                  │
│       │              │              │                        │
│       └──────┬───────┘              │                        │
│              ↓                      │                        │
│       ┌──────────┐                  │                        │
│       │ Feature 2 │←────────────────┘                        │
│       │ Marketplace│                                         │
│       └──────────┘                                           │
│              ↓                                               │
│       ┌──────────┐                                           │
│       │  Listing  │ → Browseable, filterable, upvotable      │
│       │  Page     │ → Links to Canvas + Heatmap + Positioning│
│       └──────────┘                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User submits idea** → `evaluate()` runs → produces `parsed` + `all_analysis`
2. **Feature 1 (Canvas):** `generate_canvas(parsed, all_analysis)` → 9-block canvas
3. **Feature 3 (Positioning):** `find_similar_ideas(parsed)` → 3-5 matches + patterns
4. **Feature 4 (Heatmap):** `score_idea_globally(parsed, all_analysis)` → 136 country scores
5. **Feature 2 (Marketplace):** `generate_listing(parsed, all_analysis, canvas)` → browsable listing
6. **All features return in a single API response** (no additional calls needed)

### API Response Shape (expanded)

```json
{
  "evaluation": {
    "parsed": {...},
    "three_tests": {...},
    "cultural_analysis": {...},
    "education_analysis": {...},
    "bootstrapper_score": {...},
    "case_study": {...},
    "verdict": {...},
    "sdgs": {...},
    "fad_risk": {...},
    "impact_score": {...},
    "report": "..."
  },
  "canvas": {
    "problem": {...},
    "solution": {...},
    "key_metrics": [...],
    "unique_value_proposition": {...},
    "unfair_advantage": {...},
    "channels": [...],
    "customer_segments": {...},
    "cost_structure": {...},
    "revenue_streams": [...]
  },
  "competitive_positioning": {
    "similar_ideas": [...],
    "pattern_analysis": {...},
    "positioning": {...}
  },
  "global_heatmap": {
    "country_scores": {...},
    "top_5": [...],
    "bottom_5": [...],
    "regional_breakdown": [...],
    "insights": [...]
  },
  "marketplace_listing": {
    "id": "...",
    "credibility": {...},
    "listing_url": "..."
  }
}
```

---

# IMPLEMENTATION PRIORITY

| Priority | Feature | Effort | Impact | Dependencies |
|---|---|---|---|---|
| **1** | Feature 3: Competitive Positioning | 5-7 days | HIGH — immediate value in every evaluation | Extends existing find_case_study() |
| **2** | Feature 4: Global Heatmap | 5-7 days | HIGH — "wow" factor, unique globally | Uses existing cultural scoring |
| **3** | Feature 1: Lean Canvas | 5-7 days | MEDIUM — professional output, shareable | Uses existing pipeline data |
| **4** | Feature 2: Marketplace | 2-3 weeks | HIGH — but needs Features 1 + 3 first | Depends on Features 1, 3, 4 |

**Recommended order:** 3 → 4 → 1 → 2

**Rationale:** Features 3 and 4 are "wow" features that enhance every evaluation immediately. They require no new UI pages — they add sections to the existing results. Feature 1 is a standalone deliverable that can be built in parallel. Feature 2 is the biggest lift but also the biggest payoff — it turns SEE from a tool into a platform. Build it last because it benefits from all three other features being ready.

---

# TECHNICAL CONSTRAINTS

1. **Zero dependencies** — all features must work with Python stdlib + vanilla JS. No React, no D3, no Leaflet. SVG charts and maps are hand-coded.
2. **No build tools** — works from `file://` or `python3 -m http.server`. No webpack, no npm.
3. **Performance** — all features must compute in < 3 seconds total. The heatmap (136 country scores) is the heaviest computation and should take < 1 second.
4. **Data integrity** — all features must handle missing data gracefully. If a country has no cultural profile, show Hofstede scores only. If no case studies match, show "No similar ideas found yet."
5. **Mobile-first** — every feature must work on 360px width. Desktop enhancements are bonus.
6. **Honest about limits** — if the system doesn't know something, say so. "We don't have data for this country's funding sources" is better than guessing.

---

*秩序と創造 — Order and Creation*
