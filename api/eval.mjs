/**
 * Unified evaluation function for Vercel + Netlify.
 * Uses @google/genai SDK with Gemini 3.1 Flash-Lite and Google Search Grounding.
 * Works on both platforms with a single codebase.
 */

import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "edge",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const idea = url.searchParams.get("idea") || "";

  // Server-side input validation — BEFORE calling Gemini
  if (!idea || idea.trim().length < 10) {
    return Response.json(
      { error: "Please describe your idea in at least 10 characters." },
      { status: 400, headers: corsHeaders }
    );
  }

  if (idea.length > 5000) {
    return Response.json(
      { error: "Idea too long. Maximum 5000 characters." },
      { status: 400, headers: corsHeaders }
    );
  }

  // Intent filtering — stop non-serious inputs before spending API credits
  const lowerIdea = idea.toLowerCase();
  const blockedPatterns = [
    /disneyland|disney\s*land/i,
    /go\s*to\s*(the\s*)?moon/i,
    /buy\s*(a\s*)?lamborghini|buy\s*(a\s*)?ferrari/i,
    /make\s*me\s*rich|get\s*rich\s*quick/i,
    /dating\s*app|tinder|hookup/i,
    /nft|crypto\s*pump|memecoin/i,
    /kill|harm|hurt|attack|bomb|weapon/i,
    /drug\s*deal|sell\s*drug/i,
    /onlyfans|porn|adult\s*content/i,
    /prank|joke|meme\s*project/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(idea)) {
      return Response.json(
        { error: "This tool evaluates social impact ideas — ideas that help communities. Your input doesn't seem like a serious social impact idea. If it is, please describe the problem you're solving and who it helps." },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  // Minimum quality check — must have enough words
  const words = idea.split(/\s+/).filter(w => w.length > 2);
  if (words.length < 8) {
    return Response.json(
      { error: "We need more detail. Tell us: What is the problem? Who is affected? What do you want to achieve? At least 2-3 sentences." },
      { status: 400, headers: corsHeaders }
    );
  }

  // Static results for sample cases — no API call needed
  const STATIC_RESULTS = {
    "local coffee shops near london bridge": {
      idea: "Indian street food stall for London commuters",
      _input: { problem: "Local coffee shops near London Bridge are losing foot traffic to chains", goal: "Open a small Indian street food stall serving evening commuters", country: "United Kingdom", budget: "£500 initial capital", constraints: "Solo operator, evenings only (6-10pm), no kitchen, first-time food business" },
      country: "GB", country_name: "United Kingdom", idea_type: "food", economic_tier: "T1",
      three_tests: { community_viability_score: 7, facebook_group_test: true, ten_for_ten_test: true, whatsapp_only_test: false },
      cultural: { score: 8, context_summary: "London is multicultural with high demand for street food. Evening commuters near London Bridge are a reliable customer base.", dimensions: { power_distance: { score: 35, context: "Flat hierarchy. Customers judge on quality, not credentials.", practical_advice: "Focus on food quality and Instagram presence." }, individualism: { score: 89, context: "People make individual choices. Word-of-mouth works differently here.", practical_advice: "Build a personal brand. Customers come for YOUR food, not just food." }, masculinity: { score: 66, context: "Competitive market. Quality wins.", practical_advice: "Differentiate on taste and speed, not price." }, uncertainty_avoidance: { score: 35, context: "People try new things easily.", practical_advice: "Experiment with menu. Low risk of rejection." }, long_term_orientation: { score: 51, context: "Mixed. Some plan long-term, some want quick wins.", practical_advice: "Start with a pop-up to test demand before committing." }, indulgence: { score: 69, context: "People spend on pleasure and food.", practical_advice: "Street food is indulgence. Lean into it." } } },
      education: { score_today: 7, score_after: 8, delta: 1, roi: "LOW", barriers: [{ name: "Food safety regulations", type: "structural", trainable: false }] },
      bootstrapper: { score: 8, easy: 8, feasible: 9, efforts: 7, take: "£500 and a cart. Evening commuters are a captive audience. Test with a weekend market first." },
      case_study: { title: "Dishoom: From Street Food to Restaurant Empire", source_type: "real", narrative: "Dishoom started as a tribute to Bombay's Irani cafes. They focused on one thing: authentic food with a story. No shortcuts on ingredients, no compromise on atmosphere. Now they have 8 locations across the UK.", expert: "The best street food tells a story. People don't just buy food — they buy the experience.", expert_name: "Karam Sethi, Dishoom Co-founder" },
      verdict: { total_score: 8, verdict: "GO", detail: "London's evening commuter market is reliable. £500 is enough to test. Focus on one dish, one location, one week.", elevator_pitch: "\"Open a small Indian street food stall that serves evening commuters\" — this is ready to test. London Bridge has 50,000+ commuters daily. Your £500 gets you a cart and ingredients. This week: find a spot, test with 20 customers. If 14 say they'd come back — you have a business.", first_step: "Visit London Bridge on a Tuesday evening. Count how many people walk past. Find the best spot. Buy ingredients for 20 portions of your best dish.", proof_of_work: { week_1: { day_1_2: "Visit London Bridge at 6pm. Count foot traffic. Find the best corner.", day_3_4: "Buy ingredients for 20 portions. Practice your fastest prep.", day_5_7: "Set up for one evening. Serve 20 people. Ask: 'Would you come back?'" }, week_2: { day_8_10: "Serve 3 evenings. Track: how many repeat customers?", day_11_12: "Ask every customer: 'What's your favorite dish?' Write it down.", day_13_14: "Write 1 page: what worked, what didn't, what to change. This is your proof." }, success_criteria: "If 7 out of 10 customers say 'I'd come back' — you have a business. Keep going." },
      funding: [{ source: "Local council street trading license", amount: "£100-300", likelihood: "HIGH" }, { source: "Street food market pitch competitions", amount: "£500-2000", likelihood: "MEDIUM" }],
      sdgs: { primary: { number: 8, name: "Decent Work and Economic Growth", target: "8.3", target_text: "Promote development-oriented policies supporting productive activities", plain_explanation: "The United Nations has 17 Global Goals. Your food stall helps with Goal 8: creating jobs and economic growth. Every small business contributes to the local economy." }, secondary: { number: 2, name: "Zero Hunger", target: "2.1", target_text: "End hunger", plain_explanation: "Providing affordable, nutritious food to commuters who might otherwise skip dinner." }, impact_weight: 6, what_this_means: "Your food stall creates income for you and affordable meals for commuters. Small businesses like yours are the backbone of local economies." },
      fad_risk: { level: "LOW", text: "People need to eat. Street food has existed for thousands of years.", signal: "London's street food market has been growing steadily for 20 years." },
      impact: { score: 45, sdg_weight: 6, estimated_reach: 200, cultural_fit: 0.8, interpretation: "MEDIUM" }
    },
  };

  // Check if input matches a static result
  const normalizedIdea = idea.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  for (const [key, result] of Object.entries(STATIC_RESULTS)) {
    if (normalizedIdea.includes(key) || key.includes(normalizedIdea.slice(0, 30))) {
      return Response.json(result, { headers: corsHeaders });
    }
  }

  // Netlify AI Gateway injects credentials automatically.
  // Vercel needs GOOGLE_GENAI_API_KEY in environment variables.
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY || ""
  });

  const systemPrompt = `You are a social impact idea evaluator. Evaluate ideas through 7 layers: parsing, community tests, cultural analysis, education analysis, bootstrapper scoring, case study matching, and verdict.

Search the web for real organizations, NGOs, social enterprises that have done something similar to the user's idea. Use real data, real numbers, real case studies.

Respond with ONLY valid JSON. No markdown, no code fences. Just the raw JSON object.

Required JSON structure:
{
  "idea": "short summary",
  "_input": {"problem": "", "goal": "", "country": "", "budget": "", "constraints": ""},
  "country": "ISO code",
  "country_name": "full name",
  "idea_type": "health|education|women|food|water|safety|elderly|mental_health|work|financial|disaster|community|environment|sustainability|animals|labor|rights|housing|transport|energy|agriculture|technology|art|culture|sport|peace|governance|inclusion",
  "economic_tier": "T1|T2|T3|T4",
  "three_tests": {"community_viability_score": 0-10, "facebook_group_test": true/false, "ten_for_ten_test": true/false, "whatsapp_only_test": true/false},
  "cultural": {"score": 1-10, "context_summary": "2-3 sentences describing the cultural environment the applicant operates in. Write as 'here's what your environment looks like' not 'here's why you might fail'.", "dimensions": {"power_distance": {"score": 0-100, "context": "What this means for the applicant's idea. Focus on how to work WITH this, not against it.", "practical_advice": "Specific action the applicant can take."}, "individualism": {"score": 0-100, "context": "", "practical_advice": ""}, "masculinity": {"score": 0-100, "context": "", "practical_advice": ""}, "uncertainty_avoidance": {"score": 0-100, "context": "", "practical_advice": ""}, "long_term_orientation": {"score": 0-100, "context": "", "practical_advice": ""}, "indulgence": {"score": 0-100, "context": "", "practical_advice": ""}}},
  "education": {"score_today": 1-10, "score_after": 1-10, "delta": 0-10, "roi": "HIGH|MEDIUM|LOW", "barriers": [{"name": "", "type": "trainable|structural", "trainable": true/false}]},
  "bootstrapper": {"score": 1-10, "easy": 1-10, "feasible": 1-10, "efforts": 1-10, "take": "2-sentence honest assessment"},
  "case_study": {"title": "", "source_type": "real|hypothetical", "narrative": "2-3 paragraphs about a real organization", "expert": "quote", "expert_name": ""},
  "verdict": {"total_score": 1-10, "verdict": "GO|GO WITH EDUCATION|PIVOT|SHELVE", "detail": "1-2 sentences", "elevator_pitch": "3-4 sentences, start with user's words", "first_step": "one specific action this week", "proof_of_work": {"week_1": {"day_1_2": "", "day_3_4": "", "day_5_7": ""}, "week_2": {"day_8_10": "", "day_11_12": "", "day_13_14": ""}, "success_criteria": ""}, "funding": [{"source": "", "amount": "", "likelihood": "HIGH|MEDIUM|LOW"}]},
  "sdgs": {"primary": {"number": 0, "name": "", "target": "", "target_text": "", "plain_explanation": "Explain this SDG in one sentence for someone who has never heard of SDGs. Example: 'The United Nations has 17 goals to make the world better by 2030. Your idea helps with Goal 5: making sure women and girls have equal opportunities.'"}, "secondary": {"number": 0, "name": "", "target": "", "target_text": "", "plain_explanation": ""}, "impact_weight": 0-10, "what_this_means": "Explain in 2-3 sentences what this SDG connection means for the user's idea. Be specific. Example: 'Your idea to distribute pads directly addresses SDG 3 (Good Health) because menstruation is a health issue, not just a hygiene issue. The UN specifically targets universal access to reproductive health services — and your idea is one way to reach that goal in rural India.'"},
  "fad_risk": {"level": "LOW|MEDIUM|HIGH", "text": "", "signal": ""},
  "impact": {"score": 0-100, "sdg_weight": 0-10, "estimated_reach": 0, "cultural_fit": 0-1, "interpretation": "HIGH|MEDIUM|LOW"}
}

SCORING RULES (CRITICAL):
- Score the IDEA, not the COUNTRY. A well-described idea in Bangladesh should score higher than a vague idea in Germany.
- Cultural data (Hofstede dimensions) is CONTEXT for understanding the applicant's environment. It helps you give BETTER advice, not LOWER scores.
- Do NOT penalize for cultural barriers. Instead, explain what the barriers mean and how to work WITH them.
- Give credit for what the user has already described. Awareness of constraints is a strength.
- SHELVE only when the idea is fundamentally broken — not when the environment is challenging.
- PIVOT when the approach needs changing but the problem is real.
- GO when the idea is testable with the user's described resources.
- GO WITH EDUCATION when one specific barrier needs addressing before testing.

For case_study: search the web for a REAL organization that did something similar. Include real impact numbers. If you cannot find one, say source_type: "hypothetical".

For elevator_pitch: use the person's actual words. Start with their idea in quotes. Then give specific scores and a concrete next step. Write like a partner, not a consultant.

For cultural dimensions: this is CONTEXT for understanding the applicant's environment, not scoring factors. For each dimension:
- Describe what the environment looks like (e.g., "In your area, people follow leaders and don't challenge authority openly.")
- Give practical advice on how to work WITH this (e.g., "Partner with a respected community leader who can vouch for your idea.")
- Never frame cultural data as reasons the idea might fail. Frame it as "here's how to navigate your environment."

The cultural score (1-10) reflects how well the idea is DESIGNED for the environment, not how good the environment is. An idea that accounts for cultural context scores higher than one that ignores it.

EDGE CASES AND EXCEPTIONS:

1. NO COUNTRY DETECTED: If the user doesn't mention a location, set country to "UNKNOWN" and note in the output: "We don't know where you are. Cultural and funding advice may not apply. Tell us your country for a better evaluation." Score cultural fit as neutral (5/10).

2. MULTIPLE CATEGORIES: If the idea spans multiple types (e.g., "women's health education"), set primary to the most specific (women) and mention secondary in the output.

3. TOO VAGUE: If the idea is "make the world better" or similarly broad, score 3-4 and say: "This is a mission, not a project. Tell us: what specific problem? who is affected? where? A good idea is specific enough that someone could say 'that won't work because...'."

4. TOO BROAD: If the idea is "end poverty in Africa," score 4-5 and say: "This is too broad for one project. Here's how to narrow: pick one country, one community, one specific problem. Start with 10 people, not a continent."

5. TOO NARROW: If the idea is "fix the pothole on my street," score 6-7 but note: "This is a local issue with local impact. If you want to scale, think about: how many streets have this problem? can the solution be replicated?"

6. NO CASE STUDY: If no real organization is found, set source_type to "hypothetical" and say: "We couldn't find someone who did exactly this. That means you might be creating something new. Here's the closest example we found and what you can learn from it."

7. CONFLICTING SIGNALS: If impact is high but barriers are high too, don't average them. Say: "The potential is real. The barriers are real. Here's the specific path through the barriers."

8. T1 COUNTRY, T4 CONTEXT: If someone says "rural Mississippi, no internet," detect the economic tier from context, not just country. A T1 country with T4 conditions should be scored as T4.

9. IDEA ALREADY EXISTS: If the case study matches something that already exists, say: "This exists. Here's what's different about your version? If nothing is different, consider: what's your unfair advantage?"

10. HARMFUL IDEA: If the idea involves illegal activity, unregulated medicine, or exploitation, score SHELVE and say: "This has legal or ethical concerns. Here's what you need to consider before proceeding." Do not encourage harmful ideas.

11. SINGLE SENTENCE INPUT: If the user gives only one sentence, do your best but note: "We need more detail for a thorough evaluation. Tell us: the problem, your goal, where you are, what you have."

12. LANGUAGE BARRIER: If the input has grammar errors or is in broken English, still evaluate the IDEA, not the writing. The user's English level is not a barrier to their idea's potential.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingLevel: "minimal" },
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\nEvaluate this idea:\n${idea}` }] }]
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    if (!text) {
      return Response.json(
        { error: "Gemini returned empty response" },
        { status: 502, headers: corsHeaders }
      );
    }

    // Parse JSON
    let result = null;
    try {
      result = JSON.parse(text);
    } catch {
      // Try code fences
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        try { result = JSON.parse(fenceMatch[1].trim()); } catch {}
      }
      // Try brace extraction
      if (!result) {
        const allBraces = text.match(/\{[\s\S]*\}/g);
        if (allBraces) {
          for (const match of allBraces.sort((a, b) => b.length - a.length)) {
            try { result = JSON.parse(match); break; } catch {}
          }
        }
      }
    }

    if (!result) {
      return Response.json(
        { error: "Gemini returned invalid JSON", raw: text.slice(0, 500) },
        { status: 502, headers: corsHeaders }
      );
    }

    // Ensure _input is populated
    if (!result._input) {
      result._input = { problem: "", goal: "", country: "", budget: "", constraints: "" };
    }

    // Add search sources if available
    if (sources.length > 0) {
      result._search_sources = sources.map(s => ({
        title: s.web?.title || "",
        uri: s.web?.uri || ""
      }));
    }

    return Response.json(result, { headers: corsHeaders });

  } catch (error) {
    console.error("Evaluation error:", error.message);
    return Response.json(
      { error: `Evaluation failed: ${error.message}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
