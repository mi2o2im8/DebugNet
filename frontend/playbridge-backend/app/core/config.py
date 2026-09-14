from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


# ---------------------------------------------------------
# 프로젝트 최상위 폴더 위치
#
# config.py 위치:
# playbridge-backend/app/core/config.py
#
# parents[2]를 사용하면:
# playbridge-backend/
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parents[2]

# 프로젝트 최상단의 .env 파일
ENV_FILE = BASE_DIR / ".env"


# ---------------------------------------------------------
# 환경변수 설정
# ---------------------------------------------------------
class Settings(BaseSettings):

    # Supabase 프로젝트 URL
    supabase_url: str

    # 회원가입 / 로그인 등 사용자 인증에 사용할 키
    supabase_publishable_key: str

    # FastAPI 서버에서 DB 관리 작업에 사용할 Secret Key
    # 절대 React 프론트엔드에 전달하면 안 된다.
    supabase_secret_key: str

    # .env 파일 위치 지정
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# 다른 파일에서 사용할 설정 객체
settings = Settings()