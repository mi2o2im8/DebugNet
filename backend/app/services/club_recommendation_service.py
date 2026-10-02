from __future__ import annotations

from datetime import date

from app.ml.club_fit import calculate_club_fit
from app.repositories.club_recommendation_repository import ClubRecommendationRepository


class ClubRecommendationService:
    def __init__(self):
        self.repository = ClubRecommendationRepository()

    @staticmethod
    def _age_group(birth_date_value) -> str | None:
        if not birth_date_value:
            return None

        try:
            birth = date.fromisoformat(str(birth_date_value)[:10])
        except ValueError:
            return None

        today = date.today()
        age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        if age < 0:
            return None

        return f"{age // 10 * 10}대"

    @staticmethod
    def _gender_matches(user_gender: str | None, gender_rule: str | None) -> bool:
        rule = str(gender_rule or "all").strip().lower()
        if rule in {"all", "모두", "남녀 모두", "남녀모두"}:
            return True

        gender_map = {
            "남성": "male",
            "남자": "male",
            "male": "male",
            "여성": "female",
            "여자": "female",
            "female": "female",
        }
        return gender_map.get(str(user_gender or "").strip()) == rule

    def get_defaults(self, user_id: str) -> dict:
        context = self.repository.get_user_context(user_id)
        options = self.repository.get_option_values()

        user_sports = context.get("sports") or []
        user_sports_by_id = {
            int(item["sport_id"]): item
            for item in user_sports
            if item.get("sport_id") is not None
        }

        # 추천 화면에서는 서비스에서 지원하는 5개 종목을 항상 전부 노출한다.
        # 사용자가 회원가입 때 등록한 종목이면 해당 운동 수준도 함께 내려준다.
        sports = []
        for sport in options.get("sports") or []:
            sport_id = int(sport["sport_id"])
            user_sport = user_sports_by_id.get(sport_id) or {}
            sports.append({
                **sport,
                "sport_level": user_sport.get("sport_level"),
            })

        selected_sport = next(
            (
                sport
                for sport in sports
                if int(sport["sport_id"]) in user_sports_by_id
            ),
            sports[0] if sports else None,
        )

        user_regions = context.get("regions") or []
        user_atmospheres = context.get("atmospheres") or []
        user_frequency = context.get("activity_frequency")
        user_levels = [
            sport.get("sport_level")
            for sport in user_sports
            if sport.get("sport_level")
        ]

        return {
            "sports": sports,
            "selected_sport_id": (
                selected_sport.get("sport_id")
                if selected_sport
                else None
            ),
            "selected_sport_level": (
                selected_sport.get("sport_level")
                if selected_sport
                else None
            ),
            "regions": user_regions,
            "available_times": context.get("available_times") or [],
            "atmospheres": user_atmospheres,
            "activity_frequency": user_frequency,
            "max_monthly_fee": context.get("max_monthly_fee"),
            "travel_distance_km": context.get("travel_distance_km"),
            "region_options": sorted(set(options["regions"] + user_regions)),
            "skill_level_options": sorted(set(options["skill_levels"] + user_levels)),
            "atmosphere_options": sorted(set(options["atmospheres"] + user_atmospheres)),
            "activity_frequency_options": sorted(set(
                options["activity_frequencies"]
                + ([user_frequency] if user_frequency else [])
            )),
        }

    def recommend(self, user_id: str, request_data) -> dict:
        user_context = self.repository.get_user_context(user_id)
        candidates = self.repository.get_candidate_clubs(request_data.sport_id)
        excluded_ids = self.repository.get_active_membership_club_ids(user_id)

        preferences = {
            "regions": request_data.regions,
            "available_times": [
                item.model_dump(mode="json")
                for item in request_data.available_times
            ],
            "sport_level": request_data.sport_level,
            "atmospheres": request_data.atmospheres,
            "activity_frequency": request_data.activity_frequency,
            "max_monthly_fee": request_data.max_monthly_fee,
        }

        user_age_group = self._age_group(user_context.get("birth_date"))
        results = []

        for club in candidates:
            club_id = int(club["club_id"])
            if club_id in excluded_ids:
                continue

            if not self._gender_matches(user_context.get("gender"), club.get("gender_rule")):
                continue

            age_groups = club.get("age_groups") or []
            if age_groups and user_age_group and user_age_group not in age_groups:
                continue

            club["traits"] = list(dict.fromkeys(
                (club.get("atmospheres") or []) + (club.get("intro_keywords") or [])
            ))

            fit = calculate_club_fit(preferences=preferences, club=club)

            results.append({
                "club_id": club_id,
                "club_name": club.get("club_name") or "동호회",
                "club_intro": club.get("club_intro"),
                "image_url": club.get("image_url"),
                "sport_id": club.get("sport_id"),
                "sport_name": club.get("sport_name"),
                "sports": club.get("sports") or [],
                "regions": club.get("regions") or [],
                "schedules": club.get("schedules") or [],
                "sport_levels": club.get("sport_levels") or [],
                "atmospheres": club.get("traits") or [],
                "activity_frequency": club.get("activity_frequency"),
                "monthly_fee": club.get("monthly_fee"),
                "current_members": club.get("current_members"),
                "max_members": club.get("max_members"),
                "fit_score": fit["fit_score"],
                "axis_scores": fit["axis_scores"],
                "reasons": fit["reasons"],
            })

        results.sort(key=lambda item: (-float(item["fit_score"]), item["club_name"]))
        limited = results[: request_data.limit]

        return {
            "recommendations": limited,
            "total_candidates": len(results),
        }
