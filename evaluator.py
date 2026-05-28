import argparse


WEIGHTS = {
    "social_impact": 0.3,
    "economic_feasibility": 0.3,
    "inclusivity": 0.15,
    "sustainability": 0.15,
    "cost_efficiency": 0.1,
}


def _validate_score(name: str, value: float) -> float:
    if not 0 <= value <= 10:
        raise ValueError(f"{name} must be between 0 and 10")
    return value


def evaluate_idea(
    social_impact: float,
    economic_feasibility: float,
    inclusivity: float,
    sustainability: float,
    cost_efficiency: float,
) -> float:
    """Return weighted socio-economic score from five 0-10 criterion values."""
    scores = {
        "social_impact": _validate_score("social_impact", social_impact),
        "economic_feasibility": _validate_score(
            "economic_feasibility", economic_feasibility
        ),
        "inclusivity": _validate_score("inclusivity", inclusivity),
        "sustainability": _validate_score("sustainability", sustainability),
        "cost_efficiency": _validate_score("cost_efficiency", cost_efficiency),
    }
    return round(sum(scores[k] * WEIGHTS[k] for k in WEIGHTS), 2)


def rating_band(score: float) -> str:
    """Map score to rating: >=8.5 Excellent, >=7.0 Strong, >=5.5 Moderate."""
    if score >= 8.5:
        return "Excellent"
    if score >= 7.0:
        return "Strong"
    if score >= 5.5:
        return "Moderate"
    return "Needs Improvement"


def main() -> None:
    parser = argparse.ArgumentParser(description="Socio-Economic Idea Evaluator")
    parser.add_argument("--social-impact", type=float, required=True)
    parser.add_argument("--economic-feasibility", type=float, required=True)
    parser.add_argument("--inclusivity", type=float, required=True)
    parser.add_argument("--sustainability", type=float, required=True)
    parser.add_argument("--cost-efficiency", type=float, required=True)
    args = parser.parse_args()

    score = evaluate_idea(
        social_impact=args.social_impact,
        economic_feasibility=args.economic_feasibility,
        inclusivity=args.inclusivity,
        sustainability=args.sustainability,
        cost_efficiency=args.cost_efficiency,
    )
    print(f"Overall Score: {score}/10")
    print(f"Rating: {rating_band(score)}")


if __name__ == "__main__":
    main()
