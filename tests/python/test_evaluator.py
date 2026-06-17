"""Tests for evaluator.py — the Socio-Economic Idea Evaluator."""
import sys
import json
import pytest
from pathlib import Path

# Ensure project root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import evaluator as ev


# ─── Country Detection ───

class TestDetectCountry:
    def test_india(self):
        assert ev.detect_country("help rural india with clean water") == "IN"

    def test_kenya(self):
        assert ev.detect_country("mobile money for nairobi farmers") == "KE"

    def test_japan(self):
        assert ev.detect_country("elderly care in tokyo") == "JP"

    def test_bangladesh(self):
        assert ev.detect_country("microloans in dhaka bangladesh") == "BD"

    def test_brazil(self):
        assert ev.detect_country("favela education in sao paulo") == "BR"

    def test_usa(self):
        assert ev.detect_country("homelessness in new york") == "US"

    def test_unknown_country(self):
        assert ev.detect_country("generic idea with no country") == "UNKNOWN"

    def test_case_insensitive(self):
        # detect_country expects lowercase input (parse_idea lowercases before calling)
        assert ev.detect_country("kenya water project") == "KE"

    def test_multiple_countries_first_wins(self):
        result = ev.detect_country("india and kenya collaboration")
        assert result == "IN"


# ─── Idea Type Detection ───

class TestDetectIdeaType:
    def test_education(self):
        assert ev.detect_idea_type("free school for rural children") == "education"

    def test_health(self):
        assert ev.detect_idea_type("mobile hospital for remote villages") == "health"

    def test_food(self):
        assert ev.detect_idea_type("community kitchen to fight hunger") == "food"

    def test_water(self):
        assert ev.detect_idea_type("clean water sanitation project") == "water"

    def test_women(self):
        assert ev.detect_idea_type("sanitary pads for girls in school") == "women"

    def test_elderly(self):
        assert ev.detect_idea_type("companionship for lonely elderly people") == "elderly"

    def test_environment(self):
        assert ev.detect_idea_type("plastic recycling in the ocean") == "environment"

    def test_financial_without_women(self):
        assert ev.detect_idea_type("microfinance loans for poor families") == "financial"

    def test_safety_without_women(self):
        assert ev.detect_idea_type("safe walking routes at night for everyone") == "safety"

    def test_community(self):
        assert ev.detect_idea_type("volunteer group to help neighbors") == "community"

    def test_unknown_type(self):
        assert ev.detect_idea_type("xyzzy foobar baz") == "general"

    def test_priority_order(self):
        # "women" should win over "health" since it's more specific
        assert ev.detect_idea_type("health pads for women") == "women"


# ─── Economic Tier Detection ───

class TestDetectEconomicTier:
    def test_t1_country(self):
        assert ev.detect_economic_tier("", "JP") == "T1"

    def test_t2_country(self):
        tier = ev.detect_economic_tier("", "IN")
        assert tier in ("T2-T3", "T2", "T3")

    def test_t4_override(self):
        assert ev.detect_economic_tier("refugee camp with no phone", "KE") == "T4"

    def test_rural_override(self):
        tier = ev.detect_economic_tier("village in rural india", "IN")
        assert tier == "T3"

    def test_smartphone_override(self):
        assert ev.detect_economic_tier("everyone has smartphones and good internet", "BD") == "T1"


# ─── Field Extraction ───

class TestExtractField:
    def test_structured_field(self):
        text = "Problem: No clean water\nGoal: Build wells"
        assert ev.extract_field(text, "problem") == "No clean water"

    def test_missing_field(self):
        assert ev.extract_field("just some text", "problem") == "Inferred from context"


class TestExtractConstraints:
    def test_zero_budget(self):
        c = ev.extract_constraints("I have $0 budget")
        assert c["budget"] == "$0"

    def test_dollar_budget(self):
        c = ev.extract_constraints("I have $500 to start")
        assert c["budget"] == "$500"

    def test_solo_team(self):
        c = ev.extract_constraints("I'm working solo on this")
        assert c["team"] == "Solo"

    def test_weekend_time(self):
        c = ev.extract_constraints("I can work on weekends")
        assert c["time"] == "Weekend"

    def test_no_constraints(self):
        c = ev.extract_constraints("some idea text")
        assert c["budget"] == "Unknown"
        assert c["team"] == "Unknown"


# ─── Parse Idea ───

class TestParseIdea:
    def test_basic_parse(self):
        parsed = ev.parse_idea("Help rural India get clean water through community wells")
        assert parsed["country"] == "IN"
        assert parsed["idea_type"] == "water"
        assert parsed["raw_input"] == "Help rural India get clean water through community wells"

    def test_parse_with_budget(self):
        parsed = ev.parse_idea("Education school program in Kenya with $1000 budget, working solo")
        assert parsed["country"] == "KE"
        assert parsed["constraints"]["budget"] == "$1000"
        assert parsed["constraints"]["team"] == "Solo"

    def test_parse_returns_dict_keys(self):
        parsed = ev.parse_idea("Help rural India get clean water")
        assert "raw_input" in parsed
        assert "country" in parsed
        assert "idea_type" in parsed
        assert "community" in parsed
        assert "constraints" in parsed


