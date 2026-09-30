from datetime import date, datetime, time, timedelta



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

    H1_SKILL_BY_SCORE = {
        1.0: "초보",
        0.5: "중급",
        0.0: "숙련",
    }

    H1_PURPOSE_BY_SCORE = {
        1.0: "친목",
        0.5: "운동",
        0.0: "경쟁",
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

    @classmethod
    def _h1_age(cls, birth_date) -> int | None:
        if not birth_date:
            return None

        try:
            if isinstance(birth_date, datetime):
                parsed = birth_date.date()
            elif isinstance(birth_date, date):
                parsed = birth_date
            else:
                parsed = date.fromisoformat(
                    str(birth_date)[:10]
                )
        except (TypeError, ValueError):
            return None

        today = date.today()
        return (
            today.year
            - parsed.year
            - (
                (today.month, today.day)
                < (parsed.month, parsed.day)
            )
        )

    @classmethod
    def _h1_age_constraint(
        cls,
        age_groups: list[str],
    ) -> list[int] | None:
        ranges = {
            "10대": (10, 19),
            "20대": (20, 29),
            "30대": (30, 39),
            "40대": (40, 49),
            "50대": (50, 59),
            "60대 이상": (60, 120),
        }
        selected = [
            ranges[value]
            for value in age_groups
            if value in ranges
        ]
        if not selected:
            return None
        return [
            min(value[0] for value in selected),
            max(value[1] for value in selected),
        ]

    @classmethod
    def _h1_gender(cls, value) -> str | None:
        aliases = {
            "남성": "male",
            "남자": "male",
            "male": "male",
            "여성": "female",
            "여자": "female",
            "female": "female",
        }
        return aliases.get(
            cls._normalize_text(value).lower()
        )

    @classmethod
    def _h1_gender_constraint(
        cls,
        value,
    ) -> list[str] | None:
        normalized = cls._normalize_text(value).lower()
        if normalized == "male":
            return ["male"]
        if normalized == "female":
            return ["female"]
        return None

    @classmethod
    def _h1_monthly_frequency(
        cls,
        value,
        is_club: bool,
    ) -> float | None:
        mapping = (
            cls.CLUB_FREQUENCY_VALUE
            if is_club
            else cls.USER_FREQUENCY_VALUE
        )
        weekly = mapping.get(
            cls._normalize_text(value)
        )
        if weekly is None:
            return None
        return round(float(weekly) * 4, 2)

    @classmethod
    def _h1_score_bucket(cls, value) -> float:
        score = float(value)
        if score >= 0.75:
            return 1.0
        if score >= 0.25:
            return 0.5
        return 0.0

    @staticmethod
    def _h1_split_axes(value) -> list[str]:
        text = str(value or "").strip()
        if not text or text == "-":
            return []
        return [
            item.strip()
            for item in text.split(",")
            if item.strip()
        ]

    def recommend_h1_candidates(
        self,
        context_bundle: dict,
        limit: int = 10,
    ) -> dict:
        """H1 엔진 입력을 실제 서비스 DB 문맥으로 변환한다."""
        from app.ml.operator_poc.engines.h1_recruitment import (
            run_h1_recruitment,
        )

        contexts = context_bundle.get("contexts") or {}
        if not contexts:
            return {
                "recommendations": [],
                "total_users_scanned": context_bundle.get(
                    "total_users_scanned", 0
                ),
                "candidate_pool_count": context_bundle.get(
                    "candidate_pool_count", 0
                ),
                "eligible_count": 0,
                "returned_count": 0,
                "excluded_member_count": context_bundle.get(
                    "excluded_member_count", 0
                ),
                "excluded_application_count": context_bundle.get(
                    "excluded_application_count", 0
                ),
                "excluded_summary": {},
                "consent_filter_applied": False,
                "travel_filter_mode": "region_proxy",
            }

        first_context = next(iter(contexts.values()))
        club = first_context.get("club") or {}
        club_schedules = club.get("schedules") or []
        club_slots = [
            f"club-schedule-{index}"
            for index, _ in enumerate(club_schedules)
        ]

        engine_club = {
            "운영종목": club.get("sport_name"),
            "정기활동슬롯": club_slots,
            # 실제 적합도는 아래에서 먼저 계산하고 H1 점수 구간으로
            # 인코딩한다. 엔진의 가중치·판정 규칙은 그대로 사용한다.
            "모집희망실력": ["초보"],
            "운영목적": "친목",
            "분위기점수": 5.0,
            "월활동횟수": 4.0,
            "월예상비용_원": float(
                club.get("monthly_fee") or 0
            ),
            "모집연령조건": self._h1_age_constraint(
                club.get("age_groups") or []
            ),
            "모집성별조건": self._h1_gender_constraint(
                club.get("gender_rule")
            ),
            "체험가능여부": False,
        }

        engine_users = []
        meta_by_user: dict[str, dict] = {}

        club_traits = list(
            dict.fromkeys(
                (club.get("atmospheres") or [])
                + (club.get("intro_keywords") or [])
            )
        )
        club_frequency = self._h1_monthly_frequency(
            club.get("activity_frequency"),
            is_club=True,
        )
        engine_club["월활동횟수"] = (
            club_frequency
            if club_frequency is not None
            else 4.0
        )

        for user_id, context in contexts.items():
            applicant = context.get("applicant") or {}
            profile = context.get("candidate_profile") or {}
            missing_axes: list[str] = []

            matching_slots = []
            for index, schedule in enumerate(
                club_schedules
            ):
                single_score = self._schedule_score(
                    [schedule],
                    applicant.get("available_times") or [],
                )
                if single_score and single_score > 0:
                    matching_slots.append(
                        f"club-schedule-{index}"
                    )
            if (
                not club_schedules
                or not applicant.get("available_times")
            ):
                missing_axes.append("일정")

            club_sport_id = club.get("sport_id")
            sport_ids = {
                int(value)
                for value in applicant.get("sport_ids") or []
            }
            sport_match = (
                club_sport_id is not None
                and int(club_sport_id) in sport_ids
            )

            user_level = (
                applicant.get("sport_levels") or {}
            ).get(str(club_sport_id))
            if user_level is None:
                user_level = (
                    applicant.get("sport_levels") or {}
                ).get(club_sport_id)
            skill_score = self._skill_score(
                club.get("sport_levels") or [],
                user_level,
            )
            if skill_score is None:
                missing_axes.append("실력")
                skill_score = 0.5
            skill_bucket = self._h1_score_bucket(
                skill_score
            )

            user_traits = applicant.get("atmospheres") or []
            purpose_score = self._purpose_score(
                club_traits,
                user_traits,
            )
            if purpose_score is None:
                missing_axes.append("목적")
                purpose_score = 0.5
            purpose_bucket = self._h1_score_bucket(
                purpose_score
            )

            atmosphere_score = self._atmosphere_score(
                club_traits,
                user_traits,
            )
            if atmosphere_score is None:
                missing_axes.append("분위기")
                atmosphere_score = 0.5

            user_frequency = self._h1_monthly_frequency(
                applicant.get("activity_frequency"),
                is_club=False,
            )
            if (
                club_frequency is None
                or user_frequency is None
            ):
                missing_axes.append("활동빈도")
                encoded_user_frequency = (
                    engine_club["월활동횟수"] * 0.5
                )
            else:
                frequency_score = min(
                    club_frequency,
                    user_frequency,
                ) / max(
                    club_frequency,
                    user_frequency,
                )
                encoded_user_frequency = (
                    engine_club["월활동횟수"]
                    * frequency_score
                )

            monthly_fee = float(
                club.get("monthly_fee") or 0
            )
            budget = applicant.get("max_monthly_fee")
            if budget is None:
                missing_axes.append("비용")
                encoded_budget = (
                    monthly_fee * 0.5
                    if monthly_fee > 0
                    else 0
                )
            else:
                encoded_budget = float(budget)

            region_result = self._region_pass(
                club.get("region"),
                applicant.get("regions") or [],
            )
            if region_result is None:
                missing_axes.append("이동거리")

            unique_missing = list(
                dict.fromkeys(missing_axes)
            )
            covered_axes = 6 - len([
                value
                for value in unique_missing
                if value in self.DIRECT_FIT_AXES
            ])

            engine_users.append({
                "회원_ID": user_id,
                # 현재 MVP는 초대 발송이 없는 내부 미리보기다.
                # 동의 컬럼 도입 전까지 엔진 통과값만 주입하고
                # 응답에 필터 미적용 사실을 명시한다.
                "모집제안수신동의": True,
                "희망종목": (
                    club.get("sport_name")
                    if sport_match
                    else None
                ),
                "가능슬롯": matching_slots,
                "예상이동시간_분": (
                    2 if region_result is False else 0
                ),
                "이동가능시간_분": 1,
                "나이": self._h1_age(
                    applicant.get("birth_date")
                ),
                "성별": self._h1_gender(
                    applicant.get("gender")
                ),
                "실력": self.H1_SKILL_BY_SCORE[
                    skill_bucket
                ],
                "목적": self.H1_PURPOSE_BY_SCORE[
                    purpose_bucket
                ],
                "분위기점수": round(
                    1 + 4 * float(atmosphere_score),
                    4,
                ),
                "희망월활동횟수": max(
                    encoded_user_frequency,
                    0.01,
                ),
                "월예산_원": encoded_budget,
            })

            meta_by_user[user_id] = {
                "profile": profile,
                "missing_axes": unique_missing,
                "data_coverage": round(
                    covered_axes / 6 * 100
                ),
            }

        ranked = run_h1_recruitment(
            club=engine_club,
            users=engine_users,
            return_all=True,
        )

        recommendations = []
        excluded_summary: dict[str, int] = {}

        for row in ranked.to_dict(orient="records"):
            user_id = str(row["Candidate_ID"])
            if not bool(row["Hard_Filter_Pass"]):
                reason = str(
                    row["Hard_Filter_Fail_Reason"]
                )
                excluded_summary[reason] = (
                    excluded_summary.get(reason, 0) + 1
                )
                continue

            meta = meta_by_user.get(user_id, {})
            profile = meta.get("profile") or {}
            recommendations.append({
                "rank": int(row["Ranking"]),
                "user_id": user_id,
                "nickname": profile.get(
                    "nickname"
                ) or "이름 없는 사용자",
                "profile_image": profile.get(
                    "profile_image"
                ),
                "direct_match_score": float(
                    row["Direct_Match_Score"]
                ),
                "action": str(row["Action"]),
                "severe_mismatch_axes": (
                    self._h1_split_axes(
                        row.get("Severe_Mismatch")
                    )
                ),
                "partial_mismatch_axes": (
                    self._h1_split_axes(
                        row.get("Partial_Mismatch")
                    )
                ),
                "axis_scores": {
                    "schedule": round(
                        float(row["Match_schedule"]) * 100
                    ),
                    "skill": round(
                        float(row["Match_skill"]) * 100
                    ),
                    "purpose": round(
                        float(row["Match_purpose"]) * 100
                    ),
                    "atmosphere": round(
                        float(row["Match_atmosphere"]) * 100
                    ),
                    "activity_frequency": round(
                        float(
                            row["Match_activity_frequency"]
                        ) * 100
                    ),
                    "cost": round(
                        float(row["Match_cost"]) * 100
                    ),
                },
                "data_coverage": meta.get(
                    "data_coverage", 0
                ),
                "missing_axes": meta.get(
                    "missing_axes", []
                ),
            })

        eligible_count = len(recommendations)
        recommendations = recommendations[:limit]

        return {
            "recommendations": recommendations,
            "total_users_scanned": context_bundle.get(
                "total_users_scanned", 0
            ),
            "candidate_pool_count": context_bundle.get(
                "candidate_pool_count", len(contexts)
            ),
            "eligible_count": eligible_count,
            "returned_count": len(recommendations),
            "excluded_member_count": context_bundle.get(
                "excluded_member_count", 0
            ),
            "excluded_application_count": context_bundle.get(
                "excluded_application_count", 0
            ),
            "excluded_summary": excluded_summary,
            "consent_filter_applied": False,
            "travel_filter_mode": "region_proxy",
        }

    @classmethod
    def _h3_slot(cls, event_date: date, start_time: str) -> str | None:
        start = cls._to_minutes(start_time)
        bands = (
            (360, 480, "아침/새벽(6~8시)"),
            (480, 720, "오전(8~12시)"),
            (720, 840, "점심(12~14시)"),
            (840, 1080, "오후(14~18시)"),
            (1080, 1320, "저녁(18~22시)"),
        )
        for lower, upper, label in bands:
            if lower <= start < upper:
                day_type = "평일" if event_date.weekday() < 5 else "휴일"
                return f"{day_type} | {label}"
        return None

    @classmethod
    def _h3_member_available(
        cls,
        day: str,
        start: int,
        end: int,
        availability: list[dict],
    ) -> bool:
        for row in availability:
            if cls._normalize_day(row.get("day_of_week")) != day:
                continue
            member_start = cls._to_minutes(row.get("start_time"))
            member_end = cls._to_minutes(row.get("end_time"))
            if member_start is None or member_end is None:
                continue
            if member_end <= member_start:
                member_end += 1440
            if max(start, member_start) < min(end, member_end):
                return True
        return False

    @classmethod
    def _h3_event_conflict(
        cls,
        event_date: date,
        start: int,
        end: int,
        existing_events: list[dict],
    ) -> bool:
        for event in existing_events:
            if event.get("status") == "cancelled":
                continue
            if str(event.get("event_date"))[:10] != event_date.isoformat():
                continue
            event_start = cls._to_minutes(event.get("start_time"))
            event_end = cls._to_minutes(event.get("end_time"))
            if event_start is None:
                continue
            if event_end is None:
                return True
            if event_end <= event_start:
                event_end += 1440
            if max(start, event_start) < min(end, event_end):
                return True
        return False

    def recommend_h3_schedules(
        self,
        context: dict,
        start_date: date,
        end_date: date,
        minimum_participants: int,
        guest_allowed: bool,
        max_guests: int = 0,
    ) -> dict:
        """실제 DB 시간 구간을 H3 후보 슬롯으로 변환한다."""
        day_names = ("월", "화", "수", "목", "금", "토", "일")
        schedules = context.get("schedules") or []
        members = context.get("members") or []
        raw_times = context.get("available_times") or []
        venues = context.get("venues") or []
        existing_events = context.get("existing_events") or []
        times_by_user: dict[str, list[dict]] = {}
        for row in raw_times:
            times_by_user.setdefault(str(row.get("user_id")), []).append(row)
        users_with_times = sum(
            bool(times_by_user.get(str(member.get("user_id"))))
            for member in members
        )
        coverage = {
            "active_members": len(members),
            "members_with_availability": users_with_times,
            "member_availability_percent": round(
                users_with_times / len(members) * 100
            ) if members else 0,
            "candidate_schedules": 0,
        }
        missing = ["venue_availability", "venue_coordinates", "travel_minutes"]
        club = context.get("club") or {}
        if not context.get("sport"):
            missing.append("club_sport")
        if not context.get("region"):
            missing.append("club_region")
        if not club.get("activity_frequency"):
            missing.append("club_activity_frequency")
        if not schedules:
            missing.append("club_schedules")
        if not members:
            missing.append("active_members")
        if users_with_times < len(members):
            missing.append("member_availability")
        if not venues:
            missing.append("club_venue")
        elif len(venues) > 1:
            missing.append("venue_selection")

        response = {
            "recommendations": [],
            "data_coverage": coverage,
            "missing_fields": missing,
            "venue_availability_applied": False,
            "travel_applied": False,
            "candidate_time_source": "club_schedules",
        }
        if not schedules or not users_with_times:
            return response

        # 같은 엔진 슬롯에 속하는 실제 일정 중 시간 일치 회원이
        # 가장 많은 날짜를 대표 후보로 사용한다.
        best_by_slot: dict[str, dict] = {}
        candidate_count = 0
        overnight_schedule_seen = False
        current_date = start_date
        while current_date <= end_date:
            day = day_names[current_date.weekday()]
            for schedule in schedules:
                if self._normalize_day(schedule.get("day_of_week")) != day:
                    continue
                start = self._to_minutes(schedule.get("start_time"))
                end = self._to_minutes(schedule.get("end_time"))
                if start is None or end is None:
                    continue
                if end <= start:
                    overnight_schedule_seen = True
                    continue  # 생성 폼은 익일 종료를 지원하지 않는다.
                slot = self._h3_slot(current_date, schedule.get("start_time"))
                if slot is None or self._h3_event_conflict(
                    current_date, start, end, existing_events
                ):
                    continue
                matching = {
                    str(member["user_id"])
                    for member in members
                    if member.get("user_id")
                    and self._h3_member_available(
                        day, start, end,
                        times_by_user.get(str(member["user_id"]), []),
                    )
                }
                candidate_count += 1
                candidate = {
                    "slot": slot,
                    "event_date": current_date,
                    "start_time": str(schedule["start_time"])[:5],
                    "end_time": str(schedule["end_time"])[:5],
                    "matching": matching,
                }
                previous = best_by_slot.get(slot)
                if previous is None or len(matching) > len(previous["matching"]):
                    best_by_slot[slot] = candidate
            current_date += timedelta(days=1)
        coverage["candidate_schedules"] = candidate_count
        if overnight_schedule_seen:
            missing.append("overnight_schedule_unsupported")
        if not best_by_slot:
            missing.append("supported_candidate_time")
            return response

        venue = venues[0] if len(venues) == 1 else {}
        venue_id = venue.get("venue_id", venue.get("club_venue_id"))
        engine_members = [
            {
                "member_id": member.get("club_member_id"),
                "available_slots": [
                    slot for slot, candidate in best_by_slot.items()
                    if str(member.get("user_id")) in candidate["matching"]
                ],
            }
            for member in members
        ]
        # 엔진은 요청 시점에만 import한다.
        from app.ml.operator_poc.engines.h3_schedule import run_h3_schedule

        ranked = run_h3_schedule(
            club={
                "sport": context.get("sport"),
                "region": context.get("region"),
                "activity_frequency": self.OFFICIAL_FREQUENCY.get(
                    club.get("activity_frequency"),
                    club.get("activity_frequency"),
                ),
                "minimum_participants": minimum_participants,
                "guest_allowed": guest_allowed,
            },
            members=engine_members,
            venues=[{
                "venue_id": venue_id,
                "candidate_slots": list(best_by_slot),
            }],
            top_k=len(best_by_slot),
        )
        for row in ranked.to_dict(orient="records"):
            if int(row["guest_needed"]) > max_guests:
                continue
            candidate = best_by_slot[row["schedule"]]
            response["recommendations"].append({
                "rank": len(response["recommendations"]) + 1,
                "schedule_slot": row["schedule"],
                "event_date": candidate["event_date"],
                "start_time": candidate["start_time"],
                "end_time": candidate["end_time"],
                "venue_id": venue_id,
                "venue_name": venue.get("venue_name"),
                "venue_address": venue.get("address"),
                "matching_member_count": int(row["reachable_count"]),
                "total_members": int(row["total_members"]),
                "availability_ratio": float(row["availability_ratio"]),
                "guest_needed": int(row["guest_needed"]),
                "operation_status": row["operation_status"],
                "prior_rank": int(row["prior_rank"]),
                "prior_score": float(row["prior_score"]),
                "source": row["source"],
                "strength": row["strength"],
                "usage": row["usage"],
                "verified": bool(row["verified"]),
            })
            if len(response["recommendations"]) == 3:
                break
        return response
