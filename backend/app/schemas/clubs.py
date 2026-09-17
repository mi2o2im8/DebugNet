from typing import Optional
from pydantic import BaseModel

# ---------------------------------------------------------
# 동호회 검색 조건
#
# 프론트엔드에서 동호회 검색을 요청할 때 사용한다.
# ---------------------------------------------------------
class ClubSearchRequest(BaseModel):
    keyword: Optional[str] = None
    sport_name: Optional[str] = None
    region: Optional[str] = None
    day_of_week: Optional[str] = None
    atmosphere: Optional[str] = None

# -----------------------------------------------------
# 가입 질문 답변
# -----------------------------------------------------
class JoinAnswer(BaseModel):
    question_id: int
    answer_text: str


# -----------------------------------------------------
# 동호회 가입 신청
# -----------------------------------------------------
class ClubApplicationRequest(BaseModel):
    user_id: str
    application_message: str
    answers: list[JoinAnswer] = []