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