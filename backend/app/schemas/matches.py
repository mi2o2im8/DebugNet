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

# =========================================================
# 매칭 관리 메인 Summary
#
# GET /api/matches/management/{club_id}/summary
#
# MatchManagement.jsx의 임시 summary를
# 실제 DB 결과로 교체하기 위해 사용
# =========================================================

class MatchManagementSummaryResponse(BaseModel):

    # 내가 받은 아직 처리하지 않은 매칭 신청
    received: int = 0

    # 내가 보냈고 아직 상대가 처리하지 않은 신청
    sent: int = 0

    # 확정되었고 아직 경기 날짜가 지나지 않은 경기
    upcoming: int = 0

    # 경기 날짜가 지난 경기
    history: int = 0

    # 현재 동호회가 작성한 후기
    written_reviews: int = 0

    # 현재 동호회가 받은 후기
    received_reviews: int = 0


# =========================================================
# 매칭 관리 목록 Item
#
# 아래 6개 목록에서 공통으로 사용
#
# received
# sent
# upcoming
# history
# writtenReviews
# receivedReviews
# =========================================================

class MatchManagementListItemResponse(BaseModel):

    # 매칭 고유 ID
    club_match_id: int

    # 상대 동호회
    opponent_club_id: int

    opponent_club_name: str

    opponent_club_profile_image: str | None = None

    # 종목
    sport_name: str

    # 경기 날짜 / 시간
    match_date: date

    start_time: time

    end_time: time | None = None

    # 장소
    region: str

    location_name: str

    # -----------------------------------------------------
    # 매칭 신청/승인 상태
    #
    # 예:
    # pending
    # approved
    # rejected
    # cancelled
    # -----------------------------------------------------
    status: str

    # -----------------------------------------------------
    # 경기 기록 상태
    #
    # received / sent / upcoming에서는
    # 아직 필요 없을 수 있으므로 None 가능
    #
    # 예:
    # RECORD_REQUIRED
    # RECORD_PENDING
    # RECORD_CONFIRM_REQUIRED
    # COMPLETED
    # -----------------------------------------------------
    record_status: str | None = None

    # 후기 여부
    has_written_review: bool = False

    has_received_review: bool = False


# =========================================================
# 매칭 관리 목록 Response
#
# GET /api/matches/management/{club_id}/matches
# =========================================================

class MatchManagementListResponse(BaseModel):

    items: list[
        MatchManagementListItemResponse
    ]

    total_count: int

# =========================================================
# 매칭 관리 상세 Response
#
# GET
# /api/matches/management/{club_id}/matches/{club_match_id}
#
# MatchManagementDetail.jsx에서 사용
# =========================================================

class MatchManagementDetailResponse(BaseModel):

    # -----------------------------------------------------
    # 매칭 기본 정보
    # -----------------------------------------------------
    club_match_id: int

    # 현재 화면 기준
    #
    # received
    # sent
    # upcoming
    # history
    type: Literal[
        "received",
        "sent",
        "upcoming",
        "history",
    ]


    # -----------------------------------------------------
    # 상대 동호회
    # -----------------------------------------------------
    opponent_club_id: int

    opponent_club_name: str

    opponent_club_profile_image: str | None = None


    # -----------------------------------------------------
    # 경기 정보
    # -----------------------------------------------------
    sport_name: str

    match_date: date

    start_time: time

    end_time: time | None = None


    # -----------------------------------------------------
    # 장소
    # -----------------------------------------------------
    region: str

    location_name: str

    address: str | None = None


    # -----------------------------------------------------
    # 경기 조건
    # -----------------------------------------------------
    skill_level: str

    required_players: int

    venue_type: str | None = None

    parking_available: bool | None = None

    intro: str | None = None


    # -----------------------------------------------------
    # 매칭 자체 상태
    #
    # 예:
    # pending
    # approved
    # rejected
    # cancelled
    # -----------------------------------------------------
    status: str

    # 화면에 바로 표시할 상태 문구
    #
    # 예:
    # 승인 대기
    # 응답 대기
    # 경기 예정
    # -----------------------------------------------------
    status_label: str


    # -----------------------------------------------------
    # 지난 경기 기록 상태
    #
    # received / sent / upcoming이면 None
    #
    # history이면:
    # RECORD_REQUIRED
    # RECORD_PENDING
    # RECORD_CONFIRM_REQUIRED
    # COMPLETED
    # -----------------------------------------------------
    record_status: str | None = None


    # -----------------------------------------------------
    # 경기 점수
    #
    # 현재 club_id 기준으로 변환해서 내려준다.
    #
    # target    = HOME
    # requester = AWAY
    #
    # 따라서 프론트는 home/away를 신경 쓰지 않고
    # 그냥 my_score / opponent_score만 사용한다.
    # -----------------------------------------------------
    my_score: int | None = None

    opponent_score: int | None = None


    # -----------------------------------------------------
    # 후기 여부
    # -----------------------------------------------------
    has_written_review: bool = False

    has_received_review: bool = False

    # -----------------------------------------------------
    # 경기 취소 요청 상태
    #
    # is_cancel_request_sent
    # → 현재 동호회가 취소 요청을 보냄
    #
    # is_cancel_request_received
    # → 상대 동호회가 취소 요청을 보냄
    # -----------------------------------------------------
    is_cancel_request_sent: bool = False

    is_cancel_request_received: bool = False

