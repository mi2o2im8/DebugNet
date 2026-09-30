from datetime import (
    date,
    datetime,
)

from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)


# ---------------------------------------------------------
# 가입 신청 질문 답변
# ---------------------------------------------------------
class ClubApplicationAnswerResponse(BaseModel):
    question_id: int
    question_text: str
    answer_text: str

# ---------------------------------------------------------
# H2 가입 신청자 적합도 분석
#
# 운영자의 가입 검토를 보조하는 참고 정보이며,
# 자동 승인·거절에는 사용하지 않는다.
# ---------------------------------------------------------
class ClubApplicationFitResponse(BaseModel):
    direct_fit_score: float | None = None
    official_prior_score: float | None = None

    classification: Literal[
        "적합",
        "조건부 적합",
        "확인 필요",
        "부적합",
    ]

    hard_constraint_passed: bool
    hard_constraint_reason: str

    severe_mismatch_axes: list[str] = Field(
        default_factory=list
    )
    partial_mismatch_axes: list[str] = Field(
        default_factory=list
    )

    trial_recommended: bool = False
    operator_action: str

    data_coverage: int = Field(
        ge=0,
        le=100,
    )
    missing_axes: list[str] = Field(
        default_factory=list
    )


# ---------------------------------------------------------
# H1 모집 대상 추천
#
# 아직 가입 신청하지 않은 사용자 중 운영 조건과의 적합도를
# 계산한다. 현재 MVP에서는 초대 발송 없이 조회만 제공한다.
# ---------------------------------------------------------
class ClubRecruitmentAxisScores(BaseModel):
    schedule: int = Field(ge=0, le=100)
    skill: int = Field(ge=0, le=100)
    purpose: int = Field(ge=0, le=100)
    atmosphere: int = Field(ge=0, le=100)
    activity_frequency: int = Field(ge=0, le=100)
    cost: int = Field(ge=0, le=100)


class ClubRecruitmentRecommendationItem(BaseModel):
    rank: int = Field(ge=1)
    user_id: str
    nickname: str
    profile_image: str | None = None
    direct_match_score: float = Field(ge=0, le=100)
    action: Literal[
        "최우선 모집",
        "우선 모집",
        "일반 후보",
        "체험 제안",
        "후순위",
    ]
    severe_mismatch_axes: list[str] = Field(
        default_factory=list
    )
    partial_mismatch_axes: list[str] = Field(
        default_factory=list
    )
    axis_scores: ClubRecruitmentAxisScores
    data_coverage: int = Field(ge=0, le=100)
    missing_axes: list[str] = Field(
        default_factory=list
    )


class ClubRecruitmentRecommendationResponse(BaseModel):
    recommendations: list[
        ClubRecruitmentRecommendationItem
    ] = Field(default_factory=list)
    total_users_scanned: int = Field(ge=0)
    candidate_pool_count: int = Field(ge=0)
    eligible_count: int = Field(ge=0)
    returned_count: int = Field(ge=0)
    excluded_member_count: int = Field(ge=0)
    excluded_application_count: int = Field(ge=0)
    excluded_summary: dict[str, int] = Field(
        default_factory=dict
    )
    consent_filter_applied: bool = False
    travel_filter_mode: Literal[
        "region_proxy"
    ] = "region_proxy"


# ---------------------------------------------------------
# H4 실제 활동 결과 및 참여 저하 분석
#
# attendance_status(일정 전 참석 의사)와 구분되는
# 일정 종료 후 실제 활동 결과다.
# ---------------------------------------------------------
ClubActivityResult = Literal[
    "attended",
    "cancelled",
    "no_show",
    "not_eligible",
]


class ClubActivityResultInput(BaseModel):
    user_id: str
    result: ClubActivityResult


class ClubActivityResultBulkRequest(BaseModel):
    results: list[ClubActivityResultInput] = Field(
        min_length=1
    )


class ClubActivityResultMutationResponse(BaseModel):
    event_id: int
    saved_count: int = Field(ge=0)
    message: str


class ClubActivityResultMemberResponse(BaseModel):
    club_member_id: int
    user_id: str
    name: str
    nickname: str
    profile_image: str | None = None
    role: Literal[
        "owner",
        "manager",
        "member",
    ]


