from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# =========================================================
# 게시판 / 정렬 / 검색 종류
# =========================================================

# ---------------------------------------------------------
# Community 게시판 종류
#
# 현재 Frontend에서 확정된 값과 완전히 동일하게 사용한다.
#
# free    = 자유게시판
# sports  = 종목별게시판
# recruit = 홍보·회원구인
# notice  = 공지사항
# ---------------------------------------------------------
BoardType = Literal[
    "free",
    "sports",
    "recruit",
    "notice",
]


# ---------------------------------------------------------
# 게시글 정렬 방식
#
# Community.jsx에서 실제 사용하는 값
# ---------------------------------------------------------
PostSortType = Literal[
    "latest",
    "views",
    "comments",
]


# ---------------------------------------------------------
# 게시글 검색 범위
#
# 중요:
# Frontend가 현재 titleContent를 사용하고 있으므로
# Backend도 titleContent 그대로 받는다.
# ---------------------------------------------------------
PostSearchType = Literal[
    "title",
    "content",
    "titleContent",
]


# =========================================================
# 작성자 프로필
# =========================================================

# ---------------------------------------------------------
# 게시글 상세의 작성자 프로필 모달에 사용하는 정보
#
# 실제 데이터 출처:
#
# users
# - user_id
# - nickname
# - profile_image
# - bio
#
# user_sports + sports
# - 활동 종목
#
# user_regions
# - 활동 지역
#
# user_trust_scores
# - trust_score
# ---------------------------------------------------------
class AuthorProfileResponse(BaseModel):

    user_id: str

    nickname: str

    profile_image: str | None = None

    bio: str | None = None

    sports: list[str] = []

    regions: list[str] = []

    trust_score: float | None = None


# =========================================================
# 게시글 목록
# =========================================================

# ---------------------------------------------------------
# 게시글 목록에서 게시글 1개
#
# Community.jsx에서 현재 사용하는 이름을 최대한 유지한다.
#
# DB                       Frontend
#
# post_id          →       id
# board_type       →       board
# users.nickname   →       author
# view_count       →       views
# 댓글 COUNT        →       comments
# created_at       →       createdAt
#
# sportId / sportName
# clubId / clubName
#
# 은 특정 게시판에서 사용할 수 있도록 추가한다.
# ---------------------------------------------------------
class PostListItem(BaseModel):

    id: int

    board: BoardType

    title: str

    # 게시글 작성자 UUID
    authorId: str

    # users.nickname
    author: str

    # 종목별 게시판
    sportId: int | None = None
    sportName: str | None = None

    # 홍보·회원구인 게시판
    clubId: int | None = None
    clubName: str | None = None

    views: int = 0

    comments: int = 0

    createdAt: datetime


# ---------------------------------------------------------
# 게시글 목록 전체 응답
#
# Community.jsx의 Frontend slice 페이지네이션을
# 나중에 서버 페이지네이션으로 교체하기 위한 값들이다.
# ---------------------------------------------------------
class PostListResponse(BaseModel):

    items: list[PostListItem]

    page: int

    pageSize: int

    totalCount: int

    totalPages: int


# =========================================================
# 게시글 작성
# =========================================================

# ---------------------------------------------------------
# React → POST /api/posts
#
# Frontend PostWrite.jsx에서 실제로 보내는 데이터와 동일하다.
#
# author_id는 절대 받지 않는다.
#
# 작성자는 JWT Bearer Token에서 가져온다.
# ---------------------------------------------------------
class PostCreateRequest(BaseModel):

    board_type: BoardType

    sport_id: int | None = Field(
        default=None,
        gt=0,
    )

    club_id: int | None = Field(
        default=None,
        gt=0,
    )

    # Frontend maxLength=100과 동일
    title: str = Field(
        min_length=1,
        max_length=100,
    )

    # Frontend maxLength=3000과 동일
    content: str = Field(
        min_length=1,
        max_length=3000,
    )


    # -----------------------------------------------------
    # 게시판 종류별 Request 구조 검증
    #
    # 이것은 "권한 검사"가 아니다.
    #
    # 예:
    #
    # sports 게시판인데 sport_id가 없는 경우
    # → 잘못된 Request
    #
    # recruit 게시판인데 club_id가 없는 경우
    # → 잘못된 Request
    #
    # 실제 sport_id 존재 여부나
    # 동호회 운영진 여부는 Service에서 다시 확인한다.
    # -----------------------------------------------------
    @model_validator(mode="after")
    def validate_board_fields(self):

        # ---------------------------------------------
        # 자유게시판
        # sport / club 정보 사용 안 함
        # ---------------------------------------------
        if self.board_type == "free":

            if self.sport_id is not None:
                raise ValueError(
                    "자유게시판에서는 sport_id를 사용할 수 없습니다."
                )

            if self.club_id is not None:
                raise ValueError(
                    "자유게시판에서는 club_id를 사용할 수 없습니다."
                )


        # ---------------------------------------------
        # 종목별게시판
        # sport_id 필수
        # club_id 사용 안 함
        # ---------------------------------------------
        elif self.board_type == "sports":

            if self.sport_id is None:
                raise ValueError(
                    "종목별게시판은 sport_id가 필요합니다."
                )

            if self.club_id is not None:
                raise ValueError(
                    "종목별게시판에서는 club_id를 사용할 수 없습니다."
                )


        # ---------------------------------------------
        # 홍보·회원구인
        # club_id 필수
        #
        # 실제 운영진 권한 여부는
        # Service에서 JWT user_id를 이용해 검증한다.
        # ---------------------------------------------
        elif self.board_type == "recruit":

            if self.club_id is None:
                raise ValueError(
                    "홍보·회원구인 게시판은 club_id가 필요합니다."
                )

            if self.sport_id is not None:
                raise ValueError(
                    "홍보·회원구인 게시판에서는 sport_id를 직접 받지 않습니다."
                )


        # ---------------------------------------------
        # 공지사항
        #
        # 관리자 권한 여부는 Service에서 검증한다.
        # 현재 관리자 구조는 아직 확정되지 않았으므로
        # Schema에서 관리자 판별 로직을 만들지 않는다.
        # ---------------------------------------------
        elif self.board_type == "notice":

            if self.sport_id is not None:
                raise ValueError(
                    "공지사항에서는 sport_id를 사용할 수 없습니다."
                )

            if self.club_id is not None:
                raise ValueError(
                    "공지사항에서는 club_id를 사용할 수 없습니다."
                )

        return self


