from __future__ import annotations

import logging
import warnings
from pathlib import Path
from typing import Any

import joblib


logger = logging.getLogger(__name__)


# =========================================================
# ML1 - 챗봇 자연어 요구/니즈 분석 모델
# =========================================================
# 모델: Character TF-IDF + One-vs-Rest Logistic Regression
# 학습: 챗봇용 ML.ipynb (당근 동호회 이용자 문장 230개)
#
# 역할
# → 사용자 문장에서 "어떤 요구가 담겨 있는지" 보조 신호를 뽑는다.
# → 종목/지역 판단이나 동호회 추천 순위에는 직접 사용하지 않는다.
# → POC1 입력 변수로 변환하지 않는다.
# =========================================================

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "playbridge_chatbot_multilabel_model.pkl"
)


# =========================================================
# class 번호 ↔ 요인 이름
# =========================================================
# 학습 노트북의 MultiLabelBinarizer(mlb.classes_) 순서 그대로다.
# (가나다순 정렬) 순서를 바꾸면 결과가 틀어지므로 수정 금지.
# =========================================================

ML1_LABELS = [
    "가입 절차",       # 0
    "거리 및 접근성",  # 1
    "동호회 분위기",   # 2
    "맞춤 선택",       # 3
    "비용",            # 4
    "심리적 부담",     # 5
    "일정",            # 6
    "정보 탐색",       # 7
]

# 학습 때 사용한 기본 기준값
ML1_THRESHOLD = 0.5


# =========================================================
# 모델 1회 로드 (서버 실행 중 재사용)
# =========================================================

_model: Any = None
_load_failed = False


def _get_model() -> Any:
    global _model, _load_failed

    if _model is not None:
        return _model

    if _load_failed:
        return None

    try:
        # scikit-learn 버전 차이 경고는 동작 확인을 마쳤으므로 숨긴다.
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            _model = joblib.load(MODEL_PATH)

        logger.info("ML1 모델 로드 완료: %s", MODEL_PATH.name)
        return _model

    except Exception:
        _load_failed = True
        logger.exception("ML1 모델 로드 실패: %s", MODEL_PATH)
        return None


# =========================================================
# 문장 분석
# =========================================================
# 반환 예시
# {
#     "available": True,
#     "factors": ["일정"],                  # threshold 이상 요인
#     "scores": {"가입 절차": 0.4728, ...}, # 8개 요인 확률
# }
#
# 모델을 쓸 수 없거나 문장이 비어 있으면
# available=False 로 돌려주고, 챗봇은 ML1 없이 계속 동작한다.
# =========================================================

def analyze_needs(text: str) -> dict[str, Any]:
    empty_result = {
        "available": False,
        "factors": [],
        "scores": {},
    }

    cleaned = (text or "").strip()

    if not cleaned:
        return empty_result

    model = _get_model()

    if model is None:
        return empty_result

    try:
        probabilities = model.predict_proba([cleaned])[0]
    except Exception:
        logger.exception("ML1 예측 실패")
        return empty_result

    scores = {
        label: round(float(probability), 4)
        for label, probability in zip(ML1_LABELS, probabilities)
    }

    factors = [
        label
        for label, probability in scores.items()
        if probability >= ML1_THRESHOLD
    ]

    return {
        "available": True,
        "factors": factors,
        "scores": scores,
    }