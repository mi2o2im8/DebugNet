from __future__ import annotations

from datetime import time
from typing import Any


WEIGHTS = {
    "region": 25.0,
    "schedule": 20.0,
    "skill": 20.0,
    "atmosphere": 15.0,
    "frequency": 10.0,
    "fee": 10.0,
}


LEVEL_ORDER = {
    "입문": 0,
    "초급": 1,
    "중급": 2,
    "상급": 3,
}


FREQUENCY_ORDER = {
    "주 1회 이하": 1,
    "주 1회": 1,
    "주 1~2회": 2,
    "주 2회": 2,
    "주 3~4회": 3,
    "주 5회 이상": 4,
}


def _normalize_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _normalize_region(value: Any) -> str:
    text = _normalize_text(value)
    if not text:
        return ""

    # DB에는 "서울 관악구", 사용자 정보에는 "관악구"처럼 저장될 수 있다.
    parts = text.split()
    return parts[-1] if parts else text


def _parse_time(value: Any) -> int | None:
    if value is None:
        return None

    if isinstance(value, time):
        return value.hour * 60 + value.minute

    text = str(value).strip()
    if not text:
        return None

    try:
        hour_text, minute_text = text[:5].split(":")
        return int(hour_text) * 60 + int(minute_text)
    except (ValueError, TypeError):
        return None


def _interval_overlap(a_start: Any, a_end: Any, b_start: Any, b_end: Any) -> bool:
    a1 = _parse_time(a_start)
    a2 = _parse_time(a_end)
    b1 = _parse_time(b_start)
    b2 = _parse_time(b_end)

    if None in (a1, a2, b1, b2):
        return False

    return max(a1, b1) < min(a2, b2)


def region_score(user_regions: list[str], club_regions: list[str]) -> float:
    if not user_regions or not club_regions:
        return 0.5

    mine = {_normalize_region(value) for value in user_regions if _normalize_region(value)}
    theirs = {_normalize_region(value) for value in club_regions if _normalize_region(value)}

    return 1.0 if mine & theirs else 0.0


def schedule_score(user_times: list[dict], club_schedules: list[dict]) -> float:
    if not user_times or not club_schedules:
        return 0.5

    same_day = False

    for mine in user_times:
        my_day = _normalize_text(mine.get("day_of_week"))
        if not my_day:
            continue

        for schedule in club_schedules:
            if my_day != _normalize_text(schedule.get("day_of_week")):
                continue

            same_day = True

            if _interval_overlap(
                mine.get("start_time"),
                mine.get("end_time"),
                schedule.get("start_time"),
                schedule.get("end_time"),
            ):
                return 1.0

    return 0.5 if same_day else 0.0


def skill_score(user_level: str | None, club_levels: list[str]) -> float:
    if not user_level or not club_levels:
        return 0.5

    normalized_levels = {_normalize_text(value) for value in club_levels}

    if "수준 무관" in normalized_levels or "수준무관" in normalized_levels:
        return 1.0

    normalized_user = _normalize_text(user_level)
    if normalized_user in normalized_levels:
        return 1.0

    user_rank = LEVEL_ORDER.get(normalized_user)
    club_ranks = [LEVEL_ORDER.get(value) for value in normalized_levels]
    club_ranks = [value for value in club_ranks if value is not None]

    if user_rank is None or not club_ranks:
        return 0.5

    gap = min(abs(user_rank - value) for value in club_ranks)
    if gap == 1:
        return 0.5

    return 0.0


def atmosphere_score(user_traits: list[str], club_traits: list[str]) -> float:
    if not user_traits or not club_traits:
        return 0.5

    mine = {_normalize_text(value) for value in user_traits if _normalize_text(value)}
    theirs = {_normalize_text(value) for value in club_traits if _normalize_text(value)}

    if not mine or not theirs:
        return 0.5

    overlap = len(mine & theirs)
    if overlap == 0:
        return 0.0

    return min(1.0, overlap / max(1, len(mine)))


def frequency_score(user_frequency: str | None, club_frequency: str | None) -> float:
    if not user_frequency or not club_frequency:
        return 0.5

    mine = FREQUENCY_ORDER.get(_normalize_text(user_frequency))
    theirs = FREQUENCY_ORDER.get(_normalize_text(club_frequency))

    if mine is None or theirs is None:
        return 1.0 if _normalize_text(user_frequency) == _normalize_text(club_frequency) else 0.5

    gap = abs(mine - theirs)
    if gap == 0:
        return 1.0
    if gap == 1:
        return 0.6
    return 0.2


