from fastapi import (
    APIRouter,
    Depends,
    File,
    Query,
    UploadFile,
    status,
)

from app.core.security import get_current_user_id
from app.schemas.posts import (
    BoardType,
    CommunityWriteOptionsResponse,
    PostCreateRequest,
    PostCreateResponse,
    PostDetailResponse,
    PostImageUploadResponse,
    PostListResponse,
    PostUpdateRequest,
    PostUpdateResponse,
    PostSearchType,
    PostSortType,
)
from app.services.post_service import PostService


# ---------------------------------------------------------
# PlayBridge 전체 Community 게시글 Router
#
# club_posts:
# 특정 동호회 내부 게시판
#
# posts:
# PlayBridge 전체 Community
# ---------------------------------------------------------
router = APIRouter(
    prefix="/api/posts",
    tags=["Community Posts"],
)


# ---------------------------------------------------------
# 게시글 목록 조회
#
# 예:
#
# GET /api/posts
#     ?board_type=free
#     &page=1
#     &size=10
#     &sort=latest
#
# 검색 시:
#
# GET /api/posts
#     ?board_type=free
#     &page=1
#     &size=10
#     &sort=latest
#     &search_type=titleContent
#     &keyword=풋살
#
#
# 로그인 사용자를 JWT에서 확인하는 이유:
#
# 현재 사용자가 차단한 사람의 게시글과 댓글을
# 목록에서 제외해야 하기 때문이다.
# ---------------------------------------------------------
@router.get(
    "",
    response_model=PostListResponse,
)
def get_posts(

    # -----------------------------------------------------
    # 게시판 종류
    #
    # free
    # sports
    # recruit
    # notice
    # -----------------------------------------------------
    board_type: BoardType = Query(...),


    # -----------------------------------------------------
    # 종목별게시판 종목 필터
    #
    # 없으면 전체 종목
    # 값이 있으면 해당 sport_id 게시글만 조회
    # -----------------------------------------------------
    sport_id: int | None = Query(
        default=None,
        gt=0,
    ),

    # -----------------------------------------------------
    # 현재 페이지
    #
    # 최소 1
    # -----------------------------------------------------
    page: int = Query(
        default=1,
        ge=1,
    ),

    # -----------------------------------------------------
    # 한 페이지 게시글 개수
    #
    # 현재 Frontend 기준 최대 10개
    # -----------------------------------------------------
    size: int = Query(
        default=10,
        ge=1,
        le=10,
    ),

    # -----------------------------------------------------
    # 정렬
    #
    # latest
    # views
    # comments
    # -----------------------------------------------------
    sort: PostSortType = Query(
        default="latest",
    ),

    # -----------------------------------------------------
    # 검색 범위
    #
    # title
    # content
    # titleContent
    #
    # 검색하지 않을 때는 없어도 된다.
    # -----------------------------------------------------
    search_type: PostSearchType | None = Query(
        default=None,
    ),

    # -----------------------------------------------------
    # 검색어
    # -----------------------------------------------------
    keyword: str | None = Query(
        default=None,
        max_length=100,
    ),

    # -----------------------------------------------------
    # 현재 로그인 사용자 UUID
    #
    # Frontend에서 user_id를 보내는 것이 아니라
    # Authorization Bearer Token에서 가져온다.
    # -----------------------------------------------------
    user_id: str = Depends(
        get_current_user_id
    ),
):

    # -----------------------------------------------------
    # Router에서는 DB를 직접 호출하지 않는다.
    #
    # Service에 필요한 값만 전달한다.
    # -----------------------------------------------------
    post_service = PostService()

    return post_service.get_post_list(
        user_id=user_id,
        board_type=board_type,
        sport_id=sport_id,
        page=page,
        size=size,
        sort=sort,
        search_type=search_type,
        keyword=keyword,
    )


# =========================================================
# Community 글쓰기 옵션 조회
# =========================================================

# ---------------------------------------------------------
# GET /api/posts/write-options
#
# 반환:
# - 활성 종목 목록
# - 현재 사용자가 운영 가능한 동호회
# - recruit 작성 가능 여부
# - notice 작성 가능 여부
#
# 현재 사용자 UUID는 JWT에서 가져온다.
# ---------------------------------------------------------
@router.get(
    "/write-options",
    response_model=CommunityWriteOptionsResponse,
)
def get_write_options(

    user_id: str = Depends(
        get_current_user_id
    ),
):

    post_service = PostService()

    return post_service.get_write_options(
        user_id=user_id,
    )



# =========================================================
# 게시글 이미지 업로드
# =========================================================

@router.post(
    "/images",
    response_model=PostImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_post_image(
    file: UploadFile = File(...),

    user_id: str = Depends(
        get_current_user_id
    ),
):

    # UploadFile의 실제 파일 데이터를 bytes로 읽는다.
    file_bytes = await file.read()

    post_service = PostService()

    result = post_service.upload_post_image(
        user_id=user_id,
        file_name=file.filename,
        content_type=file.content_type,
        file_bytes=file_bytes,
    )

    await file.close()

    return result




# ---------------------------------------------------------
# 게시글 상세 조회
#
# GET /api/posts/15
#
# 처리:
# - JWT 사용자 확인
# - 게시글 존재 확인
# - 차단 사용자 게시글 차단
# - 작성자 Profile 조회
# - 댓글 수 조회
# - 조회수 +1
# ---------------------------------------------------------
@router.get(
    "/{post_id}",
    response_model=PostDetailResponse,
)
def get_post_detail(

    post_id: int,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    post_service = PostService()

    return post_service.get_post_detail(
        post_id=post_id,
        user_id=user_id,
    )

# ---------------------------------------------------------
# 게시글 작성
#
# POST /api/posts
#
# author_id는 Request Body에서 받지 않는다.
#
# JWT Bearer Token에서 현재 사용자 UUID를 구해서
# posts.author_id로 저장한다.
# ---------------------------------------------------------
@router.post(
    "",
    response_model=PostCreateResponse,
    status_code=201,
)
def create_post(

    post_data: PostCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    post_service = PostService()

    return post_service.create_post(
        user_id=user_id,
        post_data=post_data,
    )


# =========================================================
# 게시글 수정
# =========================================================

@router.patch(
    "/{post_id}",
    response_model=PostUpdateResponse,
)
def update_post(
    post_id: int,
    post_data: PostUpdateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    post_service = PostService()

    return post_service.update_post(
        post_id=post_id,
        user_id=user_id,
        post_data=post_data,
    )



# ---------------------------------------------------------
# 게시글 삭제
#
# DELETE /api/posts/{post_id}
#
# Frontend에서는 post_id만 URL로 전달한다.
#
# 실제 삭제 권한은:
#
# JWT user_id
# ==
# posts.author_id
#
# 인지 Backend에서 확인한다.
# ---------------------------------------------------------
@router.delete(
    "/{post_id}",
    status_code=204,
)
def delete_post(

    post_id: int,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    post_service = PostService()

    post_service.delete_post(
        post_id=post_id,
        user_id=user_id,
    )

    return None