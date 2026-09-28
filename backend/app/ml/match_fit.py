from __future__ import annotations

from datetime import time
from math import atan2, cos, radians, sin, sqrt
from typing import Any


# =========================================================
# Match Fit V1 가중치
# =========================================================
# 현재 서비스 DB에서 바로 비교 가능한 4개 축을 사용한다.
#
# time
# → 원하는 시간과 상대팀 모집 시간의 적합도
#
# distance
# → 원하는 경기 장소와 상대 경기장의 이동 부담
#
# skill
# → 원하는 상대 실력과 상대팀 실력의 적합도
#
# players
# → 원하는 경기 인원과 상대팀 경기 인원의 차이
#
# 현재 서비스용 V1 가중치다.
# 최종 발표 전에 서비스용 Match Fit 기준으로
# Baseline 비교를 다시 진행해서 최종 확정할 예정이다.
# =========================================================

MATCH_FIT_WEIGHTS = {
    "time": 0.2747497219,
    "distance": 0.2814238042,
    "skill": 0.2358175751,
    "players": 0.2080088988,
}


# =========================================================
# 국민생활체육조사 기반 Travel Fit 감소 계수
# =========================================================
# 기존 POC에서 확인한 이동시간별 활동빈도 감소 결과를
# Match Fit의 거리/이동 점수에 재사용한다.
# =========================================================

TRAVEL_SCORE_BY_MINUTES = (
    (10, 1.0000000000),
    (20, 0.8709830241),
    (30, 0.6795495212),
    (45, 0.5571053405),
    (60, 0.4318200596),
)


# =========================================================
# 시간값을 분(minute)으로 변환
# =========================================================

def _time_to_minutes(
    value: time | str | None,
) -> int | None:

    if value is None:
        return None

    # datetime.time 객체인 경우
    if isinstance(value, time):
        return (
            value.hour * 60
            + value.minute
        )

    # Supabase에서 "19:00:00" 문자열로 오는 경우
    text = str(value).strip()

    if not text:
        return None

    parts = text.split(":")

    if len(parts) < 2:
        return None

    try:
        hour = int(parts[0])
        minute = int(parts[1])

    except ValueError:
        return None

    return (
        hour * 60
        + minute
    )


# =========================================================
# 시간 적합도
# =========================================================

def calculate_time_score(
    requested_start: time | str,
    requested_end: time | str,
    candidate_start: time | str | None,
    candidate_end: time | str | None,
) -> float:

    """
    사용자가 원하는 경기시간과
    상대 모집글의 경기시간이 얼마나 겹치는지 계산한다.

    예:
    19:00~21:00 ↔ 19:00~21:00
    → 100점

    19:00~21:00 ↔ 20:00~22:00
    → 일부 겹침

    전혀 안 겹침
    → 0점
    """

    req_start = _time_to_minutes(
        requested_start
    )

    req_end = _time_to_minutes(
        requested_end
    )

    cand_start = _time_to_minutes(
        candidate_start
    )

    cand_end = _time_to_minutes(
        candidate_end
    )

    if None in {
        req_start,
        req_end,
        cand_start,
        cand_end,
    }:
        return 0.0

    if (
        req_end <= req_start
        or cand_end <= cand_start
    ):
        return 0.0

    overlap_start = max(
        req_start,
        cand_start,
    )

    overlap_end = min(
        req_end,
        cand_end,
    )

    overlap_minutes = max(
        0,
        overlap_end - overlap_start,
    )

    # 아예 시간이 겹치지 않음
    if overlap_minutes == 0:
        return 0.0

    # 전체 시간 범위
    union_start = min(
        req_start,
        cand_start,
    )

    union_end = max(
        req_end,
        cand_end,
    )

    union_minutes = (
        union_end - union_start
    )

    if union_minutes <= 0:
        return 0.0

    score = (
        overlap_minutes
        / union_minutes
        * 100
    )

    return round(
        min(100.0, score),
        2,
    )


# =========================================================
# 위도/경도 거리 계산
# =========================================================

def calculate_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float,
) -> float:

    """
    Haversine 공식을 이용해서
    두 좌표 사이 직선거리를 km로 계산한다.
    """

    earth_radius_km = 6371.0088

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    delta_lat = radians(
        lat2 - lat1
    )

    delta_lon = radians(
        lon2 - lon1
    )

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a),
    )

    return (
        earth_radius_km
        * c
    )


# =========================================================
# 거리 -> 예상 이동시간
# =========================================================