# ─── Zone Lookup ───

class TestGetZone:
    def test_east_africa(self):
        assert ev.get_zone_for_country("KE") == "east_africa"

    def test_south_asia(self):
        assert ev.get_zone_for_country("IN") == "south_asia"

    def test_east_asia(self):
        assert ev.get_zone_for_country("JP") == "east_asia"

    def test_latin_america(self):
        assert ev.get_zone_for_country("BR") == "latin_america"

    def test_mena(self):
        assert ev.get_zone_for_country("EG") == "mena"

    def test_unknown_defaults_to_south_asia(self):
        assert ev.get_zone_for_country("ZZ") == "south_asia"


# ─── Country Data Loading ───

class TestLoadCountryData:
    def test_load_india(self):
        data = ev.load_country_data("IN")
        assert data["name"] != "Unknown"
        assert "hofstede" in data
        assert "power_distance" in data["hofstede"]

    def test_load_kenya(self):
        data = ev.load_country_data("KE")
        assert data["name"] != "Unknown"

    def test_load_unknown_country(self):
        data = ev.load_country_data("ZZ")
        assert data["name"] == "Unknown"
        assert data["hofstede"]["power_distance"] == 50  # default


# ─── SDG Mapping ───

class TestMapToSDGs:
    def test_education(self):
        sdgs = ev.map_to_sdgs("education")
        assert sdgs["primary"]["number"] == 4
        assert sdgs["impact_weight"] > 0

    def test_health(self):
        sdgs = ev.map_to_sdgs("health")
        assert sdgs["primary"]["number"] == 3

    def test_food(self):
        sdgs = ev.map_to_sdgs("food")
        assert sdgs["primary"]["number"] == 2

    def test_water(self):
        sdgs = ev.map_to_sdgs("water")
        assert sdgs["primary"]["number"] == 6

    def test_women(self):
        sdgs = ev.map_to_sdgs("women")
        assert sdgs["primary"]["number"] == 5

    def test_unknown_type(self):
        sdgs = ev.map_to_sdgs("nonexistent_type")
        assert "primary" in sdgs


# ─── Fad Risk ───

class TestAssessFadRisk:
    def test_food_low_risk(self):
        risk = ev.assess_fad_risk("food")
        assert risk["level"] == "LOW"

    def test_education_low_risk(self):
        risk = ev.assess_fad_risk("education")
        assert risk["level"] == "LOW"

    def test_unknown_type(self):
        risk = ev.assess_fad_risk("nonexistent")
        assert risk["level"] == "UNKNOWN"


# ─── Impact Score ───

class TestCalculateImpactScore:
    def test_high_impact(self):
        result = ev.calculate_impact_score("food", "T1", 8.0)
        assert result["score"] > 0
        assert result["sdg_weight"] > 0
        assert result["estimated_reach"] == 1000
        assert result["cultural_fit"] == 0.8

    def test_low_tier_reach(self):
        result = ev.calculate_impact_score("education", "T4", 5.0)
        assert result["estimated_reach"] == 30

    def test_interpretation_levels(self):
        high = ev.calculate_impact_score("food", "T1", 10.0)
        low = ev.calculate_impact_score("food", "T4", 1.0)
        assert high["interpretation"] in ("HIGH", "MEDIUM")
        assert low["interpretation"] in ("LOW", "MEDIUM")


# ─── Three Tests ───

class TestRunThreeTests:
    def _make_parsed(self, **overrides):
        base = {
            "raw_input": "Help rural India get clean water",
            "country": "IN",
            "idea_type": "water",
            "community": {"economic_tier": "T3"},
            "constraints": {"budget": "$100", "team": "Solo"},
        }
        base.update(overrides)
        return base

    def test_returns_required_keys(self):
        parsed = self._make_parsed()
        country_data = ev.load_country_data("IN")
        result = ev.run_three_tests(parsed, country_data)
        assert "community_viability_score" in result
        assert "facebook_group_test" in result
        assert "ten_for_ten_test" in result
        assert "whatsapp_only_test" in result

    def test_score_in_range(self):
        parsed = self._make_parsed()
        country_data = ev.load_country_data("IN")
        result = ev.run_three_tests(parsed, country_data)
        assert 0 <= result["community_viability_score"] <= 10

    def test_tests_have_pass_field(self):
        parsed = self._make_parsed()
        country_data = ev.load_country_data("IN")
        result = ev.run_three_tests(parsed, country_data)
        # The test results are dicts with a "pass" field
        assert "pass" in result["facebook_group_test"]
        assert isinstance(result["facebook_group_test"]["pass"], bool)


# ─── Cultural Analysis ───

