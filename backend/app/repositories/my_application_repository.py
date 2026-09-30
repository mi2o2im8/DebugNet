from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# 마이페이지 "신청 현황"용 Repository
#
# 내가 한 동호회 가입 신청 / 게스트 신청을 모아서 조회한다.
# 기존 repository 들을 건드리지 않도록 따로 둔다.
# ---------------------------------------------------------
class MyApplicationRepository:

    def __init__(self):
        self.admin_client = get_supabase_admin_client()

    # -----------------------------------------------------
    # 내 동호회 가입 신청 전체 (최신순)
    # -----------------------------------------------------
    def find_club_applications_by_user(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("club_applications")
            .select(
                "application_id, "
                "club_id, "
                "status, "
                "created_at, "
                "decided_at"
            )
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .order("application_id", desc=True)
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 내 게스트 신청 전체 (최신 신청순)
    # 상태: pending / joined / rejected / cancelled
    # -----------------------------------------------------
    def find_guest_applications_by_user(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("event_participants")
            .select("event_participant_id, event_id, status")
            .eq("user_id", user_id)
            .eq("participant_type", "guest")
            .order("event_participant_id", desc=True)
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 일정 조회 (취소된 일정도 포함 → "일정 취소"로 보여주기 위함)
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
            .select(
                "event_id, "
                "club_id, "
                "title, "
                "description, "
                "event_date, "
                "start_time, "
                "end_time, "
                "location, "
                "event_image_url, "
                "max_guests, "
                "registration_deadline, "
                "status"
            )
            .in_("event_id", event_ids)
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 동호회 이름
    # 반환 예: {9: "강서 FC"}
    # -----------------------------------------------------
    def find_club_names_by_ids(
        self,
        club_ids: list[int],
    ) -> dict[int, str]:

        if not club_ids:
            return {}

        response = (
            self.admin_client
            .table("clubs")
            .select("club_id, club_name")
            .in_("club_id", club_ids)
            .execute()
        )

        return {
            int(row["club_id"]): row["club_name"]
            for row in (response.data or [])
        }

    # -----------------------------------------------------
    # 동호회 대표 이미지
    # 반환 예: {9: "https://..."}
    # -----------------------------------------------------
    def find_representative_images_by_club_ids(
        self,
        club_ids: list[int],
    ) -> dict[int, str]:

        if not club_ids:
            return {}

        response = (
            self.admin_client
            .table("club_images")
            .select("club_id, image_url, display_order")
            .in_("club_id", club_ids)
            .eq("image_type", "representative")
            .order("display_order")
            .execute()
        )

        result: dict[int, str] = {}

        for row in response.data or []:
            club_id = int(row["club_id"])

            # 동호회마다 첫 번째 대표 이미지만
            if club_id not in result:
                result[club_id] = row["image_url"]

        return result

    # -----------------------------------------------------
    # 현재 활동 중(active)인 동호회 id
    # (가입 승인 후 탈퇴했는지 구분용)
    # -----------------------------------------------------
    def find_active_club_ids_by_user(
        self,
        user_id: str,
    ) -> set[int]:

        response = (
            self.admin_client
            .table("club_members")
            .select("club_id")
            .eq("user_id", user_id)
            .eq("status", "active")
            .execute()
        )

        return {
            int(row["club_id"])
            for row in (response.data or [])
        }

    # =====================================================
    # ⭐ 받은 신청 (운영자용)
    # =====================================================

    # 운영진으로 인정하는 역할
    OPERATOR_ROLES = ["owner", "manager", "동호회장", "운영진"]

    # -----------------------------------------------------
    # 내가 운영 중인 동호회 id
    # -----------------------------------------------------
    def find_operating_club_ids(
        self,
        user_id: str,
    ) -> list[int]:

        response = (
            self.admin_client
            .table("club_members")
            .select("club_id")
            .eq("user_id", user_id)
            .eq("status", "active")
            .in_("role", self.OPERATOR_ROLES)
            .execute()
        )

        return sorted({
            int(row["club_id"])
            for row in (response.data or [])
        })

    # -----------------------------------------------------
    # 여러 동호회의 승인 대기 가입 신청 (오래된 신청부터)
    # -----------------------------------------------------
    def find_pending_club_applications(
        self,
        club_ids: list[int],
    ) -> list[dict]:

        if not club_ids:
            return []

        response = (
            self.admin_client
            .table("club_applications")
            .select("application_id, club_id, user_id, created_at")
            .in_("club_id", club_ids)
            .eq("status", "pending")
            .order("created_at")
            .order("application_id")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 여러 동호회의 앞으로 열릴 일정 (오늘 포함, 취소 제외)
    # -----------------------------------------------------
    def find_upcoming_events_by_club_ids(
        self,
        club_ids: list[int],
        from_date: str,
    ) -> list[dict]:

        if not club_ids:
            return []

        response = (
            self.admin_client
            .table("club_events")
            .select(
                "event_id, club_id, title, "
                "event_date, start_time, status"
            )
            .in_("club_id", club_ids)
            .gte("event_date", from_date)
            .neq("status", "cancelled")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 여러 일정의 승인 대기 게스트 신청
    # -----------------------------------------------------
    def find_pending_guests_by_event_ids(
        self,
        event_ids: list[int],
    ) -> list[dict]:

        if not event_ids:
            return []

        response = (
            self.admin_client
            .table("event_participants")
            .select("event_participant_id, event_id, user_id")
            .in_("event_id", event_ids)
            .eq("participant_type", "guest")
            .eq("status", "pending")
            .order("event_participant_id")
            .execute()
        )

        return response.data or []

    # -----------------------------------------------------
    # 신청자 닉네임 / 프로필 사진
    # 반환 예: {"uuid": {"nickname": "...", "profile_image": "..."}}
    # -----------------------------------------------------
    def find_user_profiles_by_ids(
        self,
        user_ids: list[str],
    ) -> dict[str, dict]:

        if not user_ids:
            return {}

        response = (
            self.admin_client
            .table("users")
            .select("user_id, nickname, profile_image")
            .in_("user_id", user_ids)
            .execute()
        )

        return {
            row["user_id"]: row
            for row in (response.data or [])
        }