def estimate_travel_minutes(
    distance_km: float,
) -> float:

    """
    기존 Match Fit POC와 같은 방식으로
    대략적인 이동시간을 계산한다.

    실제 카카오 길찾기 API 등을 연결하게 되면
    나중에는 이 부분만 교체하면 된다.
    """

    return (
        8.0
        + (
            distance_km
            * 1.25
            / 24.0
            * 60.0
        )
    )


# =========================================================
# 이동시간 -> Travel Fit 점수
# =========================================================

def _travel_minutes_to_score(
    travel_minutes: float,
) -> float:

    for (
        upper_minutes,
        factor,
    ) in TRAVEL_SCORE_BY_MINUTES:

        if (
            travel_minutes
            <= upper_minutes
        ):

            return round(
                factor * 100,
                2,
            )

    # 61분 이상
    return 44.24


# =========================================================
# 거리 적합도
# =========================================================

def calculate_distance_score(
    requested_latitude: float | None,
    requested_longitude: float | None,
    candidate_latitude: float | None,
    candidate_longitude: float | None,
    requested_region: str | None,
    candidate_region: str | None,
) -> tuple[
    float,
    float | None,
    int | None,
]:

    """
    반환값:

    (
        거리 점수,
        실제 계산 거리 km,
        예상 이동시간 분
    )

    좌표가 있으면 좌표를 사용하고,
    좌표가 없는 기존 데이터는 지역명을 이용한다.
    """

    coordinates = (
        requested_latitude,
        requested_longitude,
        candidate_latitude,
        candidate_longitude,
    )

    # 모든 좌표가 존재하는 경우
    if all(
        value is not None
        for value in coordinates
    ):

        distance_km = (
            calculate_distance_km(
                float(
                    requested_latitude
                ),
                float(
                    requested_longitude
                ),
                float(
                    candidate_latitude
                ),
                float(
                    candidate_longitude
                ),
            )
        )

        travel_minutes = (
            estimate_travel_minutes(
                distance_km
            )
        )

        return (
            _travel_minutes_to_score(
                travel_minutes
            ),
            round(
                distance_km,
                2,
            ),
            round(
                travel_minutes
            ),
        )

    # -----------------------------------------------------
    # 좌표가 없는 데이터 fallback
    # -----------------------------------------------------

    request_region = (
        requested_region or ""
    ).strip()

    candidate_region_text = (
        candidate_region or ""
    ).strip()

    # 같은 구라면 비교적 높은 점수
    if (
        request_region
        and candidate_region_text
        and (
            request_region
            == candidate_region_text
        )
    ):

        return (
            80.0,
            None,
            None,
        )

    # 좌표도 없고 지역도 다르면 낮은 기본점수
    return (
        45.0,
        None,
        None,
    )


# =========================================================
# 실력 적합도
# =========================================================

def calculate_skill_score(
    requested_skill: str,
    candidate_skill: str | None,
) -> float:

    skill_rank = {
        "초급": 1,
        "중급": 2,
        "상급": 3,
    }

    requested_rank = (
        skill_rank.get(
            requested_skill
        )
    )

    candidate_rank = (
        skill_rank.get(
            candidate_skill or ""
        )
    )

    # 알 수 없는 데이터
    if (
        requested_rank is None
        or candidate_rank is None
    ):

        return 50.0

    gap = abs(
        requested_rank
        - candidate_rank
    )

    # 같은 수준
    if gap == 0:
        return 100.0

    # 한 단계 차이
    if gap == 1:
        return 70.0

    # 초급 ↔ 상급
    return 35.0


# =========================================================
# 경기 인원 적합도
# =========================================================

def calculate_player_score(
    requested_players: int,
    candidate_players: int | None,
) -> float:

    if candidate_players is None:
        return 50.0

    gap = abs(
        int(
            requested_players
        )
        - int(
            candidate_players
        )
    )

    if gap == 0:
        return 100.0

    if gap == 1:
        return 85.0

    if gap == 2:
        return 65.0

    if gap == 3:
        return 45.0

    return 25.0


# =========================================================
# 추천 이유 만들기
# =========================================================

