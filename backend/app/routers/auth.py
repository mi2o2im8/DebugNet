from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.schemas.auth import SignupRequest, SignupResponse
from app.services.auth_service import AuthService


# ---------------------------------------------------------
# 인증 관련 API Router
#
# 현재 FastAPI가 담당하는 인증 API는 회원가입만 둔다.
# 로그인 / 로그아웃 / 세션 갱신은 React가 Supabase Auth와
# 직접 통신해서 처리한다.
# ---------------------------------------------------------
router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"],
)


# ---------------------------------------------------------
# 회원가입
# POST /api/auth/signup
# ---------------------------------------------------------
@router.post(
    "/signup",
    response_model=SignupResponse,
)
def signup(signup_data: SignupRequest):

    # 요청마다 Service를 새로 생성한다.
    auth_service = AuthService()

    # 검증된 회원가입 데이터를 Service로 전달한다.
    return auth_service.signup(signup_data)

# ---------------------------------------------------------
# 이메일 중복 확인
#
# GET /api/auth/check-email?email=test@test.com
# ---------------------------------------------------------
@router.get("/check-email")
def check_email(email: str):

    auth_service = AuthService()

    return auth_service.check_email(email)


# ---------------------------------------------------------
# 닉네임 중복 확인
#
# GET /api/auth/check-nickname?nickname=다찍어
# ---------------------------------------------------------
@router.get("/check-nickname")
def check_nickname(nickname: str):

    auth_service = AuthService()

    return auth_service.check_nickname(nickname)




# ---------------------------------------------------------
# Bearer Token 검증 테스트 API
#
# Authorization 헤더의 Access Token을 security.py가 검증하고,
# 정상 토큰이면 실제 Supabase 사용자 UUID를 반환한다.
# ---------------------------------------------------------
@router.get("/me")
def get_me(
    user_id: str = Depends(get_current_user_id),
):

    return {
        "message": "인증 성공",
        "user_id": user_id,
    }