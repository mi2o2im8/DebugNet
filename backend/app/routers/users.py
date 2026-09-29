from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.security import get_current_user_id
from app.schemas.my_events import (MyActivityResponse, MyEventListResponse,)
from app.schemas.my_events import MyGuestEventListResponse
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
# 내 게스트 일정
#
# GET /api/users/me/guest-events
# GET /api/users/me/guest-events?from_date=2026-09-28&to_date=2026-10-04
#
# 다른 동호회 일정에 게스트로 신청(승인 대기) / 참여(확정)한 일정
# 기간을 안 보내면 전체
# ---------------------------------------------------------
@router.get(
    "/me/guest-events",
    response_model=MyGuestEventListResponse,
)
def get_my_guest_events(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
):
    if from_date and to_date and from_date > to_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="조회 시작일은 종료일보다 늦을 수 없습니다.",
        )

    my_event_service = MyEventService()

    try:
        return my_event_service.get_my_guest_events(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
        )

    except Exception as error:
        print("내 게스트 일정 조회 실제 오류:", repr(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="게스트 일정을 조회하는 중 오류가 발생했습니다.",
        ) from error


# ---------------------------------------------------------
# 내 활동 (가입 후 지난 일정 전체)
#
# GET /api/users/me/activity
# ---------------------------------------------------------
@router.get(
    "/me/activity",
    response_model=MyActivityResponse,
)
def get_my_activity(
    user_id: str = Depends(get_current_user_id),
):
    my_event_service = MyEventService()

    try:
        return my_event_service.get_my_activity(
            user_id=user_id,
        )

    except Exception as error:
        print("내 활동 조회 실제 오류:", repr(error))

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="내 활동을 조회하는 중 오류가 발생했습니다.",
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
