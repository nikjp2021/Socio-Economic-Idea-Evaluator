# SEE — Platform for Good
## Product Requirements Document (PRD)
### Version 2.0 — June 2026

---

## 1. Product Vision

**SEE is the first platform that helps individuals — not organizations — turn social impact ideas into action.**

In 60 seconds, it evaluates your idea against 136 countries, 182+ real organizations, and the UN Sustainable Development Goals, then gives you a score, a verdict, a learning path, and your first step.

No sign-up. No cost. Results in 60 seconds.

**Mission:** Democratize social impact infrastructure. Give every person with an idea the same tools that NGOs and social enterprises spend months and thousands of dollars accessing.

**Recognition Goal:** Be recognized as a "Platform for Good" — a general people's TechSoup. Win a major tech-for-good award by demonstrating that individuals can create measurable social impact with the right guidance.

---

## 2. Target Users

### Primary: Individual Impact Makers
- University students with social impact ideas
- Working professionals who see a problem in their community
- Retirees who want to give back but don't know how
- People in developing countries who see problems firsthand

**Characteristics:** No org, no funding, no framework. Have motivation but lack structure.

### Secondary: Small Groups
- Informal community groups (2-5 people)
- Student clubs and associations
- Religious or community organizations exploring new programs

**Characteristics:** Have some structure but no evaluation methodology.

### Tertiary: Educators & Mentors
- University professors teaching social entrepreneurship
- NGO program managers evaluating new initiatives
- Impact investors screening early-stage ideas

**Characteristics:** Use SEE as a teaching or screening tool.

---

## 3. Core Value Proposition

**"Describe your idea. We'll tell you if it can work, why, and what to do next."**

The product delivers four things in sequence:

```
EVALUATE → LEARN → ACT → SHARE
```

| Stage | What the user gets | Time |
|-------|-------------------|------|
| **Evaluate** | Score, verdict, cultural analysis, case study match, first step | 60 seconds |
| **Learn** | 3-week learning path with barrier-specific lessons | 3 weeks |
| **Act** | 14-day action plan with concrete daily steps | 14 days |
| **Share** | Branded result card for social media | 1 tap |

---

## 4. User Journey

### 4.1 First Visit

```
Land on page → See hero → Click "Test Your Idea" → Fill form → Get result
```

**Gate:** Access code required (`9999`). Protects against scrapers and API abuse. "Request Access" button for legitimate users who don't have the code.

**Hero:** Clear value proposition. "You have an idea to help people. Will it work?" Two CTAs: "Test Your Idea" (primary), "See How" (secondary).

**Form:** 5 fields — Problem (required), Goal (required), Country, Budget, Constraints. Example chips for inspiration.

**Validation:** Encouraging messages that guide, not reject. Cost-control gate before API call.

**Result:** Full evaluation with 10 tabbed sections. Score animation. Verdict badge. "Do This Today" CTA. Learning path. Share card.

### 4.2 Return Visit

```
Land on page → See previous evaluation → Modify or start fresh
```

**Persistence:** Last evaluation stored in localStorage for 7 days. Form pre-filled. Results pre-rendered with "Showing your last evaluation" banner.

**Progress:** 14-day plan checkbox progress persists in localStorage.

### 4.3 Authenticated User

```
Evaluate → Save as Project → Dashboard → Track progress → Check in weekly
```

**Save as Project:** Button directly on evaluation results. Creates project in database with roadmap and milestones.

**Dashboard:** Tabs for Projects, Decide, Plan, Execute, Track, Fund, Scale, Stories. Each tab lazy-loads from API.

**Check-in:** Weekly form with accomplishments, blockers, next steps, mood. Streak tracking.

---

## 5. Feature Requirements

### 5.1 Evaluation Engine (Core Product)

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| 7-layer evaluation pipeline | Country detection → community tests → cultural analysis → education analysis → bootstrapper score → case study matching → verdict | P0 |
| 136-country Hofstede database | Cultural dimensions for every country | P0 |
| 182+ case study matching | 3-mode matching: exact → hypothetical → novel | P0 |
| 17 UN SDG mapping | Every idea mapped to relevant SDGs | P0 |
| Verdict system | GO / GO WITH EDUCATION / PIVOT / SHELVE with score-band-specific messaging | P0 |
| 14-day proof-of-work | 6-phase action plan generated from evaluation data | P0 |
| Funding pathways | Score-aware funding suggestions for ~10 countries | P1 |
| Lean canvas | 9-block social impact canvas from evaluation | P1 |
| Competitive positioning | Radar chart + top 3 comparable organizations | P1 |
| Global heatmap | Top/bottom 5 countries + regional averages | P1 |
| Mentor council | Top 3 matched mentor personas with playbooks | P1 |
| What-If mode | Compare cultural dimensions across countries | P2 |

