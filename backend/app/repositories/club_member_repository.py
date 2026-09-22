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
                "profile_image"
            )
            .in_(
                "user_id",
                user_ids,
            )
            .execute()
        )

        return response.data or []