from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.security import get_current_user_id
from app.schemas.users import ProfileImageUpdateRequest
from app.services.user_service import UserService


# ---------------------------------------------------------
# 사용자 관련 API Router
# ---------------------------------------------------------
router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)

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