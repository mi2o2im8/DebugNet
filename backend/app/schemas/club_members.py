from datetime import datetime
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

    join_source: str | None = None


# ---------------------------------------------------------
# 현재 동호회 회원 목록
# ---------------------------------------------------------
class ClubMemberListResponse(BaseModel):
    members: list[
        ClubMemberListItemResponse
    ] = Field(
        default_factory=list
    )

    total: int
    active_count: int
    inactive_count: int
    suspended_count: int