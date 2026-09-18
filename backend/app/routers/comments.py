from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_id

from app.schemas.comments import (
    CommentCreateRequest,
    CommentCreateResponse,
    CommentListResponse,
    CommentUpdateRequest,
    CommentUpdateResponse,
)

from app.services.comment_service import CommentService


# ---------------------------------------------------------
# PlayBridge Community 댓글 Router
# ---------------------------------------------------------
router = APIRouter(
    tags=["Community Comments"],
)


# =========================================================
# 댓글 목록 조회
# =========================================================

# ---------------------------------------------------------
# GET /api/posts/{post_id}/comments
#
# 처리:
# - JWT 사용자 확인
# - 게시글 존재 확인
# - 차단 사용자 댓글 제외
# - 작성자 프로필 포함
# ---------------------------------------------------------
@router.get(
    "/api/posts/{post_id}/comments",
    response_model=CommentListResponse,
)
def get_comments(

    post_id: int,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    comment_service = CommentService()

    return comment_service.get_comment_list(
        post_id=post_id,
        user_id=user_id,
    )


# =========================================================
# 댓글 작성
# =========================================================

# ---------------------------------------------------------
# POST /api/posts/{post_id}/comments
#
# Request Body:
#
# {
#     "content": "댓글 내용"
# }
#
# author_id는 Body에서 받지 않는다.
# JWT 사용자 UUID를 사용한다.
# ---------------------------------------------------------
@router.post(
    "/api/posts/{post_id}/comments",
    response_model=CommentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(

    post_id: int,

    comment_data: CommentCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    comment_service = CommentService()

    return comment_service.create_comment(
        post_id=post_id,
        user_id=user_id,
        comment_data=comment_data,
    )


# =========================================================
# 댓글 삭제
# =========================================================

# ---------------------------------------------------------
# DELETE /api/comments/{comment_id}
#
# 처리:
# - JWT 사용자 확인
# - 댓글 존재 확인
# - comments.author_id == JWT user_id 확인
# - 본인 댓글만 삭제
# ---------------------------------------------------------
@router.delete(
    "/api/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_comment(

    comment_id: int,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    comment_service = CommentService()

    comment_service.delete_comment(
        comment_id=comment_id,
        user_id=user_id,
    )

    return None

# =========================================================
# 댓글 수정
# =========================================================

@router.patch(
    "/api/comments/{comment_id}",
    response_model=CommentUpdateResponse,
)
def update_comment(
    comment_id: int,
    comment_data: CommentUpdateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    comment_service = CommentService()

    return comment_service.update_comment(
        comment_id=comment_id,
        user_id=user_id,
        comment_data=comment_data,
    )