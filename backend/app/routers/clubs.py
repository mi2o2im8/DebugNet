from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.security import (
    get_current_user_id,
)
from app.schemas.clubs import (
    ClubCreateRequest,
    ClubCreateResponse,
)
from app.services.club_service import (
    ClubService,
)


router = APIRouter(
    prefix="/api/clubs",
    tags=["Clubs"],
)


# ---------------------------------------------------------
# 동호회 생성
#
# POST /api/clubs
# ---------------------------------------------------------
@router.post(
    "",
    response_model=ClubCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_club(
    request_data: ClubCreateRequest,

    # Authorization의 Supabase Access Token 검증
    owner_id: str = Depends(
        get_current_user_id
    ),
):
    club_service = ClubService()

    try:
        return club_service.create_club(
            owner_id=owner_id,
            request_data=request_data,
        )

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
                "동호회 생성 중 오류가 발생했습니다."
            ),
        ) from error