from datetime import datetime, timezone

from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# PlayBridge 사용자 차단 Repository
#
# Repository 역할:
#
# - 기존 차단 여부 확인
# - 사용자 차단 생성
# - 내가 차단한 사용자 목록 조회
# - 차단 대상 사용자 기본 정보 조회
# - 차단 해제
#
# 자기 자신 차단, 중복 차단 등의 판단은
# Service에서 처리한다.
# ---------------------------------------------------------
class BlockRepository:

    def __init__(self):

        self.admin_client = get_supabase_admin_client()


    # =====================================================
    # 1. 기존 차단 여부 확인
    # =====================================================

    # -----------------------------------------------------
    # 현재 사용자가 상대방을 이미 차단했는지 확인
    #
    # user_id:
    # JWT에서 얻은 현재 로그인 사용자
    #
    # blocked_user_id:
    # 차단 대상 사용자
    # -----------------------------------------------------
    def is_blocked(
        self,
        user_id: str,
        blocked_user_id: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("user_blocks")
            .select("block_id")
            .eq(
                "user_id",
                user_id,
            )
            .eq(
                "blocked_user_id",
                blocked_user_id,
            )
            .limit(1)
            .execute()
        )

        return bool(response.data)


    # =====================================================
    # 2. 사용자 존재 여부 확인
    # =====================================================

    # -----------------------------------------------------
    # 차단하려는 사용자가 실제 users 테이블에 존재하는지
    # Service에서 확인하기 위해 사용한다.
    # -----------------------------------------------------
    def user_exists(
        self,
        user_id: str,
    ) -> bool:

        response = (
            self.admin_client
            .table("users")
            .select("user_id")
            .eq(
                "user_id",
                user_id,
            )
            .limit(1)
            .execute()
        )

        return bool(response.data)


    # =====================================================
    # 3. 차단 생성
    # =====================================================

    def create_block(
        self,
        user_id: str,
        blocked_user_id: str,
    ) -> dict:

        block_data = {
            # 차단한 사람
            "user_id": user_id,

            # 차단당한 사람
            "blocked_user_id": blocked_user_id,

            "created_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

        response = (
            self.admin_client
            .table("user_blocks")
            .insert(
                block_data
            )
            .execute()
        )

        if not response.data:
            raise ValueError(
                "사용자 차단 저장에 실패했습니다."
            )

        return response.data[0]


    # =====================================================
    # 4. 내가 차단한 사용자 목록
    # =====================================================

    # -----------------------------------------------------
    # 현재 로그인 사용자의 user_blocks 행을 가져온다.
    #
    # 예:
    #
    # [
    #   {
    #       "block_id": 1,
    #       "blocked_user_id": "...",
    #       "created_at": "..."
    #   }
    # ]
    # -----------------------------------------------------
    def get_blocks(
        self,
        user_id: str,
    ) -> list[dict]:

        response = (
            self.admin_client
            .table("user_blocks")
            .select(
                "block_id, "
                "blocked_user_id, "
                "created_at"
            )
            .eq(
                "user_id",
                user_id,
            )
            .order(
                "created_at",
                desc=True,
            )
            .execute()
        )

        return response.data or []


    # =====================================================
    # 5. 차단한 사용자들의 기본 프로필
    # =====================================================

    # -----------------------------------------------------
    # user_blocks에는 UUID만 있기 때문에
    #
    # 내 정보 > 차단 사용자 관리
    #
    # 화면에 nickname / profile_image / bio를 보여주려면
    # users 테이블을 조회해야 한다.
    # -----------------------------------------------------
    def get_users_by_ids(
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
                "nickname, "
                "profile_image, "
                "bio"
            )
            .in_(
                "user_id",
                user_ids,
            )
            .execute()
        )

        return response.data or []


    # =====================================================
    # 6. 차단 해제
    # =====================================================

    # -----------------------------------------------------
    # 중요한 점:
    #
    # blocked_user_id만 조건으로 삭제하면 안 된다.
    #
    # 반드시:
    #
    # user_id = 현재 로그인 사용자
    # AND
    # blocked_user_id = 상대방
    #
    # 두 조건을 모두 사용한다.
    #
    # 그래야 다른 사용자의 차단 기록을
    # 삭제할 수 없다.
    # -----------------------------------------------------
    def delete_block(
        self,
        user_id: str,
        blocked_user_id: str,
    ) -> None:

        (
            self.admin_client
            .table("user_blocks")
            .delete()
            .eq(
                "user_id",
                user_id,
            )
            .eq(
                "blocked_user_id",
                blocked_user_id,
            )
            .execute()
        )