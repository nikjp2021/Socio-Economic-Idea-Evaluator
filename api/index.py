"""
Vercel serverless handler for the Socio-Economic Evaluator.
Mirrors server.py evaluation pipeline for deployment on Vercel.

Usage: Deploy to Vercel — this file is auto-detected as /api/eval endpoint.
"""

import sys
import os
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Point sys.path at project root so evaluator.py can be imported
SCRIPT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(SCRIPT_DIR))

from evaluator import (
    parse_idea, load_country_data, run_three_tests,
    run_cultural_analysis, run_education_analysis,
    run_bootstrapper_score, find_case_study, generate_verdict,
    map_to_sdgs, assess_fad_risk, calculate_impact_score
)


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        idea = params.get('idea', [''])[0]

        if not idea or len(idea.strip()) < 10:
            self._send_json({"error": "Please describe your idea in at least 10 characters."}, 400)
            return

        if len(idea) > 5000:
            self._send_json({"error": "Idea too long. Maximum 5000 characters."}, 400)
            return

        # Read optional API key from header
        api_key = self.headers.get('X-API-Key', '')

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
            response = {
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

            # Include API key presence flag (not the key itself) for frontend awareness
            if api_key:
                response["_has_api_key"] = True

            self._send_json(response)

        except Exception as e:
            self._send_json({"error": f"Evaluation failed: {str(e)}"}, 500)

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'X-API-Key')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def log_message(self, format, *args):
        pass  # Suppress request logging in serverless
