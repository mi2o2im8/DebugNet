from typing import Optional
from pydantic import BaseModel

# ---------------------------------------------------------
# 동호회 검색 조건
#
# 프론트엔드에서 동호회 검색을 요청할 때 사용한다.
# ---------------------------------------------------------
class ClubSearchRequest(BaseModel):
    keyword: Optional[str] = None
    sport_name: Optional[str] = None
    region: Optional[str] = None
    day_of_week: Optional[str] = None
    atmosphere: Optional[str] = None

# -----------------------------------------------------
# 가입 질문 답변
# -----------------------------------------------------
class JoinAnswer(BaseModel):
    question_id: int
    answer_text: str


# -----------------------------------------------------
# 동호회 가입 신청
# -----------------------------------------------------
class ClubApplicationRequest(BaseModel):
    user_id: str
    application_message: str
    answers: list[JoinAnswer] = []
from datetime import time

from pydantic import (
    AliasChoices,
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


class ClubScheduleCreate(BaseModel):
    # DB와 백엔드에서 사용할 필드명
    day_of_week: str = Field(
        min_length=1,
        max_length=10,

        # React의 day와 백엔드의 day_of_week를 모두 허용
        validation_alias=AliasChoices(
            "day_of_week",
            "day",
        ),
    )

    start_time: time = Field(
        validation_alias=AliasChoices(
            "start_time",
            "startTime",
        ),
    )

    end_time: time = Field(
        validation_alias=AliasChoices(
            "end_time",
            "endTime",
        ),
    )

    # React에서 비활성화한 일정인지 확인하는 값
    enabled: bool = True

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.end_time <= self.start_time:
            raise ValueError(
                "종료 시간은 시작 시간보다 늦어야 합니다."
            )

        return self


class ClubJoinQuestionCreate(BaseModel):
    question_text: str = Field(
        min_length=1,
        max_length=50,
        validation_alias=AliasChoices(
            "question_text",
            "question",
        ),
    )

    question_type: str = "text"

    required: bool = False

    @field_validator("question_text")
    @classmethod
    def strip_question_text(cls, value: str) -> str:
        stripped_value = value.strip()

        if not stripped_value:
            raise ValueError(
                "가입 질문은 비워둘 수 없습니다."
            )

        return stripped_value


class ClubCreateRequest(BaseModel):
    # 1단계: 기본 정보

    representative_image_url: str | None = Field(
        default=None,
        max_length=1000,
        validation_alias=AliasChoices(
            "representative_image_url",
            "representativeImageUrl",
        ),
    )

    club_name: str = Field(
        min_length=1,
        max_length=50,
        validation_alias=AliasChoices(
            "club_name",
            "clubName",
        ),
    )

    sport_name: str = Field(
        min_length=1,
        max_length=50,
        validation_alias=AliasChoices(
            "sport_name",
            "sport",
        ),
    )

    city: str = Field(
        min_length=1,
        max_length=50,
    )

    district: str = Field(
        min_length=1,
        max_length=50,
    )

    detail_location: str | None = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices(
            "detail_location",
            "detailLocation",
        ),
    )

    # 2단계: 활동 일정 및 장소

    schedules: list[ClubScheduleCreate] = Field(
        min_length=1,
    )

    activity_place: str = Field(
        min_length=1,
        max_length=100,
        validation_alias=AliasChoices(
            "activity_place",
            "activityPlace",
        ),
    )

    activity_place_detail: str | None = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices(
            "activity_place_detail",
            "activityPlaceDetail",
        ),
    )

    activity_frequency: str = Field(
        min_length=1,
        max_length=50,
        validation_alias=AliasChoices(
            "activity_frequency",
            "activityFrequency",
        ),
    )

    # 3단계: 활동 조건 및 가입 대상

    activity_levels: list[str] = Field(
        default_factory=lambda: ["수준 무관"],
        validation_alias=AliasChoices(
            "activity_levels",
            "activityLevels",
        ),
    )

    join_target: str = Field(
        min_length=1,
        max_length=30,
        validation_alias=AliasChoices(
            "join_target",
            "joinTarget",
        ),
    )

    age_groups: list[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices(
            "age_groups",
            "ageGroups",
        ),
    )

    no_age_limit: bool = Field(
        default=False,
        validation_alias=AliasChoices(
            "no_age_limit",
            "noAgeLimit",
        ),
    )

    # 4단계: 동호회 소개 작성

    intro_keywords: list[str] = Field(
        default_factory=list,
        max_length=10,
        validation_alias=AliasChoices(
            "intro_keywords",
            "introKeywords",
        ),
    )

    club_intro: str | None = Field(
        default=None,
        max_length=2000,
        validation_alias=AliasChoices(
            "club_intro",
            "clubDescription",
        ),
    )

    activity_image_urls: list[str] = Field(
        default_factory=list,
        max_length=5,
        validation_alias=AliasChoices(
            "activity_image_urls",
            "activityImageUrls",
        ),
    )

        # 5단계: 가입 및 운영 방식

    join_method: str = Field(
        min_length=1,
        max_length=30,
        validation_alias=AliasChoices(
            "join_method",
            "joinMethod",
        ),
    )

    max_members: int | None = Field(
        default=None,
        ge=1,
        validation_alias=AliasChoices(
            "max_members",
            "maxMembers",
        ),
    )

    join_questions: list[ClubJoinQuestionCreate] = Field(
        default_factory=list,
        max_length=5,
        validation_alias=AliasChoices(
            "join_questions",
            "joinQuestions",
        ),
    )

    visibility: str = Field(
        default="public",
        max_length=30,
    )

    @field_validator("max_members", mode="before")
    @classmethod
    def normalize_max_members(cls, value):
        if value in (
            None,
            "",
            "unlimited",
        ):
            return None

        return value

    @field_validator(
        "club_name",
        "sport_name",
        "city",
        "district",
        "activity_place",
        "activity_frequency",
        "join_target",
        "join_method",
        "visibility",
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
        "activity_levels",
        "age_groups",
        "intro_keywords",
    )
    @classmethod
    def normalize_string_list(
        cls,
        values: list[str],
    ) -> list[str]:
        normalized_values = []

        for value in values:
            stripped_value = value.strip()

            if (
                stripped_value
                and stripped_value not in normalized_values
            ):
                normalized_values.append(
                    stripped_value
                )

        return normalized_values

    @model_validator(mode="after")
    def validate_create_conditions(self):
        active_schedules = [
            schedule
            for schedule in self.schedules
            if schedule.enabled
        ]

        if not active_schedules:
            raise ValueError(
                "하나 이상의 활동 일정을 활성화해주세요."
            )

        if not self.activity_levels:
            raise ValueError(
                "하나 이상의 운동 수준을 선택해주세요."
            )

        if (
            not self.no_age_limit
            and not self.age_groups
        ):
            raise ValueError(
                "연령 제한이 있다면 연령대를 선택해주세요."
            )

        return self


# React 에 응답 전달하기
class ClubCreateResponse(BaseModel):
    club_id: int
    owner_id: str
    message: str


class ClubDashboardSchedule(BaseModel):
    club_schedule_id: int
    day_of_week: str
    start_time: time
    end_time: time


class ClubDashboardResponse(BaseModel):
    club_id: int
    club_name: str
    club_intro: str | None = None

    sport_name: str | None = None
    region: str | None = None
    venue_name: str | None = None

    representative_image_url: str | None = None
    activity_image_urls: list[str] = Field(
        default_factory=list
    )

    current_members: int = 0
    max_members: int | None = None
    activity_frequency: str | None = None

    user_role: str

    schedules: list[ClubDashboardSchedule] = Field(
        default_factory=list
    )
