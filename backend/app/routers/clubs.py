from typing import List, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.security import get_current_user_id

from app.schemas.clubs import (
    ClubApplicationRequest,
    ClubCreateRequest,
    ClubCreateResponse,
    ClubDashboardResponse,
)

from app.services.club_service import ClubService


# =========================================================
# 동호회 Router
# =========================================================

router = APIRouter(
    prefix="/api/clubs",
    tags=["clubs"],
)

club_service = ClubService()

# =========================================================
# 내가 가입한 동호회 조회
#
# GET /api/clubs/my
# =========================================================

@router.get("/my")
def get_my_club(
    user_id: str = Depends(get_current_user_id),
):
    try:

        club = club_service.get_my_club(
            user_id=user_id
        )

        if not club:
            return {
                "club_id": None,
                "club_name": None,
                "sport_name": None,
            }

        return club

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="내 동호회 조회 중 오류가 발생했습니다.",
        ) from error

# =========================================================
# 동호회 검색
#
# GET /api/clubs/search
#
# 검색 조건:
# - keyword
# - sport_name (복수 선택)
# - region (복수 선택)
# - day_of_week (복수 선택)
# - time_slot (복수 선택)
# - atmosphere
# =========================================================



@router.get("/search")
def search_clubs(
    keyword: Optional[str] = Query(default=None),

    # 복수 종목 선택
    sport_name: Optional[List[str]] = Query(default=None),

    # 복수 지역 선택
    region: Optional[List[str]] = Query(default=None),

    # 복수 활동 요일 선택
    day_of_week: Optional[List[str]] = Query(default=None),

    # 복수 활동 시간대 선택
    time_slot: Optional[List[str]] = Query(default=None),

    # 동호회 분위기
    atmosphere: Optional[str] = Query(default=None),
):
    return club_service.search_clubs(
        keyword=keyword,
        sport_name=sport_name,
        region=region,
        day_of_week=day_of_week,
        time_slot=time_slot,
        atmosphere=atmosphere,
    )

# =========================================================
# 모집 중인 동호회 조회
#
# GET /api/clubs/recruiting
# =========================================================

@router.get("/recruiting")
def get_recruiting_clubs(
    sport_name: list[str] = Query(default=[]),
    region: list[str] = Query(default=[]),
    day_of_week: list[str] = Query(default=[]),
    time_slot: list[str] = Query(default=[]),
):
    try:
        return club_service.get_recruiting_clubs(
            sport_names=sport_name,
            regions=region,
            days=day_of_week,
            time_slots=time_slot,
        )

    except Exception as e:
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"모집 중인 동호회 조회 중 오류가 발생했습니다: {str(e)}"
        )

# =========================================================
# 동호회 생성
#
# POST /api/clubs
# =========================================================

@router.post(
    "",
    response_model=ClubCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_club(
    request_data: ClubCreateRequest,
    owner_id: str = Depends(get_current_user_id),
):
    try:
        return club_service.create_club(
            owner_id=owner_id,
            request_data=request_data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동호회 생성 중 오류가 발생했습니다.",
        ) from error

# =========================================================
# 게스트 모집 중인 행사 조회
#
# GET /api/clubs/guest-recruiting
# =========================================================

@router.get("/guest-recruiting")
def get_guest_recruiting_events():
    try:
        return club_service.get_guest_recruiting_events()

    except Exception as e:
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"게스트 모집 조회 중 오류가 발생했습니다: {str(e)}"
        )

# =========================================================
# 동호회 상세 조회
#
# GET /api/clubs/{club_id}
# =========================================================

@router.get("/{club_id}")
def get_club_by_id(club_id: int):
    return club_service.get_club_by_id(club_id)


# =========================================================
# 동호회 가입 신청
#
# POST /api/clubs/{club_id}/join
# =========================================================

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

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error


# =========================================================
# 동호회 가입 질문 조회
#
# GET /api/clubs/{club_id}/join-questions
# =========================================================

@router.get("/{club_id}/join-questions")
def get_join_questions(club_id: int):
    return club_service.get_join_questions(
        club_id=club_id,
    )


# =========================================================
# 동호회 가입 상태 조회
#
# GET /api/clubs/{club_id}/member-status
# =========================================================

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


# =========================================================
# 동호회 가입 신청서 제출
#
# POST /api/clubs/{club_id}/application
#
# 가입 신청서와 추가 질문 답변을 저장한다.
# =========================================================

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

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        ) from error


# =========================================================
# 운영진 동호회 허브 조회
#
# GET /api/clubs/{club_id}/dashboard
# =========================================================

@router.get(
    "/{club_id}/dashboard",
    response_model=ClubDashboardResponse,
)
def get_club_dashboard(
    club_id: int,
    user_id: str = Depends(get_current_user_id),
):
    try:
        return club_service.get_dashboard(
            club_id=club_id,
            user_id=user_id,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="동호회 허브를 불러오는 중 오류가 발생했습니다.",
        ) from error


