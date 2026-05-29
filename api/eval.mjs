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
  "idea_type": "health|education|women|food|water|safety|elderly|mental_health|work|financial|disaster|community",
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

The cultural score (1-10) reflects how well the idea is DESIGNED for the environment, not how good the environment is. An idea that accounts for cultural context scores higher than one that ignores it.`;

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
