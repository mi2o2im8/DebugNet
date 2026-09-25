from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from app.repositories.club_event_repository import (
    ClubEventRepository,
)
from app.repositories.club_repository import ClubRepository
from app.services.club_event_service import ClubEventService


KST = ZoneInfo("Asia/Seoul")

# 서버가 꺼져 있다가 켜졌을 때,
# 이 시간 안에 마감된 투표까지만 결과 알림을 보낸다.
# (오래된 투표에 뒤늦게 알림이 쏟아지는 것 방지)
VOTE_RESULT_LOOKBACK = timedelta(hours=24)


class NotificationSchedulerService:
    """
    정해진 시각에 실행되는 알림

    - schedule_reminder : 일정 당일 아침, 참석자에게 알림
    - vote_result       : 참석 투표 마감 후, 동호회 회원에게 결과 알림

    두 작업 모두 '이미 보낸 알림'을 확인하고 보내기 때문에
    여러 번 실행되거나 서버가 재시작돼도 같은 알림이 중복으로 가지 않는다.
    """

    def __init__(self):
        self.event_repository = ClubEventRepository()
        self.club_repository = ClubRepository()
        self.event_service = ClubEventService()

    # -----------------------------------------------------
    # 공통: 동호회 이름
    # -----------------------------------------------------
    def get_club_name(
        self,
        club_id: int,
    ) -> str:

        try:
            club = self.club_repository.find_club_by_id(club_id)
            return club.get("club_name") if club else "동호회"

        except Exception:
            return "동호회"

    # -----------------------------------------------------
    # 공통: "19:00:00" → "19:00"
    # -----------------------------------------------------
    @staticmethod
    def format_time_label(
        value,
    ) -> str:

        if not value:
            return ""

        return str(value)[:5]

    # =====================================================
    # 1. 일정 당일 알림 (schedule_reminder)
    #
    # 대상:
    # - 참석 투표에서 '참석'을 고른 회원
    # - 참가가 확정(joined)된 게스트
    # =====================================================
    def send_schedule_reminders(self) -> int:

        now = datetime.now(KST)
        today = now.date()

        events = self.event_repository.find_events_on_date(
            today.isoformat()
        )

        if not events:
            return 0

        event_ids = [int(event["event_id"]) for event in events]

        already_sent = (
            self.event_repository
            .find_sent_event_notification_keys(
                notification_type="schedule_reminder",
                event_ids=event_ids,
            )
        )

        participant_rows = (
            self.event_repository
            .find_participants_by_event_ids(event_ids)
        )

        sent_count = 0

        for event in events:

            try:
                event_id = int(event["event_id"])
                club_id = int(event["club_id"])

                # 이미 시작한 일정은 건너뜀
                # (서버가 늦게 켜졌을 때 지난 일정 알림 방지)
                if event.get("start_time"):
                    start_at = datetime.combine(
                        today,
                        time.fromisoformat(str(event["start_time"])[:8]),
                        tzinfo=KST,
                    )

                    if start_at <= now:
                        continue

                # 참석으로 응답한 회원
                status_by_user = (
                    self.event_service
                    .build_attendance_status_by_user(event_id)
                )

                recipient_ids = {
                    str(uid)
                    for uid, status in status_by_user.items()
                    if status == "attending"
                }

                # 참가 확정된 게스트
                recipient_ids.update(
                    str(row["user_id"])
                    for row in participant_rows
                    if int(row["event_id"]) == event_id
                    and row.get("participant_type") == "guest"
                    and row.get("status") == "joined"
                    and row.get("user_id")
                )

                recipient_ids = [
                    uid for uid in recipient_ids
                    if (uid, event_id) not in already_sent
                ]

                if not recipient_ids:
                    continue

                club_name = self.get_club_name(club_id)
                start_label = self.format_time_label(
                    event.get("start_time")
                )
                time_text = f" {start_label}" if start_label else ""

                self.event_repository.create_event_notifications(
                    user_ids=recipient_ids,
                    notification_type="schedule_reminder",
                    title="오늘 일정이 있어요",
                    content=(
                        f"[{club_name}] 오늘{time_text} "
                        f"'{event.get('title') or '일정'}' "
                        "일정이 있어요. 잊지 마세요!"
                    ),
                    event_id=event_id,
                    link_path="/myschedule",
                )

                sent_count += len(recipient_ids)

            except Exception as e:
                # 한 일정이 실패해도 나머지 일정은 계속 처리
                print(
                    "일정 당일 알림 실패:",
                    event.get("event_id"),
                    repr(e),
                )

        return sent_count

    # =====================================================
    # 2. 투표 결과 알림 (vote_result)
    #
    # 대상: 해당 동호회의 활성 회원 전체
    # =====================================================
    def send_vote_results(self) -> int:

        # ⭐ event_votes.deadline 에는 화면에서 입력한 한국 시각이
        #    "+00" 이 붙은 채로 저장돼 있다. (예: 23:59 입력 → 23:59+00)
        #    그래서 비교할 때도 '지금 한국 시각'에 +00 을 붙여서 비교한다.
        now = datetime.now(KST).replace(tzinfo=timezone.utc)

        votes = (
            self.event_repository
            .find_attendance_votes_closed_between(
                start_at=(now - VOTE_RESULT_LOOKBACK).isoformat(),
                end_at=now.isoformat(),
            )
        )

        if not votes:
            return 0

        event_ids = list({int(vote["event_id"]) for vote in votes})

        already_sent = (
            self.event_repository
            .find_sent_event_notification_keys(
                notification_type="vote_result",
                event_ids=event_ids,
            )
        )

        events = {
            int(event["event_id"]): event
            for event in (
                self.event_repository.find_events_by_ids(event_ids)
            )
        }

        sent_count = 0

        for event_id in event_ids:

            # 취소된 일정은 find_events_by_ids에서 제외됨
            event = events.get(event_id)

            if event is None:
                continue

            try:
                club_id = int(event["club_id"])

                member_ids = [
                    str(uid)
                    for uid in (
                        self.event_repository
                        .find_active_member_user_ids(club_id=club_id)
                    )
                    if (str(uid), event_id) not in already_sent
                ]

                if not member_ids:
                    continue

                status_by_user = (
                    self.event_service
                    .build_attendance_status_by_user(event_id)
                )

                statuses = list(status_by_user.values())
                attending = statuses.count("attending")
                absent = statuses.count("absent")

                club_name = self.get_club_name(club_id)

                self.event_repository.create_event_notifications(
                    user_ids=member_ids,
                    notification_type="vote_result",
                    title="참석 투표가 마감됐어요",
                    content=(
                        f"[{club_name}] "
                        f"'{event.get('title') or '일정'}' "
                        f"참석 {attending}명 · 불참 {absent}명으로 "
                        "마감됐어요."
                    ),
                    event_id=event_id,
                    link_path=(
                        f"/clubs/{club_id}/events/"
                        f"{event_id}/attendance"
                    ),
                )

                sent_count += len(member_ids)

            except Exception as e:
                print(
                    "투표 결과 알림 실패:",
                    event_id,
                    repr(e),
                )

        return sent_count
