import unittest

from evaluator import evaluate_idea, rating_band


class EvaluatorTests(unittest.TestCase):
    def test_evaluate_idea_returns_weighted_score(self):
        score = evaluate_idea(
            social_impact=8,
            economic_feasibility=7,
            inclusivity=9,
            sustainability=8,
            cost_efficiency=6,
        )
        self.assertEqual(score, 7.65)

    def test_rating_band_maps_scores_to_correct_bands(self):
        self.assertEqual(rating_band(8.5), "Excellent")
        self.assertEqual(rating_band(8.49), "Strong")
        self.assertEqual(rating_band(7.0), "Strong")
        self.assertEqual(rating_band(7.2), "Strong")
        self.assertEqual(rating_band(6.9), "Moderate")
        self.assertEqual(rating_band(5.5), "Moderate")
        self.assertEqual(rating_band(5.6), "Moderate")
        self.assertEqual(rating_band(5.49), "Needs Improvement")
        self.assertEqual(rating_band(5.4), "Needs Improvement")

    def test_invalid_score_raises_value_error(self):
        with self.assertRaises(ValueError):
            evaluate_idea(
                social_impact=11,
                economic_feasibility=7,
                inclusivity=9,
                sustainability=8,
                cost_efficiency=6,
            )


if __name__ == "__main__":
    unittest.main()
