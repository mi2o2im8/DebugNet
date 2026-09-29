from datetime import datetime

from pydantic import BaseModel, Field


# -----------------------------------------------------
# 동호회 활동 후기 작성 요청
# -----------------------------------------------------
class EventReviewCreateRequest(BaseModel):
    rating: int = Field(
        ge=1,
        le=5,
    )

    review_text: str = Field(
        min_length=1,
        max_length=1000,
    )


# -----------------------------------------------------
# 동호회 활동 후기 응답
# -----------------------------------------------------
class EventReviewResponse(BaseModel):
    review_id: int
    event_id: int
    user_id: str

    rating: int | None = None
    review_text: str | None = None

    created_at: datetime | None = None