from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.supabase import get_supabase_auth_client


# ---------------------------------------------------------
# React가 보내는 Bearer Token을 읽기 위한 보안 도구
# ---------------------------------------------------------
bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------
# 현재 로그인한 사용자 UUID 확인
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

    # Supabase Auth Client
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

    user_id = response.user.id

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자 UUID를 확인할 수 없습니다.",
        )

    return str(user_id)