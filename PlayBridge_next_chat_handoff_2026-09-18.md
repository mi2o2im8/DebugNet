# PlayBridge 운영진 동호회 기능 — 새 채팅 인수인계 프롬프트

아래 내용을 새 채팅의 첫 메시지로 그대로 붙여 넣고, 이 문서와 함께 준비한 최신 소스 ZIP 및 `운영진 동호회 플로우(1).zip`을 첨부해주세요.

---

## 새 채팅용 프롬프트

나는 `DebugNet` 프로젝트의 운영진 동호회 기능을 계속 개발하고 있다. 이전 채팅의 전체 맥락을 아래에 정리했으니, 이미 완료한 작업을 다시 시작하지 말고 **현재 체크포인트부터** 이어서 도와줘.

### 1. 답변 및 작업 방식

- 한국어로 설명한다.
- 완성된 전체 코드를 한꺼번에 던지지 말고, 내가 직접 따라 칠 수 있도록 **한 단계씩** 진행한다.
- 각 단계는 가능하면 다음 순서로 진행한다.
  1. 수정할 파일과 위치 설명
  2. 추가하거나 교체할 짧은 코드 제시
  3. PowerShell 검증 명령 제시
  4. 내가 결과를 보내면 다음 단계 진행
- 일정상 세부 완성도보다 실제로 동작하는 프로토타입을 우선한다.
- 첨부한 최신 소스 ZIP을 먼저 확인하고, 이 문서와 충돌하면 **첨부 소스의 실제 상태를 우선**한다.
- `.env`, Supabase 키, JWT 등 비밀값을 출력하거나 커밋하도록 요구하지 않는다.
- 현재 작업 트리가 깨끗하다고 가정하지 말고, 필요한 경우 `git status`를 먼저 확인한다.

### 2. 프로젝트 환경

- 로컬 저장소: `C:\Users\Admin\mbca\2차 팀과제\앱개발\DebugNet`
- 프론트엔드: React + Vite
- 백엔드: FastAPI
- 인증·DB·Storage: Supabase
- 로컬 프론트: 보통 `http://localhost:5173`
- 로컬 백엔드: 보통 `http://127.0.0.1:8000`
- 목표: 2026-09-22 전후까지 운영진 동호회 UX 플로우의 프로토타입 완성

### 3. 디자인 규칙

- 모바일 기준: Galaxy S20 Ultra, CSS viewport 약 `412 × 915`
- 앱 본문 최대 너비: `412px`
- 좌우 기본 여백: `20px`
- 글꼴: Maplestory
- 핵심 색상: 네이비 + 초록 `#008006`
- 카드 radius: 약 `10–12px`
- 버튼·입력 높이: 약 `48–50px`
- 상단/하단 safe area를 고려한다.
- 운영 기능 화면은 본문만 스크롤되고 BottomNav는 하단 고정이다.
- BottomNav에 가리지 않도록 레이아웃이 `calc(88px + env(safe-area-inset-bottom))` 정도의 하단 공간을 책임진다.
- 기존 `BottomNav`의 색상·아이콘·전체 디자인은 유지하고 너비만 앱 규격에 맞춘다.

### 4. BottomNav 적용 범위

- `/clubs/create`의 동호회 개설 6단계에는 BottomNav를 적용하지 않는다.
- `/clubs/:clubId/manage`와 이후 운영진 관리 화면에는 `ClubManageLayout` + `Outlet`으로 공통 적용한다.
- 기존 `Main`, `Community`가 BottomNav를 직접 렌더링한다면 중복 렌더링하지 않는다.

### 5. 전체 UX 플로우 진행 상태

첨부된 `운영진 동호회 플로우(1).zip`의 번호 기준이다.

| 번호 | 기능 | 상태 |
|---|---|---|
| 1 | 동호회 개설 | 프론트·백엔드·DB·Storage 연결 및 E2E 검증 완료 |
| 2 | 운영진 동호회 홈/허브 | 프로토타입 구현 완료, 세부 디자인은 나중에 보정 |
| 3–6 | 일정 관리/생성/상세 관리/참석 관리 | **현재 진행 중** |
| 7 | 회원 관리 | 이후 구현 |
| 8 | 게시글 관리 | 다른 팀원이 담당하므로 우선 비워두거나 placeholder 유지 |
| 9 | 매칭 관리 | 이후 구현 |
| 10 | 동호회 설정 | 이후 구현 |

### 6. 완료된 동호회 개설 기능

- `POST /api/clubs`가 Supabase Auth JWT를 검증하고 동호회를 생성한다.
- Swagger 및 프론트 E2E에서 `201 Created`를 확인했다.
- 대표/활동 이미지가 `club-images` Storage와 `club_images` 테이블에 저장된다.
- 관련 주요 파일:
  - `backend/app/schemas/clubs.py`
  - `backend/app/repositories/club_repository.py`
  - `backend/app/services/club_service.py`
  - `backend/app/routers/clubs.py`
  - `backend/main.py`
  - `frontend/src/api/apiClient.js`
  - `frontend/src/api/clubApi.js`
  - `frontend/src/pages/ClubCreate/*`
  - `supabase/migrations/20260917090000_club_create_schema.sql`

### 7. 완료된 동호회 홈/허브

