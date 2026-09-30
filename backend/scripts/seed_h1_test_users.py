"""Create or remove synthetic users for PlayBridge H1 verification.

Run from the backend directory so the existing .env is loaded:

    python scripts/seed_h1_test_users.py seed --target-club-id 27 --count 300
    python scripts/seed_h1_test_users.py cleanup --confirm H1_SEED_DELETE

This script must only be used against a development or test Supabase project.
"""

from __future__ import annotations

import argparse
import random
import secrets
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parent
if BACKEND_ROOT.name == "scripts":
    BACKEND_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.supabase import get_supabase_admin_client  # noqa: E402


SEED_EMAIL_PREFIX = "h1_seed_"
SEED_EMAIL_DOMAIN = "playbridge.test"
DEFAULT_RANDOM_SEED = 20260930

USER_FREQUENCIES = [
    "주 1회 이하",
    "주 1~2회",
    "주 3~4회",
    "주 5회 이상",
]
SPORT_LEVELS = ["입문", "초급", "중급", "상급"]
ATMOSPHERES = [
    "친목 중심",
    "즐거운 분위기",
    "가볍게 활동",
    "실력 향상",
    "꾸준한 운동",
    "건강한 라이프스타일",
    "정기적인 활동",
    "경쟁적인 활동",
    "대회/리그 활동",
]
REGIONS = [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
]
DAYS = ["월", "화", "수", "목", "금", "토", "일"]


def _chunks(rows: list[dict], size: int = 100):
    for index in range(0, len(rows), size):
        yield rows[index:index + size]


def _insert_rows(client, table_name: str, rows: list[dict]) -> None:
    for batch in _chunks(rows):
        client.table(table_name).insert(batch).execute()


def _first_or_none(rows: list[dict]) -> dict | None:
    return rows[0] if rows else None