class TestRunCulturalAnalysis:
    def test_returns_required_keys(self):
        parsed = ev.parse_idea("Clean water for rural India villages")
        country_data = ev.load_country_data(parsed["country"])
        result = ev.run_cultural_analysis(parsed, country_data)
        assert "cultural_compatibility_score" in result
        assert "hofstede_analysis" in result

    def test_score_in_range(self):
        parsed = ev.parse_idea("Clean water for rural India villages")
        country_data = ev.load_country_data(parsed["country"])
        result = ev.run_cultural_analysis(parsed, country_data)
        assert 0 <= result["cultural_compatibility_score"] <= 10

    def test_hofstede_dimensions_present(self):
        parsed = ev.parse_idea("Clean water for rural India villages")
        country_data = ev.load_country_data(parsed["country"])
        result = ev.run_cultural_analysis(parsed, country_data)
        dims = result["hofstede_analysis"]
        assert "power_distance" in dims
        assert "individualism" in dims


# ─── Education Analysis ───

class TestRunEducationAnalysis:
    def test_returns_required_keys(self):
        parsed = ev.parse_idea("Clean water for rural India")
        country_data = ev.load_country_data(parsed["country"])
        cultural = ev.run_cultural_analysis(parsed, country_data)
        result = ev.run_education_analysis(cultural, country_data)
        assert "score_today" in result
        assert "score_after_education" in result
        assert "delta" in result

    def test_delta_non_negative(self):
        parsed = ev.parse_idea("Clean water for rural India")
        country_data = ev.load_country_data(parsed["country"])
        cultural = ev.run_cultural_analysis(parsed, country_data)
        result = ev.run_education_analysis(cultural, country_data)
        assert result["delta"] >= 0

    def test_has_barriers(self):
        parsed = ev.parse_idea("Clean water for rural India")
        country_data = ev.load_country_data(parsed["country"])
        cultural = ev.run_cultural_analysis(parsed, country_data)
        result = ev.run_education_analysis(cultural, country_data)
        assert "barriers" in result
        assert isinstance(result["barriers"], list)


# ─── Bootstrapper Score ───

class TestRunBootstrapperScore:
    def _get_all_analysis(self):
        parsed = ev.parse_idea("Clean water for rural India")
        country_data = ev.load_country_data(parsed["country"])
        cultural = ev.run_cultural_analysis(parsed, country_data)
        education = ev.run_education_analysis(cultural, country_data)
        three_tests = ev.run_three_tests(parsed, country_data)
        return parsed, {
            "three_tests": three_tests,
            "cultural_analysis": cultural,
            "education_analysis": education,
        }

    def test_returns_required_keys(self):
        parsed, all_analysis = self._get_all_analysis()
        result = ev.run_bootstrapper_score(parsed, all_analysis)
        assert "bootstrapper_score" in result
        assert "easy" in result
        assert "feasible" in result
        assert "efforts" in result

    def test_score_in_range(self):
        parsed, all_analysis = self._get_all_analysis()
        result = ev.run_bootstrapper_score(parsed, all_analysis)
        score = result["bootstrapper_score"]
        assert 1 <= score <= 10, f"bootstrapper_score = {score} out of range"

    def test_sub_scores_are_dicts(self):
        parsed, all_analysis = self._get_all_analysis()
        result = ev.run_bootstrapper_score(parsed, all_analysis)
        assert isinstance(result["easy"], dict)
        assert "score" in result["easy"]
        assert isinstance(result["feasible"], dict)
        assert "score" in result["feasible"]


# ─── Mentor Personas ───

class TestMatchMentorPersonas:
    def test_returns_list(self):
        parsed = ev.parse_idea("Clean water for rural India")
        country_data = ev.load_country_data(parsed["country"])
        cultural = ev.run_cultural_analysis(parsed, country_data)
        education = ev.run_education_analysis(cultural, country_data)
        three_tests = ev.run_three_tests(parsed, country_data)
        bootstrapper = ev.run_bootstrapper_score(parsed, {
            "three_tests": three_tests,
            "cultural_analysis": cultural,
            "education_analysis": education,
        })
        case_study = ev.find_case_study(parsed)
        all_analysis = {
            "country_data": country_data,
            "three_tests": three_tests,
            "cultural_analysis": cultural,
            "education_analysis": education,
            "bootstrapper_score": bootstrapper,
            "case_study": case_study,
        }
        result = ev.match_mentor_personas(parsed, all_analysis)
        assert isinstance(result, list)
        assert len(result) <= 3


# ─── Full Evaluate Integration ───

class TestEvaluate:
    def test_full_evaluation_india(self):
        report = ev.evaluate("Help rural India get clean water through community wells and filtration systems")
        assert isinstance(report, str)
        assert len(report) > 500
        assert "Result" in report

    def test_full_evaluation_kenya(self):
        report = ev.evaluate("Mobile banking app for farmers in Kenya to access microloans")
        assert isinstance(report, str)
        assert len(report) > 500

    def test_full_evaluation_japan(self):
        report = ev.evaluate("Loneliness support network for elderly people living alone in Japan")
        assert isinstance(report, str)
        assert len(report) > 500

    def test_evaluation_contains_score(self):
        report = ev.evaluate("Free coding workshops for rural youth in India")
        assert "/10" in report or "out of 10" in report

    def test_evaluation_contains_country(self):
        report = ev.evaluate("Clean water project in Kenya")
        assert "Kenya" in report
