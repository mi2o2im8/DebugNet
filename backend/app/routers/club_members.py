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
    ClubRecruitmentRecommendationResponse,
    ClubActivityResultBulkRequest,
    ClubActivityResultMutationResponse,
    ClubActivityResultWorkspaceResponse,
    ClubParticipationRiskResponse,
    ClubMemberListResponse,
    ClubMemberRoleUpdateRequest,
    ClubMemberStatusUpdateRequest,
    ClubMemberUpdateResponse,
    ClubMemberDetailResponse,
    ClubMemberWarningCreateRequest,
    ClubMemberWarningMutationResponse,
    ClubLeaveReviewRequest,
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
# H4 실제 활동 결과 입력 화면 데이터
#
# GET /api/clubs/{club_id}/activity-results
# ---------------------------------------------------------
@router.get(
    "/activity-results",
    response_model=ClubActivityResultWorkspaceResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_activity_results(
    club_id: int,
    limit: int = Query(default=8, ge=1, le=12),
    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.get_activity_result_workspace(
            club_id=club_id,
            user_id=manager_user_id,
            limit=limit,
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
        print("H4 활동 결과 조회 실제 오류:", repr(error))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="실제 활동 결과를 불러오지 못했습니다.",
        ) from error


# ---------------------------------------------------------
# H4 일정별 실제 활동 결과 저장
#
# PUT /api/clubs/{club_id}/events/{event_id}/activity-results
# ---------------------------------------------------------
@router.put(
    "/events/{event_id}/activity-results",
    response_model=ClubActivityResultMutationResponse,
    status_code=status.HTTP_200_OK,
)
def save_club_activity_results(
    club_id: int,
    event_id: int,
    request_data: ClubActivityResultBulkRequest,
    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.save_activity_results(
            club_id=club_id,
            event_id=event_id,
            manager_user_id=manager_user_id,
            results=request_data.results,
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
        print("H4 활동 결과 저장 실제 오류:", repr(error))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="실제 활동 결과를 저장하지 못했습니다.",
        ) from error


# ---------------------------------------------------------
# H4 회원 참여 저하 위험 조회
#
# GET /api/clubs/{club_id}/participation-risks
# ---------------------------------------------------------
@router.get(
    "/participation-risks",
    response_model=ClubParticipationRiskResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_participation_risks(
    club_id: int,
    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.get_participation_risks(
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
        print("H4 참여 위험 조회 실제 오류:", repr(error))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="참여 위험 분석을 현재 사용할 수 없습니다.",
        ) from error


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
# 회원 상세 조회
#
# GET /api/clubs/{club_id}/members/{club_member_id}
# ---------------------------------------------------------
@router.get(
    "/members/{club_member_id}",
    response_model=ClubMemberDetailResponse,
    status_code=status.HTTP_200_OK,
)
def get_club_member_detail(
    club_id: int,
    club_member_id: int,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.get_member_detail(
            club_id=club_id,
            club_member_id=club_member_id,
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
            "회원 상세 조회 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "회원 상세 정보를 불러오는 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 회원 경고 부여
#
# POST
# /api/clubs/{club_id}/members/{club_member_id}/warnings
# ---------------------------------------------------------
@router.post(
    "/members/{club_member_id}/warnings",
    response_model=(
        ClubMemberWarningMutationResponse
    ),
    status_code=status.HTTP_201_CREATED,
)
def create_club_member_warning(
    club_id: int,
    club_member_id: int,
    request_data: ClubMemberWarningCreateRequest,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.create_member_warning(
            club_id=club_id,
            club_member_id=club_member_id,
            manager_user_id=manager_user_id,
            warning_type=request_data.warning_type,
            reason=request_data.reason,
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
            "회원 경고 부여 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "회원 경고를 저장하는 중 "
                "오류가 발생했습니다."
            ),
        ) from error


# ---------------------------------------------------------
# 회원 경고 취소
#
# DELETE
# /api/clubs/{club_id}/members/{club_member_id}/
# warnings/{warning_id}
# ---------------------------------------------------------
@router.delete(
    (
        "/members/{club_member_id}"
        "/warnings/{warning_id}"
    ),
    response_model=(
        ClubMemberWarningMutationResponse
    ),
    status_code=status.HTTP_200_OK,
)
def delete_club_member_warning(
    club_id: int,
    club_member_id: int,
    warning_id: int,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.delete_member_warning(
            club_id=club_id,
            club_member_id=club_member_id,
            warning_id=warning_id,
            manager_user_id=manager_user_id,
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
            "회원 경고 취소 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "회원 경고를 취소하는 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 내가 가입한 동호회 탈퇴
#
# DELETE /api/clubs/{club_id}/members/me
# ---------------------------------------------------------
@router.delete(
    "/members/me",
    status_code=status.HTTP_200_OK,
)
def withdraw_my_club(
    club_id: int,

    request: ClubLeaveReviewRequest,

    user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.withdraw_my_membership(
            club_id=club_id,
            user_id=user_id,
            rating=request.rating,
            leave_reason=request.leave_reason,
            review_text=request.review_text,
        )

    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            "동호회 탈퇴 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "동호회 탈퇴 중 "
                "오류가 발생했습니다."
            ),
        ) from error

# ---------------------------------------------------------
# 동호회 회원 내보내기
#
# DELETE /api/clubs/{club_id}/members/{club_member_id}
# ---------------------------------------------------------
@router.delete(
    "/members/{club_member_id}",
    response_model=ClubMemberUpdateResponse,
    status_code=status.HTTP_200_OK,
)
def remove_club_member(
    club_id: int,
    club_member_id: int,

    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return member_service.remove_member(
            club_id=club_id,
            club_member_id=club_member_id,
            manager_user_id=manager_user_id,
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

    except Exception as error:
        print(
            "회원 내보내기 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "회원을 내보내는 중 "
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
# H1 모집 대상 추천
#
# GET /api/clubs/{club_id}/recruitment-recommendations
# ---------------------------------------------------------
@router.get(
    "/recruitment-recommendations",
    response_model=(
        ClubRecruitmentRecommendationResponse
    ),
    status_code=status.HTTP_200_OK,
)
def get_club_recruitment_recommendations(
    club_id: int,
    limit: int = Query(default=10, ge=1, le=20),
    manager_user_id: str = Depends(
        get_current_user_id
    ),
):
    member_service = ClubMemberService()

    try:
        return (
            member_service
            .get_recruitment_recommendations(
                club_id=club_id,
                user_id=manager_user_id,
                limit=limit,
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

    except Exception as error:
        print(
            "H1 모집 대상 추천 실제 오류:",
            repr(error),
        )

        raise HTTPException(
            status_code=(
                status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            detail=(
                "모집 대상 추천을 현재 사용할 수 없습니다."
            ),
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
