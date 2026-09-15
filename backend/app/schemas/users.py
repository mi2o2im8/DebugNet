from pydantic import BaseModel, Field


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