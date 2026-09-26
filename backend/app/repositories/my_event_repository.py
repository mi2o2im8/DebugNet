from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# 내 동호회 전체 일정용 Repository
#
# 기존 club_repository.py 를 건드리지 않도록
# 이 기능에 필요한 조회만 따로 둔다.
# ---------------------------------------------------------
class MyEventRepository:

    def __init__(self):
        self.admin_client = get_supabase_admin_client()

    # -----------------------------------------------------
    # 내가 활동 중인 동호회 목록
    #
    # club_members(active) + clubs(status=True)
    # 반환 예: [{"club_id": 1, "club_name": "강서 FC", "role": "owner"}]
    # -----------------------------------------------------
    def find_active_clubs_by_user(
        self,
        user_id: str,
    ) -> list[dict]:

        member_response = (
            self.admin_client
            .table("club_members")
            .select("club_id, role, joined_at")
            .eq("user_id", user_id)
            .eq("status", "active")
            .order("joined_at", desc=False)
            .execute()
        )

        members = member_response.data or []

        if not members:
            return []

        club_ids = [member["club_id"] for member in members]

        club_response = (
            self.admin_client
            .table("clubs")
            .select("club_id, club_name")
            .in_("club_id", club_ids)
            .eq("status", True)
            .execute()
        )

        club_name_by_id = {
            club["club_id"]: club["club_name"]
            for club in (club_response.data or [])
        }

        return [
            {
                "club_id": member["club_id"],
                "club_name": club_name_by_id[member["club_id"]],
                "role": member.get("role"),
            }
            for member in members
            if member["club_id"] in club_name_by_id
        ]