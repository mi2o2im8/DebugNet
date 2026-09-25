from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 예약 알림 스케줄러 (일정 당일 알림 / 투표 결과 알림)
from app.core.scheduler import start_scheduler, shutdown_scheduler

# 회원가입 API Router 가져오기
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.clubs import router as clubs_router

# 게시글 API Router 가져오기
from app.routers.posts import router as posts_router

# 게시글 댓글 API Router 가져오기
from app.routers.comments import router as comments_router

# 유저 차단 API Router 가져오기
from app.routers.blocks import router as blocks_router

# 동호회(운영진) 일정 생성 API Router 가져오기
from app.routers.club_events import (
    router as club_events_router,
)


# 동호회 가입 신청 및 회원 관리 API Router
from app.routers.club_members import (
    router as club_members_router,
)

# 팀매칭 API Router 가져오기
from app.routers.matches import ( router as matches_router, )


# ---------------------------------------------------------
# 서버 시작 / 종료 시 실행할 작업
#
# - 서버가 켜질 때: 예약 알림 스케줄러 시작
# - 서버가 꺼질 때: 스케줄러 정리
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    shutdown_scheduler()


# ---------------------------------------------------------
# PlayBridge FastAPI 애플리케이션 생성
# ---------------------------------------------------------
app = FastAPI(
    title="PlayBridge API",
    description="PlayBridge 백엔드 API 서버",
    version="0.1.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS 설정
#
# React 개발 서버(localhost:5173)가
# FastAPI 서버(localhost:8000)에 요청할 수 있도록 허용한다.
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Router 연결
#
# 현재 auth_router에는 FastAPI 회원가입 API만 있다.
# 로그인은 React가 Supabase Auth와 직접 처리한다.
# ---------------------------------------------------------
app.include_router(auth_router)
app.include_router(clubs_router)
app.include_router(users_router)

app.include_router(posts_router)
app.include_router(comments_router)
app.include_router(blocks_router)
app.include_router(club_events_router)

app.include_router(club_members_router)

app.include_router(matches_router)


# ---------------------------------------------------------
# 서버 실행 확인용 기본 API
# ---------------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "PlayBridge API is running"
    }


# ---------------------------------------------------------
# 서버 상태 확인용 API
# ---------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "ok"
    }