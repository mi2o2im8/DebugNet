
from pathlib import Path
import json

import joblib
import pandas as pd


# ============================================================
# Runtime Resource
# ============================================================

PACKAGE_ROOT = (
    Path(__file__)
    .resolve()
    .parents[1]
)

CONFIG_PATH = (
    PACKAGE_ROOT
    / "config"
    / "h2_runtime_config.json"
)

MODEL_PATH = (
    PACKAGE_ROOT
    / "models"
    / "h2_official_prior.joblib"
)


with open(
    CONFIG_PATH,
    "r",
    encoding="utf-8"
) as f:

    H2_RUNTIME_CONFIG = (
        json.load(f)
    )


H2_PRIOR_MODEL = joblib.load(
    MODEL_PATH
)


# ============================================================
# Engine-local Namespace
# ============================================================

H2_WEIGHTS = {

    axis: float(weight)

    for axis, weight
    in H2_RUNTIME_CONFIG[
        "direct_fit_axes"
    ].items()
}


# 실제 저장 Model 기준으로 고정
H2_MODEL_FEATURES = list(
    H2_PRIOR_MODEL.feature_names_in_
)

H2_MODEL_CLASSES = list(
    H2_PRIOR_MODEL.classes_
)


H2_POSITIVE_IDX = next(

    i

    for i, cls
    in enumerate(
        H2_MODEL_CLASSES
    )

    if str(cls) == "1"
)


# ------------------------------------------------------------
# 검증된 MVP Runtime Rule
#
# 학습 Threshold가 아님.
# 기존 H2 Reference Contract 기준.
# ------------------------------------------------------------

H2_FIT_THRESHOLD = 85.0

H2_SEVERE_THRESHOLD = 0.50

H2_PARTIAL_LOW = 0.50
H2_PARTIAL_HIGH = 0.75


H2_TRIAL_TARGETS = {
    "조건부 적합",
    "확인 필요",
}


# ============================================================
# Sport Normalization
# ============================================================

H2_SPORT_ALIASES = {

    "축구·풋살":
        "축구, 풋살",

    "축구/풋살":
        "축구, 풋살",

    "축구,풋살":
        "축구, 풋살",

    "축구, 풋살":
        "축구, 풋살",

    "농구":
        "농구",

    "배구":
        "배구",

    "탁구":
        "탁구",

    "테니스":
        "테니스",
}


def h2_normalize_sport(
    sport
):

    value = str(
        sport
    ).strip()

    return (
        H2_SPORT_ALIASES.get(
            value,
            value
        )
    )


# ============================================================
# Direct Fit
# ============================================================

