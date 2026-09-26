from app.repositories.club_event_repository import (
    ClubEventRepository,
)
from app.repositories.match_repository import (
    MatchRepository,
)
from app.repositories.my_event_repository import (
    MyEventRepository,
)
from app.schemas.my_events import (
    MyEventClubResponse,
    MyEventItemResponse,
    MyEventListResponse,
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

    # -----------------------------------------------------
    # 한 동호회의 일정 행 모으기
    #
    # get_events 의 2~6단계와 같은 규칙
    # (동호회 일정 + 승인된 팀매칭 일정, 취소 일정 제외)
    # -----------------------------------------------------
    def collect_club_event_rows(
        self,
        club_id: int,
    ) -> list[dict]:

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

        match_event_ids = list({
            int(match["event_id"])
            for match in approved_matches
            if match.get("event_id") is not None
        })

        match_event_rows = (
            self.event_repository
            .find_events_by_ids(
                event_ids=match_event_ids,
            )
        )

        event_map = {}

        for event_row in normal_event_rows + match_event_rows:
            event_map[int(event_row["event_id"])] = event_row

        return list(event_map.values())

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

        for club in clubs:

            for event_row in self.collect_club_event_rows(
                club.club_id
            ):
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
                )
            )

        return MyEventListResponse(
            year=year,
            month=month,
            clubs=clubs,
            events=events,
            total=len(events),
        )