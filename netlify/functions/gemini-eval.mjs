/**
 * Netlify Function: Gemini-powered evaluation
 * Calls Gemini API with a structured prompt, returns evaluation JSON.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

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
    console.error("GEMINI_API_KEY not set in environment variables");
    return Response.json(
      { error: "API key not configured. Set GEMINI_API_KEY in Netlify environment variables." },
      { status: 500, headers: corsHeaders }
    );
  }

  const systemPrompt = `You are a social impact idea evaluator. You evaluate ideas through 7 layers: parsing, three community tests, Hofstede cultural analysis, education lever analysis, bootstrapper scoring, case study matching, and verdict generation.

You MUST respond with ONLY valid JSON. No markdown, no code fences, no explanation. Just the raw JSON object.

The JSON must have this EXACT structure:

{
  "idea": "short summary of the idea",
  "_input": {
    "problem": "the problem being solved",
    "goal": "what the idea wants to achieve",
    "country": "detected country name",
    "budget": "detected budget or empty string",
    "constraints": "detected constraints or empty string"
  },
  "country": "ISO country code (2 letters)",
  "country_name": "full country name",
  "idea_type": "category: health, education, environment, finance, agriculture, mental_health, elder_care, disability, gender, technology, community, or general",
  "economic_tier": "T1, T2, T3, or T4",
  "three_tests": {
    "community_viability_score": 0-10,
    "facebook_group_test": true or false,
    "ten_for_ten_test": true or false,
    "whatsapp_only_test": true or false
  },
  "cultural": {
    "score": 1-10,
    "dominant_barrier": "the biggest cultural barrier (e.g. 'Power Distance — hierarchy prevents peer-to-peer models')",
    "dimensions": {
      "power_distance": {"score": 0-100, "barrier": "brief explanation"},
      "individualism": {"score": 0-100, "barrier": "brief explanation"},
      "masculinity": {"score": 0-100, "barrier": "brief explanation"},
      "uncertainty_avoidance": {"score": 0-100, "barrier": "brief explanation"},
      "long_term_orientation": {"score": 0-100, "barrier": "brief explanation"},
      "indulgence": {"score": 0-100, "barrier": "brief explanation"}
    }
  },
  "education": {
    "score_today": 1-10,
    "score_after": 1-10,
    "delta": 0-10,
    "roi": "description of education investment return",
    "barriers": [
      {"name": "barrier name", "type": "trainable or structural", "trainable": true or false}
    ]
  },
  "bootstrapper": {
    "score": 1-10,
    "easy": 1-10,
    "feasible": 1-10,
    "efforts": 1-10,
    "take": "your honest 2-sentence assessment"
  },
  "case_study": {
    "title": "Name of a real organization that did something similar",
    "source_type": "real or hypothetical",
    "mode": "direct, hybrid, or adapted",
    "match_score": 0-100,
    "narrative": "2-3 paragraphs about how this organization succeeded",
    "expert": "a relevant quote from an expert or founder",
    "expert_name": "who said it"
  },
  "verdict": {
    "total_score": 1-10,
    "verdict": "GO, GO WITH EDUCATION, PIVOT, or SHELVE",
    "detail": "1-2 sentences explaining why this verdict",
    "elevator_pitch": "A co-founder style pitch. Start with the user's own words in quotes. Be specific with scores. Give a concrete next step. 3-4 sentences max.",
    "first_step": "One specific thing to do THIS WEEK",
    "proof_of_work": {
      "protocol": [
        {"day": "Day 1-2", "action": "specific action"},
        {"day": "Day 3-5", "action": "specific action"},
        {"day": "Day 6-10", "action": "specific action"},
        {"day": "Day 11-14", "action": "specific action"}
      ]
    },
    "funding": [
      {"source": "funding source name", "amount": "typical amount", "likelihood": "High, Medium, or Low"}
    ]
  },
  "sdgs": [
    {"id": 1, "name": "No Poverty", "targets": ["1.1", "1.4"]}
  ],
  "fad_risk": {
    "level": "Low, Medium, or High",
    "reason": "why this risk level",
    "timeframe": "how long before this becomes a fad or irrelevant"
  },
  "impact": {
    "score": 1-10,
    "components": {
      "breadth": "how many people affected",
      "depth": "how much change per person",
      "durability": "how long the impact lasts"
    }
  }
}

Use real Hofstede scores for the country. Be honest — not every idea deserves GO. Use PIVOT when the approach is wrong but the problem is real. Use SHELVE when structural barriers are too high.

For the elevator_pitch: use the person's actual words. Start with their idea in quotes. Then give specific scores and a concrete next step. Write like a co-founder, not a consultant.`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [{
          parts: [{ text: `Evaluate this social impact idea:\n\n${idea}` }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      return Response.json(
        { error: `Gemini API error: ${response.status}`, detail: err },
        { status: 502, headers: corsHeaders }
      );
    }

    const data = await response.json();

    // Gemini 2.5 Flash may return multiple parts (thinking + text)
    // Find the part with the actual JSON response
    const parts = data.candidates?.[0]?.content?.parts || [];
    let text = '';
    for (const part of parts) {
      if (part.text && !part.thought) {
        text = part.text;
        break;
      }
    }
    // Fallback: use first part with text
    if (!text && parts.length > 0) {
      text = parts.find(p => p.text)?.text || '';
    }

    if (!text) {
      console.error("Gemini response has no text parts:", JSON.stringify(data).slice(0, 500));
      return Response.json(
        { error: "Gemini returned empty response" },
        { status: 502, headers: corsHeaders }
      );
    }

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code fences
      let cleaned = text;
      const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        cleaned = fenceMatch[1].trim();
      } else {
        // Try to find the last complete JSON object in the text
        // (handles thinking tokens before JSON)
        const allBraces = text.match(/\{[\s\S]*\}/g);
        if (allBraces && allBraces.length > 0) {
          // Try each match from largest to smallest
          for (const match of allBraces.sort((a, b) => b.length - a.length)) {
            try {
              result = JSON.parse(match);
              break; // Successfully parsed
            } catch { continue; }
          }
        }
      }
      if (!result) {
        try {
          result = JSON.parse(cleaned);
        } catch (parseErr) {
          console.error("Gemini JSON parse failed. Raw text:", text.slice(0, 1000));
          return Response.json(
            { error: "Gemini returned invalid JSON", raw: text.slice(0, 500) },
            { status: 502, headers: corsHeaders }
          );
        }
      }
    }

    // Ensure _input is populated
    if (!result._input) {
      result._input = { problem: "", goal: "", country: "", budget: "", constraints: "" };
    }

    return Response.json(result, { headers: corsHeaders });

  } catch (e) {
    console.error("Gemini function error:", e.message, e.name);
    const msg = e.name === 'AbortError' ? 'Evaluation timed out. Try a shorter idea.' : `Evaluation failed: ${e.message}`;
    return Response.json(
      { error: msg, type: e.name },
      { status: 500, headers: corsHeaders }
    );
  }
};
