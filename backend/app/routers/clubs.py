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
    ClubDashboardResponse,
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
    
# ---------------------------------------------------------
# 운영진 동호회 허브 조회
#
# GET /api/clubs/{club_id}/dashboard
# ---------------------------------------------------------
@router.get(
    "/{club_id}/dashboard",
    response_model=ClubDashboardResponse,
)
def get_club_dashboard(
    club_id: int,

    user_id: str = Depends(
        get_current_user_id
    ),
):
    club_service = ClubService()

    try:
        return club_service.get_dashboard(
            club_id=club_id,
            user_id=user_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "동호회 허브를 불러오는 중 "
                "오류가 발생했습니다."
            ),
        ) from error