### 5.2 Validation & Cost Control

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Blocked pattern filter | Regex-based content filter for out-of-scope inputs | P0 |
| Minimum length gate | 50 characters combined for problem + goal | P0 |
| Minimum word count | 5 words longer than 2 characters | P0 |
| Question detection | Rejects pure questions, encourages action language | P1 |
| Encouraging error messages | Warm, guiding messages that teach, not reject | P0 |
| 60-second fetch timeout | AbortController prevents hung requests | P0 |
| API key validation | Server-side check before calling Gemini | P0 |

### 5.3 Learning Path

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| 3-week learning path | Generated from evaluation data, barrier-specific | P0 |
| Week 1: Understand context | Read case study, learn barrier, find ally | P0 |
| Week 2: Test with people | 10-person test, learn barrier, serve 3 people | P0 |
| Week 3: Build proof | Evidence, storytelling, proof-of-work | P0 |
| Read/Learn/Do structure | Each lesson has theory + action | P0 |
| Barrier-specific tips | Tips from cultural dimensions analysis | P1 |
| Case study integration | Lessons reference the matched case study | P1 |

### 5.4 Shareable Result Card

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Visual share card | Branded card with score, badge, headline, tone | P0 |
| "Platform for Good" branding | Tagline on every shared card | P0 |
| Native share API | One-tap share on mobile (WhatsApp, Twitter, etc.) | P0 |
| Clipboard fallback | Copy link for desktop users | P0 |
| UTM tracking | `utm_source=share&utm_medium=card&utm_campaign=eval_results` | P1 |
| Open Graph meta tags | Rich preview when shared on social media | P1 |

### 5.5 Project Dashboard

**Status:** Partially implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Project list | Cards with progress bars, streak badges, status | P0 |
| Project detail | Milestones grouped by phase, check-in form, history | P0 |
| Plan tab | 14-day plan from evaluation with checkboxes | P0 |
| Decide tab | Compare 2+ evaluations, ranked table, tradeoffs | P1 |
| Execute tab | Task CRUD with overdue/today/upcoming categories | P1 |
| Track tab | Metric logging with sparklines and delta tracking | P1 |
| Fund tab | Funding sources list with apply links | P1 |
| Scale tab | Scaling plans and partnerships CRUD | P2 |
| Stories tab | Followed case study narratives | P2 |
| Lifecycle bar | 7-stage visual progress indicator | P1 |
| Streak system | Weekly check-in streak with fire emoji badge | P1 |
| Milestone celebrations | Confetti burst + toast on completion | P1 |
| Stuck nudges | Help panel on "stuck" mood, inactivity detection | P1 |

### 5.6 Case Study Explorer

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Searchable grid | Filter by category, zone, status | P0 |
| Expandable cards | Click to reveal details, what worked, what failed | P0 |
| "Start This" button | Opens intake modal → roadmap → templates → save | P0 |
| "Follow" button | Save case study to followed stories | P2 |
| Quick Evaluate | Tap pre-evaluated ideas for instant results | P1 |

### 5.7 Templates

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Problem Statement Canvas | Who suffers, what's the gap, why now | P0 |
| Stakeholder Map | Who you need, who trusts the community | P0 |
| Budget Reality Check | $0 operations breakdown | P0 |
| Operations Plan | Delivery, schedule, supplies, volunteers | P1 |
| Funding Proposal Skeleton | 1-page grant application | P1 |
| Monthly Impact Report | Beneficiaries, outcomes, challenges, goals | P1 |
| Legal Basics | Registration, permits, liability by scale | P2 |

### 5.8 Community Features

**Status:** Partially implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Public project feed | Active projects with progress and streaks | P1 |
| Leaderboard | Top evaluated ideas with upvotes | P1 |
| Community stats | Total evaluations, users, case studies, countries | P1 |
| Verdict distribution | Visual bar showing GO/PIVOT/SHELVE ratios | P2 |
| SDG Stories carousel | Real organizations mapped to UN goals | P1 |

### 5.9 Funding Matcher

**Status:** Implemented (Tier 1)

| Feature | Description | Priority |
|---------|-------------|----------|
| Funding database | 15+ curated grants, fellowships, CSR programs | P1 |
| Match scoring | Weighted scoring: country 30%, zone 20%, SDG 25%, type 15%, tier 10% | P1 |
| Filter by country/type | Dropdown filters for targeted search | P1 |
| Application tracking | Draft → submitted → approved status | P2 |

