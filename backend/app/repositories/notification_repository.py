from app.core.supabase import (
    get_supabase_admin_client,
)


# =========================================================
# 공용 알림 Repository
#
# 여러 서비스(게스트 신청, 동호회 개설, 동호회 커뮤니티)에서
# 같이 쓰는 알림 저장 / 대상자 조회 기능
#
# ⭐ 알림 저장이 실패해도 원래 기능(신청, 개설, 글쓰기)은
#    정상 처리되어야 하므로, 호출하는 쪽에서 try/except로 감싼다.
# =========================================================

# 한 번에 insert 할 최대 행 수
INSERT_CHUNK_SIZE = 500

# 전체 사용자 조회 시 한 번에 가져올 행 수 (Supabase 기본 최대 1000)
SELECT_PAGE_SIZE = 1000


class NotificationRepository:

    def __init__(self):
        self.admin_client = (
            get_supabase_admin_client()
        )

    # -----------------------------------------------------
    # 알림 여러 명에게 한 번에 저장
    # -----------------------------------------------------
    def create_notifications(
        self,
        user_ids: list[str],
        notification_type: str,
        title: str,
        content: str,
        related_type: str | None = None,
        related_id: int | None = None,
        link_path: str | None = None,
    ) -> int:

        # 중복 제거 + 빈 값 제거 (순서 유지)
        unique_ids = list(
            dict.fromkeys(
                str(uid) for uid in user_ids if uid
            )
        )

        if not unique_ids:
            return 0

        rows = [
            {
                "user_id": uid,
                "notification_type": notification_type,
                "title": title,
                "content": content,
                "related_type": related_type,
                "related_id": related_id,
                "link_path": link_path,
                "is_read": False,
            }
            for uid in unique_ids
        ]

        for start in range(0, len(rows), INSERT_CHUNK_SIZE):
            (
                self.admin_client
                .table("notifications")
                .insert(rows[start:start + INSERT_CHUNK_SIZE])
                .execute()
            )

        return len(rows)

    # -----------------------------------------------------
    # 동호회 운영진(동호회장 + 운영진) user_id 목록
    # -----------------------------------------------------
    def find_club_manager_user_ids(
        self,
        club_id: int,
    ) -> list[str]:

        response = (
            self.admin_client
            .table("club_members")
            .select("user_id")
            .eq("club_id", club_id)
            .eq("status", "active")
            .in_("role", ["owner", "manager"])
            .execute()
        )

        return [
            row["user_id"]
            for row in (response.data or [])
            if row.get("user_id")
        ]

    # -----------------------------------------------------
    # 동호회 활동 회원 전체 user_id 목록
    # -----------------------------------------------------
    def find_club_member_user_ids(
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
    # 서비스 전체 사용자 user_id 목록 (페이지 단위로 끝까지)
    # -----------------------------------------------------
    def find_all_user_ids(self) -> list[str]:

        user_ids: list[str] = []
        start = 0

        while True:
            response = (
                self.admin_client
                .table("users")
                .select("user_id")
                .order("user_id")
                .range(start, start + SELECT_PAGE_SIZE - 1)
                .execute()
            )

            rows = response.data or []

            user_ids.extend(
                row["user_id"]
                for row in rows
                if row.get("user_id")
            )

            if len(rows) < SELECT_PAGE_SIZE:
                break

            start += SELECT_PAGE_SIZE

        return user_ids

    # -----------------------------------------------------
    # 알림 문구용 이름 조회
    # -----------------------------------------------------
    def find_club_name(
        self,
        club_id: int,
    ) -> str:

        response = (
            self.admin_client
            .table("clubs")
            .select("club_name")
            .eq("club_id", club_id)
            .limit(1)
            .execute()
        )

        rows = response.data or []

        return (
            rows[0].get("club_name")
            if rows and rows[0].get("club_name")
            else "동호회"
        )

    def find_user_nickname(
        self,
        user_id: str,
    ) -> str:

        response = (
            self.admin_client
            .table("users")
            .select("nickname")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        rows = response.data or []

        return (
            rows[0].get("nickname")
            if rows and rows[0].get("nickname")
            else "회원"
        )
