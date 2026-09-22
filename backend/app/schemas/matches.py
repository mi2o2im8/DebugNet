from datetime import (
    date,
    time,
    datetime,
)

from typing import Literal

from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)


# =========================================================
# 팀매칭 공통 값
# =========================================================

# 현재 MatchAvailabilityForm.jsx에서 사용하는 실력 단계
MatchSkillLevel = Literal[
    "초급",
    "중급",
    "상급",
]


# 현재 MatchAvailabilityForm.jsx에서 사용하는 장소 유형
MatchVenueType = Literal[
    "실내",
    "실외",
]


# =========================================================
# 경기 가능일 등록 Request
# =========================================================

class MatchAvailabilityCreateRequest(BaseModel):

    # -----------------------------------------------------
    # 어떤 동호회 이름으로 경기 가능일을 등록하는지
    #
    # 프론트에서 club_id를 선택해서 보내지만
    # 실제 owner / manager 권한은 Service에서 JWT로 검증한다.
    # -----------------------------------------------------
    club_id: int = Field(
        gt=0,
    )


    # -----------------------------------------------------
    # sports.sport_id
    #
    # 기존 프론트의 sport 문자열은
    # 실제 API 연결할 때 sport_id로 변경한다.
    # -----------------------------------------------------
    sport_id: int = Field(
        gt=0,
    )


    # -----------------------------------------------------
    # 경기 날짜 / 시간
    # -----------------------------------------------------
    match_date: date

    start_time: time

    end_time: time


    # -----------------------------------------------------
    # 우리 팀에서 경기할 인원
    # -----------------------------------------------------
    required_players: int = Field(
        ge=1,
    )


    # -----------------------------------------------------
    # 초급 / 중급 / 상급
    # -----------------------------------------------------
    skill_level: MatchSkillLevel


    # -----------------------------------------------------
    # 경기 지역
    #
    # 예:
    # 관악구
    # 강남구
    # -----------------------------------------------------
    region: str = Field(
        min_length=1,
        max_length=30,
    )


    # -----------------------------------------------------
    # 경기장 정보
    # -----------------------------------------------------
    location_name: str = Field(
        min_length=1,
        max_length=100,
    )

    address: str | None = Field(
        default=None,
        max_length=300,
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


    # -----------------------------------------------------
    # 추가 조건
    # -----------------------------------------------------
    parking_available: bool | None = None

    venue_type: MatchVenueType | None = None

    venue_cost_negotiable: bool | None = None

    time_negotiable: bool | None = None


    # -----------------------------------------------------
    # 한 줄 소개
    #
    # 현재 Frontend 최대 50자
    # -----------------------------------------------------
    intro: str | None = Field(
        default=None,
        max_length=50,
    )


    # =====================================================
    # 문자열 정리
    # =====================================================

    @field_validator(
        "region",
        "location_name",
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
        "address",
        "intro",
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


    # =====================================================
    # 시작 / 종료 시간 검사
    # =====================================================

    @model_validator(mode="after")
    def validate_time_range(self):

        if self.end_time <= self.start_time:
            raise ValueError(
                "종료 시간은 시작 시간보다 늦어야 합니다."
            )

        return self


# =========================================================
# 경기 가능일 등록 Response
# =========================================================

class MatchAvailabilityCreateResponse(BaseModel):

    availability_id: int

    message: str = "경기 가능일이 등록되었습니다."

# =========================================================
# 팀매칭 옵션 - 동호회
# =========================================================

class MatchClubOptionResponse(BaseModel):

    club_id: int

    club_name: str

    # 프론트의 동호회 선택창 / 프로필 표시용
    club_profile_image: str | None = None


# =========================================================
# 팀매칭 옵션 - 종목
# =========================================================

class MatchSportOptionResponse(BaseModel):

    sport_id: int

    sport_name: str


# =========================================================
# 경기 가능일 등록 화면 옵션 Response
#
# GET /api/matches/options
# =========================================================

class MatchOptionsResponse(BaseModel):

    # 현재 사용자가 owner / manager로 운영 가능한 동호회
    clubs: list[MatchClubOptionResponse]

    # 활성화된 sports 목록
    sports: list[MatchSportOptionResponse]


# =========================================================
# 경기 가능일 조회 Response
#
# 목록 / 상세에서 공통으로 사용할 수 있는 형태
# =========================================================

class MatchAvailabilityResponse(BaseModel):

    availability_id: int

    # -----------------------------------------------------
    # 동호회 정보
    # -----------------------------------------------------
    club_id: int

    club_name: str

    club_profile_image: str | None = None


    # -----------------------------------------------------
    # 종목 정보
    #
    # DB에는 sport_id가 저장되어 있지만
    # Frontend 표시를 위해 sport_name도 같이 반환
    # -----------------------------------------------------
    sport_id: int

    sport_name: str


    # -----------------------------------------------------
    # 경기 날짜 / 시간
    # -----------------------------------------------------
    match_date: date

    start_time: time

    end_time: time | None = None


    # -----------------------------------------------------
    # 경기 조건
    # -----------------------------------------------------
    required_players: int

    skill_level: str


    # -----------------------------------------------------
    # 장소
    # -----------------------------------------------------
    region: str

    location_name: str

    address: str | None = None

    latitude: float | None = None

    longitude: float | None = None


    # -----------------------------------------------------
    # 장소 / 협의 조건
    # -----------------------------------------------------
    parking_available: bool | None = None

    venue_type: str | None = None

    venue_cost_negotiable: bool | None = None

    time_negotiable: bool | None = None


    # -----------------------------------------------------
    # 기타
    # -----------------------------------------------------
    intro: str | None = None

    status: str

    created_at: datetime

    updated_at: datetime


# =========================================================
# 내가 등록한 경기 가능일 목록 Response
#
# GET /api/matches/availabilities/my
# =========================================================

class MyMatchAvailabilityListResponse(BaseModel):

    items: list[MatchAvailabilityResponse]

    total_count: int

# =========================================================
# 경기 가능일 수정 Request
# =========================================================

class MatchAvailabilityUpdateRequest(BaseModel):

    sport_id: int | None = Field(
        default=None,
        gt=0,
    )

    match_date: date | None = None

    start_time: time | None = None

    end_time: time | None = None

    required_players: int | None = Field(
        default=None,
        ge=1,
    )

    skill_level: MatchSkillLevel | None = None

    region: str | None = Field(
        default=None,
        min_length=1,
        max_length=30,
    )

    location_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    address: str | None = Field(
        default=None,
        max_length=300,
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

    parking_available: bool | None = None

    venue_type: MatchVenueType | None = None

    venue_cost_negotiable: bool | None = None

    time_negotiable: bool | None = None

    intro: str | None = Field(
        default=None,
        max_length=50,
    )


    @field_validator(
        "region",
        "location_name",
    )
    @classmethod
    def strip_required_strings(
        cls,
        value: str | None,
    ) -> str | None:

        if value is None:
            return None

        stripped_value = value.strip()

        if not stripped_value:
            raise ValueError(
                "필수 입력값은 공백일 수 없습니다."
            )

        return stripped_value


    @field_validator(
        "address",
        "intro",
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

# =========================================================
# 경기 가능일 수정 Response
# =========================================================

class MatchAvailabilityUpdateResponse(BaseModel):

    availability_id: int

    message: str = "경기 가능일이 수정되었습니다."

# =========================================================
# 경기 가능일 삭제 Response
#
# DELETE /api/matches/availabilities/{availability_id}
# =========================================================

class MatchAvailabilityDeleteResponse(BaseModel):

    availability_id: int

    message: str = "경기 가능일이 삭제되었습니다."

# =========================================================
# 상대팀 경기 가능일 목록 Response
#
# GET /api/matches/availabilities
# =========================================================

class MatchAvailabilityListResponse(BaseModel):

    items: list[MatchAvailabilityResponse]

    total_count: int

# =========================================================
# 매칭 신청 가능한 내 동호회
# =========================================================

class MatchRequestableClubResponse(BaseModel):

    club_id: int

    club_name: str


# =========================================================
# 매칭 신청 가능한 내 동호회 목록 Response
#
# GET /api/matches/requestable-clubs
# =========================================================

class MatchRequestableClubsResponse(BaseModel):

    clubs: list[MatchRequestableClubResponse]

# =========================================================
# 매칭 신청 생성 Request
#
# POST /api/matches/requests
#
# target_club_id는 프론트에서 받지 않는다.
# availability_id를 조회해서 Backend가 직접 확인한다.
# =========================================================

class MatchRequestCreateRequest(BaseModel):

    availability_id: int = Field(
        ...,
        gt=0,
    )

    requester_club_id: int = Field(
        ...,
        gt=0,
    )


# =========================================================
# 매칭 신청 생성 Response
# =========================================================

class MatchRequestCreateResponse(BaseModel):

    club_match_id: int

    status: str = "pending"

    message: str = "매칭 신청이 완료되었습니다."

# =========================================================
# 내가 이 경기 가능일에 보낸 매칭 신청 정보
# =========================================================

class MyMatchRequestResponse(BaseModel):

    club_match_id: int

    requester_club_id: int

    status: str


# =========================================================
# 경기 가능일 상세 Response
#
# 기존 경기 상세 정보
# +
# 현재 사용자의 매칭 신청 상태
# =========================================================

class MatchAvailabilityDetailResponse(
    MatchAvailabilityResponse
):

    has_requested: bool = False

    my_requests: list[
        MyMatchRequestResponse
    ] = Field(
        default_factory=list
    )