class ClubActivityResultEventResponse(BaseModel):
    event_id: int
    title: str
    event_date: date
    results: dict[str, ClubActivityResult] = Field(
        default_factory=dict
    )


class ClubActivityResultWorkspaceResponse(BaseModel):
    members: list[
        ClubActivityResultMemberResponse
    ] = Field(default_factory=list)
    events: list[
        ClubActivityResultEventResponse
    ] = Field(default_factory=list)
    result_options: list[ClubActivityResult] = Field(
        default_factory=lambda: [
            "attended",
            "cancelled",
            "no_show",
            "not_eligible",
        ]
    )


class ClubParticipationRiskItemResponse(BaseModel):
    club_member_id: int
    user_id: str
    name: str
    nickname: str
    profile_image: str | None = None
    role: Literal[
        "owner",
        "manager",
        "member",
    ]
    analysis_status: Literal[
        "analyzed",
        "insufficient_data",
    ]
    eligible_result_count: int = Field(ge=0)
    risk_score: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    risk_grade: Literal[
        "정상",
        "관찰",
        "관리 필요",
        "고위험",
    ] | None = None
    detected_risk: str | None = None
    reason_candidates: list[str] = Field(
        default_factory=list
    )
    confirmation_questions: list[str] = Field(
        default_factory=list
    )
    operator_action: str | None = None
    operator_summary: str | None = None
    management_priority: int | None = None
    previous_attendance_rate: float | None = None
    recent_attendance_rate: float | None = None
    attendance_rate_delta: float | None = None
    recent_cancel_rate: float | None = None
    recent_no_show_rate: float | None = None
    consecutive_nonparticipation: int | None = None
    missed_opportunities: int | None = None


class ClubParticipationRiskResponse(BaseModel):
    risks: list[
        ClubParticipationRiskItemResponse
    ] = Field(default_factory=list)
    total: int = Field(ge=0)
    analyzed_count: int = Field(ge=0)
    insufficient_data_count: int = Field(ge=0)
    observe_count: int = Field(ge=0)
    management_required_count: int = Field(ge=0)
    high_risk_count: int = Field(ge=0)
    minimum_eligible_results: int = Field(default=4, ge=1)

# ---------------------------------------------------------
# 가입 신청자 목록 항목
# ---------------------------------------------------------
class ClubApplicationListItemResponse(BaseModel):
    application_id: int
    club_id: int

    user_id: str
    name: str
    nickname: str
    profile_image: str | None = None

    application_message: str | None = None

    fit_analysis: (
        ClubApplicationFitResponse | None
    ) = None

    status: Literal[
        "pending",
        "approved",
        "rejected",
        "cancelled",
    ]

    created_at: datetime
    decided_at: datetime | None = None
    decided_by_user_id: str | None = None

    answers: list[
        ClubApplicationAnswerResponse
    ] = Field(
        default_factory=list
    )


# ---------------------------------------------------------
# 가입 신청자 목록 응답
# ---------------------------------------------------------
class ClubApplicationListResponse(BaseModel):
    applications: list[
        ClubApplicationListItemResponse
    ] = Field(
        default_factory=list
    )

    total: int


# ---------------------------------------------------------
# 가입 신청 승인·거절 요청
# ---------------------------------------------------------
class ClubApplicationDecisionRequest(BaseModel):
    decision: Literal[
        "approve",
        "reject",
    ]


# ---------------------------------------------------------
# 가입 신청 승인·거절 응답
# ---------------------------------------------------------
class ClubApplicationDecisionResponse(BaseModel):
    application_id: int
    club_id: int
    user_id: str

    application_status: Literal[
        "approved",
        "rejected",
    ]

    member_status: Literal[
        "active",
    ] | None = None

    message: str

# ---------------------------------------------------------
# 현재 동호회 회원
# ---------------------------------------------------------
class ClubMemberListItemResponse(BaseModel):
    club_member_id: int
    club_id: int
    user_id: str

    name: str
    nickname: str
    profile_image: str | None = None

    role: Literal[
        "owner",
        "manager",
        "member",
    ]

    status: Literal[
        "active",
        "inactive",
        "suspended",
    ]

    joined_at: datetime | None = None
    join_source: str | None = None

    responded_vote_count: int = 0
    eligible_vote_count: int = 0
    vote_participation_rate: int | None = None
    warning_count: int = 0


