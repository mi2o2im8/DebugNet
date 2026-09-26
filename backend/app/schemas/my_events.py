from datetime import date, time

from pydantic import BaseModel


# ---------------------------------------------------------
# 내 동호회 전체 일정 - 일정 1개
#
# GET /api/users/me/events
# ---------------------------------------------------------
class MyEventItemResponse(BaseModel):
    event_id: int

    # 내가 속한 동호회 (팀매칭 일정도 "내 쪽" 동호회 기준)
    club_id: int
    club_name: str
    is_operator: bool

    title: str

    event_date: date
    start_time: time
    end_time: time | None = None

    location: str | None = None

    event_type: str
    status: str

    # 내 참석 투표 응답 ("참석" / "불참" / "미정")
    # 투표가 없거나 아직 응답하지 않았으면 None
    my_attendance: str | None = None


# ---------------------------------------------------------
# 내 동호회 전체 일정 - 동호회 1개 (달력 색상 / 범례용)
# ---------------------------------------------------------
class MyEventClubResponse(BaseModel):
    club_id: int
    club_name: str
    is_operator: bool


# ---------------------------------------------------------
# 내 동호회 전체 일정 응답
# ---------------------------------------------------------
class MyEventListResponse(BaseModel):
    year: int
    month: int

    clubs: list[MyEventClubResponse]
    events: list[MyEventItemResponse]

    total: int