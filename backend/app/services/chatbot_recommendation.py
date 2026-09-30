from __future__ import annotations
from app.services.club_service import ClubService

import re
from datetime import time
from typing import Any

from app.schemas.clubs import (
    ClubRecommendationRequest,
    ClubRecommendationTime,
)
from app.services.club_recommendation_service import ClubRecommendationService


# =========================================================
# 챗봇 자연어 → 동호회 추천 조건 변환
# =========================================================
#
# 역할
# ---------------------------------------------------------
# 사용자가 자연어로 입력한 추천 조건을
# 기존 ClubRecommendationService가 사용할 수 있는 형태로 변환한다.
#
# ML1의 8개 요인을 POC1이나 추천 조건으로 직접 변환하지 않는다.
# ML1은 별도의 보조 신호로만 사용한다.
#
# 지원 종목은 PlayBridge의 5개 종목만 사용한다.
# =========================================================


SUPPORTED_SPORT_ALIASES = {
    "축구·풋살": ["축구", "풋살"],
    "배구": ["배구"],
    "농구": ["농구"],
    "테니스": ["테니스"],
    "탁구": ["탁구"],
}


DAY_ALIASES = {
    "월요일": ["월요일", "월"],
    "화요일": ["화요일", "화"],
    "수요일": ["수요일", "수"],
    "목요일": ["목요일", "목"],
    "금요일": ["금요일", "금"],
    "토요일": ["토요일", "토"],
    "일요일": ["일요일", "일"],
}


DAY_PART_RANGES = {
    "아침": (time(6, 0), time(10, 0)),
    "오전": (time(6, 0), time(12, 0)),
    "점심": (time(11, 0), time(14, 0)),
    "오후": (time(12, 0), time(18, 0)),
    "저녁": (time(18, 0), time(22, 0)),
    "밤": (time(18, 0), time(22, 0)),
}


def _normalize_text(value: Any) -> str:
    """비교용 문자열 정리."""

    return " ".join(
        str(value or "")
        .strip()
        .lower()
        .split()
    )


def _compact_text(value: Any) -> str:
    """공백과 일부 구분기호를 제거한 문자열."""

    text = _normalize_text(value)

    for char in [" ", "·", "ㆍ", "/", "-", "_"]:
        text = text.replace(char, "")

    return text


# =========================================================
# 종목 찾기
# =========================================================

def _find_sport_id(
    text: str,
    supported_sports: list[dict],
) -> int | None:

    compact = _compact_text(text)

    for canonical_name, aliases in SUPPORTED_SPORT_ALIASES.items():

        for alias in aliases:
            if _compact_text(alias) in compact:

                for sport in supported_sports:
                    sport_name = str(
                        sport.get("sport_name") or ""
                    )

                    if _compact_text(sport_name) == _compact_text(
                        canonical_name
                    ):
                        return int(sport["sport_id"])

    return None


# =========================================================
# 지역 찾기
# =========================================================

def _find_region(
    text: str,
    region_options: list[str],
) -> str | None:

    compact = _compact_text(text)

    # 긴 지역명을 먼저 확인한다.
    candidates = sorted(
        {
            str(region).strip()
            for region in region_options
            if str(region).strip()
        },
        key=len,
        reverse=True,
    )

    for region in candidates:
        if _compact_text(region) in compact:
            return region

    return None


# =========================================================
# 분위기 찾기
# =========================================================

def _find_atmospheres(
    text: str,
    atmosphere_options: list[str],
) -> list[str]:

    compact = _compact_text(text)
    matched = []

    candidates = sorted(
        {
            str(value).strip()
            for value in atmosphere_options
            if str(value).strip()
        },
        key=len,
        reverse=True,
    )

    for atmosphere in candidates:
        if _compact_text(atmosphere) in compact:
            matched.append(atmosphere)

    return matched[:3]


# =========================================================
# 활동 빈도 찾기
# =========================================================

def _find_activity_frequency(
    text: str,
    frequency_options: list[str],
) -> str | None:

    compact = _compact_text(text)

    candidates = sorted(
        {
            str(value).strip()
            for value in frequency_options
            if str(value).strip()
        },
        key=len,
        reverse=True,
    )

    for frequency in candidates:
        if _compact_text(frequency) in compact:
            return frequency

    # 자주 사용하는 표현을 간단하게 대응
    if "주1회" in compact or "일주일에1번" in compact:
        return _find_matching_option(
            frequency_options,
            ["주 1회", "주1회", "일주일에 1번"],
        )

    if "주2회" in compact or "일주일에2번" in compact:
        return _find_matching_option(
            frequency_options,
            ["주 2회", "주2회", "일주일에 2번"],
        )

    if "주3회" in compact or "일주일에3번" in compact:
        return _find_matching_option(
            frequency_options,
            ["주 3회", "주3회", "일주일에 3번"],
        )

    return None


def _find_matching_option(
    options: list[str],
    aliases: list[str],
) -> str | None:

    normalized_options = {
        _compact_text(option): option
        for option in options
    }

    for alias in aliases:
        compact_alias = _compact_text(alias)

        if compact_alias in normalized_options:
            return normalized_options[compact_alias]

    return None


