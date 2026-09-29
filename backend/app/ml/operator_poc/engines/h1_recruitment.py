
from pathlib import Path
import json
import math
import pandas as pd


# ============================================================
# Runtime Config
# ============================================================

PACKAGE_ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = PACKAGE_ROOT / "config" / "h1_runtime_config.json"


with open(
    CONFIG_PATH,
    "r",
    encoding="utf-8"
) as f:
    H1_CONFIG = json.load(f)


# ============================================================
# Engine-local Constants
#
# 중요:
# 다른 Engine의 전역변수와 절대 공유하지 않는다.
# ============================================================

H1_WEIGHTS = {
    axis: float(info["weight"])
    for axis, info
    in H1_CONFIG["ranking_axes"].items()
}


H1_CORE_AXES = list(
    H1_CONFIG[
        "bottleneck"
    ][
        "core_axes"
    ]
)


H1_SEVERE_THRESHOLD = float(
    H1_CONFIG[
        "bottleneck"
    ][
        "severe_threshold"
    ]
)


H1_PARTIAL_LOW = float(
    H1_CONFIG[
        "bottleneck"
    ][
        "partial_range"
    ][0]
)


H1_PARTIAL_HIGH = float(
    H1_CONFIG[
        "bottleneck"
    ][
        "partial_range"
    ][1]
)


H1_AXIS_LABELS = {
    "schedule": "일정",
    "skill": "실력",
    "purpose": "목적",
    "atmosphere": "분위기",
    "activity_frequency": "활동빈도",
    "cost": "비용",
}


H1_SKILL_LEVELS = {
    key: int(value)
    for key, value
    in H1_CONFIG[
        "ranking_axes"
    ][
        "skill"
    ][
        "levels"
    ].items()
}


H1_PURPOSE_LEVELS = {
    key: int(value)
    for key, value
    in H1_CONFIG[
        "ranking_axes"
    ][
        "purpose"
    ][
        "levels"
    ].items()
}


# ============================================================
# Utility
# ============================================================

def _safe_float(value, default=0.0):

    try:
        return float(value)

    except (
        TypeError,
        ValueError,
    ):
        return float(default)


def _clamp01(value):

    return max(
        0.0,
        min(
            1.0,
            float(value)
        )
    )


def _as_list(value):

    if value is None:
        return []

    if isinstance(
        value,
        (
            list,
            tuple,
            set,
        )
    ):
        return list(value)

    return [value]


# ============================================================
# Hard Filter
# ============================================================

def h1_check_hard_filters(
    club,
    user
):
    """
    Candidate Retrieval.

    순서:
    1. 모집 제안 수신 동의
    2. 종목 exact match
    3. 일정 overlap
    4. 이동 가능
    5. optional age
    6. optional gender
    """

    # 1. Consent
    if not bool(
        user.get(
            "모집제안수신동의",
            False
        )
    ):
        return False, "모집제안수신동의"


    # 2. Sport
    if (
        user.get("희망종목")
        !=
        club.get("운영종목")
    ):
        return False, "종목 불일치"


    # 3. Schedule
    club_slots = set(
        _as_list(
            club.get(
                "정기활동슬롯"
            )
        )
    )

    user_slots = set(
        _as_list(
            user.get(
                "가능슬롯"
            )
        )
    )

    if not (
        club_slots
        &
        user_slots
    ):
        return False, "일정 교집합 없음"


    # 4. Travel
    expected_travel = _safe_float(
        user.get(
            "예상이동시간_분"
        ),
        math.inf
    )

    allowed_travel = _safe_float(
        user.get(
            "이동가능시간_분"
        ),
        -math.inf
    )

    if expected_travel > allowed_travel:
        return False, "이동 가능 범위 초과"


    # 5. Optional Age
    age_constraint = club.get(
        "모집연령조건"
    )

    if age_constraint not in (
        None,
        "",
        [],
        (),
    ):

        age_values = _as_list(
            age_constraint
        )

        if len(age_values) >= 2:

            min_age = _safe_float(
                age_values[0]
            )

            max_age = _safe_float(
                age_values[1]
            )

            user_age = _safe_float(
                user.get(
                    "나이"
                ),
                -1
            )

            if not (
                min_age
                <= user_age
                <= max_age
            ):
                return False, "연령조건 불충족"


    # 6. Optional Gender
    gender_constraint = club.get(
        "모집성별조건"
    )

    if gender_constraint not in (
        None,
        "",
        [],
        (),
    ):

        allowed_genders = set(
            _as_list(
                gender_constraint
            )
        )

        if (
            user.get("성별")
            not in allowed_genders
        ):
            return False, "성별조건 불충족"


    return True, "-"


# ============================================================
# Ranking Axis
# ============================================================

