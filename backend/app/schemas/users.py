from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------
# 프로필 이미지 URL 수정 요청
#
# React → FastAPI
#
# Supabase Storage에 이미지를 업로드한 뒤
# 생성된 Public URL을 전달한다.
# ---------------------------------------------------------
class ProfileImageUpdateRequest(BaseModel):

    profile_image: str = Field(
        min_length=1,
    )

# ---------------------------------------------------------
# 내 정보 조회 - 운동 종목 1개
#
# user_sports + user_sport_levels + sports 를 합친 결과
# ---------------------------------------------------------
class MyProfileSport(BaseModel):

    sport_id: int

    # sports.sport_name (예: "축구ㆍ풋살", "농구")
    sport_name: str

    # user_sport_levels.sport_level (예: "초급", "중급", "상급")
    sport_level: str | None = None


# ---------------------------------------------------------
# 내 정보 조회 응답
#
# FastAPI → React
#
# GET /api/users/me
# 마이페이지 / 내 정보 수정 페이지에서 함께 사용한다.
# ---------------------------------------------------------
class MyProfileResponse(BaseModel):

    user_id: str
    name: str
    nickname: str
    email: str | None = None
    profile_image: str | None = None

    # DB에 저장된 값 그대로 ("남성" / "여성")
    gender: str | None = None

    # "YYYY-MM-DD"
    birth_date: str | None = None

    sports: list[MyProfileSport] = []

    # user_regions.region (예: ["강서구", "마포구"])
    regions: list[str] = []



# ---------------------------------------------------------
# 내 정보 수정 - 운동 종목 1개 + 수준
# ---------------------------------------------------------
class MyProfileSportUpdate(BaseModel):

    # 1 = 축구ㆍ풋살, 2 = 배구, 3 = 농구, 4 = 테니스, 5 = 탁구
    sport_id: int = Field(gt=0)

    # 회원가입과 같은 값만 허용
    sport_level: Literal["초급", "중급", "상급"]


# ---------------------------------------------------------
# 내 정보 수정 요청
#
# React → FastAPI
#
# PATCH /api/users/me
# 수정 페이지의 모든 값을 한 번에 보낸다.
# (종목 / 지역은 "보낸 목록으로 통째로 교체")
# ---------------------------------------------------------
class MyProfileUpdateRequest(BaseModel):

    name: str = Field(
        min_length=1,
        max_length=50,
    )

    nickname: str = Field(
        min_length=2,
        max_length=20,
    )

    gender: Literal["남성", "여성"]

    # React에서 "YYYY-MM-DD" 문자열로 보내면 date로 변환된다.
    birth_date: date

    sports: list[MyProfileSportUpdate] = Field(min_length=1)

    regions: list[str] = Field(min_length=1)

    # -----------------------------------------------------
    # 이름 / 닉네임 앞뒤 공백 제거
    # -----------------------------------------------------
    @field_validator("name", "nickname", mode="before")
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    # -----------------------------------------------------
    # 같은 종목이 두 번 들어오지 않도록 검사
    # -----------------------------------------------------
    @field_validator("sports")
    @classmethod
    def check_duplicate_sports(cls, sports):
        sport_ids = [sport.sport_id for sport in sports]

        if len(sport_ids) != len(set(sport_ids)):
            raise ValueError("같은 운동 종목이 중복되었습니다.")

        return sports

    # -----------------------------------------------------
    # 지역: 공백 제거 + 빈 값 제거 + 중복 제거 (순서 유지)
    # -----------------------------------------------------
    @field_validator("regions")
    @classmethod
    def clean_regions(cls, regions):
        cleaned = []

        for region in regions:
            region = region.strip()

            if region and region not in cleaned:
                cleaned.append(region)

        if not cleaned:
            raise ValueError("활동 지역을 하나 이상 선택해주세요.")

        return cleaned
