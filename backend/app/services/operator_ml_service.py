from datetime import date, datetime, time



class OperatorMlService:
    DIRECT_FIT_AXES = {
        "일정",
        "실력",
        "목적",
        "분위기",
        "활동빈도",
        "비용",
    }

    LEVEL_RANK = {
        "입문": 0,
        "초급": 0,
        "중급": 1,
        "상급": 2,
    }

    CLUB_LEVEL_RANK = {
        "초급 중심": 0,
        "중급 중심": 1,
        "상급 중심": 2,
    }

    PURPOSE_RANK = {
        "친목 중심": 0,
        "즐거운 분위기": 0,
        "가볍게 활동": 0,
        "실력 향상": 1,
        "꾸준한 운동": 1,
        "건강한 라이프스타일": 1,
        "정기적인 활동": 1,
        "경쟁적인 활동": 2,
        "대회/리그 활동": 2,
    }

    USER_FREQUENCY_VALUE = {
        "주 1회 이하": 1.0,
        "주 1~2회": 1.5,
        "주 3~4회": 3.5,
        "주 5회 이상": 5.0,
        "상관없음": None,
    }

    CLUB_FREQUENCY_VALUE = {
        "주 1회": 1.0,
        "주 2회": 2.0,
        "주 3~4회": 3.5,
        "비정기 활동": 0.75,
        "자유 참여": None,
    }

    OFFICIAL_FREQUENCY = {
        "주 1회 이하": "일주일에 1번",
        "주 1~2회": "일주일에 2번",
        "주 3~4회": "일주일에 3번",
        "주 5회 이상": "일주일에 5번",
        "주 1회": "일주일에 1번",
        "주 2회": "일주일에 2번",
        "비정기 활동": "한 달에 3번 이하",
        "자유 참여": "한 달에 3번 이하",
    }

    @staticmethod
    def _normalize_text(value) -> str:
        return str(value or "").strip()

    @classmethod
    def _normalize_day(cls, value) -> str:
        normalized = cls._normalize_text(value)

        day_aliases = {
            "월": "월",
            "월요일": "월",
            "화": "화",
            "화요일": "화",
            "수": "수",
            "수요일": "수",
            "목": "목",
            "목요일": "목",
            "금": "금",
            "금요일": "금",
            "토": "토",
            "토요일": "토",
            "일": "일",
            "일요일": "일",
        }

        return day_aliases.get(
            normalized,
            normalized,
        )

    @staticmethod
    def _to_minutes(value) -> int | None:
        if value is None:
            return None

        if isinstance(value, time):
            parsed = value
        else:
            text = str(value).strip()
            if not text:
                return None
            parsed = time.fromisoformat(text)

        return parsed.hour * 60 + parsed.minute

    @classmethod
    def _schedule_score(
        cls,
        club_schedules: list[dict],
        user_times: list[dict],
    ) -> float | None:
        if not club_schedules or not user_times:
            return None

        matched_count = 0

        for club_schedule in club_schedules:
            club_day = cls._normalize_day(
                club_schedule.get("day_of_week")
            )
            club_start = cls._to_minutes(
                club_schedule.get("start_time")
            )
            club_end = cls._to_minutes(
                club_schedule.get("end_time")
            )

            if club_start is None or club_end is None:
                continue

            # PostgreSQL TIME에는 24:00을 저장할 수 없어
            # 회원가입 단계에서 하루 끝을 00:00으로 저장한다.
            # 종료 시간이 시작 시간보다 작거나 같다면
            # 다음 날 자정 또는 익일 시간으로 해석한다.
            if club_end <= club_start:
                club_end += 24 * 60

            has_overlap = False

            for user_time in user_times:
                if cls._normalize_day(
                    user_time.get("day_of_week")
                ) != club_day:
                    continue

                user_start = cls._to_minutes(
                    user_time.get("start_time")
                )
                user_end = cls._to_minutes(
                    user_time.get("end_time")
                )

                if user_start is None or user_end is None:
                    continue

                if user_end <= user_start:
                    user_end += 24 * 60

                if max(club_start, user_start) < min(
                    club_end,
                    user_end,
                ):
                    has_overlap = True
                    break

            if has_overlap:
                matched_count += 1

        return round(
            matched_count / len(club_schedules),
            4,
        )

    @classmethod
    def _skill_score(
        cls,
        club_levels: list[str],
        user_level: str | None,
    ) -> float | None:
        if not club_levels or not user_level:
            return None

        if any(
            level in {
                "수준 무관",
                "실력별 그룹 운영",
                "입문 가능",
            }
            for level in club_levels
        ):
            return 1.0

        user_rank = cls.LEVEL_RANK.get(
            cls._normalize_text(user_level)
        )

        club_ranks = [
            cls.CLUB_LEVEL_RANK[level]
            for level in club_levels
            if level in cls.CLUB_LEVEL_RANK
        ]

        if user_rank is None or not club_ranks:
            return None

        distance = min(
            abs(user_rank - club_rank)
            for club_rank in club_ranks
        )

        return {
            0: 1.0,
            1: 0.5,
            2: 0.0,
        }.get(distance, 0.0)

    @classmethod
    def _purpose_score(
        cls,
        club_traits: list[str],
        user_traits: list[str],
    ) -> float | None:
        club_ranks = [
            cls.PURPOSE_RANK[item]
            for item in club_traits
            if item in cls.PURPOSE_RANK
        ]
        user_ranks = [
            cls.PURPOSE_RANK[item]
            for item in user_traits
            if item in cls.PURPOSE_RANK
        ]

        if not club_ranks or not user_ranks:
            return None

        distance = min(
            abs(club_rank - user_rank)
            for club_rank in club_ranks
            for user_rank in user_ranks
        )

        return {
            0: 1.0,
            1: 0.5,
            2: 0.0,
        }.get(distance, 0.0)

    @classmethod
    def _atmosphere_score(
        cls,
        club_traits: list[str],
        user_traits: list[str],
    ) -> float | None:
        club_values = {
            cls._normalize_text(value)
            for value in club_traits
            if cls._normalize_text(value)
        }
        user_values = {
            cls._normalize_text(value)
            for value in user_traits
            if cls._normalize_text(value)
        }

        if not club_values or not user_values:
            return None

        if club_values & user_values:
            return 1.0

        return cls._purpose_score(
            list(club_values),
            list(user_values),
        )

    @classmethod
    def _frequency_score(
        cls,
        club_frequency: str | None,
        user_frequency: str | None,
    ) -> float | None:
        user_value = cls.USER_FREQUENCY_VALUE.get(
            cls._normalize_text(user_frequency)
        )
        club_value = cls.CLUB_FREQUENCY_VALUE.get(
            cls._normalize_text(club_frequency)
        )

        if user_value is None or club_value is None:
            return None

        difference = abs(user_value - club_value)

        if difference <= 0.5:
            return 1.0
        if difference <= 1.5:
            return 0.75
        if difference <= 2.5:
            return 0.5
        return 0.25

    @classmethod
    def _region_pass(
        cls,
        club_region: str | None,
        user_regions: list[str],
    ) -> bool | None:
        normalized_club = cls._normalize_text(
            club_region
        ).replace(" ", "")

        normalized_users = [
            cls._normalize_text(region).replace(" ", "")
            for region in user_regions
            if cls._normalize_text(region)
        ]

        if not normalized_club or not normalized_users:
            return None

        return any(
            region in normalized_club
            or normalized_club in region
            for region in normalized_users
        )

    @staticmethod
    def _age_group(birth_date) -> str | None:
        if not birth_date:
            return None

        if isinstance(birth_date, datetime):
            parsed = birth_date.date()
        elif isinstance(birth_date, date):
            parsed = birth_date
        else:
            parsed = date.fromisoformat(str(birth_date)[:10])

        today = date.today()
        age = (
            today.year
            - parsed.year
            - (
                (today.month, today.day)
                < (parsed.month, parsed.day)
            )
        )

        if age < 20:
            return "10대"
        if age >= 60:
            return "60대 이상"
        return f"{age // 10 * 10}대"

    @classmethod
    def _basic_condition_pass(
        cls,
        club: dict,
        applicant: dict,
        required_answers_passed: bool,
    ) -> bool:
        gender_rule = cls._normalize_text(
            club.get("gender_rule")
        ) or "all"
        applicant_gender = cls._normalize_text(
            applicant.get("gender")
        )

        gender_alias = {
            "남성": "male",
            "남자": "male",
            "male": "male",
            "여성": "female",
            "여자": "female",
            "female": "female",
        }

        gender_pass = (
            gender_rule == "all"
            or not applicant_gender
            or gender_alias.get(applicant_gender)
            == gender_rule
        )

        club_age_groups = club.get("age_groups") or []
        applicant_age_group = cls._age_group(
            applicant.get("birth_date")
        )

        age_pass = (
            not club_age_groups
            or applicant_age_group is None
            or applicant_age_group in club_age_groups
        )

        return bool(
            gender_pass
            and age_pass
            and required_answers_passed
        )

    @classmethod
    def _official_frequency(
        cls,
        user_frequency: str | None,
        club_frequency: str | None,
    ) -> str:
        normalized_user = cls._normalize_text(
            user_frequency
        )
        normalized_club = cls._normalize_text(
            club_frequency
        )

        return (
            cls.OFFICIAL_FREQUENCY.get(normalized_user)
            or cls.OFFICIAL_FREQUENCY.get(normalized_club)
            or "한 달에 3번 이하"
        )

    @staticmethod
    def _split_axes(value) -> list[str]:
        text = str(value or "").strip()
        if not text or text == "-":
            return []
        return [
            item.strip()
            for item in text.split(",")
            if item.strip()
        ]

    def evaluate_h2_application(
        self,
        context: dict,
        required_answers_passed: bool,
    ) -> dict:
        # 실제 평가 시점에만 모델을 불러온다.
        # ML 파일 문제로 백엔드 전체가 시작되지 않는 것을 방지한다.
        from app.ml.operator_poc.engines.h2_applicant_fit import (
            run_h2_applicant_fit_runtime,
        )

        club = context.get("club") or {}
        applicant = context.get("applicant") or {}

        missing_axes: list[str] = []

        schedule_score = self._schedule_score(
            club.get("schedules") or [],
            applicant.get("available_times") or [],
        )
        if schedule_score is None:
            missing_axes.append("일정")
            schedule_score = 1.0

        club_sport_id = club.get("sport_id")
        applicant_sport_ids = set(
            applicant.get("sport_ids") or []
        )
        sport_data_available = (
            club_sport_id is not None
            and bool(applicant_sport_ids)
        )
        sport_pass = (
            int(club_sport_id) in {
                int(value)
                for value in applicant_sport_ids
            }
            if sport_data_available
            else True
        )

        applicant_level = (
            applicant.get("sport_levels") or {}
        ).get(str(club_sport_id))
        if applicant_level is None:
            applicant_level = (
                applicant.get("sport_levels") or {}
            ).get(club_sport_id)

        skill_score = self._skill_score(
            club.get("sport_levels") or [],
            applicant_level,
        )
        if skill_score is None:
            missing_axes.append("실력")
            skill_score = 1.0

        club_traits = list(
            dict.fromkeys(
                (club.get("atmospheres") or [])
                + (club.get("intro_keywords") or [])
            )
        )
        user_traits = applicant.get("atmospheres") or []

        purpose_score = self._purpose_score(
            club_traits,
            user_traits,
        )
        if purpose_score is None:
            missing_axes.append("목적")
            purpose_score = 1.0

        atmosphere_score = self._atmosphere_score(
            club_traits,
            user_traits,
        )
        if atmosphere_score is None:
            missing_axes.append("분위기")
            atmosphere_score = 1.0

        frequency_score = self._frequency_score(
            club.get("activity_frequency"),
            applicant.get("activity_frequency"),
        )
        if frequency_score is None:
            missing_axes.append("활동빈도")
            frequency_score = 1.0

        missing_axes.append("비용")
        cost_score = 1.0

        region_result = self._region_pass(
            club.get("region"),
            applicant.get("regions") or [],
        )

        hard_checks = {
            "종목 불일치": sport_pass,
            "일정 교집합 없음": (
                schedule_score > 0
                if "일정" not in missing_axes
                else True
            ),
            "이동 가능 범위 미충족": (
                region_result
                if region_result is not None
                else True
            ),
            "운영자 필수 가입조건 미충족": (
                self._basic_condition_pass(
                    club,
                    applicant,
                    required_answers_passed,
                )
            ),
        }

        engine_result = run_h2_applicant_fit_runtime(
            applicant_id=applicant.get("user_id"),
            axis_scores={
                "일정": schedule_score,
                "실력": skill_score,
                "목적": purpose_score,
                "분위기": atmosphere_score,
                "활동빈도": frequency_score,
                "비용": cost_score,
            },
            hard_checks=hard_checks,
            club_trial_available=False,
            sport=(
                club.get("sport_name")
                or "미지원 종목"
            ),
            activity_frequency=(
                self._official_frequency(
                    applicant.get("activity_frequency"),
                    club.get("activity_frequency"),
                )
            ),
        )

        unique_missing_axes = list(
            dict.fromkeys(missing_axes)
        )
        covered_axis_count = (
            len(self.DIRECT_FIT_AXES)
            - len(unique_missing_axes)
        )

        return {
            "direct_fit_score": engine_result.get(
                "표시점수"
            ),
            "official_prior_score": engine_result.get(
                "OfficialPrior_100"
            ),
            "classification": engine_result[
                "최종판정"
            ],
            "hard_constraint_passed": engine_result[
                "HardConstraint_통과"
            ],
            "hard_constraint_reason": engine_result[
                "HardConstraint_사유"
            ],
            "severe_mismatch_axes": self._split_axes(
                engine_result.get("심한불일치축")
            ),
            "partial_mismatch_axes": self._split_axes(
                engine_result.get("부분불일치축")
            ),
            "trial_recommended": engine_result[
                "체험추천"
            ],
            "operator_action": engine_result[
                "운영자_추천액션"
            ],
            "data_coverage": round(
                covered_axis_count
                / len(self.DIRECT_FIT_AXES)
                * 100
            ),
            "missing_axes": unique_missing_axes,
        }