def h1_schedule_match(
    club,
    user
):

    club_slots = set(
        _as_list(
            club.get(
                "정기활동슬롯"
            )
        )
    )

    user_slots = set(
        _as_list(
            user.get(
                "가능슬롯"
            )
        )
    )

    if len(club_slots) == 0:
        return 0.0

    overlap = len(
        club_slots
        &
        user_slots
    )

    return _clamp01(
        overlap
        /
        len(club_slots)
    )


def h1_skill_match(
    club,
    user
):

    club_skills = _as_list(
        club.get(
            "모집희망실력"
        )
    )

    user_skill = user.get(
        "실력"
    )

    if (
        user_skill
        not in H1_SKILL_LEVELS
    ):
        return 0.0

    valid_club_levels = [
        H1_SKILL_LEVELS[x]
        for x in club_skills
        if x in H1_SKILL_LEVELS
    ]

    if not valid_club_levels:
        return 0.0

    user_level = (
        H1_SKILL_LEVELS[
            user_skill
        ]
    )

    min_distance = min(
        abs(
            user_level
            -
            club_level
        )
        for club_level
        in valid_club_levels
    )

    return _clamp01(
        1.0
        -
        0.5
        *
        min_distance
    )


def h1_purpose_match(
    club,
    user
):

    club_purpose = club.get(
        "운영목적"
    )

    user_purpose = user.get(
        "목적"
    )

    if (
        club_purpose
        not in H1_PURPOSE_LEVELS
        or
        user_purpose
        not in H1_PURPOSE_LEVELS
    ):
        return 0.0

    distance = abs(
        H1_PURPOSE_LEVELS[
            club_purpose
        ]
        -
        H1_PURPOSE_LEVELS[
            user_purpose
        ]
    )

    return _clamp01(
        1.0
        -
        0.5
        *
        distance
    )


def h1_atmosphere_match(
    club,
    user
):

    club_value = _safe_float(
        club.get(
            "분위기점수"
        )
    )

    user_value = _safe_float(
        user.get(
            "분위기점수"
        )
    )

    return _clamp01(
        1.0
        -
        abs(
            user_value
            -
            club_value
        )
        /
        4.0
    )


def h1_activity_frequency_match(
    club,
    user
):

    club_frequency = _safe_float(
        club.get(
            "월활동횟수"
        )
    )

    user_frequency = _safe_float(
        user.get(
            "희망월활동횟수"
        )
    )

    if (
        club_frequency <= 0
        and
        user_frequency <= 0
    ):
        return 1.0

    if (
        club_frequency <= 0
        or
        user_frequency <= 0
    ):
        return 0.0

    return _clamp01(
        min(
            club_frequency,
            user_frequency
        )
        /
        max(
            club_frequency,
            user_frequency
        )
    )


def h1_cost_match(
    club,
    user
):

    club_cost = _safe_float(
        club.get(
            "월예상비용_원"
        )
    )

    user_budget = _safe_float(
        user.get(
            "월예산_원"
        )
    )

    if club_cost <= 0:
        return 1.0

    if user_budget <= 0:
        return 0.0

    return _clamp01(
        min(
            1.0,
            user_budget
            /
            club_cost
        )
    )


# ============================================================
# Match / Score
# ============================================================

def calculate_h1_matches(
    club,
    user
):

    return {
        "schedule":
            round(
                h1_schedule_match(
                    club,
                    user
                ),
                6
            ),

        "skill":
            round(
                h1_skill_match(
                    club,
                    user
                ),
                6
            ),

        "purpose":
            round(
                h1_purpose_match(
                    club,
                    user
                ),
                6
            ),

        "atmosphere":
            round(
                h1_atmosphere_match(
                    club,
                    user
                ),
                6
            ),

        "activity_frequency":
            round(
                h1_activity_frequency_match(
                    club,
                    user
                ),
                6
            ),

        "cost":
            round(
                h1_cost_match(
                    club,
                    user
                ),
                6
            ),
    }


def calculate_h1_score(
    matches
):

    weighted_sum = sum(

        float(
            matches[axis]
        )
        *
        H1_WEIGHTS[axis]

        for axis
        in H1_WEIGHTS
    )


    total_weight = sum(
        H1_WEIGHTS.values()
    )


    if total_weight <= 0:
        return 0.0


    return round(
        weighted_sum
        /
        total_weight
        *
        100,
        2
    )


# ============================================================
# Mismatch
# ============================================================

def detect_h1_mismatch(
    matches
):

    severe = [

        H1_AXIS_LABELS[axis]

        for axis
        in H1_CORE_AXES

        if (
            float(
                matches[axis]
            )
            <
            H1_SEVERE_THRESHOLD
        )
    ]


    partial = [

        H1_AXIS_LABELS[axis]

        for axis
        in H1_WEIGHTS

        if (
            H1_PARTIAL_LOW
            <=
            float(
                matches[axis]
            )
            <
            H1_PARTIAL_HIGH
        )
    ]


    return severe, partial


