from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.services.notification_scheduler_service import (
    KST,
    NotificationSchedulerService,
)


# ---------------------------------------------------------
# 예약 알림 스케줄러
#
# - 일정 당일 알림 : 매일 오전 8시 (한국 시간)
# - 투표 결과 알림 : 10분마다 마감된 투표 확인
#
# main.py 의 lifespan 에서 start / shutdown 한다.
# ---------------------------------------------------------
scheduler = BackgroundScheduler(timezone=KST)


def run_schedule_reminders() -> None:
    try:
        NotificationSchedulerService().send_schedule_reminders()

    except Exception as e:
        print("일정 당일 알림 작업 실패:", repr(e))


def run_vote_results() -> None:
    try:
        NotificationSchedulerService().send_vote_results()

    except Exception as e:
        print("투표 결과 알림 작업 실패:", repr(e))


def start_scheduler() -> None:

    if scheduler.running:
        return

    scheduler.add_job(
        run_schedule_reminders,
        CronTrigger(hour=8, minute=0, timezone=KST),
        id="schedule_reminder",
        replace_existing=True,
        misfire_grace_time=60 * 30,
        coalesce=True,
    )

    scheduler.add_job(
        run_vote_results,
        IntervalTrigger(minutes=10),
        id="vote_result",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )

    scheduler.start()

    # 서버가 오전 8시 이후에 (재)시작된 경우를 대비해
    # 시작할 때 한 번씩 바로 실행한다.
    # 이미 보낸 알림은 다시 보내지 않으므로 여러 번 실행돼도 안전하다.
    if datetime.now(KST).hour >= 8:
        scheduler.add_job(run_schedule_reminders, id="schedule_reminder_on_start")

    scheduler.add_job(run_vote_results, id="vote_result_on_start")


def shutdown_scheduler() -> None:

    if scheduler.running:
        scheduler.shutdown(wait=False)
