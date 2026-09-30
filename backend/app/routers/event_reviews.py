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

from app.services.club_event_service import (
    ClubEventService,
)


# ---------------------------------------------------------
# 동호회 활동 후기 Router
# ---------------------------------------------------------

router = APIRouter(
    prefix="/api/clubs/{club_id}/events",
    tags=["Event Reviews"],
)


# ---------------------------------------------------------
# 동호회 활동 후기 작성
#
# POST /api/clubs/{club_id}/events/{event_id}/reviews
# ---------------------------------------------------------
@router.post(
    "/{event_id}/reviews",
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


# -----------------------------------------------------
# 동호회의 전체 활동 후기 조회
#
# GET /api/clubs/{club_id}/events/reviews
# -----------------------------------------------------
@router.get(
    "/reviews",
    response_model=list[EventReviewResponse],
    status_code=status.HTTP_200_OK,
)
def get_club_reviews(
    club_id: int,
):
    event_service = ClubEventService()

    try:
        return event_service.get_club_reviews(
            club_id=club_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "동호회 후기 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "동호회 후기 조회 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 활동 종료 후 리뷰 안내 여부 조회
#
# GET /api/clubs/{club_id}/events/{event_id}/review-prompt
# ---------------------------------------------------------
@router.get(
    "/{event_id}/review-prompt",
)
def get_review_prompt(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    review_service = EventReviewService()

    try:
        return review_service.get_review_prompt(
            club_id=club_id,
            event_id=event_id,
            user_id=user_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error


# ---------------------------------------------------------
# 내가 작성한 활동 후기 조회
#
# GET /api/clubs/{club_id}/events/{event_id}/reviews/me
# ---------------------------------------------------------
@router.get(
    "/{event_id}/reviews/me",
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
    "/{event_id}/reviews",
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