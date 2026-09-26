from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.security import (
    get_current_user_id,
)
from app.schemas.club_events import (
    ClubEventAttendanceRequest,
    ClubEventAttendanceResponse,
    ClubEventCreateRequest,
    ClubEventCreateResponse,
    ClubEventDetailResponse,
    ClubEventListResponse,
    ClubEventParticipantListResponse,
    ClubEventGuestDecisionRequest,
    ClubEventGuestDecisionResponse,
)

from app.services.club_event_service import (
    ClubEventService,
)


router = APIRouter(
    prefix="/api/clubs/{club_id}/events",
    tags=["Club Events"],
)


# ---------------------------------------------------------
# 일정 생성
#
# POST /api/clubs/{club_id}/events
# ---------------------------------------------------------
@router.post(
    "",
    response_model=ClubEventCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_club_event(
    club_id: int,
    request_data: ClubEventCreateRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.create_event(
            club_id=club_id,
            user_id=user_id,
            request_data=request_data,
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

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 생성 중 오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 일정 목록 조회
#
# GET /api/clubs/{club_id}/events
# ---------------------------------------------------------
@router.get(
    "",
    response_model=ClubEventListResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_events(
    club_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.get_events(
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
        print(
            "일정 목록 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 목록 조회 중 오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 일정 단건 조회
#
# GET /api/clubs/{club_id}/events/{event_id}
# ---------------------------------------------------------
@router.get(
    "/{event_id}",
    response_model=ClubEventDetailResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_event(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.get_event(
            club_id=club_id,
            event_id=event_id,
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
        print(
            "일정 단건 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 조회 중 오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 일정 수정
#
# PUT /api/clubs/{club_id}/events/{event_id}
# ---------------------------------------------------------
@router.put(
    "/{event_id}",
    response_model=ClubEventCreateResponse,
    status_code=status.HTTP_200_OK,
)
def update_club_event(
    club_id: int,
    event_id: int,
    request_data: ClubEventCreateRequest,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.update_event(
            club_id=club_id,
            event_id=event_id,
            user_id=user_id,
            request_data=request_data,
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

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "일정 수정 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 수정 중 오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 일정 복사
#
# POST /api/clubs/{club_id}/events/{event_id}/copy
# ---------------------------------------------------------
@router.post(
    "/{event_id}/copy",
    response_model=ClubEventCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def copy_club_event(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.copy_event(
            club_id=club_id,
            event_id=event_id,
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

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "일정 복사 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 복사 중 오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 일정 삭제
#
# DELETE /api/clubs/{club_id}/events/{event_id}
# ---------------------------------------------------------
@router.delete(
    "/{event_id}",
    response_model=ClubEventCreateResponse,
    status_code=status.HTTP_200_OK,
)
def delete_club_event(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.cancel_event(
            club_id=club_id,
            event_id=event_id,
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
        print(
            "일정 삭제 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 삭제 중 오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 내 참석 응답 조회
#
# GET /api/clubs/{club_id}/events/{event_id}/attendance
# ---------------------------------------------------------
@router.get(
    "/{event_id}/attendance",
    response_model=ClubEventAttendanceResponse,
    status_code=status.HTTP_200_OK,
)
def get_my_club_event_attendance(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.get_my_attendance(
            club_id=club_id,
            event_id=event_id,
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
        print(
            "참석 응답 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "참석 응답 조회 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 내 참석 응답 저장 또는 변경
#
# PUT /api/clubs/{club_id}/events/{event_id}/attendance
# ---------------------------------------------------------
@router.put(
    "/{event_id}/attendance",
    response_model=ClubEventAttendanceResponse,
    status_code=status.HTTP_200_OK,
)
def update_my_club_event_attendance(
    club_id: int,
    event_id: int,
    request_data: ClubEventAttendanceRequest,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.update_my_attendance(
            club_id=club_id,
            event_id=event_id,
            user_id=user_id,
            request_data=request_data,
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

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "참석 응답 변경 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "참석 응답 변경 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 일정 참가자 관리 목록 조회
#
# GET /api/clubs/{club_id}/events/{event_id}/participants
# ---------------------------------------------------------
@router.get(
    "/{event_id}/participants",
    response_model=ClubEventParticipantListResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_event_participants(
    club_id: int,
    event_id: int,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return event_service.get_event_participants(
            club_id=club_id,
            event_id=event_id,
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
        print(
            "일정 참가자 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "일정 참가자 목록 조회 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 운영자: 참가자 참석 상태 변경
#
# PATCH /api/clubs/{club_id}/events/{event_id}
#       /participants/{event_participant_id}/attendance
# ---------------------------------------------------------
@router.patch(
    (
        "/{event_id}/participants/"
        "{event_participant_id}/attendance"
    ),
    response_model=ClubEventAttendanceResponse,
    status_code=status.HTTP_200_OK,
)
def update_club_event_participant_attendance(
    club_id: int,
    event_id: int,
    event_participant_id: int,
    request_data: ClubEventAttendanceRequest,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return (
            event_service
            .update_participant_attendance(
                club_id=club_id,
                event_id=event_id,
                event_participant_id=(
                    event_participant_id
                ),
                user_id=user_id,
                request_data=request_data,
            )
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

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "참가자 참석 상태 변경 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "참가자 참석 상태 변경 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 게스트 신청 승인·거절
#
# PATCH /api/clubs/{club_id}/events/{event_id}
#       /participants/{event_participant_id}/decision
# ---------------------------------------------------------
@router.patch(
    (
        "/{event_id}/participants/"
        "{event_participant_id}/decision"
    ),
    response_model=ClubEventGuestDecisionResponse,
    status_code=status.HTTP_200_OK,
)
def decide_club_event_guest(
    club_id: int,
    event_id: int,
    event_participant_id: int,
    request_data: ClubEventGuestDecisionRequest,
    user_id: str = Depends(
        get_current_user_id
    ),
):
    event_service = ClubEventService()

    try:
        return (
            event_service
            .decide_participant_application(
                club_id=club_id,
                event_id=event_id,
                event_participant_id=(
                    event_participant_id
                ),
                user_id=user_id,
                request_data=request_data,
            )
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

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "게스트 신청 처리 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "게스트 신청 처리 중 "
                "오류가 발생했습니다."
            ),
        ) from error