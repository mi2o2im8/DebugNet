from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.security import get_current_user_id
from app.schemas.my_events import MyEventListResponse
from app.services.my_event_service import MyEventService
from app.schemas.users import (
    MyProfileResponse,
    MyProfileUpdateRequest,
    ProfileImageUpdateRequest,
)
from app.services.user_service import (
    NicknameAlreadyExistsError,
    UserService,
)


# ---------------------------------------------------------
# 사용자 관련 API Router
# ---------------------------------------------------------
router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)

# ---------------------------------------------------------
# 내 정보 조회 (마이페이지 / 내 정보 수정 페이지 공용)
#
# GET /api/users/me
# ---------------------------------------------------------
@router.get(
    "/me",
    response_model=MyProfileResponse,
)
def get_my_profile(
    user_id: str = Depends(get_current_user_id),
):
    user_service = UserService()

    try:
        return user_service.get_my_profile(
            user_id=user_id
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "내 정보를 조회하는 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 내 동호회 전체 일정 (월별)
#
# GET /api/users/me/events?year=2026&month=9
# year / month 를 안 보내면 이번 달
# ---------------------------------------------------------
@router.get(
    "/me/events",
    response_model=MyEventListResponse,
)
def get_my_events(
    year: int | None = Query(
        default=None,
        ge=2000,
        le=2100,
    ),
    month: int | None = Query(
        default=None,
        ge=1,
        le=12,
    ),
    user_id: str = Depends(get_current_user_id),
):
    today = date.today()

    my_event_service = MyEventService()

    try:
        return my_event_service.get_my_events(
            user_id=user_id,
            year=year or today.year,
            month=month or today.month,
        )

    except Exception as error:
        print(
            "내 동호회 일정 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "내 동호회 일정을 조회하는 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 내 정보 수정
#
# PATCH /api/users/me
# ---------------------------------------------------------
@router.patch(
    "/me",
    response_model=MyProfileResponse,
)
def update_my_profile(
    request_data: MyProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    user_service = UserService()

    try:
        return user_service.update_my_profile(
            user_id=user_id,
            update_data=request_data,
        )

    except NicknameAlreadyExistsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "내 정보를 수정하는 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 로그인 사용자의 성별 조회
#
# GET /api/users/me/gender
# ---------------------------------------------------------
@router.get("/me/gender")
def get_my_gender(
    user_id: str = Depends(get_current_user_id),
):
    user_service = UserService()

    try:
        return user_service.get_my_gender(
            user_id=user_id
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "사용자 성별을 조회하는 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 프로필 이미지 수정
#
# PATCH /api/users/me/profile-image
# ---------------------------------------------------------
@router.patch("/me/profile-image")
def update_profile_image(
    request_data: ProfileImageUpdateRequest,

    # Frontend가 보낸 Bearer Token을 검증해서
    # 실제 로그인 사용자의 UUID를 가져온다.
    user_id: str = Depends(get_current_user_id),
):

    user_service = UserService()

    return user_service.update_profile_image(
        user_id=user_id,
        profile_image=request_data.profile_image,
    )