# =========================================================
# 운동 수준 찾기
# =========================================================

def _find_skill_level(
    text: str,
    skill_options: list[str],
) -> str | None:

    compact = _compact_text(text)

    aliases = [
        ("초보", ["초보", "입문", "처음"]),
        ("중급", ["중급"]),
        ("상급", ["상급", "고급", "숙련"]),
    ]

    for canonical, words in aliases:
        if any(
            _compact_text(word) in compact
            for word in words
        ):
            matched = _find_matching_option(
                skill_options,
                [canonical],
            )

            if matched:
                return matched

    # DB 옵션에 정확한 표현이 있을 경우 직접 비교
    for option in skill_options:
        if _compact_text(option) in compact:
            return option

    return None


# =========================================================
# 회비 찾기
# =========================================================

def _find_max_monthly_fee(text: str) -> int | None:

    normalized = _normalize_text(text)

    patterns = [
        # 3만원
        r"(\d+(?:\.\d+)?)\s*만\s*원",

        # 30000원
        r"(\d{1,7})\s*원",
    ]

    for pattern in patterns:

        match = re.search(pattern, normalized)

        if not match:
            continue

        value = float(match.group(1))

        # "3만원" → 30000
        if "만원" in match.group(0).replace(" ", ""):
            return int(value * 10000)

        return int(value)

    return None


# =========================================================
# 요일 찾기
# =========================================================

def _find_days(text: str) -> list[str]:

    compact = _compact_text(text)

    # 주말
    if "주말" in compact:
        return ["토요일", "일요일"]

    # 평일
    if "평일" in compact:
        return [
            "월요일",
            "화요일",
            "수요일",
            "목요일",
            "금요일",
        ]

    matched = []

    for day_name, aliases in DAY_ALIASES.items():

        if any(
            _compact_text(alias) in compact
            for alias in aliases
        ):
            matched.append(day_name)

    return matched


# =========================================================
# 시간대 찾기
# =========================================================

def _find_day_part(text: str) -> tuple[time, time] | None:

    compact = _compact_text(text)

    # 긴 표현부터 처리
    ordered_parts = [
        "오후",
        "저녁",
        "밤",
        "점심",
        "오전",
        "아침",
    ]

    for part in ordered_parts:

        if _compact_text(part) in compact:
            return DAY_PART_RANGES[part]

    return None


# =========================================================
# 추천 시간 생성
# =========================================================

def _build_available_times(
    text: str,
    default_times: list[dict],
) -> list[ClubRecommendationTime]:

    days = _find_days(text)
    day_part = _find_day_part(text)

    # 사용자가 시간/요일을 말하지 않으면 시간 조건 없음
    if not days and not day_part:
        return []

    # 요일이 없고 시간만 있으면
    # 기존 사용자 가능 요일을 유지한다.
    if not days:
        days = list(
            dict.fromkeys(
                str(item.get("day_of_week"))
                for item in default_times
                if item.get("day_of_week")
            )
        )

    # 요일만 있고 시간대가 없으면
    # 사용자 기본 시간의 해당 요일을 유지한다.
    if not day_part:
        result = []

        for item in default_times:

            day = str(item.get("day_of_week") or "")

            if day in days:
                if not item.get("start_time") or not item.get("end_time"):
                    continue

                result.append(
                    ClubRecommendationTime(
                        day_of_week=day,
                        start_time=time.fromisoformat(
                            str(item["start_time"])[:8]
                        ),
                        end_time=time.fromisoformat(
                            str(item["end_time"])[:8]
                        ),
                    )
                )

        return result

    start_time, end_time = day_part

    return [
        ClubRecommendationTime(
            day_of_week=day,
            start_time=start_time,
            end_time=end_time,
        )
        for day in days
    ]


# =========================================================
# 자연어 → 추천 Request
# =========================================================

def build_recommendation_request(
    *,
    text: str,
    defaults: dict,
    limit: int = 5,
) -> ClubRecommendationRequest:

    question = str(text or "").strip()

    supported_sports = defaults.get("sports") or []

    sport_id = _find_sport_id(
        question,
        supported_sports,
    )

    region = _find_region(
        question,
        defaults.get("region_options") or [],
    )

    atmospheres = _find_atmospheres(
        question,
        defaults.get("atmosphere_options") or [],
    )

    activity_frequency = _find_activity_frequency(
        question,
        defaults.get("activity_frequency_options") or [],
    )

    skill_level = _find_skill_level(
        question,
        defaults.get("skill_level_options") or [],
    )

    max_monthly_fee = _find_max_monthly_fee(question)

    available_times = _build_available_times(
        question,
        defaults.get("available_times") or [],
    )

    # -----------------------------------------------------
    # 사용자 프로필 기본값
    #
    # 자연어로 명시한 조건만 덮어쓴다.
    # -----------------------------------------------------

    selected_sport_id = (
        sport_id
        if sport_id is not None
        else defaults.get("selected_sport_id")
    )

    selected_skill_level = (
        skill_level
        if skill_level is not None
        else None
    )

    selected_regions = (
        [region]
        if region
        else []
    )

    selected_atmospheres = (
        atmospheres
        if atmospheres
        else []
    )

    selected_frequency = (
        activity_frequency
        if activity_frequency is not None
        else None
    )
    
    selected_fee = (
        max_monthly_fee
        if max_monthly_fee is not None
        else None
    )

    return ClubRecommendationRequest(
        sport_id=selected_sport_id,
        sport_level=selected_skill_level,
        regions=selected_regions,
        available_times=available_times,
        atmospheres=selected_atmospheres,
        activity_frequency=selected_frequency,
        max_monthly_fee=selected_fee,
        limit=limit,
    )


