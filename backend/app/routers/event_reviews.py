from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.security import (
    get_current_user_id,
)

from app.schemas.event_reviews import (
    EventReviewCreateRequest,
    EventReviewResponse,
)

from app.services.event_review_service import (
    EventReviewService,
)


# ---------------------------------------------------------
# 동호회 활동 후기 Router
# ---------------------------------------------------------

router = APIRouter(
    prefix="/api/clubs/{club_id}/events/{event_id}/reviews",
    tags=["Event Reviews"],
)


# ---------------------------------------------------------
# 동호회 활동 후기 작성
#
# POST /api/clubs/{club_id}/events/{event_id}/reviews
# ---------------------------------------------------------
@router.post(
    "",
    response_model=EventReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_event_review(
    club_id: int,
    event_id: int,
    request_data: EventReviewCreateRequest,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    review_service = EventReviewService()

    try:
        return review_service.create_review(
            club_id=club_id,
            event_id=event_id,
            user_id=user_id,
            rating=request_data.rating,
            review_text=request_data.review_text,
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


# ---------------------------------------------------------
# 내가 작성한 활동 후기 조회
#
# GET /api/clubs/{club_id}/events/{event_id}/reviews/me
# ---------------------------------------------------------
@router.get(
    "/me",
    response_model=EventReviewResponse | None,
)
def get_my_event_review(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    review_service = EventReviewService()

    try:
        return review_service.get_my_review(
            event_id=event_id,
            user_id=user_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


# ---------------------------------------------------------
# 특정 활동의 후기 목록 조회
#
# GET /api/clubs/{club_id}/events/{event_id}/reviews
# ---------------------------------------------------------
@router.get(
    "",
    response_model=list[EventReviewResponse],
)
def get_event_reviews(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    review_service = EventReviewService()

    try:
        return review_service.get_event_reviews(
            event_id=event_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error