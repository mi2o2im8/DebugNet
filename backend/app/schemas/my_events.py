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

    # 팀매칭 일정이면 club_matches.club_match_id, 일반 일정이면 None
    # (지난 팀매칭 일정에서 후기 화면으로 이동할 때 사용)
    club_match_id: int | None = None

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


# ---------------------------------------------------------
# 내 활동 - 지난 일정 1개
#
# GET /api/users/me/activity
#
# 가입일 이후의 "지난" 일정만 내려준다.
# 참여 여부 / 참석률 / 누적 시간은 프론트에서
# 기간 · 종목 필터에 맞춰 계산한다.
# ---------------------------------------------------------
class MyActivityItemResponse(BaseModel):
    event_id: int

    club_id: int
    club_name: str

    title: str

    event_date: date
    start_time: time
    end_time: time | None = None

    location: str | None = None

    # 동호회 대표 종목 (종목 필터용)
    sport_name: str | None = None

    # 팀매칭 경기 여부 (참석 투표가 없는 일정)
    is_match: bool

    # 투표 참여율 / 참석 현황 집계 대상인지
    #
    # 팀원 멤버 상세 통계(club_member_service)와 같은 기준:
    # 참석 투표가 있고, 그 투표가 "가입 이후"에 만들어졌으면 True
    vote_eligible: bool = False

    # 내 참석 투표 응답 ("참석" / "불참" / "미정" / None)
    my_attendance: str | None = None


# ---------------------------------------------------------
# 내가 받은 운영진 경고 1개 (신뢰점수 감점용)
# ---------------------------------------------------------
class MyWarningResponse(BaseModel):
    warning_id: int
    club_id: int
    club_name: str

    # attendance / rule_violation / manner / other
    warning_type: str

    reason: str | None = None
    created_at: str | None = None


# ---------------------------------------------------------
# 내 활동 응답
# ---------------------------------------------------------
class MyActivityResponse(BaseModel):
    activities: list[MyActivityItemResponse]
    total: int

    # 신뢰점수 계산용 (내가 받은 경고 전체, 최신순)
    warnings: list[MyWarningResponse] = []