def h2_calculate_direct_fit(
    axis_scores
):

    missing = [

        axis

        for axis
        in H2_WEIGHTS

        if axis
        not in axis_scores
    ]


    if missing:

        raise ValueError(
            "H2 Direct Fit 입력 누락: "
            f"{missing}"
        )


    weighted_sum = sum(

        float(
            axis_scores[axis]
        )
        *
        H2_WEIGHTS[axis]

        for axis
        in H2_WEIGHTS
    )


    total_weight = sum(
        H2_WEIGHTS.values()
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

def h2_diagnose_fit_axes(
    axis_scores
):

    severe = [

        axis

        for axis
        in H2_WEIGHTS

        if (
            float(
                axis_scores[axis]
            )
            <
            H2_SEVERE_THRESHOLD
        )
    ]


    partial = [

        axis

        for axis
        in H2_WEIGHTS

        if (
            H2_PARTIAL_LOW
            <=
            float(
                axis_scores[axis]
            )
            <
            H2_PARTIAL_HIGH
        )
    ]


    return severe, partial


# ============================================================
# Classification
# ============================================================

def h2_classify(
    hard_pass,
    direct_fit,
    severe
):

    # Hard Constraint 최우선
    if not bool(
        hard_pass
    ):
        return "부적합"


    # Severe mismatch가 있으면
    # 총점과 무관하게 확인 필요
    if severe:
        return "확인 필요"


    # 85는 실제 outcome으로 학습한 값이 아닌
    # MVP Rule
    if float(
        direct_fit
    ) >= H2_FIT_THRESHOLD:
        return "적합"


    return "조건부 적합"


# ============================================================
# Operator Action
#
# 반드시 H2 이름으로 격리.
# H4 operator_action과 공유하지 않음.
# ============================================================

def h2_operator_action(
    classification,
    trial_recommended
):

    if classification == "적합":
        return "가입 검토 우선"


    if (
        classification
        == "조건부 적합"
        and
        bool(
            trial_recommended
        )
    ):
        return "체험 후 가입 검토"


    if (
        classification
        == "확인 필요"
        and
        bool(
            trial_recommended
        )
    ):
        return (
            "불일치 조건 확인 + "
            "체험 권장"
        )


    if classification == "부적합":
        return "가입 비추천"


    return "조건 확인 후 검토"


# ============================================================
# Official Prior Adapter
#
# 서비스에서는:
# sport
# activity_frequency
#
# 만 사용.
#
# Legacy joblib column:
# 최근1년_체육활동경험1
# 규칙적체육활동_빈도
#
# 는 모듈 내부에서만 처리.
# ============================================================

def h2_build_official_prior_input(
    sport,
    activity_frequency
):

    normalized_sport = (
        h2_normalize_sport(
            sport
        )
    )


    runtime_schema = (
        H2_RUNTIME_CONFIG[
            "runtime_schema"
        ]
    )


    supported = set(
        runtime_schema[
            "official_prior_supported_sports"
        ]
    )


    # Tennis 등 Prior 미검증 종목
    if normalized_sport not in supported:

        return {

            "available":
                False,

            "input":
                None,

            "reason":
                (
                    f"{normalized_sport}은(는) "
                    "H2 Official Prior 검증 "
                    "지원종목이 아님. "
                    "Direct Fit만 사용."
                ),
        }


    mapping = (
        runtime_schema[
            "legacy_model_feature_mapping"
        ]
    )


    model_input = {

        mapping[
            "sport"
        ]:
            normalized_sport,

        mapping[
            "activity_frequency"
        ]:
            activity_frequency,
    }


    return {

        "available":
            True,

        "input":
            model_input,

        "reason":
            "Official Prior 사용 가능",
    }


# ============================================================
# Official Prior Runtime
# ============================================================

def h2_predict_official_prior(
    feature_input
):

    if feature_input is None:
        return None


    missing = [

        feature

        for feature
        in H2_MODEL_FEATURES

        if feature
        not in feature_input
    ]


    if missing:

        raise ValueError(
            "H2 Official Prior "
            "필수 Feature 누락: "
            f"{missing}"
        )


    X = pd.DataFrame(

        [
            {
                feature:
                    feature_input[
                        feature
                    ]

                for feature
                in H2_MODEL_FEATURES
            }
        ],

        columns=
            H2_MODEL_FEATURES,
    )


    probability = (

        H2_PRIOR_MODEL

        .predict_proba(
            X
        )[0][
            H2_POSITIVE_IDX
        ]
    )


    return round(
        float(
            probability
        )
        *
        100,
        6
    )


# ============================================================
# Core Engine
# ============================================================

def run_h2_applicant_fit(
    applicant_id,
    axis_scores,
    hard_checks,
    club_trial_available,
    official_prior_input=None
):
    """
    Low-level H2 API.

    legacy Official Prior input을 직접 받을 수 있으나,
    Streamlit/Backend에서는
    run_h2_applicant_fit_runtime 사용 권장.
    """


    hard_failures = [

        key

        for key, passed
        in hard_checks.items()

        if not bool(
            passed
        )
    ]


    hard_pass = (
        len(
            hard_failures
        )
        == 0
    )


    direct_fit = (
        h2_calculate_direct_fit(
            axis_scores
        )
    )


    severe, partial = (
        h2_diagnose_fit_axes(
            axis_scores
        )
    )


    classification = (
        h2_classify(

            hard_pass=
                hard_pass,

            direct_fit=
                direct_fit,

            severe=
                severe,
        )
    )


    trial_recommended = (

        bool(
            club_trial_available
        )

        and

        classification
        in H2_TRIAL_TARGETS
    )


    official_prior = None


    if official_prior_input is not None:

        official_prior = (
            h2_predict_official_prior(
                official_prior_input
            )
        )


    return {

        "신청자_ID":
            applicant_id,

        "HardConstraint_통과":
            hard_pass,

        "HardConstraint_사유":
            (
                "-"
                if hard_pass
                else " / ".join(
                    hard_failures
                )
            ),

        "DirectFit_100":
            direct_fit,

        # Hard fail이면 UI에서
        # 적합도 점수 노출하지 않는 용도
        "표시점수":
            (
                direct_fit
                if hard_pass
                else None
            ),

        "심한불일치축":
            (
                ", ".join(
                    severe
                )
                if severe
                else "-"
            ),

        "부분불일치축":
            (
                ", ".join(
                    partial
                )
                if partial
                else "-"
            ),

        "OfficialPrior_100":
            official_prior,

        "최종판정":
            classification,

        "체험추천":
            trial_recommended,

        "운영자_추천액션":
            h2_operator_action(
                classification,
                trial_recommended
            ),
    }


# ============================================================
# Service / Streamlit Public API
# ============================================================

def run_h2_applicant_fit_runtime(
    applicant_id,
    axis_scores,
    hard_checks,
    club_trial_available,
    sport,
    activity_frequency
):
    """
    Streamlit / Backend용 Public API.

    legacy Model Feature명을 외부에 노출하지 않는다.
    """


    prior_adapter = (
        h2_build_official_prior_input(

            sport=
                sport,

            activity_frequency=
                activity_frequency,
        )
    )


    result = (
        run_h2_applicant_fit(

            applicant_id=
                applicant_id,

            axis_scores=
                axis_scores,

            hard_checks=
                hard_checks,

            club_trial_available=
                club_trial_available,

            official_prior_input=
                prior_adapter[
                    "input"
                ],
        )
    )


    result[
        "OfficialPrior_Available"
    ] = prior_adapter[
        "available"
    ]


    result[
        "OfficialPrior_Reason"
    ] = prior_adapter[
        "reason"
    ]


    result[
        "Runtime_Sport"
    ] = h2_normalize_sport(
        sport
    )


    return result


__all__ = [

    "H2_RUNTIME_CONFIG",
    "H2_WEIGHTS",
    "H2_MODEL_FEATURES",
    "H2_FIT_THRESHOLD",

    "h2_normalize_sport",
    "h2_calculate_direct_fit",
    "h2_diagnose_fit_axes",
    "h2_classify",
    "h2_operator_action",

    "h2_build_official_prior_input",
    "h2_predict_official_prior",

    "run_h2_applicant_fit",
    "run_h2_applicant_fit_runtime",
]