# =========================================================
# 매칭 신청 승인 / 거절 Response
#
# PATCH
# /api/matches/management/{club_id}/matches/{club_match_id}/approve
#
# PATCH
# /api/matches/management/{club_id}/matches/{club_match_id}/reject
# =========================================================

class MatchManagementActionResponse(BaseModel):

    club_match_id: int

    status: str

    # 승인 시 생성된 일정 ID
    # 거절 시에는 None
    event_id: int | None = None

    message: str

# =========================================================
# 경기 결과 작성 / 수정 Request
#
# PUT
# /api/matches/management/{club_id}/matches/
# {club_match_id}/result
#
# 프론트는 HOME / AWAY를 신경 쓰지 않고
# 현재 동호회 관점의 점수만 보낸다.
# =========================================================

class MatchResultSubmitRequest(BaseModel):

    my_score: int = Field(
        ge=0,
        le=99,
    )

    opponent_score: int = Field(
        ge=0,
        le=99,
    )


# =========================================================
# 경기 결과 Response
#
# 최초 작성
# 수정 / 재제출
# 상대팀 승인
#
# 모두 공통으로 사용
# =========================================================

class MatchResultResponse(BaseModel):

    match_result_id: int

    club_match_id: int

    # 현재 동호회 기준 점수
    my_score: int

    opponent_score: int

    # 프론트에서 바로 사용하는 기록 상태
    #
    # RECORD_PENDING
    # RECORD_CONFIRM_REQUIRED
    # COMPLETED
    record_status: Literal[
        "RECORD_PENDING",
        "RECORD_CONFIRM_REQUIRED",
        "COMPLETED",
    ]

    message: str

# =========================================================
# 경기 후기 작성 Request
#
# POST
# /api/matches/management/{club_id}/matches/
# {club_match_id}/review
#
# 6개 항목은 모두 필수
# 점수 범위는 1 ~ 5
#
# content는 선택 입력
# 최대 300자
# =========================================================

class MatchReviewCreateRequest(BaseModel):

    # 매너
    manner_score: int = Field(
        ge=1,
        le=5,
    )

    # 시간 준수
    punctuality_score: int = Field(
        ge=1,
        le=5,
    )

    # 실제 참가 인원 / 등록 인원 일치
    roster_accuracy_score: int = Field(
        ge=1,
        le=5,
    )

    # 과격 행동 / 안전
    safety_score: int = Field(
        ge=1,
        le=5,
    )

    # 경기 진행 원활성
    game_flow_score: int = Field(
        ge=1,
        le=5,
    )

    # 재경기 의사
    rematch_score: int = Field(
        ge=1,
        le=5,
    )

    # 선택 후기 내용
    content: str | None = Field(
        default=None,
        max_length=300,
    )


# =========================================================
# 경기 후기 작성 Response
# =========================================================

class MatchReviewCreateResponse(BaseModel):

    match_review_id: int

    club_match_id: int

    reviewer_club_id: int

    target_club_id: int

    manner_score: int

    punctuality_score: int

    roster_accuracy_score: int

    safety_score: int

    game_flow_score: int

    rematch_score: int

    content: str | None = None

    message: str

# =========================================================
# 경기 후기 상세 Response
#
# GET
# /api/matches/management/{club_id}/matches/
# {club_match_id}/review?type=written
#
# GET
# /api/matches/management/{club_id}/matches/
# {club_match_id}/review?type=received
# =========================================================

class MatchReviewDetailResponse(BaseModel):

    # 후기 기본 정보
    match_review_id: int

    club_match_id: int

    # written  = 내가 작성한 후기
    # received = 내가 받은 후기
    type: Literal[
        "written",
        "received",
    ]


    # -----------------------------------------------------
    # 상대 동호회
    # -----------------------------------------------------
    opponent_club_id: int

    opponent_club_name: str

    opponent_club_profile_image: str | None = None


    # -----------------------------------------------------
    # 경기 정보
    # -----------------------------------------------------
    match_date: date

    start_time: time

    end_time: time | None = None

    location_name: str


    # -----------------------------------------------------
    # 경기 점수
    #
    # 현재 club_id 관점으로 변환
    # -----------------------------------------------------
    my_score: int

    opponent_score: int


    # -----------------------------------------------------
    # 후기 6개 평가 항목
    # -----------------------------------------------------
    manner_score: int

    punctuality_score: int

    roster_accuracy_score: int

    safety_score: int

    game_flow_score: int

    rematch_score: int


    # 선택 후기 내용
    content: str | None = None