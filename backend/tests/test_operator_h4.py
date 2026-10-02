import unittest

from app.services.operator_ml_service import OperatorMlService


class OperatorH4Tests(unittest.TestCase):
    @staticmethod
    def _rows(user_id, statuses):
        return [
            {
                "user_id": user_id,
                "event_date": f"2026-08-{index:02d}",
                "result": status,
            }
            for index, status in enumerate(statuses, 1)
        ]

    def test_stable_attendance_is_normal(self):
        result = OperatorMlService().analyze_h4_participation(
            result_rows=self._rows(
                "stable",
                ["attended"] * 8,
            ),
            member_profiles={
                "stable": {
                    "activity_frequency": "주 1회 이하",
                }
            },
        )

        self.assertEqual(result["stable"]["risk_grade"], "정상")
        self.assertEqual(result["stable"]["risk_score"], 0.0)
        self.assertEqual(
            result["stable"]["recent_attendance_rate"],
            1.0,
        )

    def test_recent_no_show_streak_is_high_risk(self):
        statuses = ["attended"] * 4 + ["no_show"] * 4
        result = OperatorMlService().analyze_h4_participation(
            result_rows=self._rows("risk", statuses),
            member_profiles={
                "risk": {
                    "activity_frequency": "주 1회 이하",
                }
            },
        )

        self.assertEqual(result["risk"]["risk_grade"], "고위험")
        self.assertGreaterEqual(result["risk"]["risk_score"], 80)
        self.assertEqual(
            result["risk"]["consecutive_nonparticipation"],
            4,
        )

    def test_not_eligible_is_excluded_from_rates(self):
        result = OperatorMlService().analyze_h4_participation(
            result_rows=self._rows(
                "member",
                [
                    "not_eligible",
                    "not_eligible",
                    "attended",
                    "attended",
                ],
            ),
            member_profiles={
                "member": {
                    "activity_frequency": "주 1회 이하",
                }
            },
        )

        self.assertEqual(
            result["member"]["recent_attendance_rate"],
            1.0,
        )
        self.assertEqual(result["member"]["recent_no_show_rate"], 0.0)


if __name__ == "__main__":
    unittest.main()
