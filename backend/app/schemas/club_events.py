from datetime import (
    date,
    datetime,
    time,
)
from typing import Literal

from uuid import UUID

from pydantic import (
    AliasChoices,
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


class ClubEventCreateRequest(BaseModel):
    # 1단계: 기본 정보

    title: str = Field(
        min_length=1,
        max_length=50,
    )

    event_type: str = Field(
        default="regular",
        min_length=1,
        max_length=30,
        validation_alias=AliasChoices(
            "event_type",
            "eventType",
        ),
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    event_image_url: str | None = Field(
        default=None,
        max_length=1000,
        validation_alias=AliasChoices(
            "event_image_url",
            "eventImageUrl",
        ),
    )

    # 2단계: 날짜와 시간

    event_date: date = Field(
        validation_alias=AliasChoices(
            "event_date",
            "eventDate",
        ),
    )

    start_time: time = Field(
        validation_alias=AliasChoices(
            "start_time",
            "startTime",
        ),
    )

    end_time: time | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "end_time",
            "endTime",
        ),
    )

    recurrence_type: Literal[
        "none",
        "weekly",
        "monthly",
        "custom",
    ] = Field(
        default="none",
        validation_alias=AliasChoices(
            "recurrence_type",
            "recurrenceType",
        ),
    )

    # 3단계: 장소

    location: str | None = Field(
        default=None,
        max_length=200,
    )

    location_address: str | None = Field(
        default=None,
        max_length=500,
        validation_alias=AliasChoices(
            "location_address",
            "locationAddress",
        ),
    )

    latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    # 4단계: 참여 및 투표 설정

    max_participants: int | None = Field(
        default=None,
        ge=1,
        validation_alias=AliasChoices(
            "max_participants",
            "maxParticipants",
        ),
    )

    participation_method: Literal[
        "open",
        "approval",
    ] = Field(
        default="open",
        validation_alias=AliasChoices(
            "participation_method",
            "participationMethod",
        ),
    )

    guest_allowed: bool = Field(
        default=False,
        validation_alias=AliasChoices(
            "guest_allowed",
            "guestAllowed",
        ),
    )

    max_guests: int = Field(
        default=0,
        ge=0,
        validation_alias=AliasChoices(
            "max_guests",
            "maxGuests",
        ),
    )

    registration_deadline: datetime | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "registration_deadline",
            "registrationDeadline",
        ),
    )


    # -----------------------------------------------------
    # 문자열 정리
    # -----------------------------------------------------

    @field_validator(
        "title",
        "event_type",
    )
    @classmethod
    def strip_required_strings(
        cls,
        value: str,
    ) -> str:
        stripped_value = value.strip()

        if not stripped_value:
            raise ValueError(
                "필수 입력값은 공백일 수 없습니다."
            )

        return stripped_value

    @field_validator(
        "description",
        "event_image_url",
        "location",
        "location_address",
    )
    @classmethod
    def strip_optional_strings(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        stripped_value = value.strip()

        return stripped_value or None

    # -----------------------------------------------------
    # 프론트 한글값을 DB 영문 코드로 변환
    # -----------------------------------------------------

    @field_validator(
        "recurrence_type",
        mode="before",
    )
    @classmethod
    def normalize_recurrence_type(cls, value):
        recurrence_map = {
            "반복 안 함": "none",
            "매주 반복": "weekly",
            "매월 반복": "monthly",
            "직접 날짜 선택": "custom",
        }

        return recurrence_map.get(value, value)

    @field_validator(
        "participation_method",
        mode="before",
    )
    @classmethod
    def normalize_participation_method(
        cls,
        value,
    ):
        participation_map = {
            "바로 참여": "open",
            "누구나 바로 참여": "open",
            "운영자 승인 후 참여": "approval",
        }

        return participation_map.get(value, value)

    # -----------------------------------------------------
    # 입력값 간 관계 검증
    # -----------------------------------------------------

    @model_validator(mode="after")
    def validate_event_conditions(self):
        if (
            self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError(
                "종료 시간은 시작 시간보다 늦어야 합니다."
            )

        if (
            not self.guest_allowed
            and self.max_guests > 0
        ):
            raise ValueError(
                "게스트를 허용하지 않으면 "
                "최대 게스트 인원은 0명이어야 합니다."
            )

        if (
            self.max_participants is not None
            and self.max_guests >
                self.max_participants
        ):
            raise ValueError(
                "최대 게스트 인원은 전체 참여 인원을 "
                "초과할 수 없습니다."
            )

        if (
            self.registration_deadline is not None
            and self.registration_deadline.date()
                > self.event_date
        ):
            raise ValueError(
                "모집 마감일은 일정 날짜보다 "
                "늦을 수 없습니다."
            )

        if (
            (self.latitude is None)
            != (self.longitude is None)
        ):
            raise ValueError(
                "위도와 경도는 함께 입력해야 합니다."
            )

        if (
            self.latitude is not None
            and self.longitude is not None
            and self.location is None
        ):
            raise ValueError(
                "좌표를 입력하려면 장소명도 필요합니다."
            )

        return self


class ClubEventCreateResponse(BaseModel):
    event_id: int
    club_id: int
    message: str

class ClubEventDetailResponse(BaseModel):
    event_id: int
    club_id: int

    title: str
    description: str | None = None

    event_date: date
    start_time: time
    end_time: time | None = None

    location: str | None = None
    location_address: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    max_participants: int | None = None

    event_type: str
    status: str
    event_image_url: str | None = None

    recurrence_type: str
    participation_method: str

    guest_allowed: bool
    max_guests: int

    registration_deadline: datetime | None = None

    vote_options: list[str] = Field(
        default_factory=list,
    )

class ClubEventListItemResponse(BaseModel):
    event_id: int
    club_id: int
    title: str
    description: str | None = None

    event_date: date
    start_time: time
    end_time: time | None = None

    location: str | None = None
    location_address: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    max_participants: int | None = None

    event_type: str
    status: str
    event_image_url: str | None = None

    recurrence_type: str
    participation_method: str
    guest_allowed: bool
    max_guests: int

    registration_deadline: datetime | None = None

    attending_count: int = Field(
        default=0,
        ge=0,
    )

    absent_count: int = Field(
        default=0,
        ge=0,
    )

    undecided_count: int = Field(
        default=0,
        ge=0,
    )

    guest_count: int = Field(
        default=0,
        ge=0,
    )

    pending_guest_count: int = Field(
        default=0,
        ge=0,
    )


class ClubEventListResponse(BaseModel):
    events: list[ClubEventListItemResponse]
    total: int

class ClubEventParticipantItemResponse(BaseModel):
    event_participant_id: int
    user_id: UUID

    name: str
    nickname: str
    profile_image: str | None = None

    participant_type: Literal[
        "member",
        "guest",
    ]

    member_role: Literal[
        "owner",
        "manager",
        "member",
    ] | None = None

    participation_status: Literal[
        "pending",
        "joined",
        "rejected",
        "cancelled",
    ]

    attendance_status: Literal[
        "attending",
        "absent",
        "undecided",
    ] | None = None


class ClubEventParticipantListResponse(BaseModel):
    event_id: int

    participants: list[
        ClubEventParticipantItemResponse
    ]

    total: int
    joined_member_count: int
    joined_guest_count: int
    pending_member_count: int = 0
    pending_guest_count: int = 0

class ClubEventGuestDecisionRequest(BaseModel):
    decision: Literal[
        "approve",
        "reject",
    ]


class ClubEventGuestDecisionResponse(BaseModel):
    event_participant_id: int
    event_id: int

    participation_status: Literal[
        "joined",
        "rejected",
    ]

    message: str

class ClubEventGuestApplicationResponse(BaseModel):
    event_id: int

    event_participant_id: int | None = None

    participation_status: Literal[
        "pending",
        "joined",
        "rejected",
        "cancelled",
    ] | None = None

    message: str

class ClubEventAttendanceRequest(BaseModel):
    attendance_status: Literal[
        "attending",
        "absent",
        "undecided",
    ] = Field(
        validation_alias=AliasChoices(
            "attendance_status",
            "attendanceStatus",
        ),
    )


class ClubEventAttendanceResponse(BaseModel):
    event_id: int

    attendance_status: Literal[
        "attending",
        "absent",
        "undecided",
    ]

    participation_status: Literal[
        "pending",
        "joined",
        "rejected",
        "cancelled",
    ] | None = None

    message: str