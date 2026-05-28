# Socio-Economic Idea Evaluator

### "Virtual Shark Tank for Social Impact"

Have an idea to help your community? Not sure if it will work? This tool tells you.

**Describe your idea in plain language** — "I want to help rural farmers in Kenya get fair crop prices through SMS" — and get a complete evaluation in seconds. It tells you if the idea can work, what cultural barriers to expect, what to do on Day 1, and how to test it with real people in 14 days.

Built on research from 136 countries, 165 real-world case studies, and Hofstede's cultural dimensions framework. No sign-up. No data collected. Free forever.

---

## What It Does

You describe three things:
1. **The problem** — what's broken in your community
2. **Your goal** — what you want to achieve
3. **Where you are** — country, budget, constraints

The evaluator runs your idea through **7 layers of analysis**:

| Layer | What It Checks |
|---|---|
| **Parse** | Detects your country, idea type, and economic context |
| **Three Tests** | Would people join a Facebook group for this? Would 10 out of 10 people you talk to care? Can it run on WhatsApp alone? |
| **Cultural Fit** | How well does your idea fit the culture you're launching in? Uses 6 Hofstede dimensions (power distance, individualism, etc.) |
| **Education Gap** | What do people need to learn before they'll adopt your idea? Which gaps can training fix? |
| **Bootstrapper Score** | Can you start this with $0, a phone, and 3 friends? |
| **Case Study** | Finds the closest real-world example of someone who did something similar |
| **Verdict** | GO / GO WITH EDUCATION / PIVOT / SHELVE — with a personalized pitch and Day 1 action plan |

You get a verdict score out of 10, a co-founder-style pitch using your own words, a proof-of-work protocol (test in 14 days), and funding pathways.

---

## Try It

### Web (easiest)
```bash
python3 server.py
# Open http://localhost:8080
```

### Command Line
```bash
python3 evaluator.py "I want to help teenage girls in rural India get sanitary pads through a WhatsApp group of mothers"
```

---

## Examples of Ideas It Can Evaluate

- "Peer-to-peer mental health support for rural Cambodian youth via WhatsApp"
- "Teach coding to kids in Nairobi slums using donated phones"
- "Connect isolated elderly people in rural Japan with daily volunteer check-ins"
- "Help farmers in Kenya share real-time crop prices through SMS"
- "Affordable sanitary pads distributed by local women in Bangladeshi villages"

---

## What You Get

A complete evaluation including:

- **Verdict**: GO, GO WITH EDUCATION, PIVOT, or SHELVE
- **Your Pitch**: A co-founder-style briefing using your own words
- **Cultural Barriers**: What might stop adoption in your specific country
- **Education Gap**: What training could unlock 10+ points of improvement
- **Case Study**: A real example of someone who did something similar
- **Day 1 Action**: Exactly what to do this week
- **Proof-of-Work**: A 14-day test protocol to prove demand
- **Funding Pathways**: Where to look for money (country-specific)

---

## Deploy

### Vercel (recommended)
```bash
npm i -g vercel
vercel
```
Set `SERPER_API_KEY` in Vercel dashboard for web search (optional).

### Netlify
Deploy with publish directory `.`, then update the Vercel URL in `netlify.toml`.

---

## Environment Variables

| Variable | Required | What It Does |
|---|---|---|
| `SERPER_API_KEY` | No | Enables web search for richer case studies (Phase 2) |
| `PORT` | No | Server port for local dev (default: 8080) |

---

## Project Structure

```
evaluator.py          # The 7-layer evaluation engine
server.py             # Local development server
api/index.py          # Vercel serverless handler
index.html            # Landing page with built-in evaluator
vercel.json           # Vercel deployment config
netlify.toml          # Netlify deployment config
data/
  hofstede-database.json   # 136 countries with cultural dimension scores
  countries.json           # 10 countries with detailed cultural profiles
  zones.json               # 11 global zones
case-studies/
  library.json             # 55 real-world case studies
  zones-library.json       # 110 zone-based case studies
```

---

## Who Built This

**Nikhil Tiwari** — PhD researcher at Shizuoka University, Japan. Studies socio-economic systems and community-driven development.

**Claude** — AI assistant by Anthropic.

Together: Harvard-level knowledge for social problems. Free. For everyone.

---

## License

Open source. Use it, fork it, build on it.
