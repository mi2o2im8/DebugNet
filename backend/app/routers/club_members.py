from typing import Literal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.security import (
    get_current_user_id,
)

from app.schemas.club_members import (
    ClubApplicationDecisionRequest,
    ClubApplicationDecisionResponse,
    ClubApplicationListResponse,
    ClubMemberListResponse,
    ClubMemberRoleUpdateRequest,
    ClubMemberStatusUpdateRequest,
    ClubMemberUpdateResponse,
)

from app.services.club_member_service import (
    ApplicationConflictError,
    ClubMemberService,
    MemberManagementConflictError,
)


router = APIRouter(
    prefix="/api/clubs/{club_id}",
    tags=["Club Members"],
)


# ---------------------------------------------------------
# 현재 동호회 회원 목록 조회
#
# GET /api/clubs/{club_id}/members
# ---------------------------------------------------------
@router.get(
    "/members",
    response_model=ClubMemberListResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_members(
    club_id: int,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.get_members(
            club_id=club_id,
            user_id=manager_user_id,
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
            "동호회 회원 목록 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "동호회 회원 목록을 불러오는 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 회원 역할 변경
#
# PATCH /api/clubs/{club_id}/members/{club_member_id}/role
# ---------------------------------------------------------
@router.patch(
    "/members/{club_member_id}/role",
    response_model=ClubMemberUpdateResponse,
    status_code=status.HTTP_200_OK,
)
def update_club_member_role(
    club_id: int,
    club_member_id: int,
    request_data: ClubMemberRoleUpdateRequest,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.update_member_role(
            club_id=club_id,
            club_member_id=club_member_id,
            manager_user_id=manager_user_id,
            next_role=request_data.role,
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

    except MemberManagementConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "회원 역할 변경 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="회원 역할 변경 중 오류가 발생했습니다.",
        ) from error


# ---------------------------------------------------------
# 회원 상태 변경
#
# PATCH /api/clubs/{club_id}/members/{club_member_id}/status
# ---------------------------------------------------------
@router.patch(
    "/members/{club_member_id}/status",
    response_model=ClubMemberUpdateResponse,
    status_code=status.HTTP_200_OK,
)
def update_club_member_status(
    club_id: int,
    club_member_id: int,
    request_data: ClubMemberStatusUpdateRequest,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.update_member_status(
            club_id=club_id,
            club_member_id=club_member_id,
            manager_user_id=manager_user_id,
            next_status=request_data.status,
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

    except MemberManagementConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "회원 상태 변경 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail="회원 상태 변경 중 오류가 발생했습니다.",
        ) from error


# ---------------------------------------------------------
# 가입 신청자 목록 조회
#
# GET /api/clubs/{club_id}/applications
# ---------------------------------------------------------
@router.get(
    "/applications",
    response_model=ClubApplicationListResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_applications(
    club_id: int,

    application_status: Literal[
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "all",
    ] = Query(
        default="pending"
    ),

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        status_filter = (
            None
            if application_status == "all"
            else application_status
        )

        return member_service.get_applications(
            club_id=club_id,
            user_id=manager_user_id,
            application_status=status_filter,
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
            "가입 신청자 목록 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "가입 신청자 목록을 불러오는 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 가입 신청 승인·거절
#
# PATCH
# /api/clubs/{club_id}/applications/
# {application_id}/decision
# ---------------------------------------------------------
@router.patch(
    "/applications/{application_id}/decision",
    response_model=(
        ClubApplicationDecisionResponse
    ),
    status_code=status.HTTP_200_OK,
)
def decide_club_application(
    club_id: int,
    application_id: int,
    request_data: ClubApplicationDecisionRequest,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.decide_application(
            club_id=club_id,
            application_id=application_id,
            manager_user_id=manager_user_id,
            decision=request_data.decision,
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

    except ApplicationConflictError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "가입 신청 처리 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "가입 신청 처리 중 "
                "오류가 발생했습니다."
            ),
        ) from error