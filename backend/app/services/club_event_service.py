from uuid import uuid4

from app.repositories.club_event_repository import (
    ClubEventRepository,
)
from app.repositories.club_repository import (
    ClubRepository,
)
from app.schemas.club_events import (
    ClubEventAttendanceRequest,
    ClubEventAttendanceResponse,
    ClubEventCreateRequest,
    ClubEventCreateResponse,
    ClubEventDetailResponse,
    ClubEventListItemResponse,
    ClubEventListResponse,
    ClubEventParticipantItemResponse,
    ClubEventParticipantListResponse,
    ClubEventGuestDecisionRequest,
    ClubEventGuestDecisionResponse,
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
    # 동호회 일정 조회 권한 확인
    # ⭐ 일반 가입 회원도 일정 조회 가능
    # ⭐ 일정 생성/수정/삭제는 기존 운영 권한 유지
    # -----------------------------------------------------
    def validate_view_permission(
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
                "이 동호회의 회원만 일정을 조회할 수 있습니다."
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
                "location_address": (
                    request_data.location_address
                ),
                "latitude": request_data.latitude,
                "longitude": request_data.longitude,

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
    # 일정 단건 조회
    # -----------------------------------------------------
    def get_event(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> ClubEventDetailResponse:
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if (
            event is None
            or event.get("status") == "cancelled"
        ):
            raise LookupError(
                "존재하지 않거나 삭제된 일정입니다."
            )

        attendance_vote = (
            self.event_repository
            .find_attendance_vote(event_id)
        )

        vote_options = []

        if attendance_vote is not None:
            option_rows = (
                self.event_repository
                .find_vote_options(
                    int(attendance_vote["vote_id"])
                )
            )

            vote_options = [
                str(option_row["option_text"])
                for option_row in option_rows
            ]

        return ClubEventDetailResponse(
            **event,
            vote_options=vote_options,
        )

    # -----------------------------------------------------
    # 일정 수정
    # -----------------------------------------------------
    def update_event(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
        request_data: ClubEventCreateRequest,
    ) -> ClubEventCreateResponse:
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        current_event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if (
            current_event is None
            or current_event.get("status")
                == "cancelled"
        ):
            raise LookupError(
                "존재하지 않거나 삭제된 일정입니다."
            )

        participant_rows = (
            self.event_repository
            .find_participant_details(event_id)
        )

        active_guest_rows = [
            participant_row
            for participant_row in participant_rows
            if (
                participant_row.get(
                    "participant_type"
                ) == "guest"
                and participant_row.get("status") in {
                    "pending",
                    "joined",
                }
            )
        ]

        joined_guest_count = sum(
            1
            for participant_row in active_guest_rows
            if participant_row.get("status") == "joined"
        )

        if (
            not request_data.guest_allowed
            and active_guest_rows
        ):
            raise ValueError(
                "대기 또는 승인된 게스트가 있어 "
                "게스트 모집을 해제할 수 없습니다."
            )

        if (
            request_data.guest_allowed
            and request_data.max_guests
                < joined_guest_count
        ):
            raise ValueError(
                "최대 게스트 인원은 현재 승인된 "
                "게스트 수보다 적을 수 없습니다."
            )

        recurrence_group_id = (
            current_event.get(
                "recurrence_group_id"
            )
        )

        if request_data.recurrence_type == "none":
            recurrence_group_id = None

        elif recurrence_group_id is None:
            recurrence_group_id = str(uuid4())

        registration_deadline = (
            request_data
            .registration_deadline
            .isoformat()
            if request_data.registration_deadline
            else None
        )

        self.event_repository.update_event(
            club_id=club_id,
            event_id=event_id,
            event_data={
                "title": request_data.title,
                "description": (
                    request_data.description
                ),
                "event_date": (
                    request_data
                    .event_date
                    .isoformat()
                ),
                "start_time": (
                    request_data
                    .start_time
                    .isoformat()
                ),
                "end_time": (
                    request_data
                    .end_time
                    .isoformat()
                    if request_data.end_time
                    else None
                ),
                "location": request_data.location,
                "location_address": (
                    request_data.location_address
                ),
                "latitude": request_data.latitude,
                "longitude": request_data.longitude,

                "max_participants": (
                    request_data.max_participants
                ),
                "event_type": (
                    request_data.event_type
                ),
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
                    registration_deadline
                ),
            },
        )

        self.event_repository \
            .update_attendance_vote_deadline(
                event_id=event_id,
                deadline=registration_deadline,
            )

        return ClubEventCreateResponse(
            event_id=event_id,
            club_id=club_id,
            message="일정이 수정되었습니다.",
        )

    # -----------------------------------------------------
    # 일정 복사
    # -----------------------------------------------------
    def copy_event(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> ClubEventCreateResponse:
        source_event = self.get_event(
            club_id=club_id,
            event_id=event_id,
            user_id=user_id,
        )

        copy_suffix = " (복사본)"

        copied_title = (
            source_event.title[
                : 50 - len(copy_suffix)
            ]
            + copy_suffix
        )

        request_data = (
            ClubEventCreateRequest.model_validate(
                {
                    "title": copied_title,
                    "event_type": (
                        source_event.event_type
                    ),
                    "description": (
                        source_event.description
                    ),
                    "event_image_url": (
                        source_event.event_image_url
                    ),
                    "event_date": (
                        source_event.event_date
                    ),
                    "start_time": (
                        source_event.start_time
                    ),
                    "end_time": (
                        source_event.end_time
                    ),
                    "recurrence_type": (
                        source_event.recurrence_type
                    ),
                    "location": (
                        source_event.location
                    ),
                    "location_address": (
                        source_event.location_address
                    ),
                    "latitude": (
                        source_event.latitude
                    ),
                    "longitude": (
                        source_event.longitude
                    ),
                    "max_participants": (
                        source_event.max_participants
                    ),
                    "participation_method": (
                        source_event
                        .participation_method
                    ),
                    "guest_allowed": (
                        source_event.guest_allowed
                    ),
                    "max_guests": (
                        source_event.max_guests
                    ),
                    "registration_deadline": (
                        source_event
                        .registration_deadline
                    ),
                    "vote_options": (
                        source_event.vote_options
                        or [
                            "참석",
                            "불참",
                            "미정",
                        ]
                    ),
                }
            )
        )

        copied_event = self.create_event(
            club_id=club_id,
            user_id=user_id,
            request_data=request_data,
        )

        return ClubEventCreateResponse(
            event_id=copied_event.event_id,
            club_id=club_id,
            message="일정이 복사되었습니다.",
        )

    # -----------------------------------------------------
    # 일정 삭제
    #
    # 실제 행은 삭제하지 않고 status만 cancelled로 변경
    # -----------------------------------------------------
    def cancel_event(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> ClubEventCreateResponse:
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if (
            event is None
            or event.get("status") == "cancelled"
        ):
            raise LookupError(
                "존재하지 않거나 이미 삭제된 일정입니다."
            )

        self.event_repository.cancel_event(
            club_id=club_id,
            event_id=event_id,
        )

        return ClubEventCreateResponse(
            event_id=event_id,
            club_id=club_id,
            message="일정이 삭제되었습니다.",
        )

    # -----------------------------------------------------
    # 일정별 참가자 및 참석 현황 집계
    # -----------------------------------------------------
    def build_event_participant_counts(
        self,
        event_rows: list[dict],
    ) -> dict[int, dict[str, int]]:
        event_ids = [
            int(event_row["event_id"])
            for event_row in event_rows
        ]

        counts = {
            event_id: {
                "attending_count": 0,
                "absent_count": 0,
                "undecided_count": 0,
                "guest_count": 0,
                "pending_guest_count": 0,
            }
            for event_id in event_ids
        }

        if not event_ids:
            return counts

        participant_rows = (
            self.event_repository
            .find_participants_by_event_ids(
                event_ids
            )
        )

        joined_member_ids_by_event = {
            event_id: set()
            for event_id in event_ids
        }

        for participant_row in participant_rows:
            event_id = int(
                participant_row["event_id"]
            )

            if event_id not in counts:
                continue

            participant_type = (
                participant_row["participant_type"]
            )

            participant_status = (
                participant_row["status"]
            )

            if participant_type == "guest":
                if participant_status == "joined":
                    counts[event_id][
                        "guest_count"
                    ] += 1

                elif participant_status == "pending":
                    counts[event_id][
                        "pending_guest_count"
                    ] += 1

                continue

            if (
                participant_type == "member"
                and participant_status == "joined"
            ):
                joined_member_ids_by_event[
                    event_id
                ].add(
                    str(participant_row["user_id"])
                )

        # 투표하지 않은 승인 회원은 기본적으로 미정
        for event_id, member_ids in (
            joined_member_ids_by_event.items()
        ):
            counts[event_id][
                "undecided_count"
            ] = len(member_ids)

        vote_rows = (
            self.event_repository
            .find_attendance_votes_by_event_ids(
                event_ids
            )
        )

        # 일정에 참석 투표가 여러 개라면
        # 가장 최근 vote_id를 사용
        vote_id_by_event = {}

        for vote_row in vote_rows:
            event_id = int(vote_row["event_id"])
            vote_id = int(vote_row["vote_id"])

            current_vote_id = (
                vote_id_by_event.get(event_id)
            )

            if (
                current_vote_id is None
                or vote_id > current_vote_id
            ):
                vote_id_by_event[event_id] = (
                    vote_id
                )

        vote_ids = list(
            vote_id_by_event.values()
        )

        if not vote_ids:
            return counts

        option_rows = (
            self.event_repository
            .find_vote_options_by_vote_ids(
                vote_ids
            )
        )

        response_rows = (
            self.event_repository
            .find_vote_responses_by_vote_ids(
                vote_ids
            )
        )

        option_by_id = {
            int(option_row["option_id"]): {
                "vote_id": int(
                    option_row["vote_id"]
                ),
                "option_text": str(
                    option_row["option_text"]
                ).strip(),
            }
            for option_row in option_rows
        }

        event_id_by_vote = {
            vote_id: event_id
            for event_id, vote_id
            in vote_id_by_event.items()
        }

        # 단일 선택 투표에 응답이 여러 개 있다면
        # response_id가 가장 큰 최신 응답만 사용
        latest_response_by_user = {}

        for response_row in response_rows:
            vote_id = int(
                response_row["vote_id"]
            )

            if vote_id not in event_id_by_vote:
                continue

            user_id = str(
                response_row["user_id"]
            )

            response_key = (
                vote_id,
                user_id,
            )

            current_response = (
                latest_response_by_user.get(
                    response_key
                )
            )

            if (
                current_response is None
                or int(
                    response_row["response_id"]
                ) > int(
                    current_response["response_id"]
                )
            ):
                latest_response_by_user[
                    response_key
                ] = response_row

        for (
            vote_id,
            user_id,
        ), response_row in (
            latest_response_by_user.items()
        ):
            event_id = event_id_by_vote[
                vote_id
            ]

            if (
                user_id
                not in joined_member_ids_by_event[
                    event_id
                ]
            ):
                continue

            option_id = int(
                response_row["option_id"]
            )

            option = option_by_id.get(
                option_id
            )

            if (
                option is None
                or option["vote_id"] != vote_id
            ):
                continue

            option_text = option[
                "option_text"
            ]

            if option_text in {
                "참석",
                "attending",
            }:
                counts[event_id][
                    "attending_count"
                ] += 1

                counts[event_id][
                    "undecided_count"
                ] -= 1

            elif option_text in {
                "불참",
                "absent",
            }:
                counts[event_id][
                    "absent_count"
                ] += 1

                counts[event_id][
                    "undecided_count"
                ] -= 1

            # 미정 또는 응답 없음은
            # 기존 undecided_count를 그대로 유지

        return counts

    # -----------------------------------------------------
    # 일정별 사용자 참석 상태 구성
    # -----------------------------------------------------
    def build_attendance_status_by_user(
        self,
        event_id: int,
    ) -> dict[str, str]:
        vote_rows = (
            self.event_repository
            .find_attendance_votes_by_event_ids(
                [event_id]
            )
        )

        if not vote_rows:
            return {}

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

        attendance_status_by_user = {}

        # response_id 오름차순이므로 같은 사용자의
        # 응답이 여러 개라면 마지막 응답이 최종값이 됨
        for response_row in response_rows:
            option_id = int(
                response_row["option_id"]
            )

            attendance_status = (
                status_by_option_id.get(
                    option_id
                )
            )

            if attendance_status is None:
                continue

            attendance_status_by_user[
                str(response_row["user_id"])
            ] = attendance_status

        return attendance_status_by_user

    # -----------------------------------------------------
    # 일정 참석 응답 권한 확인
    #
    # 반환값
    # - 기존 참가자: 참가 정보
    # - 활동 회원이지만 아직 참가 정보 없음: None
    # -----------------------------------------------------
    def validate_attendance_access(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> dict | None:
        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if (
            event is None
            or event.get("status") == "cancelled"
        ):
            raise LookupError(
                "존재하지 않거나 종료된 일정입니다."
            )

        participant = (
            self.event_repository
            .find_user_event_participant(
                event_id=event_id,
                user_id=user_id,
            )
        )

        if participant is not None:
            if participant["status"] != "joined":
                raise PermissionError(
                    "승인된 참가자만 "
                    "참석 여부를 선택할 수 있습니다."
                )

            return participant

        membership = (
            self.club_repository
            .find_active_membership(
                club_id=club_id,
                user_id=user_id,
            )
        )

        if membership is None:
            raise PermissionError(
                "동호회 회원 또는 승인된 게스트만 "
                "참석 여부를 선택할 수 있습니다."
            )

        return None

    # -----------------------------------------------------
    # 참석 투표와 선택 항목 조회
    # -----------------------------------------------------
    def get_attendance_vote_data(
        self,
        event_id: int,
    ) -> tuple[dict, list[dict]]:
        vote = (
            self.event_repository
            .find_attendance_vote(event_id)
        )

        if vote is None:
            raise LookupError(
                "이 일정에는 참석 투표가 없습니다."
            )

        option_rows = (
            self.event_repository
            .find_vote_options(
                int(vote["vote_id"])
            )
        )

        if not option_rows:
            raise LookupError(
                "참석 투표 선택 항목이 없습니다."
            )

        return vote, option_rows

    # -----------------------------------------------------
    # 내 현재 참석 응답 조회
    # -----------------------------------------------------
    def get_my_attendance(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> ClubEventAttendanceResponse:
        self.validate_attendance_access(
            club_id=club_id,
            event_id=event_id,
            user_id=user_id,
        )

        self.get_attendance_vote_data(
            event_id
        )

        attendance_by_user = (
            self.build_attendance_status_by_user(
                event_id
            )
        )

        attendance_status = (
            attendance_by_user.get(
                str(user_id),
                "undecided",
            )
        )

        return ClubEventAttendanceResponse(
            event_id=event_id,
            attendance_status=attendance_status,
            message="현재 참석 응답입니다.",
        )

    # -----------------------------------------------------
    # 내 참석 응답 저장 또는 변경
    # -----------------------------------------------------
    def update_my_attendance(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
        request_data: ClubEventAttendanceRequest,
    ) -> ClubEventAttendanceResponse:
        participant = (
            self.validate_attendance_access(
                club_id=club_id,
                event_id=event_id,
                user_id=user_id,
            )
        )

        vote, option_rows = (
            self.get_attendance_vote_data(
                event_id
            )
        )

        option_texts_by_status = {
            "attending": {
                "참석",
                "attending",
            },
            "absent": {
                "불참",
                "absent",
            },
            "undecided": {
                "미정",
                "undecided",
            },
        }

        accepted_option_texts = (
            option_texts_by_status[
                request_data.attendance_status
            ]
        )

        selected_option = None

        for option_row in option_rows:
            option_text = str(
                option_row["option_text"]
            ).strip()

            if option_text in accepted_option_texts:
                selected_option = option_row
                break

        if selected_option is None:
            raise ValueError(
                "선택한 참석 상태에 해당하는 "
                "투표 항목이 없습니다."
            )

        # 기존 참가 정보가 없는 동호회 회원은
        # 첫 응답 시 member + joined로 등록
        if participant is None:
            self.event_repository \
                .create_member_event_participant(
                    event_id=event_id,
                    user_id=user_id,
                )

        self.event_repository.replace_vote_response(
            vote_id=int(vote["vote_id"]),
            option_id=int(
                selected_option["option_id"]
            ),
            user_id=user_id,
        )

        status_messages = {
            "attending": "참석으로 응답했습니다.",
            "absent": "불참으로 응답했습니다.",
            "undecided": "미정으로 응답했습니다.",
        }

        return ClubEventAttendanceResponse(
            event_id=event_id,
            attendance_status=(
                request_data.attendance_status
            ),
            message=status_messages[
                request_data.attendance_status
            ],
        )

    # -----------------------------------------------------
    # 일정 참가자 관리 목록 조회
    # -----------------------------------------------------
    def get_event_participants(
        self,
        club_id: int,
        event_id: int,
        user_id: str,
    ) -> ClubEventParticipantListResponse:
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if (
            event is None
            or event.get("status") == "cancelled"
        ):
            raise LookupError(
                "존재하지 않는 일정입니다."
            )

        participant_rows = (
            self.event_repository
            .find_participant_details(
                event_id
            )
        )

        attendance_by_user = (
            self.build_attendance_status_by_user(
                event_id
            )
        )

        participants = []
        joined_member_count = 0
        joined_guest_count = 0
        pending_guest_count = 0

        for participant_row in participant_rows:
            participant_type = (
                participant_row["participant_type"]
            )

            participation_status = (
                participant_row["status"]
            )

            participant_user_id = str(
                participant_row["user_id"]
            )

            user_data = (
                participant_row.get("user")
                or {}
            )

            attendance_status = None

            if participation_status == "joined":
                attendance_status = (
                    attendance_by_user.get(
                        participant_user_id,
                        "undecided",
                    )
                )

            if (
                participant_type == "member"
                and participation_status == "joined"
            ):
                joined_member_count += 1

            elif (
                participant_type == "guest"
                and participation_status == "joined"
            ):
                joined_guest_count += 1

            elif (
                participant_type == "guest"
                and participation_status == "pending"
            ):
                pending_guest_count += 1

            participants.append(
                ClubEventParticipantItemResponse(
                    event_participant_id=int(
                        participant_row[
                            "event_participant_id"
                        ]
                    ),
                    user_id=participant_user_id,
                    name=user_data.get(
                        "name",
                        "알 수 없는 사용자",
                    ),
                    nickname=user_data.get(
                        "nickname",
                        "알 수 없음",
                    ),
                    profile_image=user_data.get(
                        "profile_image"
                    ),
                    participant_type=(
                        participant_type
                    ),
                    participation_status=(
                        participation_status
                    ),
                    attendance_status=(
                        attendance_status
                    ),
                )
            )

        return ClubEventParticipantListResponse(
            event_id=event_id,
            participants=participants,
            total=len(participants),
            joined_member_count=(
                joined_member_count
            ),
            joined_guest_count=(
                joined_guest_count
            ),
            pending_guest_count=(
                pending_guest_count
            ),
        )

    # -----------------------------------------------------
    # 동호회 일정 목록 조회
    # -----------------------------------------------------
    def get_events(
        self,
        club_id: int,
        user_id: str,
    ) -> ClubEventListResponse:
        self.validate_view_permission(
            club_id=club_id,
            user_id=user_id,
        )

        event_rows = (
            self.event_repository
            .find_events_by_club(club_id)
        )

        participant_counts = (
            self.build_event_participant_counts(
                event_rows
            )
        )

        events = [
            ClubEventListItemResponse(
                **{
                    **event_row,
                    **participant_counts[
                        int(event_row["event_id"])
                    ],
                }
            )
            for event_row in event_rows
        ]

        return ClubEventListResponse(
            events=events,
            total=len(events),
        )

    # -----------------------------------------------------
    # 게스트 신청 승인 또는 거절
    # -----------------------------------------------------
    def decide_guest_application(
        self,
        club_id: int,
        event_id: int,
        event_participant_id: int,
        user_id: str,
        request_data: ClubEventGuestDecisionRequest,
    ) -> ClubEventGuestDecisionResponse:
        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        event = (
            self.event_repository
            .find_event_by_id(
                club_id=club_id,
                event_id=event_id,
            )
        )

        if (
            event is None
            or event.get("status") == "cancelled"
        ):
            raise LookupError(
                "존재하지 않는 일정입니다."
            )

        participant = (
            self.event_repository
            .find_event_participant(
                event_id=event_id,
                event_participant_id=(
                    event_participant_id
                ),
            )
        )

        if participant is None:
            raise LookupError(
                "존재하지 않는 참가 신청입니다."
            )

        if participant["participant_type"] != "guest":
            raise ValueError(
                "게스트 신청만 승인하거나 "
                "거절할 수 있습니다."
            )

        if participant["status"] != "pending":
            raise ValueError(
                "이미 처리된 게스트 신청입니다."
            )

        if request_data.decision == "approve":
            if not event.get("guest_allowed", False):
                raise ValueError(
                    "게스트 모집이 허용되지 않은 "
                    "일정입니다."
                )

            max_guests = int(
                event.get("max_guests") or 0
            )

            joined_guest_count = (
                self.event_repository
                .count_joined_guests(event_id)
            )

            if joined_guest_count >= max_guests:
                raise ValueError(
                    "게스트 모집 정원이 "
                    "마감되었습니다."
                )

            new_status = "joined"
            message = (
                "게스트 신청을 승인했습니다."
            )

        else:
            new_status = "rejected"
            message = (
                "게스트 신청을 거절했습니다."
            )

        updated_participant = (
            self.event_repository
            .update_pending_guest_status(
                event_id=event_id,
                event_participant_id=(
                    event_participant_id
                ),
                new_status=new_status,
            )
        )

        return ClubEventGuestDecisionResponse(
            event_participant_id=int(
                updated_participant[
                    "event_participant_id"
                ]
            ),
            event_id=event_id,
            participation_status=new_status,
            message=message,
        )