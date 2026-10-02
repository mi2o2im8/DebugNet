import unittest

from app.services.operator_ml_service import OperatorMlService


class OperatorH1Tests(unittest.TestCase):
    @staticmethod
    def _club_context():
        return {
            "sport_id": 1,
            "sport_name": "축구·풋살",
            "activity_frequency": "주 1회",
            "gender_rule": "all",
            "monthly_fee": 30000,
            "schedules": [{
                "day_of_week": "월요일",
                "start_time": "19:00",
                "end_time": "21:00",
            }],
            "sport_levels": ["중급 중심"],
            "region": "서울특별시 마포구",
            "atmospheres": ["친목 중심"],
            "intro_keywords": [],
            "age_groups": [],
        }

    @staticmethod
    def _applicant(user_id, sport_id=1):
        return {
            "user_id": user_id,
            "gender": "남성",
            "birth_date": "1997-01-13",
            "travel_distance_km": 5,
            "max_monthly_fee": 30000,
            "activity_frequency": "주 1~2회",
            "sport_ids": [sport_id],
            "sport_levels": {str(sport_id): "중급"},
            "regions": ["마포구"],
            "available_times": [{
                "day_of_week": "월",
                "start_time": "18:00",
                "end_time": "22:00",
            }],
            "atmospheres": ["친목 중심"],
        }

    def test_matching_candidate_is_ranked(self):
        result = OperatorMlService().recommend_h1_candidates(
            context_bundle={
                "contexts": {
                    "user-a": {
                        "club": self._club_context(),
                        "applicant": self._applicant("user-a"),
                        "candidate_profile": {
                            "user_id": "user-a",
                            "nickname": "축구맨",
                            "profile_image": None,
                        },
                    },
                },
                "total_users_scanned": 3,
                "candidate_pool_count": 1,
                "excluded_member_count": 1,
                "excluded_application_count": 1,
            },
            limit=10,
        )

        self.assertEqual(result["eligible_count"], 1)
        self.assertEqual(result["returned_count"], 1)
        item = result["recommendations"][0]
        self.assertEqual(item["rank"], 1)
        self.assertEqual(item["nickname"], "축구맨")
        self.assertGreaterEqual(item["direct_match_score"], 80)
        self.assertEqual(item["axis_scores"]["schedule"], 100)

    def test_sport_mismatch_is_excluded(self):
        result = OperatorMlService().recommend_h1_candidates(
            context_bundle={
                "contexts": {
                    "user-b": {
                        "club": self._club_context(),
                        "applicant": self._applicant(
                            "user-b",
                            sport_id=2,
                        ),
                        "candidate_profile": {
                            "user_id": "user-b",
                            "nickname": "배구맨",
                            "profile_image": None,
                        },
                    },
                },
                "total_users_scanned": 1,
                "candidate_pool_count": 1,
            },
            limit=10,
        )

        self.assertEqual(result["recommendations"], [])
        self.assertEqual(
            result["excluded_summary"]["종목 불일치"],
            1,
        )

    def test_empty_pool_returns_metadata(self):
        result = OperatorMlService().recommend_h1_candidates(
            context_bundle={
                "contexts": {},
                "total_users_scanned": 5,
                "candidate_pool_count": 0,
                "excluded_member_count": 3,
                "excluded_application_count": 2,
            },
            limit=10,
        )

        self.assertEqual(result["recommendations"], [])
        self.assertEqual(result["total_users_scanned"], 5)
        self.assertFalse(result["consent_filter_applied"])


if __name__ == "__main__":
    unittest.main()
