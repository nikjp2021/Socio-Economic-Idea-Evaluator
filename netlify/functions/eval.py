"""
Netlify Function handler for the Socio-Economic Evaluator.
Routes /api/eval to this Python function.

Netlify Python functions use the handler(event, context) signature.
"""

import sys
import os
import json
import traceback
from pathlib import Path
from urllib.parse import parse_qs

# Resolve paths — evaluator.py and data are bundled alongside this function
FUNCTION_DIR = Path(__file__).parent.resolve()

# In Netlify's runtime, bundled files are in the function directory
# Try function dir first, then project root
EVALUATOR_PATH = None
for candidate in [FUNCTION_DIR, FUNCTION_DIR.parent.parent]:
    if (candidate / "evaluator.py").exists():
        EVALUATOR_PATH = candidate
        break

if EVALUATOR_PATH:
    sys.path.insert(0, str(EVALUATOR_PATH))

try:
    from evaluator import (
        parse_idea, load_country_data, run_three_tests,
        run_cultural_analysis, run_education_analysis,
        run_bootstrapper_score, find_case_study, generate_verdict,
        map_to_sdgs, assess_fad_risk, calculate_impact_score
    )
    IMPORT_OK = True
    IMPORT_ERROR = None
except ImportError as e:
    IMPORT_OK = False
    IMPORT_ERROR = str(e)


def handler(event, context):
    """Netlify Function entry point."""
    # Parse query parameters
    params = event.get("queryStringParameters") or {}
    idea = params.get("idea", "")

    if not idea or len(idea.strip()) < 10:
        return _response(400, {"error": "Please describe your idea in at least 10 characters."})

    if len(idea) > 5000:
        return _response(400, {"error": "Idea too long. Maximum 5000 characters."})

    if not IMPORT_OK:
        return _response(500, {
            "error": f"Module import failed: {IMPORT_ERROR}",
            "function_dir": str(FUNCTION_DIR),
            "evaluator_path": str(EVALUATOR_PATH),
            "cwd": os.getcwd(),
            "files": os.listdir(str(FUNCTION_DIR))[:20],
        })

    # Read optional API key from header
    headers = event.get("headers") or {}
    api_key = headers.get("x-api-key", "")

    try:
        # Run full 7-layer evaluation
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

        # SDG Mapping & Impact
        sdgs = map_to_sdgs(parsed_idea["idea_type"])
        fad_risk = assess_fad_risk(parsed_idea["idea_type"])
        impact = calculate_impact_score(
            parsed_idea["idea_type"],
            parsed_idea["community"]["economic_tier"],
            cultural_analysis["cultural_compatibility_score"]
        )

        # Build response
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
                "funding": verdict["funding_pathway"],
            },
            "sdgs": sdgs,
            "fad_risk": fad_risk,
            "impact": impact,
        }

        if api_key:
            result["_has_api_key"] = True

        return _response(200, result)

    except Exception as e:
        return _response(500, {
            "error": f"Evaluation failed: {str(e)}",
            "traceback": traceback.format_exc(),
        })


def _response(status, body):
    """Build a Netlify Function response."""
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "X-API-Key",
        },
        "body": json.dumps(body, ensure_ascii=False),
    }
