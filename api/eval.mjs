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
  "cultural": {"score": 1-10, "dominant_barrier": "description", "dimensions": {"power_distance": {"score": 0-100, "barrier": ""}, "individualism": {"score": 0-100, "barrier": ""}, "masculinity": {"score": 0-100, "barrier": ""}, "uncertainty_avoidance": {"score": 0-100, "barrier": ""}, "long_term_orientation": {"score": 0-100, "barrier": ""}, "indulgence": {"score": 0-100, "barrier": ""}}},
  "education": {"score_today": 1-10, "score_after": 1-10, "delta": 0-10, "roi": "HIGH|MEDIUM|LOW", "barriers": [{"name": "", "type": "trainable|structural", "trainable": true/false}]},
  "bootstrapper": {"score": 1-10, "easy": 1-10, "feasible": 1-10, "efforts": 1-10, "take": "2-sentence honest assessment"},
  "case_study": {"title": "", "source_type": "real|hypothetical", "narrative": "2-3 paragraphs about a real organization", "expert": "quote", "expert_name": ""},
  "verdict": {"total_score": 1-10, "verdict": "GO|GO WITH EDUCATION|PIVOT|SHELVE", "detail": "1-2 sentences", "elevator_pitch": "3-4 sentences, start with user's words", "first_step": "one specific action this week", "proof_of_work": {"week_1": {"day_1_2": "", "day_3_4": "", "day_5_7": ""}, "week_2": {"day_8_10": "", "day_11_12": "", "day_13_14": ""}, "success_criteria": ""}, "funding": [{"source": "", "amount": "", "likelihood": "HIGH|MEDIUM|LOW"}]},
  "sdgs": {"primary": {"number": 0, "name": "", "target": "", "target_text": ""}, "secondary": {"number": 0, "name": "", "target": "", "target_text": ""}, "impact_weight": 0-10},
  "fad_risk": {"level": "LOW|MEDIUM|HIGH", "text": "", "signal": ""},
  "impact": {"score": 0-100, "sdg_weight": 0-10, "estimated_reach": 0, "cultural_fit": 0-1, "interpretation": "HIGH|MEDIUM|LOW"}
}

SCORING RULES (CRITICAL):
- Do NOT penalize based on country assumptions. A T3 country with a well-described idea should score HIGHER than a T1 country with a vague idea.
- Give credit for what the user has already described. If they mention constraints, solutions, or awareness of barriers — that's a strength, not a weakness.
- Hofstede scores are CONTEXT, not PUNISHMENT. High power distance means "partner with leaders" — it doesn't mean "this idea won't work."
- The user's specific context matters more than country-level statistics. A solo founder with $0 in Bangladesh who describes a clear path should score higher than a funded team in the US with no plan.
- SHELVE only when the idea is fundamentally broken — not when the country has high cultural scores.
- PIVOT when the approach is wrong but the problem is real.
- GO when the idea is testable with the user's described resources.
- GO WITH EDUCATION when one specific barrier needs addressing before testing.

For case_study: search the web for a REAL organization that did something similar. Include real impact numbers. If you cannot find one, say source_type: "hypothetical".

For elevator_pitch: use the person's actual words. Start with their idea in quotes. Then give specific scores and a concrete next step. Write like a partner, not a consultant.

For cultural dimensions: describe what the user should DO about each barrier, not just that it exists. Every barrier gets a workaround. The score reflects how many barriers exist, not how hard they are to overcome.`;

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
