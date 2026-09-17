from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.club_service import ClubService
from app.schemas.clubs import ClubApplicationRequest

router = APIRouter(
    prefix="/api/clubs",
    tags = ["clubs"],
)

club_service = ClubService()
# ---------------------------------------------------------
# 동호회 검색
#
# GET /api/clubs/search
#
# 검색 조건:
# - keyword
# - sport_name
# - region
# - day_of_week
# - atmosphere
# ---------------------------------------------------------
@router.get("/search")
def search_clubs(
    keyword: Optional[str] = Query(default=None),
    sport_name: Optional[str] = Query(default=None),
    region: Optional[str] = Query(default=None),
    day_of_week: Optional[str] = Query(default=None),
    atmosphere: Optional[str] = Query(default=None),
):
    return club_service.search_clubs(
        keyword=keyword,
        sport_name=sport_name,
        region=region,
        day_of_week=day_of_week,
        atmosphere=atmosphere,
    )

# -----------------------------------------------------
# 동호회 상세 조회 API
#
# GET /api/clubs/{club_id}
# -----------------------------------------------------
@router.get("/{club_id}")
def get_club_by_id(club_id: int):
    return club_service.get_club_by_id(club_id)

# -----------------------------------------------------
# 동호회 가입 신청 API
#
# POST /api/clubs/{club_id}/join
# -----------------------------------------------------
@router.post("/{club_id}/join")
def create_join_request(
    club_id: int,
    user_id: str,
):
    try:
        return club_service.create_join_request(
            club_id=club_id,
            user_id=user_id,
        )

    except Exception as e:
        # DB에서 발생한 실제 오류 내용을 확인하기 위한 코드
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
# -----------------------------------------------------
# 동호회 가입 질문 조회 API
#
# 운영자가 설정한 가입 질문을 가져온다.
# -----------------------------------------------------
@router.get("/{club_id}/join-questions")
def get_join_questions(club_id: int):
    return club_service.get_join_questions(
        club_id=club_id
    )

# -----------------------------------------------------
# 동호회 가입 상태 조회 API
#
# GET /api/clubs/{club_id}/member-status
# -----------------------------------------------------
@router.get("/{club_id}/member-status")
def get_member_status(
    club_id: int,
    user_id: str,
):
    return {
        "status": club_service.get_member_status(
            club_id=club_id,
            user_id=user_id,
        )
    }

# -----------------------------------------------------
# 동호회 가입 신청서 제출 API
#
# 가입 신청서와 추가 질문 답변을 저장한다.
# -----------------------------------------------------
@router.post("/{club_id}/application")
def create_application(
    club_id: int,
    request: ClubApplicationRequest,
):
    try:
        return club_service.create_application(
            club_id=club_id,
            user_id=request.user_id,
            application_message=request.application_message,
            answers=[
                {
                    "question_id": answer.question_id,
                    "answer_text": answer.answer_text,
                }
                for answer in request.answers
            ],
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )