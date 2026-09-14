from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.supabase import get_supabase_auth_client


# ---------------------------------------------------------
# React가 보내는 Bearer Token을 읽기 위한 보안 도구
#
# React 로그인 흐름:
# React → Supabase Auth 직접 로그인 → Access Token 발급
# React → FastAPI 요청 시 Authorization 헤더에 Token 전달
# ---------------------------------------------------------
bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------
# 현재 로그인한 사용자 UUID 확인
#
# 앞으로 로그인 필요한 Router에서 아래처럼 사용한다.
#
# user_id: str = Depends(get_current_user_id)
#
# 프론트가 user_id를 직접 보내는 값을 믿지 않고,
# Supabase Access Token을 검증해서 실제 UUID를 가져온다.
# ---------------------------------------------------------
def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> str:

    # Authorization 헤더가 없는 경우
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다.",
        )

    access_token = credentials.credentials

    # Publishable Key 기반 Auth Client를 사용해
    # React가 전달한 Access Token을 Supabase에서 검증한다.
    auth_client = get_supabase_auth_client()

    try:
        response = auth_client.auth.get_user(access_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않거나 만료된 인증 토큰입니다.",
        ) from exc

    if response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자 정보를 확인할 수 없습니다.",
        )

    return str(response.user.id)
