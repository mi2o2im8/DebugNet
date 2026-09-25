from datetime import datetime, timezone

from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# PlayBridge Community 댓글 Repository
#
# Repository 역할:
# - comments 테이블 CRUD
#
# 비즈니스 판단은 하지 않는다.
#
# 예:
# - 본인 댓글인지
# - 차단한 사용자인지
# - 게시글이 존재하는지
#
# 이런 판단은 CommentService에서 처리한다.
# ---------------------------------------------------------
class CommentRepository:

    def __init__(self):

        # 기존 PlayBridge Backend와 동일하게
        # Admin Supabase Client를 사용한다.
        self.admin_client = get_supabase_admin_client()


    # =====================================================
    # 1. 게시글 댓글 목록 조회
    # =====================================================

    # -----------------------------------------------------
    # 특정 게시글의 일반 댓글 조회
    #
    # 현재 Frontend에는 대댓글 기능이 없으므로:
    #
    # parent_comment_id IS NULL
    #
    # 인 댓글만 가져온다.
    #
    # blocked_user_ids가 있으면
    # 현재 사용자가 차단한 사람의 댓글을 제외한다.
    # -----------------------------------------------------
    def get_comments_by_post_id(
        self,
        post_id: int,
        blocked_user_ids: list[str] | None = None,
    ) -> list[dict]:

        query = (
            self.admin_client
            .table("comments")
            .select(
                "comment_id, "
                "post_id, "
                "author_id, "
                "parent_comment_id, "
                "content, "
                "created_at, "
                "updated_at"
            )
            .eq(
                "post_id",
                post_id,
            )
            .is_(
                "parent_comment_id",
                "null",
            )
        )


        # -------------------------------------------------
        # 차단 사용자 댓글 제외
        # -------------------------------------------------
        if blocked_user_ids:

            blocked_ids = ",".join(
                blocked_user_ids
            )

            query = query.not_.in_(
                "author_id",
                f"({blocked_ids})",
            )


        # -------------------------------------------------
        # 댓글은 오래된 순서부터 보여준다.
        #
        # 먼저 작성된 댓글
        # → 나중에 작성된 댓글
        # -------------------------------------------------
        response = (
            query
            .order(
                "created_at",
                desc=False,
            )
            .execute()
        )

        return response.data or []


    # =====================================================
    # 2. 댓글 1개 조회
    # =====================================================

    # -----------------------------------------------------
    # 댓글 삭제 전에:
    #
    # - 댓글이 실제 존재하는지
    # - author_id가 현재 로그인 사용자와 같은지
    #
    # 확인하기 위해 사용한다.
    # -----------------------------------------------------
    def get_comment_by_id(
        self,
        comment_id: int,
    ) -> dict | None:

        response = (
            self.admin_client
            .table("comments")
            .select(
                "comment_id, "
                "post_id, "
                "author_id, "
                "parent_comment_id, "
                "content, "
                "created_at, "
                "updated_at"
            )
            .eq(
                "comment_id",
                comment_id,
            )
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =====================================================
    # 3. 댓글 작성
    # =====================================================

    # -----------------------------------------------------
    # 댓글 생성
    #
    # post_id:
    # URL에서 받은 게시글 ID
    #
    # author_id:
    # JWT에서 확인한 현재 사용자 UUID
    #
    # content:
    # Frontend Request Body
    #
    # 현재는 대댓글을 사용하지 않으므로
    # parent_comment_id = None
    # -----------------------------------------------------
    def create_comment(
        self,
        post_id: int,
        author_id: str,
        content: str,
    ) -> dict:

        now = datetime.now(
            timezone.utc
        ).isoformat()

        comment_data = {

            "post_id": post_id,

            "author_id": author_id,

            "parent_comment_id": None,

            "content": content,

            "created_at": now,

            "updated_at": now,
        }


        response = (
            self.admin_client
            .table("comments")
            .insert(
                comment_data
            )
            .execute()
        )


        if not response.data:
            raise ValueError(
                "댓글 저장에 실패했습니다."
            )


        return response.data[0]


    # =====================================================
    # 4. 댓글 삭제
    # =====================================================

    # -----------------------------------------------------
    # 실제 DELETE만 수행한다.
    #
    # 본인 댓글 여부는 CommentService에서
    # 먼저 확인하고 이 메서드를 호출한다.
    # -----------------------------------------------------
    def delete_comment(
        self,
        comment_id: int,
    ) -> None:

        (
            self.admin_client
            .table("comments")
            .delete()
            .eq(
                "comment_id",
                comment_id,
            )
            .execute()
        )


    # =========================================================
    # 댓글 수정
    # =========================================================

    def update_comment(
        self,
        comment_id: int,
        update_data: dict,
    ):

        response = (
            self.admin_client
            .table("comments")
            .update(update_data)
            .eq("comment_id", comment_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]


    # =====================================================
    # 5. 댓글 알림 생성
    # =====================================================
    def create_comment_notification(
        self,
        user_id: str,
        title: str,
        content: str,
        post_id: int,
    ) -> None:

        self.admin_client.table("notifications").insert(
            {
                "user_id": user_id,
                "notification_type": "community_comment",
                "title": title,
                "content": content,
                "related_type": "post",
                "related_id": post_id,
                "is_read": False,
            }
        ).execute()