def _build_reasons(
    score_detail: dict[
        str,
        float,
    ],
) -> list[str]:

    reason_map = {

        "time":
            "원하는 경기 시간과 잘 맞아요.",

        "distance":
            "희망 지역과 이동 부담이 적어요.",

        "skill":
            "원하는 실력 수준과 잘 맞아요.",

        "players":
            "희망 경기 인원과 잘 맞아요.",
    }

    # 점수가 높은 조건부터 정렬
    ordered_keys = sorted(
        score_detail,
        key=score_detail.get,
        reverse=True,
    )

    # 70점 이상 조건 우선
    strong_keys = [
        key
        for key in ordered_keys
        if (
            score_detail[key]
            >= 70
        )
    ]

    # 최대 3개
    selected_keys = (
        strong_keys[:3]
    )

    # 좋은 조건이 부족해도
    # 최소 2개 이유는 보여준다.
    if len(
        selected_keys
    ) < 2:

        for key in ordered_keys:

            if (
                key
                not in selected_keys
            ):

                selected_keys.append(
                    key
                )

            if (
                len(
                    selected_keys
                )
                >= 2
            ):
                break

    return [
        reason_map[key]
        for key
        in selected_keys
    ]


# =========================================================
# Match Fit 최종 계산
# =========================================================

def calculate_match_fit(
    request_condition: dict[
        str,
        Any,
    ],
    candidate: dict[
        str,
        Any,
    ],
) -> dict[
    str,
    Any,
]:

    """
    사용자가 입력한 희망 경기조건과
    상대 경기 모집글 하나를 비교한다.

    중요한 점:
    이 함수에서는 DB를 조회하지 않는다.

    입력
    ↓
    점수 계산
    ↓
    결과 반환

    만 담당한다.
    """

    # -----------------------------------------------------
    # 1. 시간 점수
    #
    # 사용자가 "시간 상관없음"을 선택했다면
    # 시간은 추천 순위 결정에 사용하지 않는다.
    # -----------------------------------------------------

    time_flexible = bool(
        request_condition.get(
            "time_flexible",
            False,
        )
    )


    if time_flexible:

        # 화면 표시용 값.
        # 실제 최종 점수에서는 아래에서 제외한다.
        time_score = 100.0

    else:

        time_score = (
            calculate_time_score(

                request_condition[
                    "start_time"
                ],

                request_condition[
                    "end_time"
                ],

                candidate.get(
                    "start_time"
                ),

                candidate.get(
                    "end_time"
                ),
            )
        )


    # -----------------------------------------------------
    # 2. 거리 점수
    # -----------------------------------------------------

    (
        distance_score,
        distance_km,
        estimated_travel_minutes,
    ) = calculate_distance_score(

        request_condition.get(
            "latitude"
        ),

        request_condition.get(
            "longitude"
        ),

        candidate.get(
            "latitude"
        ),

        candidate.get(
            "longitude"
        ),

        request_condition.get(
            "region"
        ),

        candidate.get(
            "region"
        ),
    )


    # -----------------------------------------------------
    # 3. 실력 점수
    # -----------------------------------------------------

    skill_score = (
        calculate_skill_score(

            request_condition[
                "skill_level"
            ],

            candidate.get(
                "skill_level"
            ),
        )
    )


    # -----------------------------------------------------
    # 4. 인원 점수
    # -----------------------------------------------------

    player_score = (
        calculate_player_score(

            request_condition[
                "required_players"
            ],

            candidate.get(
                "required_players"
            ),
        )
    )


    # -----------------------------------------------------
    # 5. 세부점수
    # -----------------------------------------------------

    score_detail = {

        "time":
            time_score,

        "distance":
            distance_score,

        "skill":
            skill_score,

        "players":
            player_score,
    }


    # -----------------------------------------------------
    # 6. 가중합으로 최종 Match Fit 계산
    #
    # 시간 상관없음이면
    # 시간 항목 자체를 계산에서 제외하고
    # 남은 가중치를 자동으로 100%로 재조정한다.
    # -----------------------------------------------------

    if time_flexible:

        active_keys = [
            "distance",
            "skill",
            "players",
        ]

    else:

        active_keys = [
            "time",
            "distance",
            "skill",
            "players",
        ]


    # 현재 사용되는 가중치 총합
    weight_sum = sum(

        MATCH_FIT_WEIGHTS[key]

        for key
        in active_keys
    )


    # 남은 Feature 비율을 다시 정규화해서 계산
    total_score = sum(

        score_detail[key]
        * (
            MATCH_FIT_WEIGHTS[key]
            / weight_sum
        )

        for key
        in active_keys
    )


    # -----------------------------------------------------
    # 7. 최종 결과 반환
    # -----------------------------------------------------

    return {

        "score":
            round(
                total_score,
                2,
            ),

        "score_detail":
            score_detail,

        "distance_km":
            distance_km,

        "estimated_travel_minutes":
            estimated_travel_minutes,

        "reasons":
            _build_reasons(
                score_detail
            ),
    }