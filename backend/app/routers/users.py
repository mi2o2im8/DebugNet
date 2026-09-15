from fastapi import APIRouter, Depends

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