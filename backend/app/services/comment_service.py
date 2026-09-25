from fastapi import HTTPException, status
from datetime import datetime, timezone

from app.repositories.comment_repository import CommentRepository
from app.repositories.post_repository import PostRepository

from app.schemas.comments import (
    CommentCreateRequest,
    CommentCreateResponse,
    CommentListResponse,
    CommentResponse,
    CommentUpdateRequest,
    CommentUpdateResponse,
)


# ---------------------------------------------------------
# PlayBridge Community 댓글 Service
#
# 역할:
#
# CommentRepository
# → comments CRUD
#
# PostRepository
# → 게시글 존재 확인
# → 차단 사용자 조회
# → 사용자 프로필 조회
#
# Service에서는 이 데이터들을 조합해서
# 실제 Community 규칙을 처리한다.
# ---------------------------------------------------------
class CommentService:

    def __init__(self):

        self.comment_repository = CommentRepository()

        # 이미 만들어둔 사용자/게시글 관련 조회 기능 재사용
        self.post_repository = PostRepository()


    # =====================================================
    # 1. 댓글 목록 조회
    # =====================================================

    def get_comment_list(
        self,
        post_id: int,
        user_id: str,
    ) -> CommentListResponse:

        # -------------------------------------------------
        # 게시글 존재 확인
        # -------------------------------------------------
        post = self.post_repository.get_post_by_id(
            post_id=post_id,
        )

        if post is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 현재 사용자가 차단한 사용자 목록
        # -------------------------------------------------
        blocked_user_ids = (
            self.post_repository.get_blocked_user_ids(
                user_id=user_id,
            )
        )


        # -------------------------------------------------
        # 게시글 작성자 자체가 차단된 사람이라면
        # 직접 API를 호출해도 게시글/댓글을 보여주지 않는다.
        # -------------------------------------------------
        if post["author_id"] in blocked_user_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 차단 사용자 댓글 제외 후 댓글 조회
        # -------------------------------------------------
        comments = (
            self.comment_repository.get_comments_by_post_id(
                post_id=post_id,
                blocked_user_ids=blocked_user_ids,
            )
        )


        if not comments:

            return CommentListResponse(
                comments=[],
                totalCount=0,
            )


        # -------------------------------------------------
        # 작성자 프로필은 같은 사용자가 댓글을 여러 개 써도
        # 한 번만 생성하도록 캐시한다.
        #
        # 예:
        #
        # A 댓글
        # A 댓글
        # B 댓글
        #
        # → A 프로필 DB 조회 1번
        # → B 프로필 DB 조회 1번
        # -------------------------------------------------
        profile_cache = {}

        response_comments = []


        for comment in comments:

            author_id = comment["author_id"]

            if author_id not in profile_cache:

                profile_cache[author_id] = (
                    self._build_author_profile(
                        user_id=author_id,
                    )
                )

            author_profile = profile_cache[author_id]


            response_comments.append(
                CommentResponse(
                    id=comment["comment_id"],

                    postId=comment["post_id"],

                    author_id=author_id,

                    author=author_profile["nickname"],

                    content=comment["content"],

                    createdAt=comment["created_at"],

                    author_profile=author_profile,
                )
            )


        return CommentListResponse(
            comments=response_comments,
            totalCount=len(response_comments),
        )


    # =====================================================
    # 2. 댓글 작성
    # =====================================================

    def create_comment(
        self,
        post_id: int,
        user_id: str,
        comment_data: CommentCreateRequest,
    ) -> CommentCreateResponse:

        # -------------------------------------------------
        # 게시글 존재 확인
        # -------------------------------------------------
        post = self.post_repository.get_post_by_id(
            post_id=post_id,
        )

        if post is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 차단한 사용자의 게시글에는
        # 직접 API를 호출해도 댓글을 달 수 없도록 한다.
        # -------------------------------------------------
        blocked_user_ids = (
            self.post_repository.get_blocked_user_ids(
                user_id=user_id,
            )
        )

        if post["author_id"] in blocked_user_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="게시글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 댓글 공백 제거
        # -------------------------------------------------
        content = comment_data.content.strip()

        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="댓글 내용을 입력해주세요.",
            )


        # -------------------------------------------------
        # DB 댓글 생성
        #
        # author_id는 Frontend에서 받지 않는다.
        # JWT user_id를 사용한다.
        # -------------------------------------------------
        created_comment = (
            self.comment_repository.create_comment(
                post_id=post_id,
                author_id=user_id,
                content=content,
            )
        )


        # -------------------------------------------------
        # 댓글 작성자의 실제 프로필 조회
        #
        # Frontend에서 임시로 사용하던
        #
        # author: "나"
        #
        # 대신 실제 nickname/profile을 반환한다.
        # -------------------------------------------------
        author_profile = self._build_author_profile(
            user_id=user_id,
        )


        # -------------------------------------------------
        # 게시글 작성자에게 댓글 알림 보내기
        #
        # - 내 글에 내가 댓글 단 경우는 알림 X
        # - 알림 저장이 실패해도 댓글 작성은 정상 처리
        # -------------------------------------------------
        if post["author_id"] != user_id:
            try:
                post_title = post.get("title") or "게시글"
                if len(post_title) > 20:
                    post_title = post_title[:20] + "…"

                comment_preview = content
                if len(comment_preview) > 30:
                    comment_preview = comment_preview[:30] + "…"

                self.comment_repository.create_comment_notification(
                    user_id=post["author_id"],
                    title="내 게시물에 새 댓글",
                    content=(
                        f"{author_profile['nickname']}님이 "
                        f"'{post_title}'에 댓글을 남겼어요: "
                        f"{comment_preview}"
                    ),
                    post_id=post_id,
                )
            except Exception as e:
                print("댓글 알림 생성 실패:", e)


        comment = CommentResponse(
            id=created_comment["comment_id"],

            postId=created_comment["post_id"],

            author_id=created_comment["author_id"],

            author=author_profile["nickname"],

            content=created_comment["content"],

            createdAt=created_comment["created_at"],

            author_profile=author_profile,
        )


        return CommentCreateResponse(
            comment=comment,
        )


    # =====================================================
    # 3. 댓글 삭제
    # =====================================================

    def delete_comment(
        self,
        comment_id: int,
        user_id: str,
    ) -> None:

        # -------------------------------------------------
        # 댓글 존재 확인
        # -------------------------------------------------
        comment = (
            self.comment_repository.get_comment_by_id(
                comment_id=comment_id,
            )
        )

        if comment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="댓글을 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # 댓글 작성자와 현재 로그인 사용자 비교
        #
        # JWT UUID
        # ==
        # comments.author_id
        #
        # 본인 댓글만 삭제 가능
        # -------------------------------------------------
        if comment["author_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="본인이 작성한 댓글만 삭제할 수 있습니다.",
            )


        # -------------------------------------------------
        # 실제 DB 삭제
        # -------------------------------------------------
        self.comment_repository.delete_comment(
            comment_id=comment_id,
        )


    # =========================================================
    # 댓글 수정
    # =========================================================

    def update_comment(
        self,
        comment_id: int,
        user_id: str,
        comment_data: CommentUpdateRequest,
    ) -> CommentUpdateResponse:

        # -----------------------------------------------------
        # 1. 기존 댓글 조회
        # -----------------------------------------------------
        comment = self.comment_repository.get_comment_by_id(
            comment_id=comment_id
        )

        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="댓글을 찾을 수 없습니다.",
            )


        # -----------------------------------------------------
        # 2. 본인 댓글인지 확인
        # -----------------------------------------------------
        if str(comment["author_id"]) != str(user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="댓글을 수정할 권한이 없습니다.",
            )


        # -----------------------------------------------------
        # 3. 댓글 내용 정리
        # -----------------------------------------------------
        content = comment_data.content.strip()

        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="댓글 내용을 입력해주세요.",
            )


        # -----------------------------------------------------
        # 4. 수정 시간 생성
        # -----------------------------------------------------
        updated_at = datetime.now(
            timezone.utc
        ).isoformat()


        # -----------------------------------------------------
        # 5. DB 수정
        # -----------------------------------------------------
        updated_comment = (
            self.comment_repository.update_comment(
                comment_id=comment_id,
                update_data={
                    "content": content,
                    "updated_at": updated_at,
                },
            )
        )


        if not updated_comment:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="댓글 수정 중 오류가 발생했습니다.",
            )


        # -----------------------------------------------------
        # 6. Response 반환
        # -----------------------------------------------------
        return CommentUpdateResponse(
            id=comment_id,
            content=updated_comment["content"],
            updatedAt=updated_comment["updated_at"],
        )

    


    # =====================================================
    # 작성자 프로필 생성
    # =====================================================

    def _build_author_profile(
        self,
        user_id: str,
    ) -> dict:

        # -------------------------------------------------
        # users
        # -------------------------------------------------
        user = self.post_repository.get_user_by_id(
            user_id=user_id,
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자 정보를 찾을 수 없습니다.",
            )


        # -------------------------------------------------
        # user_sports
        # -------------------------------------------------
        user_sport_rows = (
            self.post_repository.get_user_sports(
                user_id=user_id,
            )
        )

        sport_ids = [
            row["sport_id"]
            for row in user_sport_rows
            if row.get("sport_id") is not None
        ]


        # -------------------------------------------------
        # sports
        #
        # sport_id → sport_name
        # -------------------------------------------------
        sports = (
            self.post_repository.get_sports_by_ids(
                sport_ids=sport_ids,
            )
        )

        sport_names = [
            sport["sport_name"]
            for sport in sports
        ]


        # -------------------------------------------------
        # user_regions
        # -------------------------------------------------
        region_rows = (
            self.post_repository.get_user_regions(
                user_id=user_id,
            )
        )

        regions = [
            row["region"]
            for row in region_rows
            if row.get("region")
        ]


        # -------------------------------------------------
        # user_trust_scores
        # -------------------------------------------------
        trust_score_row = (
            self.post_repository.get_user_trust_score(
                user_id=user_id,
            )
        )

        trust_score = (
            trust_score_row["trust_score"]
            if trust_score_row is not None
            else None
        )


        # -------------------------------------------------
        # Frontend 프로필 모달 형태
        # -------------------------------------------------
        return {
            "user_id": user["user_id"],

            "nickname": user["nickname"],

            "profile_image": user.get(
                "profile_image"
            ),

            "bio": user.get(
                "bio"
            ),

            "sports": sport_names,

            "regions": regions,

            "trust_score": trust_score,
        }