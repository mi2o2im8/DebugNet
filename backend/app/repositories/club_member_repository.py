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