- `GET /api/clubs/{club_id}/dashboard`가 Swagger에서 `200`으로 동작했다.
- 프론트 경로: `/clubs/:clubId/manage`
- 개설 완료 화면의 `홈으로 이동`이 해당 운영 홈으로 연결된다.
- 홈에는 헤더 이미지, 동호회 정보, 빠른 관리, 일정 영역, 매칭 현황, 최근 소식 placeholder가 있다.
- 주요 파일:
  - `frontend/src/pages/ClubDashboard/ClubDashboard.jsx`
  - `frontend/src/pages/ClubDashboard/ClubDashboard.css`
  - `frontend/src/layouts/ClubManageLayout.jsx`
  - `frontend/src/layouts/ClubManageLayout.css`
  - `frontend/src/components/BottomNav.jsx`
  - `frontend/src/components/css/BottomNav.css`
  - `frontend/src/App.jsx`

### 8. 일정 기능의 DB 구조와 결정사항

- `club_schedules`: 반복되는 기본 활동 요일/시간 조건
- `club_events`: 날짜가 확정된 실제 일정
- `event_participants`: 일정 참가자와 신청 상태
- `event_votes`, `event_vote_options`, `event_vote_responses`: 참석/불참/미정 투표
- `event_reviews`: 일정 후기
- `club_default_vote_options`: 동호회 기본 투표 선택지
- FK의 삭제 규칙은 관련 테이블에서 `ON DELETE CASCADE`로 확인했다.
- `event_participants.participant_type`: `member | guest`
- `event_participants.status`: `joined | cancelled | waitlist`
- 참석/불참/미정은 `event_participants.status`가 아니라 투표 테이블로 처리한다.
- `club_events` 기본값의 잘못된 따옴표를 수정했다.
  - `recurrence_type = 'none'`
  - `participation_method = 'open'`
- 기존 한글 상태 `모집중` 7건은 `open`으로 정규화했다.
- 목표 허용값:
  - `status`: `open | closed | completed | cancelled`
  - `recurrence_type`: `none | weekly | monthly | custom`
  - `participation_method`: `open | approval`
- 이 변경을 기록할 일정 전용 Supabase migration 파일은 아직 저장소에 만들지 않았을 가능성이 높다. 실제 소스를 확인한 뒤 생성해야 한다.

### 9. 일정 백엔드의 현재 체크포인트

이미 작성하고 검증한 파일:

1. `backend/app/schemas/club_events.py`
   - `ClubEventCreateRequest`
   - camelCase/snake_case alias 지원
   - 문자열 정리, 시간 범위, 게스트 수, 마감 시간 검증
   - 기본 투표 선택지 `참석`, `불참`, `미정`
   - `python -m compileall -q app` 통과

2. `backend/app/repositories/club_event_repository.py`
   - `create_event`
   - `create_attendance_vote`
   - `create_vote_options`
   - `find_event_by_id`
   - `find_events_by_club`
   - `find_attendance_vote`
   - `find_vote_options`
   - `delete_event`
   - import 테스트에서 `ClubEventRepository`가 정상 출력됨

바로 다음에 확인할 파일:

3. `backend/app/services/club_event_service.py`
4. `backend/app/routers/club_events.py`
5. `backend/main.py`의 router 등록

이전 채팅에서 위 3–5번의 코드는 안내했지만, 아직 내가 파일 작성 및 검증 결과를 확정해서 보내지 않았다. 따라서 새 채팅에서는 먼저 첨부 소스 ZIP에 이 파일들이 실제로 있는지 확인하고 다음 검증부터 진행한다.

```powershell
Set-Location .\backend
python -m compileall -q app main.py
python -c "from main import app; print([path for path in app.openapi().get('paths', {}) if 'events' in path])"
```

예상 API 경로:

```text
POST /api/clubs/{club_id}/events
```

위 검증이 통과하면 Swagger에서 club 9 또는 10을 대상으로 일정 생성 `201 Created`를 확인하고, Supabase의 `club_events`, `event_votes`, `event_vote_options` 저장 결과를 점검한다. 그 뒤 일정 목록 API와 프론트 화면을 연결한다.

### 10. 구현 우선순위

1. 일정 생성 API의 서비스/라우터 등록 및 Swagger 검증
2. 일정 목록 조회 API
3. 일정 생성 화면과 API 연결
4. 일정 상세/수정/삭제
5. 참석 현황/투표 관리
6. 일정 전용 Supabase migration 기록
7. 회원 관리
8. 매칭 관리
9. 동호회 설정
10. 전체 모바일 UI 및 회귀 테스트

### 11. Git 및 보안 주의

- 과거에 원격 `main`과 로컬이 갈라져 rebase한 적이 있으므로 작업 전 `git fetch origin`, `git status`로 상태를 확인한다.
- 사용자가 작성 중인 다른 팀원의 파일이나 무관한 변경을 덮어쓰지 않는다.
- `.env`, JWT, Supabase service key를 ZIP이나 Git에 넣지 않는다.
- 사용자가 이전 채팅에서 JWT를 붙여넣은 적이 있으므로 답변에서 그 값을 재현하지 않는다.

이제 첨부 파일을 확인하고, 위 `9. 일정 백엔드의 현재 체크포인트`부터 한 단계씩 진행해줘.

---

## 새 채팅에 함께 첨부할 파일

필수:

1. 이 문서 `PlayBridge_next_chat_handoff_2026-09-18.md`
2. 아래 PowerShell 스크립트로 만든 `PlayBridge_next_chat_context.zip`
3. 원본 UX 자료 `운영진 동호회 플로우(1).zip`

선택:

- 오류 화면이나 현재 UI 스크린샷 1–2장
- Supabase 쿼리 결과는 필요할 때만 텍스트로 추가

첨부하지 말 것:

- `.env`, `.env.*`
- JWT/access token
- Supabase secret/service-role key
- `node_modules`, `dist`, Python 가상환경
- 오래된 전체 `DebugNet.zip` — 최신 로컬 변경보다 뒤처질 수 있음
