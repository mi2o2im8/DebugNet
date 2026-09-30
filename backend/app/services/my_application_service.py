from datetime import datetime
from zoneinfo import ZoneInfo

from app.repositories.my_application_repository import (
    MyApplicationRepository,
)
from app.schemas.my_applications import (
    MyApplicationsResponse,
    MyClubApplicationItemResponse,
    MyGuestApplicationItemResponse,
    ReceivedApplicationsResponse,
    ReceivedClubApplicationItemResponse,
    ReceivedGuestApplicationItemResponse,
)


KST = ZoneInfo("Asia/Seoul")


class MyApplicationService:

    def __init__(self):
        self.repository = MyApplicationRepository()

    # -----------------------------------------------------
    # 동호회 가입 신청
    #
    # 같은 동호회에 여러 번 신청했으면 가장 최근 신청만 보여준다.
    # -----------------------------------------------------
    def collect_club_applications(
        self,
        user_id: str,
    ) -> list[MyClubApplicationItemResponse]:

        rows = (
            self.repository
            .find_club_applications_by_user(user_id)
        )

        # 최신순으로 받았으므로 동호회마다 첫 번째만
        latest_rows = []
        seen_club_ids: set[int] = set()

        for row in rows:
            club_id = int(row["club_id"])

            if club_id in seen_club_ids:
                continue

            seen_club_ids.add(club_id)
            latest_rows.append(row)

        if not latest_rows:
            return []

        club_ids = list(seen_club_ids)

        club_name_by_id = (
            self.repository.find_club_names_by_ids(club_ids)
        )

        image_by_club_id = (
            self.repository
            .find_representative_images_by_club_ids(club_ids)
        )

        active_club_ids = (
            self.repository
            .find_active_club_ids_by_user(user_id)
        )

        return [
            MyClubApplicationItemResponse(
                application_id=int(row["application_id"]),
                club_id=int(row["club_id"]),
                club_name=club_name_by_id.get(
                    int(row["club_id"]),
                    "알 수 없는 동호회",
                ),
                club_image_url=image_by_club_id.get(
                    int(row["club_id"])
                ),
                status=row.get("status") or "pending",
                is_active_member=(
                    int(row["club_id"]) in active_club_ids
                ),
                created_at=row.get("created_at"),
                decided_at=row.get("decided_at"),
            )
            for row in latest_rows
        ]

    # -----------------------------------------------------
    # 게스트 신청
    #
    # 같은 일정에 여러 번 신청했으면 가장 최근 신청만 보여준다.
    # 정렬: 일정 날짜 최신순
    # -----------------------------------------------------
    def collect_guest_applications(
        self,
        user_id: str,
    ) -> list[MyGuestApplicationItemResponse]:

        rows = (
            self.repository
            .find_guest_applications_by_user(user_id)
        )

        latest_by_event: dict[int, dict] = {}

        for row in rows:
            event_id = int(row["event_id"])

            if event_id not in latest_by_event:
                latest_by_event[event_id] = row

        if not latest_by_event:
            return []

        event_rows = self.repository.find_events_by_ids(
            list(latest_by_event.keys())
        )

        club_name_by_id = self.repository.find_club_names_by_ids(
            list({
                int(event["club_id"])
                for event in event_rows
                if event.get("club_id") is not None
            })
        )

        event_rows.sort(
            key=lambda event: (
                str(event.get("event_date", "")),
                str(event.get("start_time", "") or ""),
            ),
            reverse=True,
        )

        items = []

        for event in event_rows:
            event_id = int(event["event_id"])
            club_id = int(event["club_id"])
            participant = latest_by_event[event_id]

            deadline = event.get("registration_deadline")

            items.append(
                MyGuestApplicationItemResponse(
                    event_participant_id=int(
                        participant["event_participant_id"]
                    ),
                    event_id=event_id,
                    club_id=club_id,
                    club_name=club_name_by_id.get(
                        club_id,
                        "알 수 없는 동호회",
                    ),
                    title=event.get("title") or "게스트 일정",
                    description=event.get("description"),
                    event_date=event["event_date"],
                    start_time=event["start_time"],
                    end_time=event.get("end_time"),
                    location=event.get("location"),
                    event_image_url=event.get("event_image_url"),
                    max_guests=event.get("max_guests"),
                    registration_deadline=(
                        str(deadline) if deadline else None
                    ),
                    event_status=event.get("status") or "open",
                    guest_status=participant.get("status") or "pending",
                )
            )

        return items

    # -----------------------------------------------------
    # 신청 현황 전체
    # -----------------------------------------------------
    def get_my_applications(
        self,
        user_id: str,
    ) -> MyApplicationsResponse:

        return MyApplicationsResponse(
            club_applications=self.collect_club_applications(user_id),
            guest_applications=self.collect_guest_applications(user_id),
        )

    # =====================================================
    # ⭐ 받은 신청 (운영자용)
    #
    # 내가 운영하는 모든 동호회에 들어온
    #   - 승인 대기 가입 신청
    #   - 시작 전 일정의 승인 대기 게스트 신청
    # =====================================================
    def get_received_applications(
        self,
        user_id: str,
    ) -> ReceivedApplicationsResponse:

        club_ids = self.repository.find_operating_club_ids(user_id)

        if not club_ids:
            return ReceivedApplicationsResponse(
                is_operator=False,
                club_applications=[],
                guest_applications=[],
            )

        club_name_by_id = self.repository.find_club_names_by_ids(club_ids)

        # ---------------------------------------------
        # 1. 가입 신청
        # ---------------------------------------------
        club_rows = (
            self.repository.find_pending_club_applications(club_ids)
        )

        # ---------------------------------------------
        # 2. 게스트 신청 (아직 시작 안 한 일정만)
        # ---------------------------------------------
        now = datetime.now(KST)

        events = self.repository.find_upcoming_events_by_club_ids(
            club_ids=club_ids,
            from_date=now.date().isoformat(),
        )

        upcoming_event_by_id: dict[int, dict] = {}

        for event in events:
            try:
                start_at = datetime.fromisoformat(
                    f"{event['event_date']}T{event['start_time']}"
                ).replace(tzinfo=KST)
            except (TypeError, ValueError):
                continue

            if start_at > now:
                upcoming_event_by_id[int(event["event_id"])] = event

        guest_rows = self.repository.find_pending_guests_by_event_ids(
            list(upcoming_event_by_id.keys())
        )

        # ---------------------------------------------
        # 3. 신청자 프로필
        # ---------------------------------------------
        profile_by_user_id = self.repository.find_user_profiles_by_ids(
            list({
                row["user_id"]
                for row in [*club_rows, *guest_rows]
                if row.get("user_id")
            })
        )

        def profile_of(target_user_id: str) -> tuple[str, str | None]:
            profile = profile_by_user_id.get(target_user_id) or {}
            return (
                profile.get("nickname") or "알 수 없는 사용자",
                profile.get("profile_image"),
            )

        club_items = []

        for row in club_rows:
            nickname, profile_image = profile_of(row["user_id"])
            club_id = int(row["club_id"])

            club_items.append(
                ReceivedClubApplicationItemResponse(
                    application_id=int(row["application_id"]),
                    club_id=club_id,
                    club_name=club_name_by_id.get(club_id, "내 동호회"),
                    user_id=row["user_id"],
                    nickname=nickname,
                    profile_image=profile_image,
                    created_at=row.get("created_at"),
                )
            )

        guest_items = []

        for row in guest_rows:
            event = upcoming_event_by_id.get(int(row["event_id"]))

            if event is None:
                continue

            nickname, profile_image = profile_of(row["user_id"])
            club_id = int(event["club_id"])

            guest_items.append(
                ReceivedGuestApplicationItemResponse(
                    event_participant_id=int(row["event_participant_id"]),
                    event_id=int(event["event_id"]),
                    club_id=club_id,
                    club_name=club_name_by_id.get(club_id, "내 동호회"),
                    title=event.get("title") or "일정",
                    event_date=event["event_date"],
                    start_time=event["start_time"],
                    user_id=row["user_id"],
                    nickname=nickname,
                    profile_image=profile_image,
                )
            )

        # 가까운 일정부터
        guest_items.sort(
            key=lambda item: (
                str(item.event_date),
                str(item.start_time),
            )
        )

        return ReceivedApplicationsResponse(
            is_operator=True,
            club_applications=club_items,
            guest_applications=guest_items,
        )