# ---------------------------------------------------------
# 현재 동호회 회원 목록
# ---------------------------------------------------------
class ClubMemberListResponse(BaseModel):
    members: list[
        ClubMemberListItemResponse
    ] = Field(
        default_factory=list
    )

    current_user_role: Literal[
        "owner",
        "manager",
    ]

    total: int
    active_count: int
    inactive_count: int
    suspended_count: int

# ---------------------------------------------------------
# 회원 역할 변경 요청
# ---------------------------------------------------------
class ClubMemberRoleUpdateRequest(BaseModel):
    role: Literal[
        "manager",
        "member",
    ]


# ---------------------------------------------------------
# 회원 상태 변경 요청
# ---------------------------------------------------------
class ClubMemberStatusUpdateRequest(BaseModel):
    status: Literal[
        "active",
        "suspended",
    ]


# ---------------------------------------------------------
# 회원 역할·상태 변경 응답
# ---------------------------------------------------------
class ClubMemberUpdateResponse(BaseModel):
    club_member_id: int
    club_id: int
    user_id: str

    role: Literal[
        "owner",
        "manager",
        "member",
    ]

    status: Literal[
        "active",
        "inactive",
        "suspended",
        "withdrawn",
    ]

    message: str

# ---------------------------------------------------------
# 회원 활동 내역
# ---------------------------------------------------------
class ClubMemberActivityResponse(BaseModel):
    event_id: int
    event_title: str
    event_date: date

    participation_status: str

    attendance_status: Literal[
        "attending",
        "absent",
        "undecided",
    ]


# ---------------------------------------------------------
# 회원 투표 내역
# ---------------------------------------------------------
class ClubMemberVoteResponse(BaseModel):
    vote_id: int
    event_id: int

    vote_title: str
    event_title: str

    deadline: datetime | None = None
    created_at: datetime | None = None

    has_responded: bool


# ---------------------------------------------------------
# 회원 경고 내역
# ---------------------------------------------------------
class ClubMemberWarningResponse(BaseModel):
    warning_id: int
    warning_type: str
    reason: str | None = None
    created_at: datetime
    created_by_user_id: str | None = None

# ---------------------------------------------------------
# 회원 경고 부여 요청
# ---------------------------------------------------------
class ClubMemberWarningCreateRequest(BaseModel):
    warning_type: Literal[
        "attendance",
        "rule_violation",
        "manner",
        "other",
    ]

    reason: str = Field(
        min_length=2,
        max_length=500,
    )

# ---------------------------------------------------------
# 회원 경고 부여·취소 응답
# ---------------------------------------------------------
class ClubMemberWarningMutationResponse(BaseModel):
    warning_id: int
    club_member_id: int
    club_id: int
    user_id: str

    warning_count: int
    message: str

# ---------------------------------------------------------
# 회원 상세 정보
# ---------------------------------------------------------
class ClubMemberDetailResponse(
    ClubMemberListItemResponse
):
    email: str
    phone: str | None = None
    bio: str | None = None

    attending_count: int = 0
    absent_count: int = 0
    undecided_count: int = 0

    activities: list[
        ClubMemberActivityResponse
    ] = Field(
        default_factory=list
    )

    votes: list[
        ClubMemberVoteResponse
    ] = Field(
        default_factory=list
    )

    warnings: list[
        ClubMemberWarningResponse
    ] = Field(
        default_factory=list
    )

    current_user_role: Literal[
        "owner",
        "manager",
    ]

    can_change_role: bool = False
    can_change_status: bool = False
    can_remove_member: bool = False
    can_manage_warnings: bool = False

# ---------------------------------------------------------
# 동호회 탈퇴 리뷰 작성 요청
# ---------------------------------------------------------
class ClubLeaveReviewRequest(BaseModel):
    rating: int | None = Field(
        default=None,
        ge=1,
        le=5,
    )

    leave_reason: str | None = None

    review_text: str | None = Field(
        default=None,
        max_length=1000,
    )