def fee_score(max_monthly_fee: int | None, club_monthly_fee: int | None) -> float:
    if max_monthly_fee is None or club_monthly_fee is None:
        return 0.5

    maximum = max(0, int(max_monthly_fee))
    fee = max(0, int(club_monthly_fee))

    if fee <= maximum:
        return 1.0

    if maximum == 0:
        return 0.0

    if fee <= maximum * 1.2:
        return 0.5

    return 0.0


def calculate_club_fit(*, preferences: dict, club: dict) -> dict:
    axis_scores = {
        "region": region_score(
            preferences.get("regions") or [],
            club.get("regions") or [],
        ),
        "schedule": schedule_score(
            preferences.get("available_times") or [],
            club.get("schedules") or [],
        ),
        "skill": skill_score(
            preferences.get("sport_level"),
            club.get("sport_levels") or [],
        ),
        "atmosphere": atmosphere_score(
            preferences.get("atmospheres") or [],
            club.get("traits") or [],
        ),
        "frequency": frequency_score(
            preferences.get("activity_frequency"),
            club.get("activity_frequency"),
        ),
        "fee": fee_score(
            preferences.get("max_monthly_fee"),
            club.get("monthly_fee"),
        ),
    }

    # 사용자가 "상관없음"을 고른 조건은 점수 계산에서 제외한다.
    # 남은 조건들의 가중치 합을 다시 100점으로 환산한다.
    active_axes = {
        "region": bool(preferences.get("regions")),
        "schedule": bool(preferences.get("available_times")),
        "skill": bool(preferences.get("sport_level")),
        "atmosphere": bool(preferences.get("atmospheres")),
        "frequency": bool(preferences.get("activity_frequency")),
        "fee": preferences.get("max_monthly_fee") is not None,
    }

    active_weight = sum(
        WEIGHTS[key]
        for key, is_active in active_axes.items()
        if is_active
    )

    if active_weight > 0:
        weighted_sum = sum(
            axis_scores[key] * WEIGHTS[key]
            for key, is_active in active_axes.items()
            if is_active
        )
        total = weighted_sum / active_weight * 100.0
    else:
        total = 0.0

    reasons: list[str] = []

    if active_axes["region"] and axis_scores["region"] >= 1.0:
        reasons.append("희망 활동 지역이 일치해요")
    if active_axes["schedule"] and axis_scores["schedule"] >= 1.0:
        reasons.append("활동 가능한 요일과 시간이 잘 맞아요")
    if active_axes["skill"] and axis_scores["skill"] >= 1.0:
        reasons.append("운동 수준이 잘 맞아요")
    if active_axes["atmosphere"] and axis_scores["atmosphere"] >= 1.0:
        reasons.append("선호하는 동호회 분위기와 잘 맞아요")
    if active_axes["frequency"] and axis_scores["frequency"] >= 1.0:
        reasons.append("희망 활동 빈도가 일치해요")
    if active_axes["fee"] and axis_scores["fee"] >= 1.0:
        reasons.append("희망 회비 범위 안이에요")

    if not reasons:
        active_keys = [
            key
            for key, is_active in active_axes.items()
            if is_active
        ]

        if active_keys:
            best_axis = max(active_keys, key=lambda key: axis_scores[key])
            fallback = {
                "region": "활동 지역 조건을 함께 고려했어요",
                "schedule": "활동 가능 시간을 함께 고려했어요",
                "skill": "운동 수준을 함께 고려했어요",
                "atmosphere": "동호회 분위기를 함께 고려했어요",
                "frequency": "활동 빈도를 함께 고려했어요",
                "fee": "회비 조건을 함께 고려했어요",
            }
            reasons.append(fallback[best_axis])
        else:
            reasons.append("가입 조건을 기준으로 추천했어요")

    return {
        "fit_score": round(total, 1),
        "axis_scores": {
            key: (
                round(value * 100)
                if active_axes[key]
                else None
            )
            for key, value in axis_scores.items()
        },
        "reasons": reasons[:3],
    }
