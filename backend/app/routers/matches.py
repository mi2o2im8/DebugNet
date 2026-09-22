from datetime import date
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.security import (
    get_current_user_id,
)

from app.schemas.matches import (
    MatchAvailabilityCreateRequest,
    MatchAvailabilityCreateResponse,
    MatchAvailabilityResponse,
    MatchAvailabilityListResponse,
    MatchAvailabilityUpdateRequest,
    MatchAvailabilityUpdateResponse,
    MatchAvailabilityDeleteResponse,
    MatchOptionsResponse,
    MyMatchAvailabilityListResponse,
    MatchRequestableClubsResponse,
    MatchRequestCreateRequest,
    MatchRequestCreateResponse,
    MatchAvailabilityDetailResponse,
)

from app.services.match_service import (
    MatchService,
    MatchDeleteConfirmationRequired,
)


# =========================================================
# Team Match Router
# =========================================================

router = APIRouter(
    prefix="/api/matches",
    tags=["Team Matches"],
)


# =========================================================
# 팀매칭 등록 옵션 조회
# =========================================================

@router.get(
    "/options",
    response_model=MatchOptionsResponse,
)
def get_match_options(

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.get_match_options(
            user_id=user_id,
        )

    except Exception as error:

        print(
            "팀매칭 옵션 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "팀매칭 옵션 조회 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 내가 등록한 경기 가능일 목록 조회
#
# GET /api/matches/availabilities/my
#
# 현재 로그인 사용자가 owner / manager로 운영하는
# 동호회들의 경기 가능일을 조회한다.
# =========================================================

@router.get(
    "/availabilities/my",
    response_model=MyMatchAvailabilityListResponse,
)
def get_my_match_availabilities(

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.get_my_availabilities(
            user_id=user_id,
        )

    except Exception as error:

        print(
            "내 경기 가능일 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "경기 가능일 목록 조회 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 경기 가능일 수정
#
# PATCH /api/matches/availabilities/{availability_id}
#
# 해당 경기 가능일을 등록한 동호회의
# owner / manager만 수정할 수 있다.
# =========================================================

@router.patch(
    "/availabilities/{availability_id}",
    response_model=MatchAvailabilityUpdateResponse,
)
def update_match_availability(
    availability_id: int,
    request_data: MatchAvailabilityUpdateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.update_availability(
            availability_id=availability_id,
            user_id=user_id,
            request_data=request_data,
        )

    # 경기 가능일 / 종목 / 동호회를 찾지 못한 경우
    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    # owner / manager 권한이 없는 경우
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    # 날짜 / 시간 / 입력값 오류
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    # 그 외 DB / 서버 내부 오류
    except Exception as error:

        print(
            "경기 가능일 수정 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "경기 가능일 수정 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 경기 가능일 삭제
#
# DELETE /api/matches/availabilities/{availability_id}
#
# 신청이 없으면 바로 삭제
#
# 신청이 있으면:
# confirm=false
# → 409 + 신청 건수 반환
#
# confirm=true
# → 연결된 신청 삭제 후 경기 가능일 삭제
# =========================================================

@router.delete(
    "/availabilities/{availability_id}",
    response_model=MatchAvailabilityDeleteResponse,
)
def delete_match_availability(
    availability_id: int,
    confirm: bool = False,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.delete_availability(
            availability_id=availability_id,
            user_id=user_id,
            confirm=confirm,
        )

    # -----------------------------------------------------
    # 매칭 신청이 존재해서
    # 사용자 재확인이 필요한 경우
    # -----------------------------------------------------
    except MatchDeleteConfirmationRequired as error:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": str(error),
                "request_count": error.request_count,
                "requires_confirmation": True,
            },
        ) from error

    # -----------------------------------------------------
    # 경기 가능일 / 동호회를 찾지 못한 경우
    # -----------------------------------------------------
    except LookupError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    # -----------------------------------------------------
    # owner / manager가 아닌 경우
    # -----------------------------------------------------
    except PermissionError as error:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    # -----------------------------------------------------
    # 기타 잘못된 요청
    # -----------------------------------------------------
    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    # -----------------------------------------------------
    # DB / 서버 내부 오류
    # -----------------------------------------------------
    except Exception as error:

        print(
            "경기 가능일 삭제 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "경기 가능일 삭제 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 상대팀 경기 가능일 목록 조회
#
# GET /api/matches/availabilities
#
# 선택 필터:
# - match_date
# - sport_id
# - region
# =========================================================

@router.get(
    "/availabilities",
    response_model=MatchAvailabilityListResponse,
)
def get_available_matches(
    match_date: date | None = Query(
        default=None,
    ),

    sport_id: int | None = Query(
        default=None,
        gt=0,
    ),

    region: str | None = Query(
        default=None,
        max_length=30,
    ),

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.get_available_matches(
            user_id=user_id,
            match_date=match_date,
            sport_id=sport_id,
            region=region,
        )

    # 지난 날짜 등 잘못된 검색 조건
    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    # DB / 서버 내부 오류
    except Exception as error:

        print(
            "상대팀 경기 가능일 목록 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "경기 가능일 목록 조회 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 경기 가능일 상세 조회
#
# GET /api/matches/availabilities/{availability_id}
#
# 경기 상세 정보
# +
# 현재 사용자의 매칭 신청 상태 반환
# =========================================================

@router.get(
    "/availabilities/{availability_id}",
    response_model=MatchAvailabilityDetailResponse,
)
def get_match_availability_detail(
    availability_id: int,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.get_availability_detail(
            availability_id=availability_id,
            user_id=user_id,
        )

    except LookupError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except Exception as error:

        print(
            "경기 가능일 상세 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "경기 가능일 상세 조회 중 오류가 발생했습니다."
            ),
        ) from error
    


# ---------------------------------------------------------
# 경기 가능일 등록
#
# POST /api/matches/availabilities
#
# 현재 로그인 사용자가 owner / manager인 동호회로
# 경기 가능 조건을 등록한다.
# ---------------------------------------------------------
@router.post(
    "/availabilities",
    response_model=MatchAvailabilityCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_match_availability(
    request_data: MatchAvailabilityCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):
    match_service = MatchService()

    try:
        return match_service.create_availability(
            user_id=user_id,
            request_data=request_data,
        )

    # 동호회 / 종목이 존재하지 않는 경우
    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    # 동호회 owner / manager가 아닌 경우
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    # 과거 날짜 등 잘못된 입력
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    # 그 외 서버 내부 오류
    except Exception as error:

        print(
            "경기 가능일 등록 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "경기 가능일 등록 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 매칭 신청 가능한 내 동호회 목록 조회
#
# GET /api/matches/requestable-clubs
#
# availability_id를 기준으로
# 상대팀을 제외한 내가 관리 가능한 동호회 목록 반환
# =========================================================

@router.get(
    "/requestable-clubs",
    response_model=MatchRequestableClubsResponse,
)
def get_requestable_clubs(
    availability_id: int = Query(
        ...,
        gt=0,
    ),

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.get_requestable_clubs(
            user_id=user_id,
            availability_id=availability_id,
        )

    except LookupError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except Exception as error:

        print(
            "매칭 신청 가능 동호회 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "매칭 신청 가능한 동호회 조회 중 오류가 발생했습니다."
            ),
        ) from error


# =========================================================
# 매칭 신청 생성
#
# POST /api/matches/requests
#
# Frontend:
# {
#     "availability_id": 101,
#     "requester_club_id": 2
# }
# =========================================================

@router.post(
    "/requests",
    response_model=MatchRequestCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_match_request(
    request_data: MatchRequestCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):

    match_service = MatchService()

    try:
        return match_service.create_match_request(
            user_id=user_id,
            request_data=request_data,
        )

    # 경기 가능일 / 동호회를 찾지 못한 경우
    except LookupError as error:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    # 신청 동호회의 owner / manager가 아닌 경우
    except PermissionError as error:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    # 중복 신청 / 자기 팀 신청 / 지난 경기 등
    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    # DB / 서버 내부 오류
    except Exception as error:

        print(
            "매칭 신청 생성 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "매칭 신청 중 오류가 발생했습니다."
            ),
        ) from error