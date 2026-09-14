from supabase import Client, create_client

from app.core.config import settings


# ---------------------------------------------------------
# 회원가입 / 로그인용 Supabase Client
#
# Publishable Key를 사용한다.
#
# 사용 예:
# - 회원가입
# - 로그인
# - 사용자 세션
# ---------------------------------------------------------
def get_supabase_auth_client() -> Client:

    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
    )


# ---------------------------------------------------------
# FastAPI 서버의 DB 관리용 Supabase Client
#
# Secret Key를 사용한다.
#
# RLS를 우회할 수 있는 강한 권한이 있으므로
# 서버 내부 Repository에서만 사용한다.
#
# 절대 React에 이 키를 전달하면 안 된다.
# ---------------------------------------------------------
def get_supabase_admin_client() -> Client:

    return create_client(
        settings.supabase_url,
        settings.supabase_secret_key,
    )