# ============================================================
# Action
# ============================================================

def h1_select_action(
    score,
    severe_mismatch,
    trial_available
):

    has_severe = bool(
        severe_mismatch
    )


    if not has_severe:

        if score >= 90:
            return "최우선 모집"

        if score >= 80:
            return "우선 모집"

        return "일반 후보"


    if (
        score >= 70
        and
        bool(
            trial_available
        )
    ):
        return "체험 제안"


    return "후순위"


# ============================================================
# Single Candidate Evaluation
# ============================================================

def evaluate_h1_candidate(
    club,
    user
):

    candidate_id = (
        user.get(
            "회원_ID"
        )
        or
        user.get(
            "Candidate_ID"
        )
        or
        "UNKNOWN"
    )


    hard_pass, fail_reason = (
        h1_check_hard_filters(
            club,
            user
        )
    )


    if not hard_pass:

        return {
            "Candidate_ID":
                candidate_id,

            "Hard_Filter_Pass":
                False,

            "Hard_Filter_Fail_Reason":
                fail_reason,

            "Direct_Match_Score":
                None,

            "Severe_Mismatch":
                "-",

            "Partial_Mismatch":
                "-",

            "Action":
                "Candidate 제외",

            "Ranking":
                None,
        }


    matches = (
        calculate_h1_matches(
            club,
            user
        )
    )


    score = (
        calculate_h1_score(
            matches
        )
    )


    severe, partial = (
        detect_h1_mismatch(
            matches
        )
    )


    action = (
        h1_select_action(

            score=
                score,

            severe_mismatch=
                severe,

            trial_available=
                club.get(
                    "체험가능여부",
                    False
                ),
        )
    )


    return {

        "Candidate_ID":
            candidate_id,

        "Hard_Filter_Pass":
            True,

        "Hard_Filter_Fail_Reason":
            "-",

        "Direct_Match_Score":
            score,

        "Severe_Mismatch":
            (
                ", ".join(severe)
                if severe
                else "-"
            ),

        "Partial_Mismatch":
            (
                ", ".join(partial)
                if partial
                else "-"
            ),

        "Action":
            action,

        "Ranking":
            None,

        # UI/설명용 상세값
        "Match_schedule":
            matches["schedule"],

        "Match_skill":
            matches["skill"],

        "Match_purpose":
            matches["purpose"],

        "Match_atmosphere":
            matches["atmosphere"],

        "Match_activity_frequency":
            matches[
                "activity_frequency"
            ],

        "Match_cost":
            matches["cost"],
    }


# ============================================================
# Public Engine
# ============================================================

def run_h1_recruitment(
    club,
    users,
    return_all=False
):
    """
    Public Runtime API.

    Parameters
    ----------
    club : dict
    users : list[dict]
    return_all : bool
        False면 Hard Filter 통과 Candidate만 반환.
        True면 제외 Candidate까지 포함.

    Returns
    -------
    pandas.DataFrame
    """

    results = [
        evaluate_h1_candidate(
            club,
            user
        )
        for user in users
    ]


    df = pd.DataFrame(
        results
    )


    if df.empty:
        return df


    # Candidate Pool만 Ranking
    passed_mask = (
        df[
            "Hard_Filter_Pass"
        ]
        == True
    )


    if passed_mask.any():

        scores = (
            df.loc[
                passed_mask,
                "Direct_Match_Score"
            ]
            .astype(float)
        )


        # Competition Ranking
        df.loc[
            passed_mask,
            "Ranking"
        ] = (
            scores
            .rank(
                method="min",
                ascending=False
            )
            .astype(int)
        )


    # nullable integer
    df["Ranking"] = (
        pd.array(
            df["Ranking"],
            dtype="Int64"
        )
    )


    if return_all:

        # 통과 후보 우선
        # 그 안에서 Ranking 순
        df["_pass_sort"] = (
            ~df[
                "Hard_Filter_Pass"
            ]
        )

        df = (
            df
            .sort_values(
                [
                    "_pass_sort",
                    "Ranking",
                    "Candidate_ID",
                ],
                ascending=[
                    True,
                    True,
                    True,
                ],
                kind="stable"
            )
            .drop(
                columns=[
                    "_pass_sort"
                ]
            )
            .reset_index(
                drop=True
            )
        )

        return df


    return (
        df[
            df[
                "Hard_Filter_Pass"
            ]
            == True
        ]
        .sort_values(
            [
                "Ranking",
                "Candidate_ID"
            ],
            kind="stable"
        )
        .reset_index(
            drop=True
        )
    )


__all__ = [
    "H1_CONFIG",
    "H1_WEIGHTS",
    "calculate_h1_matches",
    "calculate_h1_score",
    "detect_h1_mismatch",
    "h1_select_action",
    "h1_check_hard_filters",
    "evaluate_h1_candidate",
    "run_h1_recruitment",
]