### 5.10 Mentor System

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| 20 mentor personas | Real social enterprise leaders with playbooks | P1 |
| Score-tier playbooks | Low/mid/high score → different advice | P1 |
| Model stages | Idea → proof → scale → system journey | P1 |
| Warnings | What mentors would warn against | P1 |
| Standalone gallery | Browse all mentors with zone filtering | P2 |

### 5.11 Authentication & Persistence

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| JWT auth | Register/login with email + password | P0 |
| Local evaluation storage | 7-day localStorage persistence | P0 |
| Evaluation history | Last 10 evaluations in localStorage | P1 |
| Server-side save | Save evaluations to database when logged in | P1 |
| Cross-device sync | Evaluations persist across devices when logged in | P1 |

### 5.12 Cultural Lookup

**Status:** Implemented

| Feature | Description | Priority |
|---------|-------------|----------|
| Country selector | 136 countries with Hofstede scores | P1 |
| Dimension cards | 6 dimensions with practical advice | P1 |
| What works / What fails | Country-specific guidance | P1 |
| Case study links | Organizations that work in that country | P1 |

---

## 6. Technical Architecture

### 6.1 Frontend

| Component | Technology |
|-----------|-----------|
| Markup | Semantic HTML5 |
| Styling | CSS3 custom properties, responsive breakpoints |
| Logic | Vanilla ES6 JavaScript (no frameworks) |
| Routing | Hash-based SPA with `data-page` sections |
| State | Global `DB` object + localStorage |
| Icons | SVG icon system |
| i18n | Custom `_t(key)` engine (EN + JA) |

### 6.2 Backend (Vercel Serverless)

| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/eval` | `eval.mjs` | Evaluation pipeline (Gemini + deterministic) |
| `/api/auth` | `auth.mjs` | JWT authentication (register/login/me) |
| `/api/evaluations` | `evaluations.mjs` | Save/list/get evaluations |
| `/api/projects` | `projects.mjs` | Project CRUD, milestones, check-ins, feed |
| `/api/decisions` | `decisions.mjs` | Compare evaluations, pick winner |
| `/api/tasks` | `tasks.mjs` | Task CRUD, today view |
| `/api/track` | `track.mjs` | Metric logging, dashboard |
| `/api/scale` | `scale.mjs` | Scaling plans, partnerships |
| `/api/funding` | `funding.mjs` | Funding sources, matching, applications |
| `/api/reference` | `reference.mjs` | Cases, personas, countries, stats, templates |
| `/api/seed` | `seed.mjs` | Database seeding |

### 6.3 Database (Neon PostgreSQL)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password hash, name) |
| `evaluations` | Saved evaluations (idea_text, result_json) |
| `projects` | User projects (title, status, progress, streak, intake, roadmap) |
| `milestones` | Project milestones (phase, label, status) |
| `check_ins` | Weekly check-ins (accomplishments, blockers, mood) |
| `tasks` | Project tasks (title, due_date, status) |
| `impact_metrics` | Tracked metrics (name, value, unit, history) |
| `funding_sources` | Curated funding database |
| `funding_applications` | User funding applications |
| `scaling_plans` | Project scaling plans |
| `partnerships` | Project partnerships |

### 6.4 Data Assets

| Asset | Count | File |
|-------|-------|------|
| Countries (Hofstede) | 136 | `data/hofstede-database.json` |
| Countries (rich profiles) | 10 | `data/countries.json` |
| Global zones | 10 | `data/zones.json` |
| Case studies (flat) | 72 | `case-studies/library.json` |
| Figures (flat) | 70 | `case-studies/library.json` |
| Case studies (zone-based) | 110 | `case-studies/zones-library.json` |
| Figures (zone-based) | 57 | `case-studies/zones-library.json` |
| Mentor personas | 20 | `case-studies/mentor-personas.json` |

---

## 7. Design System

### 7.1 Typography

| Element | Font | Weight |
|---------|------|--------|
| Headlines | Libre Baskerville | 400, 700 |
| Body | Atkinson Hyperlegible | 400, 700 |
| Code | JetBrains Mono | 400, 500 |

### 7.2 Color Palette (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--cream` | `#faf7f2` | Page background |
| `--white` | `#fdfdfc` | Card backgrounds |
| `--ink` | `#1a1612` | Primary text |
| `--ink-light` | `#3d3832` | Secondary text |
| `--ink-muted` | `#8a7e6e` | Tertiary text |
| `--forest` | `#2a6b24` | Primary accent (GO, success) |
| `--amber` | `#c47a0a` | Warning, attention |
| `--terracotta` | `#ba5540` | Error, barriers |
| `--sky` | `#2563a8` | Info, links |

