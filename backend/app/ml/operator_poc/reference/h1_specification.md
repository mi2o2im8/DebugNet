# H1 모집 대상 추천 — Final MVP Specification

## 1. 목적

특정 동호회가 신규 회원을 모집할 때,
아직 가입 신청하지 않은 전체 서비스 회원 중
모집 적합도가 높은 후보를 탐색하고 우선순위를 제공한다.

H2가 '가입 신청 이후의 신청자 적합도 평가'라면,
H1은 '가입 신청 이전의 후보 탐색 및 모집 우선순위'이다.


## 2. Official Data 분석 결론

공식 생활체육 조사 데이터의 향후 동호회 가입의향을 Target으로 분석하였다.

전체 표본에서는 유의미한 예측 신호가 존재했으나,
실제 서비스 핵심 종목
축구·풋살 / 농구 / 배구 / 탁구 / 테니스
희망 사용자군으로 제한했을 때 성능이 크게 하락하였다.

RecentSport + CurrentFreq:
- Core Rolling ROC-AUC: 0.5815
- 따라서 개인별 Recruitment Ranking에는 사용하지 않는다.

공식데이터는 서비스 필요성과 모집 의향 특성에 대한
Research / Market Context로만 유지한다.


## 3. Candidate Retrieval

전체 회원 Pool에서 아래 조건을 순차 적용한다.

1. 모집제안 수신 동의
2. 종목 일치
3. 일정 교집합 존재
4. 실제 예상 이동시간 <= 사용자 이동 허용범위
5. 운영자가 설정한 연령조건
6. 운영자가 설정한 성별조건

통과한 사용자만 Recruitment Candidate Pool에 포함한다.


## 4. Recruitment Ranking

최종 Ranking 축:

- 일정 × 1.0
- 실력 × 1.0
- 목적 × 1.0
- 분위기 × 1.0
- 활동빈도 × 1.0
- 비용 × 0.5

이동은 Ranking Score에서 제외한다.
이미 Hard Constraint로 이동 가능 여부를 검사했기 때문에
다시 감점하면 이중 패널티가 발생하기 때문이다.


## 5. Bottleneck

Core 축:
일정 / 실력 / 목적 / 분위기 / 활동빈도

Core Match < 0.50:
강한 불일치

0.50 <= Match < 0.75:
부분 불일치

비용은 Supplemental 축이므로
Core Bottleneck으로 판정하지 않는다.


## 6. Action

강한 불일치 없음 + Score >= 90
→ 최우선 모집

강한 불일치 없음 + Score >= 80
→ 우선 모집

강한 불일치 없음 + Score < 80
→ 일반 후보

강한 불일치 존재 + Score >= 70 + 체험 가능
→ 체험 제안

그 외
→ 후순위


## 7. Threshold 주의

90 / 80 / 70점은 ML로 학습한 기준이 아니다.

현재 실제 모집 성공 Target이 없기 때문에
MVP 운영 Rule로 사용한다.

향후 아래 로그가 축적되면 재학습 또는 최적화한다.

추천 노출
→ 클릭
→ 모집 제안
→ 응답
→ 체험
→ 가입
→ 지속 활동


## 8. 나이 / 성별

나이와 성별은 일반적인 Recruitment Score에는 사용하지 않는다.

운영자가 명시적으로 모집조건을 설정한 경우에만
Optional Hard Constraint로 사용한다.


## 9. H1 / H2 차이

H1:
전체 회원 → 모집 가능한 Candidate 탐색 → Ranking

H2:
실제 가입 신청자 → 동호회와의 Fit 평가

두 엔진은 일부 Compatibility 로직을 공유할 수 있으나
서비스 목적과 호출 시점은 명확히 구분한다.