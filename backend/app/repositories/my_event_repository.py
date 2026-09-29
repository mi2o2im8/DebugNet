from app.core.supabase import get_supabase_admin_client


# ---------------------------------------------------------
# 내 동호회 전체 일정용 Repository
#
# 기존 club_repository.py 를 건드리지 않도록
# 이 기능에 필요한 조회만 따로 둔다.
# ---------------------------------------------------------
class MyEventRepository:

    def __init__(self):
        self.admin_client = get_supabase_admin_client()

    # -----------------------------------------------------
    # 내가 활동 중인 동호회 목록
    #
    # club_members(active) + clubs(status=True)
    # 반환 예: [{"club_id": 1, "club_name": "강서 FC",
    #           "role": "owner", "joined_at": "2026-09-01T..."}]
    # -----------------------------------------------------
    def find_active_clubs_by_user(
        self,
        user_id: str,
    ) -> list[dict]:

        member_response = (
            self.admin_client
            .table("club_members")
            .select("club_id, role, joined_at")
            .eq("user_id", user_id)
            .eq("status", "active")
            .order("joined_at", desc=False)
            .execute()
        )

        members = member_response.data or []

        if not members:
            return []

        club_ids = [member["club_id"] for member in members]

        club_response = (
            self.admin_client
            .table("clubs")
            .select("club_id, club_name")
            .in_("club_id", club_ids)
            .eq("status", True)
            .execute()
        )

        club_name_by_id = {
            club["club_id"]: club["club_name"]
            for club in (club_response.data or [])
        }

        return [
            {
                "club_id": member["club_id"],
                "club_name": club_name_by_id[member["club_id"]],
                "role": member.get("role"),
                "joined_at": member.get("joined_at"),
            }
            for member in members
            if member["club_id"] in club_name_by_id
        ]

    # -----------------------------------------------------
    # 동호회별 운동 종목 이름
    #
    # club_sports + sports
    # 반환 예: {1: ["축구ㆍ풋살"], 2: ["농구", "배구"]}
    # -----------------------------------------------------
    def find_sport_names_by_club_ids(
        self,
        club_ids: list[int],
    ) -> dict[int, list[str]]:

        if not club_ids:
            return {}

        club_sport_response = (
            self.admin_client
            .table("club_sports")
            .select("club_id, sport_id")
            .in_("club_id", club_ids)
            .execute()
        )

        club_sports = club_sport_response.data or []

        sport_ids = list({
            row["sport_id"]
            for row in club_sports
            if row.get("sport_id") is not None
        })

        if not sport_ids:
            return {}

        sport_response = (
            self.admin_client
            .table("sports")
            .select("sport_id, sport_name")
            .in_("sport_id", sport_ids)
            .execute()
        )

        sport_name_by_id = {
            row["sport_id"]: row["sport_name"]
            for row in (sport_response.data or [])
        }

        result: dict[int, list[str]] = {}

        for row in club_sports:
            sport_name = sport_name_by_id.get(row.get("sport_id"))

            if sport_name:
                result.setdefault(row["club_id"], []).append(sport_name)

        return result

    # -----------------------------------------------------
    # 내가 받은 운영진 경고 (club_member_warnings)
    #
    # 팀원이 만든 멤버 경고 기능이 저장하는 테이블을
    # "내 것만" 읽는다. (탈퇴한 동호회 경고도 포함)
    # 최신순
    # -----------------------------------------------------
    def find_warnings_by_user(
        self,
        user_id: str,
    ) -> list[dict]:

        warning_response = (
            self.admin_client
            .table("club_member_warnings")
            .select("warning_id, club_id, warning_type, reason, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        warnings = warning_response.data or []

        if not warnings:
            return []

        club_ids = list({row["club_id"] for row in warnings})

        club_response = (
            self.admin_client
            .table("clubs")
            .select("club_id, club_name")
            .in_("club_id", club_ids)
            .execute()
        )

        club_name_by_id = {
            row["club_id"]: row["club_name"]
            for row in (club_response.data or [])
        }

        return [
            {
                **row,
                "club_name": club_name_by_id.get(row["club_id"], "알 수 없는 동호회"),
            }
            for row in warnings
        ]

    # -----------------------------------------------------
    # 내가 게스트로 신청 / 참여한 일정 (event_participants)
    #
    # participant_type = "guest"
    # status: pending(승인 대기) / joined(참여 확정) 만
    #         rejected / cancelled 는 일정에 보여주지 않는다.
    #
    # 같은 일정에 신청 기록이 여러 개면 가장 최근 것만 사용
    # 반환 예: {12: "joined", 15: "pending"}
    # -----------------------------------------------------
    def find_guest_status_by_event(
        self,
        user_id: str,
    ) -> dict[int, str]:

        response = (
            self.admin_client
            .table("event_participants")
            .select("event_participant_id, event_id, status")
            .eq("user_id", user_id)
            .eq("participant_type", "guest")
            .order("event_participant_id", desc=True)
            .execute()
        )

        result: dict[int, str] = {}

        # 최신 신청부터 보면서 일정마다 첫 번째(=최신)만 사용
        seen_event_ids: set[int] = set()

        for row in response.data or []:
            event_id = int(row["event_id"])

            if event_id in seen_event_ids:
                continue

            seen_event_ids.add(event_id)

            if row.get("status") in ("pending", "joined"):
                result[event_id] = row["status"]

        return result

    # -----------------------------------------------------
    # 일정별 참여 확정된 게스트 수
    #
    # 반환 예: {12: 2, 15: 0}
    # -----------------------------------------------------
    def count_joined_guests_by_event_ids(
        self,
        event_ids: list[int],
    ) -> dict[int, int]:

        if not event_ids:
            return {}

        response = (
            self.admin_client
            .table("event_participants")
            .select("event_id")
            .in_("event_id", event_ids)
            .eq("participant_type", "guest")
            .eq("status", "joined")
            .execute()
        )

        result: dict[int, int] = {}

        for row in response.data or []:
            event_id = int(row["event_id"])
            result[event_id] = result.get(event_id, 0) + 1

        return result

    # -----------------------------------------------------
    # 동호회 이름 (게스트 일정의 상대 동호회용)
    #
    # 게스트 일정은 내가 가입하지 않은 동호회라서
    # find_active_clubs_by_user 로는 이름을 알 수 없다.
    # -----------------------------------------------------
    def find_club_names_by_ids(
        self,
        club_ids: list[int],
    ) -> dict[int, str]:

        if not club_ids:
            return {}

        response = (
            self.admin_client
            .table("clubs")
            .select("club_id, club_name")
            .in_("club_id", club_ids)
            .execute()
        )

        return {
            int(row["club_id"]): row["club_name"]
            for row in (response.data or [])
        }