# =========================================================
# 게시글 작성 성공 응답
# =========================================================

class PostCreateResponse(BaseModel):

    id: int

    message: str = "게시글이 등록되었습니다."


# =========================================================
# 게시글 상세
# =========================================================

# ---------------------------------------------------------
# GET /api/posts/{post_id}
#
# PostDetail.jsx에서 실제 사용하는 구조를 기준으로 한다.
#
# 현재 Frontend에서는:
#
# post.id
# post.board
# post.title
# post.content
# post.author
# post.author_id
# post.createdAt
# post.views
# post.author_profile
#
# 을 사용하고 있다.
#
# 따라서 이 응답은 그 구조를 최대한 그대로 맞춘다.
# ---------------------------------------------------------
class PostDetailResponse(BaseModel):

    id: int

    board: BoardType

    title: str

    content: str

    # PostDetail.jsx에서 현재 snake_case로 사용 중
    author_id: str

    author: str

    sportId: int | None = None
    sportName: str | None = None

    clubId: int | None = None
    clubName: str | None = None

    views: int = 0

    comments: int = 0

    createdAt: datetime

    updatedAt: datetime

    author_profile: AuthorProfileResponse


# =========================================================
# 종목 선택
# =========================================================

# ---------------------------------------------------------
# PostWrite.jsx의 selectedSportId select에 사용
# ---------------------------------------------------------
class SportOptionResponse(BaseModel):

    sport_id: int

    sport_name: str


# =========================================================
# 운영 가능한 동호회 선택
# =========================================================

# ---------------------------------------------------------
# recruit 글쓰기에서 selectedClubId select에 사용
#
# 현재 로그인 사용자가 실제로 운영 가능한 동호회만
# Service에서 걸러서 이 형태로 반환한다.
# ---------------------------------------------------------
class ManagedClubResponse(BaseModel):

    club_id: int

    club_name: str


# =========================================================
# Community 작성 권한
# =========================================================

# ---------------------------------------------------------
# Community.jsx에 현재 하드코딩되어 있는:
#
# const canWriteNotice = false;
# const canWriteRecruit = false;
#
# 를 나중에 Backend 응답으로 교체하기 위한 구조.
#
# notice 관리자 구조가 아직 없기 때문에
# canWriteNotice는 현재 단계에서는 false가 된다.
# ---------------------------------------------------------
class CommunityPermissionResponse(BaseModel):

    canWriteRecruit: bool

    canWriteNotice: bool

    managedClubs: list[ManagedClubResponse] = []


# =========================================================
# Community 글쓰기 초기 옵션 Response
# =========================================================

# ---------------------------------------------------------
# GET /api/posts/write-options
#
# PostWrite.jsx가 글쓰기 화면을 열 때 필요한 정보를
# 한 번에 반환한다.
#
# sports:
# 종목별게시판에서 선택 가능한 종목
#
# managedClubs:
# 현재 사용자가 owner 또는 manager 권한을 가진 동호회
#
# canWriteRecruit:
# managedClubs가 하나 이상이면 True
#
# canWriteNotice:
# 전체 서비스 관리자 구조가 아직 없으므로 현재 False
# ---------------------------------------------------------
class CommunityWriteOptionsResponse(BaseModel):

    sports: list[SportOptionResponse]

    managedClubs: list[ManagedClubResponse]

    canWriteRecruit: bool

    canWriteNotice: bool