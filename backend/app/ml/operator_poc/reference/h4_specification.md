# H4 회원 참여 관리 — MVP Final Specification

## 1. 목적

가입 후 실제 활동 데이터를 기반으로
참여가 저하되고 있는 회원을 조기에 탐지하고,
운영자가 적절한 확인 및 관리 행동을 취할 수 있도록 지원한다.

---

## 2. H4의 데이터 역할

### 공식 설문데이터

공식 설문의 `규칙적체육활동 참여감소`를
Proxy Target으로 검토하였다.

그러나 다음 문제를 확인하였다.

- 2020~2021 코로나 충격에 따른 Target 급변
- 2024 Feature-Target 관계 Drift
- 현재 동호회 활동회원으로 모집단을 제한할 경우 표본 감소
- 핵심종목에서 비코로나 시기의 참여감소 양성표본 부족
- 설문 Target은 실제 앱의 미래 이탈/참여저하와 동일하지 않음

따라서 공식데이터 모델은
Production Risk Score에 사용하지 않는다.

공식데이터의 역할은
Research Evidence 및 서비스 설계 근거로 한정한다.

---

## 3. 정성데이터 역할

크롤링 정성데이터는
직접 학습변수 또는 Weight로 사용하지 않는다.

활용 목적:

- 참여저하의 가능한 원인 유형 정의
- Reason Candidate 생성
- 사용자 확인 질문 설계
- Operator Intervention 설계

행동로그만으로
심리적 부담, 분위기 문제, 비용 문제 등의
실제 원인을 확정하지 않는다.

---

## 4. Production Input

실제 서비스 Event Log:

- attended
- cancelled
- no_show
- not_eligible

회원가입 / 프로필 정보:

- 희망 활동빈도
- 가능 요일·시간
- H2 Fit 정보 등

`not_eligible` 일정은
불참으로 계산하지 않는다.

---

## 5. Behavior Features

- 이전 4주 참석률
- 최근 4주 참석률
- 참석률 변화폭
- 최근 4주 취소율
- 최근 4주 노쇼율
- 연속 미참여 횟수
- 연속 노쇼 횟수
- 희망빈도 대비 실제참여
- 마지막 참석 이후 미참여 가능기회

---

## 6. Risk Dimensions

### Participation Trend
현재 참여율 및 최근 참여율 하락.

### No-show Risk
최근 노쇼율 및 연속 노쇼.

### Cancellation Risk
반복적인 사전 취소.

### Engagement Gap
희망 활동빈도 대비 실제 참여 부족.

### Inactivity
마지막 참석 이후 참여 가능한 활동을
계속 놓치는 상태.

---

## 7. Risk Severity Index

MVP 방식:

`Risk = 0.70 × Dominant Risk + 0.30 × Mean Risk`

여기서:

- Dominant Risk = 5개 Risk Dimension 중 최대값
- Mean Risk = 5개 Dimension 평균

Risk Score는
실제 이탈확률이 아니다.

운영 우선순위를 위한
MVP Risk Severity Index다.

---

## 8. MVP Risk Grade

- 정상: 0 ~ 29.9
- 관찰: 30 ~ 54.9
- 관리 필요: 55 ~ 79.9
- 고위험: 80 이상

해당 Threshold는
실제 이탈 라벨로 학습된 값이 아니다.

Synthetic Scenario 기반
MVP Rule이다.

---

## 9. Recovery

최근 참여가 과거보다 회복된 경우
별도의 Recovery Signal을 생성한다.

Recovery는 Risk Score에서
자동 차감하지 않는다.

---

## 10. Explainability Flow

Detection
→ Risk Dimension
→ Risk Grade
→ Reason Candidate
→ User Confirmation
→ Operator Intervention

Reason Candidate는
정성데이터 기반의 가능한 설명이며
확정 원인이 아니다.

---

## 11. MVP QA 결과

Synthetic Scenario에서 기대 순서:

M04 > M03 > M06 > M02

실제 Dominant + Breadth 결과:

- M04: 94.0 / 고위험
- M03: 91.0 / 고위험
- M06: 59.7 / 관리 필요
- M02: 46.0 / 관찰

정상 및 회복 Scenario:

- M01: 정상
- M05: 정상 / 회복
- M07: 정상
- M08: 정상 / 회복

균형형 Threshold Scenario QA:
8 / 8 PASS.

단, 이는 실제 예측 정확도가 아니라
Synthetic Service Logic QA 결과다.

---

## 12. 향후 개선

실제 서비스 로그가 축적되면:

- 향후 4주 참여감소
- 장기 미참여
- 휴면
- 탈퇴
- 재참여

등을 실제 Target으로 정의한다.

그 이후:

- Dimension Weight 학습
- Threshold 재설정
- Calibration
- 실제 Intervention 효과 측정
- Risk → Action 정책 개선

등을 수행한다.

---

## 13. 최종 H4 정의

H4는 전통적인 설문 기반 ML 예측모델이 아니라,

**서비스 행동로그 기반 Participation Early Warning Engine**

이다.

공식데이터는 Research Evidence,
정성데이터는 Explainability / Intervention,
실제 서비스 로그는 Detection의 중심 데이터로 사용한다.
