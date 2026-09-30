from datetime import datetime, timezone

from app.core.supabase import (
    get_supabase_admin_client,
)


class ClubMemberRepository:

    def __init__(self):
        self.admin_client = (
            get_supabase_admin_client()
        )

    # -----------------------------------------------------
    # 현재 관리 대상 회원 조회
    #
    # withdrawn(탈퇴) 회원은
    # 현재 회원 목록에서 제외한다.
    # -----------------------------------------------------
    def find_members(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id, "
                "user_id, "
                "role, "
                "status, "
                "joined_at, "
                "join_source"
            )
            .eq(
                "club_id",
                club_id,
            )
            .in_(
                "status",
                [
                    "active",
                    "inactive",
                    "suspended",
                ],
            )
            .order("club_member_id")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 회원 프로필 정보 조회
    # -----------------------------------------------------
    def find_users(
        self,
        user_ids: list[str],
    ) -> list[dict]:

        if not user_ids:
            return []

        response = (
            self.admin_client
            .table("users")
            .select(
                "user_id, "
                "name, "
                "nickname, "
                "email, "
                "profile_image, "
                "phone, "
                "bio"
            )
            .in_(
                "user_id",
                user_ids,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 동호회 가입 신청 목록 조회
    # -----------------------------------------------------
    def find_applications(
        self,
        club_id: int,
        application_status: str | None = "pending",
    ) -> list[dict]:

        query = (
            self.admin_client
            .table("club_applications")
            .select(
                "application_id, "
                "club_id, "
                "user_id, "
                "application_message, "
                "status, "
                "created_at, "
                "decided_at, "
                "decided_by_user_id"
            )
            .eq(
                "club_id",
                club_id,
            )
        )

        if application_status is not None:
            query = query.eq(
                "status",
                application_status,
            )

        response = (
            query
            .order(
                "created_at",
                desc=True,
            )
            .order(
                "application_id",
                desc=True,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 가입 신청 단건 조회
    # -----------------------------------------------------
    def find_application_by_id(
        self,
        club_id: int,
        application_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_applications")
            .select(
                "application_id, "
                "club_id, "
                "user_id, "
                "application_message, "
                "status, "
                "created_at, "
                "decided_at, "
                "decided_by_user_id"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "application_id",
                application_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 회원 등록 실패 시 신청 상태 복구
    # -----------------------------------------------------
    def restore_application_pending(
        self,
        application_id: int,
    ) -> None:

        (
            self.admin_client
            .table("club_applications")
            .update(
                {
                    "status": "pending",
                    "decided_at": None,
                    "decided_by_user_id": None,
                }
            )
            .eq(
                "application_id",
                application_id,
            )
            .eq(
                "status",
                "approved",
            )
            .execute()
        )

    # -----------------------------------------------------
    # 가입 신청 답변 조회
    # -----------------------------------------------------
    def find_application_answers(
        self,
        application_ids: list[int],
    ) -> list[dict]:

        if not application_ids:
            return []

        response = (
            self.admin_client
            .table("club_join_answers")
            .select(
                "answer_id, "
                "application_id, "
                "question_id, "
                "answer_text"
            )
            .in_(
                "application_id",
                application_ids,
            )
            .order("answer_id")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 동호회 가입 질문 조회
    # -----------------------------------------------------
    def find_join_questions(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_join_questions")
            .select(
                "question_id, "
                "question_text, "
                "question_type, "
                "required, "
                "display_order"
            )
            .eq(
                "club_id",
                club_id,
            )
            .order("display_order")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # H2 가입 신청자 적합도 평가용 데이터 일괄 조회
    #
    # 동호회 조건은 한 번만 조회하고,
    # 신청자 정보는 user_id 목록으로 묶어서 조회한다.
    # -----------------------------------------------------
    def find_h2_application_contexts(
        self,
        club_id: int,
        user_ids: list[str],
    ) -> dict[str, dict]:

        normalized_user_ids = list(
            dict.fromkeys(
                str(user_id)
                for user_id in user_ids
                if user_id
            )
        )

        if not normalized_user_ids:
            return {}

        club_response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, activity_frequency, "
                "gender_rule, monthly_fee"
            )
            .eq("club_id", club_id)
            .limit(1)
            .execute()
        )

        if not club_response.data:
            raise LookupError(
                "동호회 정보를 찾을 수 없습니다."
            )

        club = club_response.data[0]

        club_sport_response = (
            self.admin_client
            .table("club_sports")
            .select("sport_id")
            .eq("club_id", club_id)
            .limit(1)
            .execute()
        )

        club_sport_id = None
        club_sport_name = None

        if club_sport_response.data:
            club_sport_id = int(
                club_sport_response.data[0][
                    "sport_id"
                ]
            )

            sport_response = (
                self.admin_client
                .table("sports")
                .select("sport_name")
                .eq("sport_id", club_sport_id)
                .limit(1)
                .execute()
            )

            if sport_response.data:
                club_sport_name = (
                    sport_response.data[0].get(
                        "sport_name"
                    )
                )

        schedule_rows = (
            self.admin_client
            .table("club_schedules")
            .select(
                "day_of_week, start_time, end_time"
            )
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

        club_level_rows = (
            self.admin_client
            .table("club_sport_levels")
            .select("sport_level")
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

        club_region_rows = (
            self.admin_client
            .table("club_regions")
            .select("region")
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

        club_atmosphere_rows = (
            self.admin_client
            .table("club_atmospheres")
            .select("atmosphere")
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

        club_keyword_rows = (
            self.admin_client
            .table("club_intro_keywords")
            .select("keyword")
            .eq("club_id", club_id)
            .order("display_order")
            .execute()
            .data
            or []
        )

        club_age_group_rows = (
            self.admin_client
            .table("club_age_groups")
            .select("age_group")
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

        club_context = {
            "club_id": club_id,
            "sport_id": club_sport_id,
            "sport_name": club_sport_name,
            "activity_frequency": club.get(
                "activity_frequency"
            ),
            "monthly_fee": club.get(
                "monthly_fee"
            ),
            "gender_rule": (
                club.get("gender_rule") or "all"
            ),
            "schedules": schedule_rows,
            "sport_levels": [
                row["sport_level"]
                for row in club_level_rows
                if row.get("sport_level")
            ],
            "region": (
                club_region_rows[0].get("region")
                if club_region_rows
                else None
            ),
            "atmospheres": [
                row["atmosphere"]
                for row in club_atmosphere_rows
                if row.get("atmosphere")
            ],
            "intro_keywords": [
                row["keyword"]
                for row in club_keyword_rows
                if row.get("keyword")
            ],
            "age_groups": [
                row["age_group"]
                for row in club_age_group_rows
                if row.get("age_group")
            ],
        }

        user_rows = (
            self.admin_client
            .table("users")
            .select(
                "user_id, gender, birth_date, "
                "travel_distance_km, max_monthly_fee, "
                "activity_frequency"
            )
            .in_("user_id", normalized_user_ids)
            .execute()
            .data
            or []
        )

        user_sport_rows = (
            self.admin_client
            .table("user_sports")
            .select("user_id, sport_id")
            .in_("user_id", normalized_user_ids)
            .execute()
            .data
            or []
        )

        user_level_rows = (
            self.admin_client
            .table("user_sport_levels")
            .select(
                "user_id, sport_id, sport_level"
            )
            .in_("user_id", normalized_user_ids)
            .execute()
            .data
            or []
        )

        user_region_rows = (
            self.admin_client
            .table("user_regions")
            .select("user_id, region")
            .in_("user_id", normalized_user_ids)
            .execute()
            .data
            or []
        )

        user_time_rows = (
            self.admin_client
            .table("user_available_times")
            .select(
                "user_id, day_of_week, "
                "start_time, end_time"
            )
            .in_("user_id", normalized_user_ids)
            .execute()
            .data
            or []
        )

        user_atmosphere_rows = (
            self.admin_client
            .table("user_club_atmospheres")
            .select("user_id, atmosphere")
            .in_("user_id", normalized_user_ids)
            .execute()
            .data
            or []
        )

        applicants = {
            user_id: {
                "user_id": user_id,
                "gender": None,
                "birth_date": None,
                "travel_distance_km": None,
                "max_monthly_fee": None,
                "activity_frequency": None,
                "sport_ids": [],
                "sport_levels": {},
                "regions": [],
                "available_times": [],
                "atmospheres": [],
            }
            for user_id in normalized_user_ids
        }

        for row in user_rows:
            user_id = str(row["user_id"])
            applicant = applicants.get(user_id)

            if applicant is None:
                continue

            applicant.update(
                {
                    "gender": row.get("gender"),
                    "birth_date": row.get(
                        "birth_date"
                    ),
                    "travel_distance_km": row.get(
                        "travel_distance_km"
                    ),
                    "max_monthly_fee": row.get(
                        "max_monthly_fee"
                    ),
                    "activity_frequency": row.get(
                        "activity_frequency"
                    ),
                }
            )

        for row in user_sport_rows:
            user_id = str(row["user_id"])
            if user_id in applicants:
                applicants[user_id][
                    "sport_ids"
                ].append(int(row["sport_id"]))

        for row in user_level_rows:
            user_id = str(row["user_id"])
            if user_id in applicants:
                applicants[user_id][
                    "sport_levels"
                ][str(row["sport_id"])] = (
                    row.get("sport_level")
                )

        for row in user_region_rows:
            user_id = str(row["user_id"])
            if (
                user_id in applicants
                and row.get("region")
            ):
                applicants[user_id][
                    "regions"
                ].append(row["region"])

        for row in user_time_rows:
            user_id = str(row["user_id"])
            if user_id in applicants:
                applicants[user_id][
                    "available_times"
                ].append(
                    {
                        "day_of_week": row.get(
                            "day_of_week"
                        ),
                        "start_time": row.get(
                            "start_time"
                        ),
                        "end_time": row.get(
                            "end_time"
                        ),
                    }
                )

        for row in user_atmosphere_rows:
            user_id = str(row["user_id"])
            if (
                user_id in applicants
                and row.get("atmosphere")
            ):
                applicants[user_id][
                    "atmospheres"
                ].append(row["atmosphere"])

        return {
            user_id: {
                "club": club_context,
                "applicant": applicant,
            }
            for user_id, applicant
            in applicants.items()
        }

    # -----------------------------------------------------
    # H1 모집 대상 추천용 후보군 및 적합도 문맥 조회
    #
    # 현재 회원과 가입 신청 이력이 있는 사용자는 제외한다.
    # 연락처 등 민감정보는 조회하지 않는다.
    # -----------------------------------------------------
    def find_h1_recruitment_context(
        self,
        club_id: int,
    ) -> dict:

        user_rows = (
            self.admin_client
            .table("users")
            .select(
                "user_id, nickname, profile_image"
            )
            .limit(1000)
            .execute()
            .data
            or []
        )

        member_rows = (
            self.admin_client
            .table("club_members")
            .select("user_id")
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

        application_rows = (
            self.admin_client
            .table("club_applications")
            .select("user_id, status")
            .eq("club_id", club_id)
            .in_(
                "status",
                [
                    "pending",
                    "approved",
                ],
            )
            .execute()
            .data
            or []
        )

        member_user_ids = {
            str(row["user_id"])
            for row in member_rows
            if row.get("user_id")
        }
        application_user_ids = {
            str(row["user_id"])
            for row in application_rows
            if row.get("user_id")
        }
        excluded_user_ids = (
            member_user_ids
            | application_user_ids
        )

        candidate_profiles = {
            str(row["user_id"]): {
                "user_id": str(row["user_id"]),
                "nickname": (
                    row.get("nickname")
                    or "이름 없는 사용자"
                ),
                "profile_image": row.get(
                    "profile_image"
                ),
            }
            for row in user_rows
            if (
                row.get("user_id")
                and str(row["user_id"])
                not in excluded_user_ids
            )
        }

        contexts = self.find_h2_application_contexts(
            club_id=club_id,
            user_ids=list(candidate_profiles),
        )

        for user_id, context in contexts.items():
            context["candidate_profile"] = (
                candidate_profiles.get(
                    user_id,
                    {
                        "user_id": user_id,
                        "nickname": "이름 없는 사용자",
                        "profile_image": None,
                    },
                )
            )

        return {
            "contexts": contexts,
            "total_users_scanned": len(user_rows),
            "candidate_pool_count": len(
                candidate_profiles
            ),
            "excluded_member_count": len(
                member_user_ids
            ),
            "excluded_application_count": len(
                application_user_ids
                - member_user_ids
            ),
        }

    # -----------------------------------------------------
    # 특정 사용자의 동호회 회원 정보 조회
    # -----------------------------------------------------
    def find_membership(
        self,
        club_id: int,
        user_id: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id, "
                "club_id, "
                "user_id, "
                "role, "
                "status, "
                "joined_at, "
                "join_source"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 로그인 사용자의 운영 권한 조회
    # -----------------------------------------------------
    def find_management_membership(
        self,
        club_id: int,
        user_id: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id, "
                "role, "
                "status"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .eq(
                "status",
                "active",
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 승인된 신청자를 정식 회원으로 등록
    # -----------------------------------------------------
    def create_membership(
        self,
        club_id: int,
        user_id: str,
    ) -> dict:

        response = (
            self.admin_client
            .table("club_members")
            .insert(
                {
                    "club_id": club_id,
                    "user_id": user_id,
                    "role": "member",
                    "status": "active",
                    "join_source": "application",
                }
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "승인된 회원 등록에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 기존 회원 행을 다시 활성 상태로 변경
    #
    # 탈퇴 또는 비활성화 이후 재가입하는 경우 사용한다.
    # -----------------------------------------------------
    def activate_membership(
        self,
        club_member_id: int,
    ) -> dict:

        response = (
            self.admin_client
            .table("club_members")
            .update(
                {
                    "role": "member",
                    "status": "active",
                    "join_source": "application",
                }
            )
            .eq(
                "club_member_id",
                club_member_id,
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "기존 회원 상태 변경에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 가입 신청 승인 또는 거절 처리
    # -----------------------------------------------------
    def update_application_decision(
        self,
        application_id: int,
        decision_status: str,
        decided_by_user_id: str,
        decided_at: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_applications")
            .update(
                {
                    "status": decision_status,
                    "decided_at": decided_at,
                    "decided_by_user_id": (
                        decided_by_user_id
                    ),
                }
            )
            .eq(
                "application_id",
                application_id,
            )
            .eq(
                "status",
                "pending",
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 정원 정보 조회
    # -----------------------------------------------------
    def find_club_capacity(
        self,
        club_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("clubs")
            .select(
                "club_id, "
                "club_name, "
                "max_members, "
                "status"
            )
            .eq(
                "club_id",
                club_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 활동 중인 회원 수 조회
    # -----------------------------------------------------
    def count_active_members(
        self,
        club_id: int,
    ) -> int:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id",
                count="exact",
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "status",
                "active",
            )
            .execute()
        )

        if response.count is not None:
            return response.count

        return len(response.data or [])

    # -----------------------------------------------------
    # clubs.current_members 회원 수 동기화
    # -----------------------------------------------------
    def update_current_member_count(
        self,
        club_id: int,
        current_members: int,
    ) -> None:

        self.admin_client.table(
            "clubs"
        ).update(
            {
                "current_members": current_members,
            }
        ).eq(
            "club_id",
            club_id,
        ).execute()

    # -----------------------------------------------------
    # 회원 단건 조회
    # -----------------------------------------------------
    def find_member_by_id(
        self,
        club_id: int,
        club_member_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .select(
                "club_member_id, "
                "club_id, "
                "user_id, "
                "role, "
                "status, "
                "joined_at, "
                "join_source"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "club_member_id",
                club_member_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 회원 역할 변경
    # -----------------------------------------------------
    def update_member_role(
        self,
        club_id: int,
        club_member_id: int,
        role: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .update(
                {
                    "role": role,
                }
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "club_member_id",
                club_member_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 회원 상태 변경
    # -----------------------------------------------------
    def update_member_status(
        self,
        club_id: int,
        club_member_id: int,
        member_status: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .update(
                {
                    "status": member_status,
                }
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "club_member_id",
                club_member_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 전체 일정 조회
    # -----------------------------------------------------
    def find_club_events(
        self,
        club_id: int,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_events")
            .select(
                "event_id, "
                "title, "
                "event_date, "
                "status"
            )
            .eq(
                "club_id",
                club_id,
            )
            .order(
                "event_date",
                desc=True,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 동호회 일정에 연결된 투표 조회
    # -----------------------------------------------------
    def find_event_votes(
        self,
        event_ids: list[int],
    ) -> list[dict]:

        if not event_ids:
            return []

        response = (
            self.admin_client
            .table("event_votes")
            .select(
                "vote_id, "
                "event_id, "
                "title, "
                "vote_type, "
                "deadline, "
                "created_at"
            )
            .in_(
                "event_id",
                event_ids,
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 회원별 투표 응답 조회
    #
    # 복수 선택 투표에서는 한 사람이 여러 선택지를
    # 고를 수 있으므로 서비스에서 vote_id를 중복 제거한다.
    # -----------------------------------------------------
    def find_vote_responses(
        self,
        vote_ids: list[int],
        user_ids: list[str],
    ) -> list[dict]:

        if not vote_ids or not user_ids:
            return []

        response = (
            self.admin_client
            .table("event_vote_responses")
            .select(
                "response_id, "
                "vote_id, "
                "user_id, "
                "created_at"
            )
            .in_(
                "vote_id",
                vote_ids,
            )
            .in_(
                "user_id",
                user_ids,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 회원 경고 내역 조회
    # -----------------------------------------------------
    def find_member_warnings(
        self,
        club_id: int,
        user_ids: list[str],
    ) -> list[dict]:

        if not user_ids:
            return []

        response = (
            self.admin_client
            .table("club_member_warnings")
            .select(
                "warning_id, "
                "club_id, "
                "user_id, "
                "warning_type, "
                "reason, "
                "created_at, "
                "created_by_user_id"
            )
            .eq(
                "club_id",
                club_id,
            )
            .in_(
                "user_id",
                user_ids,
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 특정 회원의 일정 참여 내역 조회
    # -----------------------------------------------------
    def find_member_participations(
        self,
        event_ids: list[int],
        user_id: str,
    ) -> list[dict]:

        if not event_ids:
            return []

        response = (
            self.admin_client
            .table("event_participants")
            .select(
                "event_participant_id, "
                "event_id, "
                "user_id, "
                "status, "
                "attendance_status, "
                "created_at"
            )
            .in_(
                "event_id",
                event_ids,
            )
            .eq(
                "user_id",
                user_id,
            )
            .eq(
                "status",
                "joined",
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 회원 내보내기
    # -----------------------------------------------------
    def withdraw_member(
        self,
        club_id: int,
        club_member_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .update(
                {
                    "role": "member",
                    "status": "withdrawn",
                }
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "club_member_id",
                club_member_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 회원 경고 단건 조회
    # -----------------------------------------------------
    def find_member_warning(
        self,
        club_id: int,
        warning_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_member_warnings")
            .select(
                "warning_id, "
                "club_id, "
                "user_id, "
                "warning_type, "
                "reason, "
                "created_at, "
                "created_by_user_id"
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "warning_id",
                warning_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 회원 경고 부여
    # -----------------------------------------------------
    def create_member_warning(
        self,
        club_id: int,
        user_id: str,
        warning_type: str,
        reason: str,
        created_by_user_id: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_member_warnings")
            .insert(
                {
                    "club_id": club_id,
                    "user_id": user_id,
                    "warning_type": warning_type,
                    "reason": reason,
                    "created_by_user_id": (
                        created_by_user_id
                    ),
                }
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 회원 경고 취소
    # -----------------------------------------------------
    def delete_member_warning(
        self,
        club_id: int,
        warning_id: int,
        user_id: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("club_member_warnings")
            .delete()
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "warning_id",
                warning_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .execute()
        )

        return bool(response.data)

    # -----------------------------------------------------
    # 알림 생성
    # -----------------------------------------------------
    def create_notification(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        content: str,
        related_type: str,
        related_id: int,
    ) -> dict | None:

        # 알림 저장이 실패해도
        # 가입 승인 / 거절 자체는 정상 처리되도록 한다.
        try:
            response = (
                self.admin_client
                .table("notifications")
                .insert(
                    {
                        "user_id": user_id,
                        "notification_type": notification_type,
                        "title": title,
                        "content": content,
                        "related_type": related_type,
                        "related_id": related_id,
                        "is_read": False,
                    }
                )
                .execute()
            )
        except Exception as e:
            print("가입 알림 생성 실패:", e)
            return None

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 로그인 사용자의 동호회 탈퇴
    # -----------------------------------------------------
    def withdraw_my_membership(
        self,
        club_id: int,
        user_id: str,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_members")
            .update(
                {
                    "role": "member",
                    "status": "withdrawn",
                    "withdrawn_at": datetime.now(
                        timezone.utc
                    ).isoformat(),
                }
            )
            .eq(
                "club_id",
                club_id,
            )
            .eq(
                "user_id",
                user_id,
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 탈퇴 리뷰 작성
    # -----------------------------------------------------
    def create_club_leave_review(
        self,
        club_id: int,
        user_id: str,
        rating: int | None = None,
        leave_reason: str | None = None,
        review_text: str | None = None,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("club_leave_reviews")
            .insert(
                {
                    "club_id": club_id,
                    "user_id": user_id,
                    "rating": rating,
                    "leave_reason": leave_reason,
                    "review_text": review_text,
                }
            )
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]
