from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.posts import AuthorProfileResponse


# =========================================================
# 댓글 작성 Request
# =========================================================

# ---------------------------------------------------------
# React → POST /api/posts/{post_id}/comments
#
# Frontend에서는 댓글 내용만 보낸다.
#
# author_id는 절대 Request Body에서 받지 않는다.
# 현재 로그인 사용자의 UUID는 JWT에서 가져온다.
#
# post_id 역시 Body로 받지 않고 URL에서 받는다.
# ---------------------------------------------------------
class CommentCreateRequest(BaseModel):

    content: str = Field(
        min_length=1,
    )


# =========================================================
# 댓글 Response
# =========================================================

# ---------------------------------------------------------
# PostDetail.jsx에서 실제 사용하는 댓글 형태
#
# DB                         Frontend
#
# comment_id        →        id
# post_id           →        postId
# author_id         →        author_id
# users.nickname    →        author
# created_at        →        createdAt
#
# 작성자 프로필은 게시글 작성자 프로필과
# 동일한 모달을 사용하므로
# AuthorProfileResponse를 그대로 재사용한다.
# ---------------------------------------------------------
class CommentResponse(BaseModel):

    id: int

    postId: int

    # 현재 PostDetail.jsx에서 snake_case로 사용 중
    author_id: str

    # users.nickname
    author: str

    content: str

    createdAt: datetime

    author_profile: AuthorProfileResponse


# =========================================================
# 댓글 목록 Response
# =========================================================

# ---------------------------------------------------------
# GET /api/posts/{post_id}/comments
#
# PostDetail.jsx에서는 댓글들을 배열로 사용하므로
# comments에 댓글 목록을 담는다.
#
# totalCount는 화면 상단의:
#
# 댓글 3
#
# 같은 값을 표시할 때 사용할 수 있다.
#
# 차단한 사용자의 댓글은 Backend에서 제외한 뒤
# totalCount도 실제 보이는 댓글 기준으로 계산한다.
# ---------------------------------------------------------
class CommentListResponse(BaseModel):

    comments: list[CommentResponse]

    totalCount: int


# =========================================================
# 댓글 작성 성공 Response
# =========================================================

# ---------------------------------------------------------
# 댓글 작성 후 새로 생성된 댓글 전체를 반환한다.
#
# 그러면 Frontend에서 작성 후
# 댓글 목록 전체를 다시 요청하지 않고도
#
# setComments(prev => [...prev, createdComment])
#
# 형태로 바로 화면에 추가할 수 있다.
# ---------------------------------------------------------
class CommentCreateResponse(BaseModel):

    comment: CommentResponse