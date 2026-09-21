from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.security import (
    get_current_user_id,
)
from app.schemas.club_events import (
    ClubEventCreateRequest,
    ClubEventCreateResponse,
    ClubEventListResponse,
)
from app.services.club_event_service import (
    ClubEventService,
)


router = APIRouter(
    prefix="/api/clubs/{club_id}/events",
    tags=["Club Events"],
)


# ---------------------------------------------------------
# 일정 생성
#
# POST /api/clubs/{club_id}/events
# ---------------------------------------------------------
@router.post(
    "",
    response_model=ClubEventCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_club_event(
    club_id: int,
    request_data: ClubEventCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.create_event(
            club_id=club_id,
            user_id=user_id,
            request_data=request_data,
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
                "일정 생성 중 오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 일정 목록 조회
#
# GET /api/clubs/{club_id}/events
# ---------------------------------------------------------
@router.get(
    "",
    response_model=ClubEventListResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_events(
    club_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.get_events(
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
        print(
            "일정 목록 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 목록 조회 중 오류가 발생했습니다."
            ),
        ) from error