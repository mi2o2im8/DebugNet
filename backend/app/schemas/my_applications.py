from datetime import date, datetime, time

from pydantic import BaseModel


# ---------------------------------------------------------
# 내 동호회 가입 신청 - 1개
#
# GET /api/users/me/applications
# ---------------------------------------------------------
class MyClubApplicationItemResponse(BaseModel):
    application_id: int

    club_id: int
    club_name: str
    club_image_url: str | None = None

    # "pending" 승인 대기 / "approved" 승인 / "rejected" 거절
    status: str

    # 승인 후 지금도 활동 중인지 (탈퇴했으면 False)
    is_active_member: bool = False

    created_at: datetime | None = None
    decided_at: datetime | None = None


# ---------------------------------------------------------
# 내 게스트 신청 - 1개
#
# 게스트 모집 상세 화면(GuestRecruitDetail)에 그대로 넘길 수 있도록
# 일정 정보도 같이 내려준다.
# ---------------------------------------------------------
class MyGuestApplicationItemResponse(BaseModel):
    event_participant_id: int
    event_id: int

    club_id: int
    club_name: str

    title: str
    description: str | None = None

    event_date: date
    start_time: time
    end_time: time | None = None

    location: str | None = None
    event_image_url: str | None = None

    max_guests: int | None = None
    registration_deadline: str | None = None

    # 일정 상태 ("cancelled" 면 일정 자체가 취소됨)
    event_status: str

    # "pending" 승인 대기 / "joined" 참여 확정
    # "rejected" 거절 / "cancelled" 내가 취소
    guest_status: str


# ---------------------------------------------------------
# 신청 현황 응답
# ---------------------------------------------------------
class MyApplicationsResponse(BaseModel):
    club_applications: list[MyClubApplicationItemResponse]
    guest_applications: list[MyGuestApplicationItemResponse]


# =========================================================
# ⭐ 받은 신청 (운영자용)
#
# GET /api/users/me/received-applications
# =========================================================

# 내 동호회에 들어온 가입 신청 (승인 대기)
class ReceivedClubApplicationItemResponse(BaseModel):
    application_id: int

    club_id: int
    club_name: str

    user_id: str
    nickname: str
    profile_image: str | None = None

    created_at: datetime | None = None


# 내 동호회 일정에 들어온 게스트 신청 (승인 대기)
class ReceivedGuestApplicationItemResponse(BaseModel):
    event_participant_id: int
    event_id: int

    club_id: int
    club_name: str

    title: str
    event_date: date
    start_time: time

    user_id: str
    nickname: str
    profile_image: str | None = None


class ReceivedApplicationsResponse(BaseModel):
    # 운영 중인 동호회가 하나라도 있는지 (없으면 화면에서 탭을 숨김)
    is_operator: bool

    club_applications: list[ReceivedClubApplicationItemResponse]
    guest_applications: list[ReceivedGuestApplicationItemResponse]
