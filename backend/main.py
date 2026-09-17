from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 회원가입 API Router 가져오기
from app.routers.auth import router as auth_router
from app.routers.users import router as user_router
from app.routers.clubs import router as clubs_router

# ---------------------------------------------------------
# PlayBridge FastAPI 애플리케이션 생성
# ---------------------------------------------------------
app = FastAPI(
    title="PlayBridge API",
    description="PlayBridge 백엔드 API 서버",
    version="0.1.0",
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
app.include_router(user_router)
app.include_router(clubs_router)

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
