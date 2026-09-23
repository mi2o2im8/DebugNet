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