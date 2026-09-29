from app.repositories.club_event_repository import (
    ClubEventRepository,
)
from app.repositories.club_member_repository import (
    ClubMemberRepository,
)
from app.repositories.match_repository import (
    MatchRepository,
)
from app.repositories.my_event_repository import (
    MyEventRepository,
)
from datetime import date, datetime, timezone

from app.schemas.my_events import (
    MyActivityItemResponse,
    MyActivityResponse,
    MyWarningResponse,
    MyEventClubResponse,
    MyEventItemResponse,
    MyEventListResponse,
    MyGuestEventItemResponse,
    MyGuestEventListResponse,
)


# ---------------------------------------------------------
# 운영자 역할 (마이페이지 /api/clubs/my 와 같은 기준)
# ---------------------------------------------------------
OPERATOR_ROLES = {
    "owner",
    "manager",
    "동호회장",
    "운영진",
}


# ---------------------------------------------------------
# 내 동호회 전체 일정 Service
#
# 기존 club_event_service.py 는 건드리지 않고,
# 기존 Repository 의 조회 함수만 가져다 쓴다.
# ---------------------------------------------------------
class MyEventService:

    def __init__(self):
        self.my_event_repository = MyEventRepository()
        self.event_repository = ClubEventRepository()
        self.match_repository = MatchRepository()

        # 팀원 멤버 상세 통계와 같은 투표 조회 함수를 재사용
        self.club_member_repository = ClubMemberRepository()

    # -----------------------------------------------------
    # 한 동호회의 일정 행 모으기
    #
    # get_events 의 2~6단계와 같은 규칙
    # (동호회 일정 + 승인된 팀매칭 일정, 취소 일정 제외)
    #
    # 반환: (일정 목록, {event_id: club_match_id})
    # -----------------------------------------------------
    def collect_club_event_rows(
        self,
        club_id: int,
    ) -> tuple[list[dict], dict[int, int]]:

        normal_event_rows = (
            self.event_repository
            .find_events_by_club(club_id)
        )

        approved_matches = (
            self.match_repository
            .find_approved_matches_by_club(
                club_id=club_id,
            )
        )

        # 팀매칭 일정 event_id → club_match_id
        match_id_by_event = {
            int(match["event_id"]): int(match["club_match_id"])
            for match in approved_matches
            if match.get("event_id") is not None
            and match.get("club_match_id") is not None
        }

        match_event_ids = list(match_id_by_event.keys())

        match_event_rows = (
            self.event_repository
            .find_events_by_ids(
                event_ids=match_event_ids,
            )
        )

        event_map = {}

        for event_row in normal_event_rows + match_event_rows:
            event_map[int(event_row["event_id"])] = event_row

        return list(event_map.values()), match_id_by_event

    # -----------------------------------------------------
    # 여러 일정에 대한 "내" 참석 투표 응답
    #
    # 반환 예: {12: "참석", 15: "불참"}
    # 투표가 없거나 응답이 없으면 결과에 포함되지 않는다.
    # -----------------------------------------------------
    def build_my_attendance_by_event(
        self,
        event_ids: list[int],
        user_id: str,
    ) -> dict[int, str]:

        if not event_ids:
            return {}

        vote_rows = (
            self.event_repository
            .find_attendance_votes_by_event_ids(event_ids)
        )

        # 일정마다 가장 최근 참석 투표 사용 (get_events와 동일)
        vote_id_by_event = {}

        for vote_row in vote_rows:
            event_id = int(vote_row["event_id"])
            vote_id = int(vote_row["vote_id"])

            if vote_id > vote_id_by_event.get(event_id, -1):
                vote_id_by_event[event_id] = vote_id

        if not vote_id_by_event:
            return {}

        vote_ids = list(vote_id_by_event.values())

        event_id_by_vote = {
            vote_id: event_id
            for event_id, vote_id in vote_id_by_event.items()
        }

        option_text_by_id = {
            int(option_row["option_id"]): str(
                option_row["option_text"]
            ).strip()
            for option_row in (
                self.event_repository
                .find_vote_options_by_vote_ids(vote_ids)
            )
        }

        # 내 응답 중 투표별 최신 응답만
        latest_by_vote = {}

        for response_row in (
            self.event_repository
            .find_vote_responses_by_vote_ids(vote_ids)
        ):
            if str(response_row["user_id"]) != str(user_id):
                continue

            vote_id = int(response_row["vote_id"])

            current = latest_by_vote.get(vote_id)

            if (
                current is None
                or int(response_row["response_id"])
                > int(current["response_id"])
            ):
                latest_by_vote[vote_id] = response_row

        result = {}

        for vote_id, response_row in latest_by_vote.items():
            option_text = option_text_by_id.get(
                int(response_row["option_id"])
            )

            if option_text:
                result[event_id_by_vote[vote_id]] = option_text

        return result

    # -----------------------------------------------------
    # 내 동호회 전체 일정 (월별)
    #
    # 1. 내가 활동 중인 동호회 목록
    # 2. 동호회마다 일정 모으기 (팀매칭 포함)
    # 3. 해당 월만 남기기 + 중복 제거
    # 4. 날짜 / 시간 순 정렬
    # 5. 내 참석 응답 붙이기
    # -----------------------------------------------------
    def get_my_events(
        self,
        user_id: str,
        year: int,
        month: int,
    ) -> MyEventListResponse:

        # 1. 내 동호회
        my_clubs = (
            self.my_event_repository
            .find_active_clubs_by_user(user_id)
        )

        clubs = [
            MyEventClubResponse(
                club_id=club["club_id"],
                club_name=club["club_name"],
                is_operator=(
                    club.get("role")
                    in OPERATOR_ROLES
                ),
            )
            for club in my_clubs
        ]

        # 2 ~ 3. 동호회별 일정 → 해당 월만
        month_prefix = f"{year:04d}-{month:02d}-"

        event_rows_by_id = {}
        club_by_event_id = {}
        match_id_by_event = {}

        for club in clubs:

            club_event_rows, club_match_ids = (
                self.collect_club_event_rows(club.club_id)
            )

            for event_id, club_match_id in club_match_ids.items():
                match_id_by_event.setdefault(event_id, club_match_id)

            for event_row in club_event_rows:
                event_id = int(event_row["event_id"])

                if not str(
                    event_row.get("event_date", "")
                ).startswith(month_prefix):
                    continue

                # 내 동호회 두 곳이 팀매칭한 일정이면
                # 먼저 찾은 동호회 기준으로 한 번만 표시
                if event_id in event_rows_by_id:
                    continue

                event_rows_by_id[event_id] = event_row
                club_by_event_id[event_id] = club

        # 4. 정렬
        event_rows = sorted(
            event_rows_by_id.values(),
            key=lambda event: (
                str(event.get("event_date", "")),
                str(event.get("start_time", "") or ""),
            ),
        )

        # 5. 내 참석 응답
        my_attendance_by_event = (
            self.build_my_attendance_by_event(
                event_ids=[
                    int(event_row["event_id"])
                    for event_row in event_rows
                ],
                user_id=user_id,
            )
        )

        events = []

        for event_row in event_rows:
            event_id = int(event_row["event_id"])
            club = club_by_event_id[event_id]

            events.append(
                MyEventItemResponse(
                    event_id=event_id,
                    club_id=club.club_id,
                    club_name=club.club_name,
                    is_operator=club.is_operator,
                    title=event_row["title"],
                    event_date=event_row["event_date"],
                    start_time=event_row["start_time"],
                    end_time=event_row.get("end_time"),
                    location=event_row.get("location"),
                    event_type=event_row["event_type"],
                    status=event_row["status"],
                    my_attendance=my_attendance_by_event.get(
                        event_id
                    ),
                    club_match_id=match_id_by_event.get(event_id),
                )
            )

        return MyEventListResponse(
            year=year,
            month=month,
            clubs=clubs,
            events=events,
            total=len(events),
        )

    # -----------------------------------------------------
    # Supabase 날짜 문자열 → datetime
    #
    # club_member_service._parse_datetime 과 같은 규칙
    # (시간대가 없으면 UTC로 본다)
    # -----------------------------------------------------
    @staticmethod
    def parse_datetime(value) -> datetime | None:

        if value is None:
            return None

        if isinstance(value, datetime):
            parsed = value
        else:
            parsed = datetime.fromisoformat(
                str(value).replace("Z", "+00:00")
            )

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        return parsed

    # -----------------------------------------------------
    # 일정별 "가입 이후에 만들어진 참석 투표"가 있는지
    #
    # 팀원 club_member_service._get_eligible_votes 와 같은 기준:
    #   투표 생성일 >= 가입일 이면 집계 대상
    #   (가입일 / 생성일을 모르면 대상에 포함)
    #
    # 반환: 집계 대상인 event_id 집합
    # -----------------------------------------------------
    def find_vote_eligible_event_ids(
        self,
        event_ids: list[int],
        joined_at_by_event: dict[int, str | None],
    ) -> set[int]:

        if not event_ids:
            return set()

        vote_rows = (
            self.club_member_repository
            .find_event_votes(event_ids)
        )

        # 일정마다 가장 최근 참석 투표
        latest_vote_by_event = {}

        for vote_row in vote_rows:

            if vote_row.get("vote_type") != "attendance":
                continue

            event_id = int(vote_row["event_id"])
            current = latest_vote_by_event.get(event_id)

            if (
                current is None
                or int(vote_row["vote_id"]) > int(current["vote_id"])
            ):
                latest_vote_by_event[event_id] = vote_row

        eligible_event_ids = set()

        for event_id, vote_row in latest_vote_by_event.items():

            joined_at = self.parse_datetime(
                joined_at_by_event.get(event_id)
            )
            vote_created_at = self.parse_datetime(
                vote_row.get("created_at")
            )

            if (
                joined_at is None
                or vote_created_at is None
                or vote_created_at >= joined_at
            ):
                eligible_event_ids.add(event_id)

        return eligible_event_ids

    # -----------------------------------------------------
    # 내 활동 (지난 일정 전체)
    #
    # 1. 내가 활동 중인 동호회 + 가입일
    # 2. 동호회마다 일정 모으기 (팀매칭 포함)
    # 3. 어제까지의 일정만 남기기
    # 4. 집계 대상 판단 (팀원 멤버 상세 통계와 같은 기준)
    #    - 일반 일정: 참석 투표가 가입 이후에 만들어졌는지
    #    - 팀매칭:    경기 날짜가 가입일 이후인지
    # 5. 내 참석 응답 붙이기
    # 6. 최신순 정렬
    #
    # ※ 오늘 일정은 아직 진행 전일 수 있어서 제외
    # -----------------------------------------------------
    def get_my_activity(
        self,
        user_id: str,
    ) -> MyActivityResponse:

        # 1. 내 동호회
        my_clubs = (
            self.my_event_repository
            .find_active_clubs_by_user(user_id)
        )

        sport_names_by_club = (
            self.my_event_repository
            .find_sport_names_by_club_ids(
                [club["club_id"] for club in my_clubs]
            )
        )

        today_string = date.today().isoformat()

        event_rows_by_id = {}
        club_by_event_id = {}
        match_event_ids = set()

        for club in my_clubs:

            # 2. 일정 모으기
            club_event_rows, club_match_ids = (
                self.collect_club_event_rows(club["club_id"])
            )

            match_event_ids.update(club_match_ids.keys())

            for event_row in club_event_rows:
                event_id = int(event_row["event_id"])
                event_date = str(event_row.get("event_date", ""))[:10]

                # 3. 지난 일정만 (오늘 제외)
                if not event_date or event_date >= today_string:
                    continue

                # 두 내 동호회가 붙은 팀매칭은 한 번만
                if event_id in event_rows_by_id:
                    continue

                event_rows_by_id[event_id] = event_row
                club_by_event_id[event_id] = club

        # 4. 집계 대상 판단
        vote_eligible_event_ids = self.find_vote_eligible_event_ids(
            event_ids=[
                event_id
                for event_id in event_rows_by_id
                if event_id not in match_event_ids
            ],
            joined_at_by_event={
                event_id: club.get("joined_at")
                for event_id, club in club_by_event_id.items()
            },
        )

        for event_id in list(event_rows_by_id.keys()):
            event_row = event_rows_by_id[event_id]
            club = club_by_event_id[event_id]

            is_match = (
                event_id in match_event_ids
                or event_row.get("event_type") == "match"
            )

            joined_date = str(club.get("joined_at") or "")[:10]
            event_date = str(event_row.get("event_date", ""))[:10]

            # 팀매칭: 가입 전에 열린 경기는 제외
            if is_match and joined_date and event_date < joined_date:
                del event_rows_by_id[event_id]

            # 일반 일정: 가입 전 투표 + 가입 전 날짜면 제외
            # (가입 후 투표가 있거나, 투표 없이 가입 후 날짜인 일정은 유지)
            elif (
                not is_match
                and event_id not in vote_eligible_event_ids
                and joined_date
                and event_date < joined_date
            ):
                del event_rows_by_id[event_id]

        # 5. 내 참석 응답 (일반 일정만 투표가 있음)
        my_attendance_by_event = (
            self.build_my_attendance_by_event(
                event_ids=list(event_rows_by_id.keys()),
                user_id=user_id,
            )
        )

        # 6. 최신순
        event_rows = sorted(
            event_rows_by_id.values(),
            key=lambda event: (
                str(event.get("event_date", "")),
                str(event.get("start_time", "") or ""),
            ),
            reverse=True,
        )

        activities = []

        for event_row in event_rows:
            event_id = int(event_row["event_id"])
            club = club_by_event_id[event_id]

            club_sports = sport_names_by_club.get(club["club_id"], [])

            is_match = (
                event_id in match_event_ids
                or event_row.get("event_type") == "match"
            )

            activities.append(
                MyActivityItemResponse(
                    event_id=event_id,
                    club_id=club["club_id"],
                    club_name=club["club_name"],
                    title=event_row["title"],
                    event_date=event_row["event_date"],
                    start_time=event_row["start_time"],
                    end_time=event_row.get("end_time"),
                    location=event_row.get("location"),
                    sport_name=club_sports[0] if club_sports else None,
                    is_match=is_match,
                    my_attendance=(
                        None
                        if is_match
                        else my_attendance_by_event.get(event_id)
                    ),
                    vote_eligible=(
                        not is_match
                        and event_id in vote_eligible_event_ids
                    ),
                )
            )

        # 7. 내가 받은 경고 (신뢰점수 계산용)
        warnings = [
            MyWarningResponse(
                warning_id=int(row["warning_id"]),
                club_id=int(row["club_id"]),
                club_name=row["club_name"],
                warning_type=str(row.get("warning_type") or "other"),
                reason=row.get("reason"),
                created_at=(
                    str(row["created_at"])
                    if row.get("created_at")
                    else None
                ),
            )
            for row in (
                self.my_event_repository
                .find_warnings_by_user(user_id)
            )
        ]

        return MyActivityResponse(
            activities=activities,
            total=len(activities),
            warnings=warnings,
        )

    # -----------------------------------------------------
    # 내가 게스트로 신청 / 참여한 일정 모으기
    #
    # 1. 내 게스트 신청 상태 (pending / joined, 일정별 최신)
    # 2. 일정 조회 (취소된 일정 제외)
    # 3. 기간 필터 (YYYY-MM-DD 문자열 비교)
    # 4. 상대 동호회 이름 / 참여 확정 게스트 수 붙이기
    # 5. 날짜 / 시간 순 정렬
    #
    # 반환: MyGuestEventItemResponse 목록
    # -----------------------------------------------------
    def collect_my_guest_events(
        self,
        user_id: str,
        from_date: str | None = None,
        to_date: str | None = None,
    ) -> list[MyGuestEventItemResponse]:

        # 1. 내 게스트 신청 상태
        guest_status_by_event = (
            self.my_event_repository
            .find_guest_status_by_event(user_id)
        )

        if not guest_status_by_event:
            return []

        # 2. 일정 (find_events_by_ids 는 취소 일정을 빼고 준다)
        event_rows = (
            self.event_repository
            .find_events_by_ids(
                event_ids=list(guest_status_by_event.keys()),
            )
        )

        # 3. 기간 필터
        filtered_rows = []

        for event_row in event_rows:
            event_date = str(event_row.get("event_date", ""))[:10]

            if not event_date:
                continue

            if from_date and event_date < from_date:
                continue

            if to_date and event_date > to_date:
                continue

            filtered_rows.append(event_row)

        if not filtered_rows:
            return []

        # 4. 동호회 이름 / 게스트 수
        club_name_by_id = (
            self.my_event_repository
            .find_club_names_by_ids(
                list({
                    int(row["club_id"])
                    for row in filtered_rows
                    if row.get("club_id") is not None
                })
            )
        )

        joined_guest_count_by_event = (
            self.my_event_repository
            .count_joined_guests_by_event_ids(
                [int(row["event_id"]) for row in filtered_rows]
            )
        )

        # 5. 정렬
        filtered_rows.sort(
            key=lambda event: (
                str(event.get("event_date", "")),
                str(event.get("start_time", "") or ""),
            ),
        )

        guest_events = []

        for event_row in filtered_rows:
            event_id = int(event_row["event_id"])
            club_id = int(event_row["club_id"])

            registration_deadline = event_row.get(
                "registration_deadline"
            )

            guest_events.append(
                MyGuestEventItemResponse(
                    event_id=event_id,
                    club_id=club_id,
                    club_name=club_name_by_id.get(
                        club_id, "알 수 없는 동호회"
                    ),
                    title=event_row.get("title") or "게스트 일정",
                    description=event_row.get("description"),
                    event_date=event_row["event_date"],
                    start_time=event_row["start_time"],
                    end_time=event_row.get("end_time"),
                    location=event_row.get("location"),
                    event_image_url=event_row.get("event_image_url"),
                    event_type=event_row.get("event_type"),
                    status=event_row.get("status") or "open",
                    max_guests=event_row.get("max_guests"),
                    joined_guest_count=(
                        joined_guest_count_by_event.get(event_id, 0)
                    ),
                    registration_deadline=(
                        str(registration_deadline)
                        if registration_deadline
                        else None
                    ),
                    guest_status=guest_status_by_event[event_id],
                )
            )

        return guest_events

    # -----------------------------------------------------
    # 내 게스트 일정 (기간 선택)
    #
    # GET /api/users/me/guest-events
    #   ?from_date=2026-09-28&to_date=2026-10-04
    #
    # 기간을 안 보내면 게스트로 신청 / 참여한 일정 전체
    # -----------------------------------------------------
    def get_my_guest_events(
        self,
        user_id: str,
        from_date: date | None = None,
        to_date: date | None = None,
    ) -> MyGuestEventListResponse:

        guest_events = self.collect_my_guest_events(
            user_id=user_id,
            from_date=from_date.isoformat() if from_date else None,
            to_date=to_date.isoformat() if to_date else None,
        )

        return MyGuestEventListResponse(
            events=guest_events,
            total=len(guest_events),
        )
