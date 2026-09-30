from datetime import datetime, time
from zoneinfo import ZoneInfo

from app.repositories.club_event_repository import (
    ClubEventRepository,
)
from app.repositories.event_review_repository import (
    EventReviewRepository,
)


KST = ZoneInfo("Asia/Seoul")


class EventReviewService:

    def __init__(self):
        self.event_repository = (
            ClubEventRepository()
        )

        self.review_repository = (
            EventReviewRepository()
        )

    # -----------------------------------------------------
    # 활동 종료 여부 확인
    # -----------------------------------------------------
    def is_event_finished(
        self,
        event: dict,
    ) -> bool:
        event_date = event.get("event_date")
        end_time = event.get("end_time")

        if event_date is None or end_time is None:
            return False

        if isinstance(event_date, str):
            event_date = datetime.strptime(
                event_date,
                "%Y-%m-%d",
            ).date()

        if isinstance(end_time, str):
            end_time = time.fromisoformat(
                end_time,
            )

        event_end = datetime.combine(
            event_date,
            end_time,
        ).replace(
            tzinfo=KST,
        )

        return datetime.now(KST) >= event_end

    # -----------------------------------------------------
    # 현재 사용자의 참석 상태 확인
    # -----------------------------------------------------
    def get_user_attendance_status(
        self,
        event_id: int,
        user_id: str,
    ) -> str:
        vote_rows = (
            self.event_repository
            .find_attendance_votes_by_event_ids(
                [event_id]
            )
        )

        if not vote_rows:
            return "undecided"

        latest_vote_id = max(
            int(vote_row["vote_id"])
            for vote_row in vote_rows
        )

        option_rows = (
            self.event_repository
            .find_vote_options_by_vote_ids(
                [latest_vote_id]
            )
        )

        response_rows = (
            self.event_repository
            .find_vote_responses_by_vote_ids(
                [latest_vote_id]
            )
        )

        status_by_option_text = {
            "참석": "attending",
            "불참": "absent",
            "미정": "undecided",
            "attending": "attending",
            "absent": "absent",
            "undecided": "undecided",
        }

        status_by_option_id = {}

        for option_row in option_rows:
            option_text = str(
                option_row["option_text"]
            ).strip()

            attendance_status = (
                status_by_option_text.get(
                    option_text
                )
            )

            if attendance_status is not None:
                status_by_option_id[
                    int(option_row["option_id"])
                ] = attendance_status

        user_status = "undecided"

        for response_row in response_rows:
            if str(
                response_row["user_id"]
            ) != str(user_id):
                continue

            option_id = int(
                response_row["option_id"]
            )

            attendance_status = (
                status_by_option_id.get(
                    option_id
                )
            )

            if attendance_status is not None:
                user_status = attendance_status

        return user_status

    # -----------------------------------------------------
    # 후기 작성
    # -----------------------------------------------------
    def create_review(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
        rating: int,
        review_text: str,
    ) -> dict:

        # 1. 일정 조회
        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if event is None:
            raise LookupError(
                "존재하지 않는 일정입니다."
            )

        # 2. 취소된 일정 확인
        if event.get("status") == "cancelled":
            raise ValueError(
                "취소된 일정에는 후기를 작성할 수 없습니다."
            )

        # 3. 활동 종료 확인
        if not self.is_event_finished(event):
            raise ValueError(
                "아직 종료되지 않은 활동입니다."
            )

        # 4. 참석 여부 확인
        #    - 멤버: 참석 투표에서 "참석"
        #    - 게스트: 게스트 신청이 참여 확정(joined)
        attendance_status = (
            self.get_user_attendance_status(
                event_id=event_id,
                user_id=user_id,
            )
        )

        is_attending_member = (
            attendance_status == "attending"
        )

        is_joined_guest = (
            not is_attending_member
            and self.review_repository.is_joined_guest(
                event_id=event_id,
                user_id=user_id,
            )
        )

        if not (is_attending_member or is_joined_guest):
            raise PermissionError(
                "활동에 참석한 이용자만 후기를 작성할 수 있습니다."
            )

        # 5. 기존 후기 확인
        existing_review = (
            self.review_repository
            .find_user_event_review(
                event_id=event_id,
                user_id=user_id,
            )
        )

        if existing_review is not None:
            raise ValueError(
                "이미 해당 활동에 대한 후기를 작성했습니다."
            )

        # 6. 후기 저장
        return (
            self.review_repository
            .create_event_review(
                event_id=event_id,
                user_id=user_id,
                rating=rating,
                review_text=review_text,
            )
        )

    # -----------------------------------------------------
    # 리뷰 안내 대상 확인
    #
    # 활동 종료 후 최초 접속 시 한 번만 안내
    # -----------------------------------------------------
    def get_review_prompt(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> dict | None:

        # 1. 일정 조회
        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if event is None:
            return None

        # 2. 취소된 일정은 제외
        if event.get("status") == "cancelled":
            return None

        # 3. 아직 활동이 끝나지 않았으면 제외
        if not self.is_event_finished(event):
            return None

        # 4. 이미 리뷰 안내를 보여줬다면 제외
        existing_prompt = (
            self.review_repository
            .find_review_prompt(
                event_id=event_id,
                user_id=user_id,
            )
        )

        if existing_prompt is not None:
            return None

        # 5. 참석 여부 확인
        attendance_status = (
            self.get_user_attendance_status(
                event_id=event_id,
                user_id=user_id,
            )
        )

        is_attending_member = (
            attendance_status == "attending"
        )

        is_joined_guest = (
            not is_attending_member
            and self.review_repository.is_joined_guest(
                event_id=event_id,
                user_id=user_id,
            )
        )

        # 참석하지 않은 이용자는 제외
        if not (
            is_attending_member
            or is_joined_guest
        ):
            return None

        # 6. 이미 리뷰를 작성했다면 제외
        existing_review = (
            self.review_repository
            .find_user_event_review(
                event_id=event_id,
                user_id=user_id,
            )
        )

        if existing_review is not None:
            return None

        # 7. 안내 표시 기록 생성
        prompt = (
            self.review_repository
            .create_review_prompt(
                event_id=event_id,
                user_id=user_id,
            )
        )

        return {
            "event_id": event_id,
            "club_id": club_id,
            "prompt_id": prompt["prompt_id"],
        }    

    # -----------------------------------------------------
    # 내 후기 조회
    # -----------------------------------------------------
    def get_my_review(
        self,
        event_id: int,
        user_id: str,
    ) -> dict | None:
        return (
            self.review_repository
            .find_user_event_review(
                event_id=event_id,
                user_id=user_id,
            )
        )

    # -----------------------------------------------------
    # 일정 후기 목록 조회
    # -----------------------------------------------------
    def get_event_reviews(
        self,
        event_id: int,
    ) -> list[dict]:
        return (
            self.review_repository
            .find_event_reviews(
                event_id=event_id,
            )
        )
