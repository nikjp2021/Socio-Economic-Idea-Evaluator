/**
 * Netlify Function: Gemini-powered evaluation
 * Calls Gemini API with a structured prompt, returns evaluation JSON.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Try multiple model endpoints in order
const MODELS = [
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
];

export default async (request, context) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "API key not configured. Set GEMINI_API_KEY in Netlify environment variables." },
      { status: 500, headers: corsHeaders }
    );
  }

  const systemPrompt = `You are a social impact idea evaluator. Evaluate ideas through 7 layers: parsing, community tests, cultural analysis, education analysis, bootstrapper scoring, case study matching, and verdict.

Respond with ONLY valid JSON. No markdown, no code fences, no explanation. Just the raw JSON object.

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
  "case_study": {"title": "", "source_type": "real|hypothetical", "narrative": "2-3 paragraphs", "expert": "quote", "expert_name": ""},
  "verdict": {"total_score": 1-10, "verdict": "GO|GO WITH EDUCATION|PIVOT|SHELVE", "detail": "1-2 sentences", "elevator_pitch": "3-4 sentences, start with user's words", "first_step": "one specific action this week", "proof_of_work": {"week_1": {"day_1_2": "", "day_3_4": "", "day_5_7": ""}, "week_2": {"day_8_10": "", "day_11_12": "", "day_13_14": ""}, "success_criteria": ""}, "funding": [{"source": "", "amount": "", "likelihood": "HIGH|MEDIUM|LOW"}]},
  "sdgs": {"primary": {"number": 0, "name": "", "target": "", "target_text": ""}, "secondary": {"number": 0, "name": "", "target": "", "target_text": ""}, "impact_weight": 0-10},
  "fad_risk": {"level": "LOW|MEDIUM|HIGH", "text": "", "signal": ""},
  "impact": {"score": 0-100, "sdg_weight": 0-10, "estimated_reach": 0, "cultural_fit": 0-1, "interpretation": "HIGH|MEDIUM|LOW"}
}

Use real Hofstede scores. Be honest. Not every idea deserves GO.`;

  const requestBody = {
    contents: [{
      parts: [{ text: `Evaluate this social impact idea:\n\n${idea}` }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096
    }
  };

  // Try each model endpoint
  let lastError = null;
  for (const modelUrl of MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(`${modelUrl}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody)
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Model ${modelUrl} returned ${response.status}:`, errText.slice(0, 300));
        lastError = `${response.status}: ${errText.slice(0, 200)}`;
        continue; // Try next model
      }

      const data = await response.json();

      // Extract text from response (handle multi-part responses)
      const parts = data.candidates?.[0]?.content?.parts || [];
      let text = '';
      for (const part of parts) {
        if (part.text && !part.thought) {
          text = part.text;
          break;
        }
      }
      if (!text && parts.length > 0) {
        text = parts.find(p => p.text)?.text || '';
      }

      if (!text) {
        console.error("No text in response:", JSON.stringify(data).slice(0, 500));
        lastError = "Empty response from Gemini";
        continue;
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
        console.error("JSON parse failed. Raw:", text.slice(0, 1000));
        lastError = "Invalid JSON from Gemini";
        continue;
      }

      // Success
      if (!result._input) {
        result._input = { problem: "", goal: "", country: "", budget: "", constraints: "" };
      }
      return Response.json(result, { headers: corsHeaders });

    } catch (e) {
      console.error(`Model ${modelUrl} error:`, e.message);
      lastError = e.name === 'AbortError' ? 'Timeout' : e.message;
      continue;
    }
  }

  // All models failed
  return Response.json(
    { error: `All Gemini models failed. Last error: ${lastError}` },
    { status: 502, headers: corsHeaders }
  );
};