# =========================================================
# 실제 추천 실행
# =========================================================

def recommend_from_text(
    *,
    user_id: str,
    text: str,
    limit: int = 5,
) -> dict:

    recommendation_service = ClubRecommendationService()

    # 사용자 기본 정보
    defaults = recommendation_service.get_defaults(
        user_id=user_id
    )

    # -----------------------------------------------------
    # 1차: 기존 맞춤 추천 알고리즘
    # -----------------------------------------------------
    request_data = build_recommendation_request(
        text=text,
        defaults=defaults,
        limit=limit,
    )

    result = recommendation_service.recommend(
        user_id=user_id,
        request_data=request_data,
    )

    recommendations = result.get(
        "recommendations",
        [],
    )

    if recommendations:
        return {
            "request": request_data.model_dump(mode="json"),
            "recommendations": recommendations,
            "total_candidates": result.get(
                "total_candidates",
                len(recommendations),
            ),
        }

    # -----------------------------------------------------
    # 2차: 맞춤 추천 결과가 없으면
    # 기존 동호회 검색 기능으로 종목부터 바로 검색
    # -----------------------------------------------------
    if request_data.sport_id is not None:

        sport_name = None

        for sport in defaults.get("sports") or []:
            if int(sport.get("sport_id") or 0) == int(request_data.sport_id):
                sport_name = sport.get("sport_name")
                break

        if sport_name:

            club_service = ClubService()

            # 사용자의 기존 활동 지역
            user_regions = list(
                defaults.get("regions") or []
            )

            # ---------------------------------------------
            # 2-1. 같은 지역 + 같은 종목 우선 검색
            # ---------------------------------------------
            search_result = club_service.search_clubs(
                sport_name=[sport_name],
                region=user_regions,
            )

            # ---------------------------------------------
            # 2-2. 같은 지역에도 없으면
            # 같은 종목 전체 검색
            # ---------------------------------------------
            if not search_result:
                search_result = club_service.search_clubs(
                    sport_name=[sport_name],
                )

                user_regions = []

            # 검색 결과 형식 대응
            if isinstance(search_result, dict):
                fallback_items = (
                    search_result.get("clubs")
                    or search_result.get("results")
                    or search_result.get("data")
                    or []
                )
            elif isinstance(search_result, list):
                fallback_items = search_result
            else:
                fallback_items = []

            # ---------------------------------------------
            # 검색 결과를 챗봇 추천 형식으로 정리
            # ---------------------------------------------
            fallback_recommendations = []

            for club in fallback_items:

                if not isinstance(club, dict):
                    continue

                club_id = (
                    club.get("club_id")
                    or club.get("id")
                )

                club_name = (
                    club.get("club_name")
                    or club.get("name")
                )

                if not club_id or not club_name:
                    continue

                regions = club.get("regions") or []

                if not regions and club.get("region"):
                    regions = [club.get("region")]

                fallback_recommendations.append({
                    "club_id": club_id,
                    "club_name": club_name,
                    "club_intro": club.get("club_intro"),
                    "image_url": club.get("image_url"),
                    "sport_id": (
                        club.get("sport_id")
                        or request_data.sport_id
                    ),
                    "sport_name": (
                        club.get("sport_name")
                        or sport_name
                    ),
                    "sports": club.get("sports") or [],
                    "regions": regions,
                    "schedules": club.get("schedules") or [],
                    "sport_levels": club.get("sport_levels") or [],
                    "atmospheres": (
                        club.get("atmospheres")
                        or club.get("traits")
                        or []
                    ),
                    "activity_frequency": club.get(
                        "activity_frequency"
                    ),
                    "monthly_fee": club.get(
                        "monthly_fee"
                    ),
                    "current_members": club.get(
                        "current_members"
                    ),
                    "max_members": club.get(
                        "max_members"
                    ),
                    "reasons": [
                        "희망 종목의 동호회를 찾았어요."
                    ],
                })

                if len(fallback_recommendations) >= limit:
                    break

            if fallback_recommendations:
                fallback_request = request_data.model_copy(
                    update={
                        "regions": user_regions
                    }
                )

                return {
                    "request": fallback_request.model_dump(
                        mode="json"
                    ),
                    "recommendations": fallback_recommendations,
                    "total_candidates": len(
                        fallback_recommendations
                    ),
                }

    # -----------------------------------------------------
    # 최종적으로도 없으면 빈 결과 반환
    # -----------------------------------------------------
    return {
        "request": request_data.model_dump(
            mode="json"
        ),
        "recommendations": [],
        "total_candidates": 0,
    }