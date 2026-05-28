"""
Render web service for the Socio-Economic Evaluator.
Thin Flask wrapper around the evaluation pipeline.

Usage:
    gunicorn app:app
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

from evaluator import (
    parse_idea, load_country_data, run_three_tests,
    run_cultural_analysis, run_education_analysis,
    run_bootstrapper_score, find_case_study, generate_verdict,
    map_to_sdgs, assess_fad_risk, calculate_impact_score,
    HOFSTEDE_ADVICE, get_funding_by_score
)

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    """Health check."""
    return jsonify({"status": "ok", "service": "Socio-Economic Evaluator"})


@app.route("/api/eval")
def eval_idea():
    """Run a full 7-layer evaluation."""
    idea = request.args.get("idea", "")

    if not idea or len(idea.strip()) < 10:
        return jsonify({"error": "Please describe your idea in at least 10 characters."}), 400

    if len(idea) > 5000:
        return jsonify({"error": "Idea too long. Maximum 5000 characters."}), 400

    api_key = request.headers.get("X-API-Key", "")

    try:
        parsed_idea = parse_idea(idea)
        country_code = parsed_idea["country"]
        country_data = load_country_data(country_code)

        three_tests = run_three_tests(parsed_idea, country_data)
        cultural_analysis = run_cultural_analysis(parsed_idea, country_data)
        education_analysis = run_education_analysis(cultural_analysis, country_data)

        all_so_far = {
            "three_tests": three_tests,
            "cultural_analysis": cultural_analysis,
            "education_analysis": education_analysis,
        }
        bootstrapper_score = run_bootstrapper_score(parsed_idea, all_so_far)

        case_study = find_case_study(parsed_idea)

        all_analysis = {
            "country_data": country_data,
            "three_tests": three_tests,
            "cultural_analysis": cultural_analysis,
            "education_analysis": education_analysis,
            "bootstrapper_score": bootstrapper_score,
            "case_study": case_study,
        }
        verdict = generate_verdict(parsed_idea, all_analysis)

        sdgs = map_to_sdgs(parsed_idea["idea_type"])
        fad_risk = assess_fad_risk(parsed_idea["idea_type"])
        impact = calculate_impact_score(
            parsed_idea["idea_type"],
            parsed_idea["community"]["economic_tier"],
            cultural_analysis["cultural_compatibility_score"]
        )

        result = {
            "idea": idea[:200],
            "_input": {
                "problem": parsed_idea.get("problem", ""),
                "goal": parsed_idea.get("goal", ""),
                "country": country_data.get("name", parsed_idea["country"]),
                "budget": parsed_idea["constraints"].get("budget", ""),
                "constraints": json.dumps(parsed_idea["constraints"]) if parsed_idea["constraints"] else "",
            },
            "country": parsed_idea["country"],
            "country_name": country_data.get("name", "Unknown"),
            "idea_type": parsed_idea["idea_type"],
            "economic_tier": parsed_idea["community"]["economic_tier"],
            "three_tests": {
                "community_viability_score": three_tests["community_viability_score"],
                "facebook_group_test": three_tests["facebook_group_test"]["pass"],
                "ten_for_ten_test": three_tests["ten_for_ten_test"]["pass"],
                "whatsapp_only_test": three_tests["whatsapp_only_test"]["pass"],
            },
            "cultural": {
                "score": cultural_analysis["cultural_compatibility_score"],
                "dominant_barrier": cultural_analysis["dominant_barrier"],
                "dimensions": {
                    k: {"score": v["score"], "barrier": v["barrier"]}
                    for k, v in cultural_analysis["hofstede_analysis"].items()
                },
                "practical_advice": [
                    {
                        "dimension": k,
                        "score": v["score"],
                        "barrier": v["barrier"],
                        "meaning": HOFSTEDE_ADVICE.get(
                            ({"power_distance":"PDI","individualism":"IDV","masculinity":"MAS","uncertainty_avoidance":"UAI","long_term_orientation":"LTO","indulgence":"IVR"}.get(k, k),
                             "LOW" if k in ("long_term_orientation","indulgence") and v["score"] < 40 else "HIGH"),
                            {}
                        ).get("meaning", v.get("impact", "")),
                        "workaround": HOFSTEDE_ADVICE.get(
                            ({"power_distance":"PDI","individualism":"IDV","masculinity":"MAS","uncertainty_avoidance":"UAI","long_term_orientation":"LTO","indulgence":"IVR"}.get(k, k),
                             "LOW" if k in ("long_term_orientation","indulgence") and v["score"] < 40 else "HIGH"),
                            {}
                        ).get("workaround", ""),
                    }
                    for k, v in cultural_analysis["hofstede_analysis"].items()
                ],
            },
            "education": {
                "score_today": education_analysis["score_today"],
                "score_after": education_analysis["score_after_education"],
                "delta": education_analysis["delta"],
                "roi": education_analysis["education_roi"],
                "barriers": [
                    {"name": b["name"], "type": b["type"], "trainable": b["trainable"]}
                    for b in education_analysis["barriers"]
                ],
            },
            "bootstrapper": {
                "score": bootstrapper_score["bootstrapper_score"],
                "easy": bootstrapper_score["easy"]["score"],
                "feasible": bootstrapper_score["feasible"]["score"],
                "efforts": bootstrapper_score["efforts"]["score"],
                "take": bootstrapper_score["nikhils_take"],
            },
            "case_study": {
                "title": case_study.get("case_study", {}).get("title", "N/A"),
                "source_type": case_study.get("sourceType", "unknown"),
                "mode": case_study.get("mode", "none"),
                "match_score": case_study.get("match_score", 0),
                "narrative": case_study.get("narrative", "")[:500],
                "expert": case_study.get("expert_insight", {}).get("text", ""),
                "expert_name": case_study.get("expert_insight", {}).get(
                    "attribution",
                    case_study.get("expert_insight", {}).get("name", "")
                ),
            },
            "verdict": {
                "total_score": verdict["total_score"],
                "verdict": verdict["verdict"],
                "detail": verdict["verdict_detail"],
                "elevator_pitch": verdict["elevator_pitch"],
                "first_step": verdict["first_step"],
                "proof_of_work": verdict["proof_of_work"],
                "funding": get_funding_by_score(parsed_idea["country"], country_data.get("name", parsed_idea["country"]), verdict["total_score"]),
            },
            "sdgs": sdgs,
            "fad_risk": fad_risk,
            "impact": impact,
        }

        if api_key:
            result["_has_api_key"] = True

        return jsonify(result)

    except Exception as e:
        import traceback
        return jsonify({
            "error": f"Evaluation failed: {str(e)}",
            "traceback": traceback.format_exc(),
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
