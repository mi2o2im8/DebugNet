from app.core.supabase import (
    get_supabase_admin_client,
)


class ClubEventRepository:

    def __init__(self):
        self.admin_client = (
            get_supabase_admin_client()
        )

    # -----------------------------------------------------
    # 일정 생성
    # -----------------------------------------------------
    def create_event(
        self,
        event_data: dict,
    ) -> dict:
        response = (
            self.admin_client
            .table("club_events")
            .insert(event_data)
            .execute()
        )

        if not response.data:
            raise ValueError(
                "일정 기본 정보 저장에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 참석 여부 투표 생성
    # -----------------------------------------------------
    def create_attendance_vote(
        self,
        event_id: int,
        deadline: str | None,
    ) -> dict:
        vote_data = {
            "event_id": event_id,
            "title": "참석 여부",
            "vote_type": "attendance",
            "is_multiple": False,
        }

        if deadline is not None:
            vote_data["deadline"] = deadline

        response = (
            self.admin_client
            .table("event_votes")
            .insert(vote_data)
            .execute()
        )

        if not response.data:
            raise ValueError(
                "일정 참석 투표 생성에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 참석 투표 항목 저장
    # -----------------------------------------------------
    def create_vote_options(
        self,
        option_rows: list[dict],
    ) -> None:
        if not option_rows:
            return

        self.admin_client.table(
            "event_vote_options"
        ).insert(
            option_rows
        ).execute()

    # -----------------------------------------------------
    # 일정 단건 조회
    # -----------------------------------------------------
    def find_event_by_id(
        self,
        club_id: int,
        event_id: int,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("club_events")
            .select("*")
            .eq("club_id", club_id)
            .eq("event_id", event_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # event_id 여러 개로 일정 조회
    #
    # 팀매칭에서 하나의 club_event를
    # 양쪽 동호회 캘린더에 보여주기 위해 사용
    #
    # club_id 조건을 걸지 않는다.
    # -----------------------------------------------------
    def find_events_by_ids(
        self,
        event_ids: list[int],
    ) -> list[dict]:

        if not event_ids:
            return []

        response = (
            self.admin_client
            .table("club_events")
            .select("*")
            .in_(
                "event_id",
                event_ids,
            )
            .neq(
                "status",
                "cancelled",
            )
            .order(
                "event_date",
                desc=False,
            )
            .order(
                "start_time",
                desc=False,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 동호회 일정 목록 조회
    # -----------------------------------------------------
    def find_events_by_club(
        self,
        club_id: int,
    ) -> list[dict]:
        response = (
            self.admin_client
            .table("club_events")
            .select("*")
            .eq("club_id", club_id)
            .eq("status", "open")
            .order("event_date")
            .order("start_time")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 일정 기본 정보 수정
    # -----------------------------------------------------
    def update_event(
        self,
        club_id: int,
        event_id: int,
        event_data: dict,
    ) -> dict:
        response = (
            self.admin_client
            .table("club_events")
            .update(event_data)
            .eq("club_id", club_id)
            .eq("event_id", event_id)
            .neq("status", "cancelled")
            .execute()
        )

        if not response.data:
            raise LookupError(
                "존재하지 않거나 삭제된 일정입니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 참석 투표 마감일 수정
    # -----------------------------------------------------
    def update_attendance_vote_deadline(
        self,
        event_id: int,
        deadline: str | None,
    ) -> None:
        (
            self.admin_client
            .table("event_votes")
            .update(
                {
                    "deadline": deadline,
                }
            )
            .eq("event_id", event_id)
            .eq("vote_type", "attendance")
            .execute()
        )

    # -----------------------------------------------------
    # 일정 소프트 삭제
    # -----------------------------------------------------
    def cancel_event(
        self,
        club_id: int,
        event_id: int,
    ) -> dict:
        response = (
            self.admin_client
            .table("club_events")
            .update(
                {
                    "status": "cancelled",
                }
            )
            .eq("club_id", club_id)
            .eq("event_id", event_id)
            .neq("status", "cancelled")
            .execute()
        )

        if not response.data:
            raise LookupError(
                "존재하지 않거나 이미 삭제된 일정입니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 일정별 활성 참가자 조회
    # -----------------------------------------------------
    def find_participants_by_event_ids(
        self,
        event_ids: list[int],
    ) -> list[dict]:
        if not event_ids:
            return []

        response = (
            self.admin_client
            .table("event_participants")
            .select(
                (
                    "event_id, user_id, "
                    "participant_type, status"
                )
            )
            .in_(
                "event_id",
                event_ids,
            )
            .in_(
                "status",
                [
                    "pending",
                    "joined",
                ],
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 일정별 참석 투표 조회
    # -----------------------------------------------------
    def find_attendance_votes_by_event_ids(
        self,
        event_ids: list[int],
    ) -> list[dict]:
        if not event_ids:
            return []

        response = (
            self.admin_client
            .table("event_votes")
            .select(
                "vote_id, event_id"
            )
            .in_(
                "event_id",
                event_ids,
            )
            .eq(
                "vote_type",
                "attendance",
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 여러 투표의 선택지 조회
    # -----------------------------------------------------
    def find_vote_options_by_vote_ids(
        self,
        vote_ids: list[int],
    ) -> list[dict]:
        if not vote_ids:
            return []

        response = (
            self.admin_client
            .table("event_vote_options")
            .select(
                (
                    "option_id, vote_id, "
                    "option_text, display_order"
                )
            )
            .in_(
                "vote_id",
                vote_ids,
            )
            .order(
                "display_order",
                desc=False,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 여러 투표의 사용자 응답 조회
    # -----------------------------------------------------
    def find_vote_responses_by_vote_ids(
        self,
        vote_ids: list[int],
    ) -> list[dict]:
        if not vote_ids:
            return []

        response = (
            self.admin_client
            .table("event_vote_responses")
            .select(
                (
                    "response_id, vote_id, "
                    "option_id, user_id, created_at"
                )
            )
            .in_(
                "vote_id",
                vote_ids,
            )
            .order(
                "response_id",
                desc=False,
            )
            .execute()
        )

        return response.data or []
    

    # 기존 find_attendance_vote 관련 코드가 이어지는 위치

    # -----------------------------------------------------
    # 참석 투표와 선택 항목 조회
    # -----------------------------------------------------
    def find_attendance_vote(
        self,
        event_id: int,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("event_votes")
            .select(
                (
                    "vote_id, event_id, title, "
                    "vote_type, is_multiple, deadline"
                )
            )
            .eq("event_id", event_id)
            .eq("vote_type", "attendance")
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    def find_vote_options(
        self,
        vote_id: int,
    ) -> list[dict]:
        response = (
            self.admin_client
            .table("event_vote_options")
            .select(
                (
                    "option_id, option_text, "
                    "display_order"
                )
            )
            .eq("vote_id", vote_id)
            .order("display_order")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 일정 생성 실패 또는 일정 삭제 시 정리
    #
    # 하위 데이터는 DB의 ON DELETE CASCADE로 삭제
    # -----------------------------------------------------
    def delete_event(
        self,
        club_id: int,
        event_id: int,
    ) -> None:
        self.admin_client.table(
            "club_events"
        ).delete().eq(
            "club_id",
            club_id,
        ).eq(
            "event_id",
            event_id,
        ).execute()

    # -----------------------------------------------------
    # 일정 참가자 및 사용자 기본 정보 조회
    # -----------------------------------------------------
    def find_participant_details(
        self,
        event_id: int,
    ) -> list[dict]:
        response = (
            self.admin_client
            .table("event_participants")
            .select(
                (
                    "event_participant_id, "
                    "event_id, "
                    "user_id, "
                    "participant_type, "
                    "status, "
                    "user:users!"
                    "event_participants_user_id_fkey("
                    "name, "
                    "nickname, "
                    "profile_image"
                    ")"
                )
            )
            .eq("event_id", event_id)
            .order(
                "event_participant_id",
                desc=False,
            )
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 일정 참가 신청 한 건 조회
    # -----------------------------------------------------
    def find_event_participant(
        self,
        event_id: int,
        event_participant_id: int,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("event_participants")
            .select(
                (
                    "event_participant_id, "
                    "event_id, "
                    "user_id, "
                    "participant_type, "
                    "status"
                )
            )
            .eq("event_id", event_id)
            .eq(
                "event_participant_id",
                event_participant_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 사용자의 활성 일정 참가 정보 조회
    # -----------------------------------------------------
    def find_user_event_participant(
        self,
        event_id: int,
        user_id: str,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("event_participants")
            .select(
                (
                    "event_participant_id, "
                    "event_id, "
                    "user_id, "
                    "participant_type, "
                    "status"
                )
            )
            .eq("event_id", event_id)
            .eq("user_id", user_id)
            .in_(
                "status",
                [
                    "pending",
                    "joined",
                ],
            )
            .order(
                "event_participant_id",
                desc=True,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 사용자의 가장 최근 게스트 신청 조회
    # -----------------------------------------------------
    def find_latest_guest_application(
        self,
        event_id: int,
        user_id: str,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("event_participants")
            .select(
                (
                    "event_participant_id, "
                    "event_id, "
                    "user_id, "
                    "participant_type, "
                    "status"
                )
            )
            .eq("event_id", event_id)
            .eq("user_id", user_id)
            .eq("participant_type", "guest")
            .order(
                "event_participant_id",
                desc=True,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 게스트 참가 신청 생성
    # -----------------------------------------------------
    def create_guest_application(
        self,
        event_id: int,
        user_id: str,
    ) -> dict:
        response = (
            self.admin_client
            .table("event_participants")
            .insert(
                {
                    "event_id": event_id,
                    "user_id": user_id,
                    "participant_type": "guest",
                    "status": "pending",
                }
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "게스트 참가 신청 생성에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 게스트 참가 신청 취소
    # -----------------------------------------------------
    def cancel_guest_application(
        self,
        event_id: int,
        user_id: str,
    ) -> dict:
        response = (
            self.admin_client
            .table("event_participants")
            .update(
                {
                    "status": "cancelled",
                }
            )
            .eq("event_id", event_id)
            .eq("user_id", user_id)
            .eq("participant_type", "guest")
            .in_(
                "status",
                [
                    "pending",
                    "joined",
                ],
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "취소할 수 있는 게스트 신청이 없습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 회원을 일정 참가자로 등록
    # -----------------------------------------------------
    def create_member_event_participant(
        self,
        event_id: int,
        user_id: str,
        participation_status: str = "joined",
    ) -> dict:
        response = (
            self.admin_client
            .table("event_participants")
            .insert(
                {
                    "event_id": event_id,
                    "user_id": user_id,
                    "participant_type": "member",
                    "status": participation_status,
                }
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "일정 참가 정보 생성에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 사용자의 기존 참석 응답 조회
    # -----------------------------------------------------
    def find_user_vote_response(
        self,
        vote_id: int,
        user_id: str,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("event_vote_responses")
            .select(
                (
                    "response_id, "
                    "vote_id, "
                    "option_id, "
                    "user_id"
                )
            )
            .eq("vote_id", vote_id)
            .eq("user_id", user_id)
            .order(
                "response_id",
                desc=True,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 사용자의 참석 응답 저장
    #
    # 현재 DB의 UNIQUE가
    # (vote_id, option_id, user_id)이므로
    # 기존 응답 삭제 후 새 응답을 저장
    # -----------------------------------------------------
    def replace_vote_response(
        self,
        vote_id: int,
        option_id: int,
        user_id: str,
    ) -> dict:
        (
            self.admin_client
            .table("event_vote_responses")
            .delete()
            .eq("vote_id", vote_id)
            .eq("user_id", user_id)
            .execute()
        )

        response = (
            self.admin_client
            .table("event_vote_responses")
            .insert(
                {
                    "vote_id": vote_id,
                    "option_id": option_id,
                    "user_id": user_id,
                }
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "참석 응답 저장에 실패했습니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 승인된 게스트 인원 조회
    # -----------------------------------------------------
    def count_joined_guests(
        self,
        event_id: int,
    ) -> int:
        response = (
            self.admin_client
            .table("event_participants")
            .select("event_participant_id")
            .eq("event_id", event_id)
            .eq("participant_type", "guest")
            .eq("status", "joined")
            .execute()
        )

        return len(response.data or [])

    # -----------------------------------------------------
    # 대기 중인 참가 신청 상태 변경
    # -----------------------------------------------------
    def update_pending_participant_status(
        self,
        event_id: int,
        event_participant_id: int,
        new_status: str,
    ) -> dict:
        response = (
            self.admin_client
            .table("event_participants")
            .update(
                {
                    "status": new_status,
                }
            )
            .eq("event_id", event_id)
            .eq(
                "event_participant_id",
                event_participant_id,
            )
            .eq("status", "pending")
            .execute()
        )

        if not response.data:
            raise ValueError(
                "이미 처리되었거나 처리할 수 없는 "
                "참가 신청입니다."
            )

        return response.data[0]

    # -----------------------------------------------------
    # 동호회 활동 회원 user_id 목록 조회 (알림용)
    # -----------------------------------------------------
    def find_active_member_user_ids(
        self,
        club_id: int,
    ) -> list[str]:

        response = (
            self.admin_client
            .table("club_members")
            .select("user_id")
            .eq("club_id", club_id)
            .eq("status", "active")
            .execute()
        )

        return [
            row["user_id"]
            for row in (response.data or [])
            if row.get("user_id")
        ]

    # -----------------------------------------------------
    # 일정 관련 알림 생성 (여러 명에게 한 번에)
    # -----------------------------------------------------
    def create_event_notifications(
        self,
        user_ids: list[str],
        notification_type: str,
        title: str,
        content: str,
        event_id: int,
        link_path: str,
    ) -> None:

        if not user_ids:
            return

        rows = [
            {
                "user_id": uid,
                "notification_type": notification_type,
                "title": title,
                "content": content,
                "related_type": "event",
                "related_id": event_id,
                "link_path": link_path,
                "is_read": False,
            }
            for uid in user_ids
        ]

        self.admin_client.table("notifications").insert(rows).execute()

    # -----------------------------------------------------
    # [스케줄러] 특정 날짜의 일정 조회 (취소 제외)
    #
    # event_date: "YYYY-MM-DD" (한국 날짜 기준)
    # -----------------------------------------------------
    def find_events_on_date(
        self,
        event_date: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_events")
            .select("*")
            .eq("event_date", event_date)
            .neq("status", "cancelled")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # [스케줄러] 마감 시각이 특정 구간에 들어가는 참석 투표 조회
    #
    # start_at / end_at: 타임존이 붙은 ISO 문자열
    # -----------------------------------------------------
    def find_attendance_votes_closed_between(
        self,
        start_at: str,
        end_at: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("event_votes")
            .select("vote_id, event_id, deadline")
            .eq("vote_type", "attendance")
            .gt("deadline", start_at)
            .lte("deadline", end_at)
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # [스케줄러] 이미 보낸 알림 조회 (중복 발송 방지)
    #
    # 반환: {(user_id, related_id), ...}
    # -----------------------------------------------------
    def find_sent_event_notification_keys(
        self,
        notification_type: str,
        event_ids: list[int],
    ) -> set[tuple[str, int]]:

        if not event_ids:
            return set()

        response = (
            self.admin_client
            .table("notifications")
            .select("user_id, related_id")
            .eq("notification_type", notification_type)
            .eq("related_type", "event")
            .in_("related_id", event_ids)
            .execute()
        )

        return {
            (str(row["user_id"]), int(row["related_id"]))
            for row in (response.data or [])
            if row.get("user_id") and row.get("related_id") is not None
        }

    # -----------------------------------------------------
    # 사용자 닉네임 조회 (알림 문구용)
    # -----------------------------------------------------
    def find_user_nickname(
        self,
        user_id: str,
    ) -> str | None:

        response = (
            self.admin_client
            .table("users")
            .select("nickname")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0].get("nickname")