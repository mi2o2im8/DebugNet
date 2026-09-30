import unittest
from datetime import date

from app.services.operator_ml_service import OperatorMlService


class OperatorH3Tests(unittest.TestCase):
    def test_h2_midnight_schedule_still_overlaps(self):
        score = OperatorMlService._schedule_score(
            [{"day_of_week": "월요일", "start_time": "12:00",
              "end_time": "00:00"}],
            [{"day_of_week": "월", "start_time": "19:00",
              "end_time": "21:00"}],
        )
        self.assertEqual(score, 1.0)

    def test_exact_time_overlap_and_missing_member_data(self):
        context = {
            "club": {"activity_frequency": "주 1회"},
            "sport": "축구",
            "region": "서울",
            "schedules": [{
                "day_of_week": "월",
                "start_time": "18:00:00",
                "end_time": "20:00:00",
            }],
            "venues": [{
                "club_venue_id": 7,
                "venue_name": "실제 장소",
                "address": "실제 주소",
            }],
            "members": [
                {"club_member_id": 1, "user_id": "a"},
                {"club_member_id": 2, "user_id": "b"},
                {"club_member_id": 3, "user_id": "c"},
            ],
            "available_times": [
                {"user_id": "a", "day_of_week": "월요일",
                 "start_time": "19:00", "end_time": "21:00"},
                {"user_id": "b", "day_of_week": "월",
                 "start_time": "20:00", "end_time": "22:00"},
            ],
            "existing_events": [],
        }
        result = OperatorMlService().recommend_h3_schedules(
            context,
            date(2026, 10, 5),
            date(2026, 10, 11),
            minimum_participants=1,
            guest_allowed=False,
        )
        self.assertEqual(len(result["recommendations"]), 1)
        item = result["recommendations"][0]
        self.assertEqual(item["matching_member_count"], 1)
        self.assertEqual(item["total_members"], 3)
        self.assertEqual(item["event_date"], date(2026, 10, 5))
        self.assertEqual(result["data_coverage"]["members_with_availability"], 2)
        self.assertFalse(result["travel_applied"])
        self.assertFalse(result["venue_availability_applied"])
        self.assertIn("member_availability", result["missing_fields"])

    def test_no_known_availability_produces_no_recommendation(self):
        result = OperatorMlService().recommend_h3_schedules(
            {
                "club": {},
                "schedules": [{
                    "day_of_week": "월",
                    "start_time": "18:00",
                    "end_time": "20:00",
                }],
                "members": [{"club_member_id": 1, "user_id": "a"}],
            },
            date(2026, 10, 5),
            date(2026, 10, 11),
            minimum_participants=1,
            guest_allowed=True,
        )
        self.assertEqual(result["recommendations"], [])

    def test_guest_limit_blocks_unworkable_fallback(self):
        result = OperatorMlService().recommend_h3_schedules(
            {
                "club": {"activity_frequency": "주 1회"},
                "sport": "축구",
                "region": "서울",
                "schedules": [{
                    "day_of_week": "월",
                    "start_time": "18:00",
                    "end_time": "20:00",
                }],
                "members": [{"club_member_id": 1, "user_id": "a"}],
                "available_times": [{
                    "user_id": "a",
                    "day_of_week": "월",
                    "start_time": "08:00",
                    "end_time": "09:00",
                }],
            },
            date(2026, 10, 5),
            date(2026, 10, 11),
            minimum_participants=2,
            guest_allowed=True,
            max_guests=1,
        )
        self.assertEqual(result["recommendations"], [])


if __name__ == "__main__":
    unittest.main()