### 7.3 Dark Mode

Full dark mode support via `[data-theme="dark"]` CSS variables. Toggle in nav. Preference persisted in localStorage.

### 7.4 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 600px | Mobile — single column, stacked |
| 600-900px | Tablet — 2 columns where appropriate |
| > 900px | Desktop — full layout |

---

## 8. Language Guidelines

**Never use trademarked brands, institutions, or shows in system output.**

| Never say | Say instead |
|-----------|-------------|
| "Shark Tank" | "A rigorous evaluation" |
| "Harvard-level" | "Research-backed" |
| "Y Combinator for X" | "A structured path from idea to test" |
| "Tesla of X" | "A technology-first approach" |

**Tone:** Honest encouragement. Never kill the spirit. Never set false expectations. Always show the path forward. Celebrate the attempt.

---

## 9. Success Metrics

### 9.1 Impact Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Ideas evaluated | 1,000 in first 6 months | API call count |
| Users who take action | 20% of evaluators | Project creation rate |
| Shared result cards | 500 in first 6 months | Share button clicks |
| Learning path completion | 30% of users who start | Week 3 checkbox completion |

### 9.2 Product Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first result | < 90 seconds | Form fill → result render |
| Return visitor rate | 25% within 7 days | localStorage check |
| Auth conversion | 10% of evaluators | Register/login rate |
| Project creation rate | 5% of evaluators | Save as Project clicks |

### 9.3 Award Criteria Alignment

| Criteria | Evidence |
|----------|----------|
| Clear social impact thesis | "Infrastructure for individual impact makers" |
| Innovation | 7-layer evaluation engine + cultural dimensions + 182 case studies |
| Scalability | 136 countries, no sign-up, works on any device |
| Traction | User count, evaluations completed, shared cards |
| Evidence of impact | User stories: "I evaluated, I learned, I acted" |

---

## 10. Roadmap

### Phase 1: Foundation (Current)
- [x] Evaluation engine (7-layer pipeline)
- [x] 136-country Hofstede database
- [x] 182+ case study matching
- [x] 14-day action plan
- [x] Encouraging validation messages
- [x] Shareable result card
- [x] Learning path (3 weeks)
- [x] Access gate with demo bypass
- [x] Dark/light mode
- [x] SVG logos and branding

### Phase 2: Connection (Next)
- [ ] "Save as Project" flow refinement
- [ ] Plan tab with evaluation data
- [ ] Dashboard integration (Plan/Execute/Track)
- [ ] Email reminders for check-ins
- [ ] "Stuck?" nudge system
- [ ] Mobile-first dashboard optimization

### Phase 3: Growth (Later)
- [ ] Open Graph meta tags for rich share previews
- [ ] User stories collection system
- [ ] Funding application support
- [ ] Mentor matching refinement
- [ ] Community feed engagement features
- [ ] Multi-language support (JA, ES, FR, AR)

### Phase 4: Scale (Big)
- [ ] Direct funding infrastructure
- [ ] Peer matching system
- [ ] Impact verification system
- [ ] API for third-party integrations
- [ ] Mobile app (PWA → native)
- [ ] Award application submission

---

## 11. Known Limitations

| Limitation | Impact | Mitigation |
|-----------|--------|------------|
| Cultural profiles for only 10 countries | Rest have Hofstede scores only | Expand gradually |
| Funding pathways for ~10 countries | Limited funding suggestions | Add more country-specific sources |
| Scoring is heuristic, not calibrated | Scores may not reflect real outcomes | Collect user feedback, iterate |
| Case study matching can match irrelevant studies | Users may get unhelpful examples | Improve matching algorithm |
| No email system | Can't send reminders or follow-ups | Add email in Phase 2 |
| No analytics | Can't track user behavior | Add privacy-respecting analytics |

---

## 12. Security

| Measure | Implementation |
|---------|---------------|
| Access gate | Code `9999` protects against scrapers |
| JWT authentication | 24-hour token expiry, bcrypt password hashing |
| Input validation | Client-side + server-side validation |
| API key protection | Environment variables, format validation |
| CORS | Proper headers for cross-origin requests |
| Rate limiting | Client-side timeout, server-side intent filtering |
| SQL injection prevention | Parameterized queries throughout |

---

*Built by Nikhil Tiwari (PhD researcher, Shizuoka University) & Claude (Anthropic).*
*"Order and Creation" (秩序と創造)*
