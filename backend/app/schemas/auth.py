from datetime import date, time

from pydantic import BaseModel, EmailStr, Field, AliasChoices


# ---------------------------------------------------------
# 회원가입 시 선택한 종목 정보
#
# 아래 두 테이블에 저장할 데이터를 함께 받는다.
#
# user_sports
# - user_id
# - sport_id
#
# user_sport_levels
# - user_id
# - sport_id
# - sport_level
# ---------------------------------------------------------
class SignupSport(BaseModel):

    # sports 테이블의 PK인 sport_id
    # 1 = 축구/풋살, 2 = 배구, 3 = 농구, 4 = 테니스, 5 = 탁구
    sport_id: int = Field(gt=0)

    # 해당 종목에 대한 사용자의 운동 수준
    # 예: "입문", "초급", "중급", "상급"
    sport_level: str


# ---------------------------------------------------------
# 회원가입 시 선택한 활동 가능 시간
#
# user_available_times 테이블에 저장될 데이터
# ---------------------------------------------------------
class SignupAvailableTime(BaseModel):

     # 프론트에서는 day로 보내고,
    # 백엔드 내부에서는 day_of_week로 사용한다.
    day_of_week: str = Field(
        validation_alias=AliasChoices(
            "day_of_week",
            "day",
        )
    )

    # 프론트에서는 startTime으로 보내고,
    # 백엔드 내부에서는 start_time으로 사용한다.
    start_time: time = Field(
        validation_alias=AliasChoices(
            "start_time",
            "startTime",
        )
    )

    # 프론트에서는 endTime으로 보내고,
    # 백엔드 내부에서는 end_time으로 사용한다.
    end_time: time = Field(
        validation_alias=AliasChoices(
            "end_time",
            "endTime",
        )
    )


# ---------------------------------------------------------
# 회원가입 요청
#
# React → FastAPI
#
# 로그인은 React가 Supabase Auth와 직접 통신하므로
# FastAPI에는 별도의 LoginRequest가 필요하지 않다.
# ---------------------------------------------------------
class SignupRequest(BaseModel):

    # Supabase Auth 계정 생성에 사용할 이메일 / 비밀번호
    email: EmailStr
    password: str = Field(
        min_length=4,
        max_length=128,
    )

    # users 테이블에 저장되는 기본 회원정보
    name: str = Field(
        min_length=1,
        max_length=50,
    )
    nickname: str = Field(
        min_length=2,
        max_length=20,
    )
    profile_image: str | None = None

    gender: str

    birth_date: date

    travel_distance_km: int | None = Field(
    default=None,
    ge=0,
    )

    max_monthly_fee: int = Field(ge=0)

    #활동빈도수
    activity_frequency: str = Field(
    validation_alias=AliasChoices(
        "activity_frequency",
        "frequency",
    )
    )

    # user_sports + user_sport_levels에 저장되는 정보
    sports: list[SignupSport] = Field(min_length=1)

    # user_regions에 저장되는 활동 가능 지역
    regions: list[str] = Field(min_length=1)

    # user_available_times에 저장되는 활동 가능 시간
    available_times: list[SignupAvailableTime] = Field(min_length=1)

    # -----------------------------------------------------
    # 선호하는 동호회 분위기
    #
    # 프론트에서:
    # club_preferences: ["친목 중심", "가볍게 활동"]
    #
    # 형태로 전달된다.
    # -----------------------------------------------------
    club_preferences: list[str] = Field(min_length=1)


# ---------------------------------------------------------
# 회원가입 성공 응답
#
# FastAPI → React
#
# 현재 회원가입은 FastAPI가 Supabase Auth 계정까지 생성하므로
# 가입 직후 생성된 세션 정보를 함께 반환한다.
# 이후 일반 로그인은 React가 Supabase Auth에서 직접 처리한다.
# ---------------------------------------------------------
class SignupResponse(BaseModel):

    # Supabase Auth에서 생성한 사용자 UUID
    user_id: str

    # 회원가입 직후 발급된 세션 토큰
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
