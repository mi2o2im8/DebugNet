from app.core.supabase import (
    get_supabase_admin_client,
)


class EventReviewRepository:

    def __init__(self):
        self.admin_client = (
            get_supabase_admin_client()
        )

    # -----------------------------------------------------
    # 특정 일정에 사용자가 작성한 후기 조회
    # -----------------------------------------------------
    def find_user_event_review(
        self,
        event_id: int,
        user_id: str,
    ) -> dict | None:
        response = (
            self.admin_client
            .table("event_reviews")
            .select("*")
            .eq("event_id", event_id)
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    # -----------------------------------------------------
    # 특정 일정의 후기 목록 조회
    # -----------------------------------------------------
    def find_event_reviews(
            self,
            event_id: int,
        ) -> list[dict]:
            response = (
                self.admin_client
                .table("event_reviews")
                .select(
                    """
                    *,
                    users!event_reviews_user_id_fkey(
                        nickname
                    )
                    """
                )
                .eq("event_id", event_id)
                .order(
                    "created_at",
                    desc=True,
                )
                .execute()
            )

            reviews = response.data or []

            print(
                "후기 조회 원본 데이터:",
                reviews,
            )

            for review in reviews:
                user_data = review.pop(
                    "users",
                    None,
                )

                review["nickname"] = (
                    user_data.get("nickname")
                    if user_data
                    else None
                )

            return reviews

    # -----------------------------------------------------
    # 동호회 활동 후기 작성
    # -----------------------------------------------------
    def create_event_review(
        self,
        event_id: int,
        user_id: str,
        rating: int,
        review_text: str,
    ) -> dict:
        review_data = {
            "event_id": event_id,
            "user_id": user_id,
            "rating": rating,
            "review_text": review_text,
        }

        response = (
            self.admin_client
            .table("event_reviews")
            .insert(review_data)
            .execute()
        )

        if not response.data:
            raise ValueError(
                "동호회 활동 후기 작성에 실패했습니다."
            )

        return response.data[0]