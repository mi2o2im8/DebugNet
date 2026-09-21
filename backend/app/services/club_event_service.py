from uuid import uuid4

from app.repositories.club_event_repository import (
    ClubEventRepository,
)
from app.repositories.club_repository import (
    ClubRepository,
)
from app.schemas.club_events import (
    ClubEventCreateRequest,
    ClubEventCreateResponse,
    ClubEventListItemResponse,
    ClubEventListResponse,
)


class ClubEventService:

    def __init__(self):
        self.club_repository = ClubRepository()

        self.event_repository = (
            ClubEventRepository()
        )

    # -----------------------------------------------------
    # 동호회 및 운영 권한 확인
    # -----------------------------------------------------
    def validate_management_permission(
        self,
        club_id: int,
        user_id: str,
    ) -> None:
        club = self.club_repository.find_club_by_id(
            club_id
        )

        if club is None:
            raise LookupError(
                "존재하지 않거나 비활성화된 동호회입니다."
            )

        membership = (
            self.club_repository
            .find_active_membership(
                club_id=club_id,
                user_id=user_id,
            )
        )

        if membership is None:
            raise PermissionError(
                "이 동호회의 운영 권한이 없습니다."
            )

        if membership["role"] not in {
            "owner",
            "manager",
        }:
            raise PermissionError(
                "동호회장 또는 운영진만 "
                "일정을 관리할 수 있습니다."
            )

    # -----------------------------------------------------
    # 일정 기본 정보 저장
    # -----------------------------------------------------
    def create_base_event(
        self,
        club_id: int,
        request_data: ClubEventCreateRequest,
    ) -> int:
        recurrence_group_id = None

        if request_data.recurrence_type != "none":
            recurrence_group_id = str(uuid4())

        event = self.event_repository.create_event(
            {
                "club_id": club_id,
                "title": request_data.title,
                "description": (
                    request_data.description
                ),
                "event_date": (
                    request_data.event_date.isoformat()
                ),
                "start_time": (
                    request_data.start_time.isoformat()
                ),
                "end_time": (
                    request_data.end_time.isoformat()
                    if request_data.end_time
                    else None
                ),
                "location": request_data.location,
                "max_participants": (
                    request_data.max_participants
                ),
                "event_type": (
                    request_data.event_type
                ),
                "status": "open",
                "event_image_url": (
                    request_data.event_image_url
                ),
                "recurrence_group_id": (
                    recurrence_group_id
                ),
                "recurrence_type": (
                    request_data.recurrence_type
                ),
                "participation_method": (
                    request_data
                    .participation_method
                ),
                "guest_allowed": (
                    request_data.guest_allowed
                ),
                "max_guests": (
                    request_data.max_guests
                ),
                "registration_deadline": (
                    request_data
                    .registration_deadline
                    .isoformat()
                    if request_data.registration_deadline
                    else None
                ),
            }
        )

        return int(event["event_id"])

    # -----------------------------------------------------
    # 참석 여부 투표 및 선택 항목 저장
    # -----------------------------------------------------
    def create_attendance_vote(
        self,
        event_id: int,
        request_data: ClubEventCreateRequest,
    ) -> None:
        deadline = None

        if request_data.registration_deadline:
            deadline = (
                request_data
                .registration_deadline
                .isoformat()
            )

        vote = (
            self.event_repository
            .create_attendance_vote(
                event_id=event_id,
                deadline=deadline,
            )
        )

        vote_id = int(vote["vote_id"])

        option_rows = [
            {
                "vote_id": vote_id,
                "option_text": option,
                "display_order": index,
            }
            for index, option in enumerate(
                request_data.vote_options,
                start=1,
            )
        ]

        self.event_repository.create_vote_options(
            option_rows
        )

    # -----------------------------------------------------
    # 일정 전체 생성
    # -----------------------------------------------------
    def create_event(
        self,
        club_id: int,
        user_id: str,
        request_data: ClubEventCreateRequest,
    ) -> ClubEventCreateResponse:
        event_id = None

        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        try:
            event_id = self.create_base_event(
                club_id=club_id,
                request_data=request_data,
            )

            self.create_attendance_vote(
                event_id=event_id,
                request_data=request_data,
            )

        except Exception:
            if event_id is not None:
                try:
                    self.event_repository.delete_event(
                        club_id=club_id,
                        event_id=event_id,
                    )
                except Exception:
                    pass

            raise

        return ClubEventCreateResponse(
            event_id=event_id,
            club_id=club_id,
            message="일정이 생성되었습니다.",
        )

    # -----------------------------------------------------
    # 동호회 일정 목록 조회
    # -----------------------------------------------------
    def get_events(
        self,
        club_id: int,
        user_id: str,
    ) -> ClubEventListResponse:
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        event_rows = (
            self.event_repository
            .find_events_by_club(club_id)
        )

        events = [
            ClubEventListItemResponse(**event_row)
            for event_row in event_rows
        ]

        return ClubEventListResponse(
            events=events,
            total=len(events),
        )