def _load_target_club(client, club_id: int) -> dict:
    club_rows = (
        client.table("clubs")
        .select(
            "club_id, club_name, activity_frequency, "
            "gender_rule, monthly_fee"
        )
        .eq("club_id", club_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    club = _first_or_none(club_rows)
    if club is None:
        raise RuntimeError(f"동호회 {club_id}을 찾을 수 없습니다.")

    def fetch(table: str, columns: str) -> list[dict]:
        return (
            client.table(table)
            .select(columns)
            .eq("club_id", club_id)
            .execute()
            .data
            or []
        )

    sport_rows = fetch("club_sports", "sport_id")
    schedule_rows = fetch(
        "club_schedules",
        "day_of_week, start_time, end_time",
    )
    region_rows = fetch("club_regions", "region")
    level_rows = fetch("club_sport_levels", "sport_level")
    atmosphere_rows = fetch("club_atmospheres", "atmosphere")
    age_group_rows = fetch("club_age_groups", "age_group")

    if not sport_rows:
        raise RuntimeError("대상 동호회에 종목 정보가 없습니다.")
    if not schedule_rows:
        raise RuntimeError("대상 동호회에 정기 일정이 없습니다.")
    if not region_rows:
        raise RuntimeError("대상 동호회에 활동 지역이 없습니다.")

    return {
        **club,
        "sport_id": int(sport_rows[0]["sport_id"]),
        "schedules": schedule_rows,
        "region": region_rows[0]["region"],
        "sport_levels": [
            row["sport_level"]
            for row in level_rows
            if row.get("sport_level")
        ],
        "atmospheres": [
            row["atmosphere"]
            for row in atmosphere_rows
            if row.get("atmosphere")
        ],
        "age_groups": [
            row["age_group"]
            for row in age_group_rows
            if row.get("age_group")
        ],
    }


def _target_gender(gender_rule: str | None, rng: random.Random) -> str:
    normalized = str(gender_rule or "all").strip().lower()
    if normalized == "male":
        return "남성"
    if normalized == "female":
        return "여성"
    return rng.choice(["남성", "여성"])


def _target_age(age_groups: list[str], rng: random.Random) -> int:
    ranges = {
        "10대": (18, 19),
        "20대": (20, 29),
        "30대": (30, 39),
        "40대": (40, 49),
        "50대": (50, 59),
        "60대 이상": (60, 69),
    }
    allowed = [ranges[item] for item in age_groups if item in ranges]
    if not allowed:
        return rng.randint(20, 49)
    low, high = rng.choice(allowed)
    return rng.randint(low, high)


def _birth_date_for_age(age: int, rng: random.Random) -> str:
    today = date.today()
    year = today.year - age
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    return date(year, month, day).isoformat()


def _target_level(club_levels: list[str], rng: random.Random) -> str:
    normalized = []
    for value in club_levels:
        text = str(value)
        if "입문" in text:
            normalized.append("입문")
        elif "초급" in text:
            normalized.append("초급")
        elif "중급" in text:
            normalized.append("중급")
        elif "상급" in text:
            normalized.append("상급")
    return rng.choice(normalized or SPORT_LEVELS)


def _target_frequency(club_frequency: str | None) -> str:
    mapping = {
        "주 1회": "주 1회 이하",
        "주 2회": "주 1~2회",
        "주 3~4회": "주 3~4회",
        "비정기 활동": "주 1회 이하",
        "자유 참여": "주 1~2회",
    }
    return mapping.get(str(club_frequency or ""), "주 1~2회")


def _random_schedule(rng: random.Random) -> dict:
    start_hour = rng.choice([6, 8, 10, 12, 14, 16, 18, 19, 20])
    end_hour = min(start_hour + rng.choice([1, 2, 3]), 23)
    return {
        "day_of_week": rng.choice(DAYS),
        "start_time": f"{start_hour:02d}:00:00",
        "end_time": f"{end_hour:02d}:00:00",
    }


def _create_auth_user(client, email: str, retries: int = 3) -> str:
    last_error = None
    for attempt in range(retries):
        try:
            response = client.auth.admin.create_user({
                "email": email,
                "password": secrets.token_urlsafe(24),
                "email_confirm": True,
                "user_metadata": {"is_h1_seed": True},
            })
            if response.user is None:
                raise RuntimeError("Auth 사용자 응답에 user가 없습니다.")
            return str(response.user.id)
        except Exception as error:  # pragma: no cover - remote API branch
            last_error = error
            if attempt + 1 < retries:
                time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"Auth 사용자 생성 실패: {email}") from last_error


def seed_users(target_club_id: int, count: int, random_seed: int) -> None:
    if count < 1 or count > 500:
        raise ValueError("count는 1~500 범위여야 합니다.")

    client = get_supabase_admin_client()
    rng = random.Random(random_seed)
    club = _load_target_club(client, target_club_id)
    sport_rows = (
        client.table("sports")
        .select("sport_id")
        .execute()
        .data
        or []
    )
    sport_ids = [int(row["sport_id"]) for row in sport_rows]
    if not sport_ids:
        raise RuntimeError("sports 기준 데이터가 없습니다.")

    target_count = max(1, round(count * 0.30))
    run_tag = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    created_auth_ids: list[str] = []
    users: list[dict] = []
    user_sports: list[dict] = []
    user_levels: list[dict] = []
    user_regions: list[dict] = []
    user_times: list[dict] = []
    user_atmospheres: list[dict] = []

    print(
        f"대상 동호회: {club['club_name']} ({target_club_id})\n"
        f"전체 {count}명 / 조건 일치군 {target_count}명 / 무작위군 {count - target_count}명"
    )

    try:
        for index in range(1, count + 1):
            is_target = index <= target_count
            email = (
                f"{SEED_EMAIL_PREFIX}{run_tag}_{index:03d}"
                f"@{SEED_EMAIL_DOMAIN}"
            )
            user_id = _create_auth_user(client, email)
            created_auth_ids.append(user_id)

            if is_target:
                sport_id = club["sport_id"]
                level = _target_level(club["sport_levels"], rng)
                region = club["region"]
                schedule = rng.choice(club["schedules"])
                atmosphere = rng.choice(
                    club["atmospheres"] or ["친목 중심"]
                )
                frequency = _target_frequency(club.get("activity_frequency"))
                gender = _target_gender(club.get("gender_rule"), rng)
                age = _target_age(club["age_groups"], rng)
                monthly_fee = int(club.get("monthly_fee") or 0)
                max_fee = monthly_fee + rng.choice([0, 10000, 20000])
            else:
                sport_id = rng.choice(sport_ids)
                level = rng.choice(SPORT_LEVELS)
                region = rng.choice(REGIONS)
                schedule = _random_schedule(rng)
                atmosphere = rng.choice(ATMOSPHERES)
                frequency = rng.choice(USER_FREQUENCIES)
                gender = rng.choice(["남성", "여성"])
                age = rng.randint(18, 59)
                max_fee = rng.choice([0, 10000, 20000, 30000, 50000, 70000])

            nickname = f"H1가상{run_tag[-6:]}{index:03d}"
            users.append({
                "user_id": user_id,
                "name": f"H1 테스트 사용자 {index:03d}",
                "nickname": nickname,
                "email": email,
                "profile_image": None,
                "gender": gender,
                "birth_date": _birth_date_for_age(age, rng),
                "travel_distance_km": rng.choice([5, 10, 15, 20, 30]),
                "max_monthly_fee": max_fee,
                "status": True,
                "activity_frequency": frequency,
                "phone": None,
                "bio": "H1 모집 추천 검증용 자동 생성 데이터",
            })
            user_sports.append({
                "user_id": user_id,
                "sport_id": sport_id,
            })
            user_levels.append({
                "user_id": user_id,
                "sport_id": sport_id,
                "sport_level": level,
            })
            user_regions.append({
                "user_id": user_id,
                "region": region,
            })
            user_times.append({
                "user_id": user_id,
                "day_of_week": schedule["day_of_week"],
                "start_time": str(schedule["start_time"]),
                "end_time": str(schedule["end_time"]),
            })
            user_atmospheres.append({
                "user_id": user_id,
                "atmosphere": atmosphere,
            })

            if index % 25 == 0 or index == count:
                print(f"Auth 생성: {index}/{count}")
            time.sleep(0.04)

        _insert_rows(client, "users", users)
        _insert_rows(client, "user_sports", user_sports)
        _insert_rows(client, "user_sport_levels", user_levels)
        _insert_rows(client, "user_regions", user_regions)
        _insert_rows(client, "user_available_times", user_times)
        _insert_rows(client, "user_club_atmospheres", user_atmospheres)

    except Exception:
        print("생성 중 오류가 발생해 이번 실행의 Auth 계정을 정리합니다.")
        for user_id in reversed(created_auth_ids):
            try:
                client.auth.admin.delete_user(user_id)
            except Exception as cleanup_error:
                print(f"정리 실패: {user_id} / {cleanup_error}")
        raise

    print(
        "\n생성 완료\n"
        f"- 전체 사용자: {len(users)}명\n"
        f"- 조건 일치군: {target_count}명\n"
        f"- 이메일 표식: {SEED_EMAIL_PREFIX}* @{SEED_EMAIL_DOMAIN}\n"
        "- 테스트 사용자에게 club_members/club_applications 데이터는 생성하지 않았습니다."
    )


def cleanup_users(confirm: str) -> None:
    if confirm != "H1_SEED_DELETE":
        raise ValueError(
            "삭제하려면 --confirm H1_SEED_DELETE를 입력해야 합니다."
        )

    client = get_supabase_admin_client()
    rows = (
        client.table("users")
        .select("user_id, email")
        .like("email", f"{SEED_EMAIL_PREFIX}%@{SEED_EMAIL_DOMAIN}")
        .limit(1000)
        .execute()
        .data
        or []
    )
    if not rows:
        print("삭제할 H1 테스트 사용자가 없습니다.")
        return

    failed: list[str] = []
    for index, row in enumerate(rows, start=1):
        user_id = str(row["user_id"])
        try:
            client.auth.admin.delete_user(user_id)
        except Exception as error:
            failed.append(user_id)
            print(f"삭제 실패: {user_id} / {error}")
        if index % 25 == 0 or index == len(rows):
            print(f"Auth 삭제: {index}/{len(rows)}")
        time.sleep(0.04)

    if failed:
        raise RuntimeError(
            f"{len(failed)}명의 삭제가 실패했습니다. 위 사용자 ID를 확인해주세요."
        )
    print(f"H1 테스트 사용자 {len(rows)}명을 삭제했습니다.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PlayBridge H1 검증용 사용자 데이터 관리"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    seed_parser = subparsers.add_parser("seed", help="테스트 사용자 생성")
    seed_parser.add_argument("--target-club-id", type=int, required=True)
    seed_parser.add_argument("--count", type=int, default=300)
    seed_parser.add_argument("--random-seed", type=int, default=DEFAULT_RANDOM_SEED)

    cleanup_parser = subparsers.add_parser("cleanup", help="테스트 사용자 삭제")
    cleanup_parser.add_argument("--confirm", required=True)

    args = parser.parse_args()
    if args.command == "seed":
        seed_users(
            target_club_id=args.target_club_id,
            count=args.count,
            random_seed=args.random_seed,
        )
    else:
        cleanup_users(confirm=args.confirm)


if __name__ == "__main__":
    main()
