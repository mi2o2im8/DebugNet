from datetime import (
    datetime,
    timezone,
)

from app.repositories.club_member_repository import (
    ClubMemberRepository,
)
from app.schemas.club_members import (
    ClubApplicationAnswerResponse,
    ClubApplicationDecisionResponse,
    ClubApplicationListItemResponse,
    ClubApplicationListResponse,
    ClubMemberListItemResponse,
    ClubMemberListResponse,
    ClubMemberUpdateResponse,
)


# ---------------------------------------------------------
# 이미 처리됐거나 현재 처리할 수 없는 신청
# ---------------------------------------------------------
class ApplicationConflictError(Exception):
    pass

class MemberManagementConflictError(Exception):
    pass

class ClubMemberService:

    def __init__(self):
        self.member_repository = (
            ClubMemberRepository()
        )

    # -----------------------------------------------------
    # 동호회 및 운영 권한 확인
    # -----------------------------------------------------
    def validate_management_permission(
        self,
        club_id: int,
        user_id: str,
    ) -> dict:

        club = (
            self.member_repository
            .find_club_capacity(club_id)
        )

        if (
            club is None
            or not club.get("status")
        ):
            raise LookupError(
                "존재하지 않거나 비활성화된 동호회입니다."
            )

        membership = (
            self.member_repository
            .find_management_membership(
                club_id=club_id,
                user_id=user_id,
            )
        )

        if membership is None:
            raise PermissionError(
                "이 동호회의 운영 권한이 없습니다."
            )

        if membership.get("role") not in {
            "owner",
            "manager",
        }:
            raise PermissionError(
                "동호회장 또는 운영진만 "
                "가입 신청을 관리할 수 있습니다."
            )

        return club

    # -----------------------------------------------------
    # 현재 동호회 회원 목록 조회
    # -----------------------------------------------------
    def get_members(
        self,
        club_id: int,
        user_id: str,
    ) -> ClubMemberListResponse:

        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        management_membership = (
            self.member_repository
            .find_management_membership(
                club_id=club_id,
                user_id=user_id,
            )
        )

        current_user_role = str(
            management_membership["role"]
        )

        member_rows = (
            self.member_repository
            .find_members(club_id)
        )

        if not member_rows:
            return ClubMemberListResponse(
                members=[],
                current_user_role=current_user_role,
                total=0,
                active_count=0,
                inactive_count=0,
                suspended_count=0,
            )

        member_user_ids = list(
            {
                str(row["user_id"])
                for row in member_rows
            }
        )

        user_rows = (
            self.member_repository
            .find_users(member_user_ids)
        )

        user_map = {
            str(row["user_id"]): row
            for row in user_rows
        }

        members = []

        for member_row in member_rows:
            member_user_id = str(
                member_row["user_id"]
            )

            user = user_map.get(
                member_user_id,
                {},
            )

            members.append(
                ClubMemberListItemResponse(
                    club_member_id=int(
                        member_row["club_member_id"]
                    ),
                    club_id=club_id,
                    user_id=member_user_id,
                    name=(
                        user.get("name")
                        or "이름 없음"
                    ),
                    nickname=(
                        user.get("nickname")
                        or "닉네임 없음"
                    ),
                    profile_image=user.get(
                        "profile_image"
                    ),
                    role=member_row["role"],
                    status=member_row["status"],
                    join_source=member_row.get(
                        "join_source"
                    ),
                )
            )

        return ClubMemberListResponse(
            members=members,
            current_user_role=current_user_role,
            total=len(members),
            active_count=sum(
                member.status == "active"
                for member in members
            ),
            inactive_count=sum(
                member.status == "inactive"
                for member in members
            ),
            suspended_count=sum(
                member.status == "suspended"
                for member in members
            ),
        )

    # -----------------------------------------------------
    # 가입 신청자 목록 조회
    # -----------------------------------------------------
    def get_applications(
        self,
        club_id: int,
        user_id: str,
        application_status: str | None = "pending",
    ) -> ClubApplicationListResponse:

        self.validate_management_permission(
            club_id=club_id,
            user_id=user_id,
        )

        application_rows = (
            self.member_repository
            .find_applications(
                club_id=club_id,
                application_status=(
                    application_status
                ),
            )
        )

        if not application_rows:
            return ClubApplicationListResponse(
                applications=[],
                total=0,
            )

        application_ids = [
            int(row["application_id"])
            for row in application_rows
        ]

        applicant_user_ids = list(
            {
                str(row["user_id"])
                for row in application_rows
            }
        )

        user_rows = (
            self.member_repository
            .find_users(applicant_user_ids)
        )

        answer_rows = (
            self.member_repository
            .find_application_answers(
                application_ids
            )
        )

        question_rows = (
            self.member_repository
            .find_join_questions(club_id)
        )

        user_map = {
            str(row["user_id"]): row
            for row in user_rows
        }

        question_map = {
            int(row["question_id"]): row
            for row in question_rows
        }

        answers_by_application: dict[
            int,
            list[dict],
        ] = {}

        for answer_row in answer_rows:
            application_id = int(
                answer_row["application_id"]
            )

            answers_by_application.setdefault(
                application_id,
                [],
            ).append(answer_row)

        applications = []

        for application_row in application_rows:
            application_id = int(
                application_row["application_id"]
            )

            applicant_user_id = str(
                application_row["user_id"]
            )

            user = user_map.get(
                applicant_user_id,
                {},
            )

            application_answers = []

            for answer_row in (
                answers_by_application.get(
                    application_id,
                    [],
                )
            ):
                question_id = int(
                    answer_row["question_id"]
                )

                question = question_map.get(
                    question_id,
                    {},
                )

                application_answers.append(
                    ClubApplicationAnswerResponse(
                        question_id=question_id,
                        question_text=(
                            question.get(
                                "question_text"
                            )
                            or (
                                "삭제된 가입 질문 "
                                f"#{question_id}"
                            )
                        ),
                        answer_text=(
                            answer_row.get(
                                "answer_text"
                            )
                            or ""
                        ),
                    )
                )

            applications.append(
                ClubApplicationListItemResponse(
                    application_id=application_id,
                    club_id=int(
                        application_row["club_id"]
                    ),
                    user_id=applicant_user_id,
                    name=(
                        user.get("name")
                        or "이름 없음"
                    ),
                    nickname=(
                        user.get("nickname")
                        or "닉네임 없음"
                    ),
                    profile_image=user.get(
                        "profile_image"
                    ),
                    application_message=(
                        application_row.get(
                            "application_message"
                        )
                    ),
                    status=application_row[
                        "status"
                    ],
                    created_at=application_row[
                        "created_at"
                    ],
                    decided_at=(
                        application_row.get(
                            "decided_at"
                        )
                    ),
                    decided_by_user_id=(
                        application_row.get(
                            "decided_by_user_id"
                        )
                    ),
                    answers=application_answers,
                )
            )

        return ClubApplicationListResponse(
            applications=applications,
            total=len(applications),
        )

    # -----------------------------------------------------
    # 가입 신청 승인 또는 거절
    # -----------------------------------------------------
    def decide_application(
        self,
        club_id: int,
        application_id: int,
        manager_user_id: str,
        decision: str,
    ) -> ClubApplicationDecisionResponse:

        club = self.validate_management_permission(
            club_id=club_id,
            user_id=manager_user_id,
        )

        application = (
            self.member_repository
            .find_application_by_id(
                club_id=club_id,
                application_id=application_id,
            )
        )

        if application is None:
            raise LookupError(
                "가입 신청을 찾을 수 없습니다."
            )

        if application.get("status") != "pending":
            raise ApplicationConflictError(
                "이미 처리된 가입 신청입니다."
            )

        applicant_user_id = str(
            application["user_id"]
        )

        decided_at = datetime.now(
            timezone.utc
        ).isoformat()

        # -------------------------------------------------
        # 거절 처리
        # -------------------------------------------------
        if decision == "reject":
            updated_application = (
                self.member_repository
                .update_application_decision(
                    application_id=application_id,
                    decision_status="rejected",
                    decided_by_user_id=(
                        manager_user_id
                    ),
                    decided_at=decided_at,
                )
            )

            if updated_application is None:
                raise ApplicationConflictError(
                    "이미 다른 운영자가 처리한 신청입니다."
                )

            return ClubApplicationDecisionResponse(
                application_id=application_id,
                club_id=club_id,
                user_id=applicant_user_id,
                application_status="rejected",
                member_status=None,
                message="가입 신청을 거절했습니다.",
            )

        # -------------------------------------------------
        # 승인 요청값 검증
        # -------------------------------------------------
        if decision != "approve":
            raise ValueError(
                "지원하지 않는 처리 방식입니다."
            )

        current_member_count = (
            self.member_repository
            .count_active_members(club_id)
        )

        max_members = club.get("max_members")

        if (
            max_members is not None
            and current_member_count
                >= int(max_members)
        ):
            raise ApplicationConflictError(
                "동호회 정원이 모두 찼습니다."
            )

        existing_membership = (
            self.member_repository
            .find_membership(
                club_id=club_id,
                user_id=applicant_user_id,
            )
        )

        if (
            existing_membership is not None
            and existing_membership.get(
                "status"
            ) == "active"
        ):
            raise ApplicationConflictError(
                "이미 동호회에 가입한 사용자입니다."
            )

        if (
            existing_membership is not None
            and existing_membership.get(
                "status"
            ) == "suspended"
        ):
            raise ApplicationConflictError(
                "정지된 회원은 가입 신청을 "
                "승인할 수 없습니다."
            )

        # 먼저 신청을 approved로 선점한다.
        # 동시에 두 운영자가 승인하는 상황을 방지한다.
        updated_application = (
            self.member_repository
            .update_application_decision(
                application_id=application_id,
                decision_status="approved",
                decided_by_user_id=(
                    manager_user_id
                ),
                decided_at=decided_at,
            )
        )

        if updated_application is None:
            raise ApplicationConflictError(
                "이미 다른 운영자가 처리한 신청입니다."
            )

        try:
            if existing_membership is None:
                (
                    self.member_repository
                    .create_membership(
                        club_id=club_id,
                        user_id=applicant_user_id,
                    )
                )

            else:
                existing_status = (
                    existing_membership.get(
                        "status"
                    )
                )

                if existing_status not in {
                    "inactive",
                    "withdrawn",
                }:
                    raise ApplicationConflictError(
                        "현재 회원 상태에서는 "
                        "재가입할 수 없습니다."
                    )

                (
                    self.member_repository
                    .activate_membership(
                        club_member_id=int(
                            existing_membership[
                                "club_member_id"
                            ]
                        )
                    )
                )

        except Exception:
            # 회원 등록에 실패했으면 신청을 다시 pending으로 복구
            (
                self.member_repository
                .restore_application_pending(
                    application_id
                )
            )

            raise

        # 승인 완료 후 실제 active 회원 수와
        # clubs.current_members를 동기화한다.
        updated_member_count = (
            self.member_repository
            .count_active_members(club_id)
        )

        self.member_repository.update_current_member_count(
            club_id=club_id,
            current_members=updated_member_count,
        )

        return ClubApplicationDecisionResponse(
            application_id=application_id,
            club_id=club_id,
            user_id=applicant_user_id,
            application_status="approved",
            member_status="active",
            message="가입 신청을 승인했습니다.",
        )

    # -----------------------------------------------------
    # 회원 역할 변경
    #
    # 동호회장만 운영진 지정 및 해제가 가능하다.
    # -----------------------------------------------------
    def update_member_role(
        self,
        club_id: int,
        club_member_id: int,
        manager_user_id: str,
        next_role: str,
    ) -> ClubMemberUpdateResponse:

        self.validate_management_permission(
            club_id=club_id,
            user_id=manager_user_id,
        )

        manager_membership = (
            self.member_repository
            .find_management_membership(
                club_id=club_id,
                user_id=manager_user_id,
            )
        )

        if (
            manager_membership is None
            or manager_membership.get("role")
                != "owner"
        ):
            raise PermissionError(
                "동호회장만 운영진 역할을 "
                "변경할 수 있습니다."
            )

        target_member = (
            self.member_repository
            .find_member_by_id(
                club_id=club_id,
                club_member_id=club_member_id,
            )
        )

        if target_member is None:
            raise LookupError(
                "변경할 회원을 찾을 수 없습니다."
            )

        if target_member.get("role") == "owner":
            raise MemberManagementConflictError(
                "동호회장의 역할은 변경할 수 없습니다."
            )

        if target_member.get("status") != "active":
            raise MemberManagementConflictError(
                "활동 중인 회원만 역할을 "
                "변경할 수 있습니다."
            )

        if next_role not in {
            "manager",
            "member",
        }:
            raise ValueError(
                "지원하지 않는 회원 역할입니다."
            )

        if target_member.get("role") == next_role:
            return ClubMemberUpdateResponse(
                club_member_id=club_member_id,
                club_id=club_id,
                user_id=str(
                    target_member["user_id"]
                ),
                role=target_member["role"],
                status=target_member["status"],
                message=(
                    "이미 선택한 역할로 "
                    "설정되어 있습니다."
                ),
            )

        updated_member = (
            self.member_repository
            .update_member_role(
                club_id=club_id,
                club_member_id=club_member_id,
                role=next_role,
            )
        )

        if updated_member is None:
            raise LookupError(
                "회원 역할 변경에 실패했습니다."
            )

        role_label = (
            "운영진"
            if next_role == "manager"
            else "일반 회원"
        )

        return ClubMemberUpdateResponse(
            club_member_id=club_member_id,
            club_id=club_id,
            user_id=str(
                updated_member["user_id"]
            ),
            role=updated_member["role"],
            status=updated_member["status"],
            message=(
                f"회원 역할을 {role_label}(으)로 "
                "변경했습니다."
            ),
        )

    # -----------------------------------------------------
    # 회원 활동 정지 또는 복구
    # -----------------------------------------------------
    def update_member_status(
        self,
        club_id: int,
        club_member_id: int,
        manager_user_id: str,
        next_status: str,
    ) -> ClubMemberUpdateResponse:

        club = self.validate_management_permission(
            club_id=club_id,
            user_id=manager_user_id,
        )

        manager_membership = (
            self.member_repository
            .find_management_membership(
                club_id=club_id,
                user_id=manager_user_id,
            )
        )

        target_member = (
            self.member_repository
            .find_member_by_id(
                club_id=club_id,
                club_member_id=club_member_id,
            )
        )

        if target_member is None:
            raise LookupError(
                "변경할 회원을 찾을 수 없습니다."
            )

        if target_member.get("role") == "owner":
            raise MemberManagementConflictError(
                "동호회장은 활동 정지할 수 없습니다."
            )

        if (
            target_member.get("user_id")
            == manager_user_id
        ):
            raise MemberManagementConflictError(
                "자신의 회원 상태는 변경할 수 없습니다."
            )

        manager_role = (
            manager_membership.get("role")
            if manager_membership
            else None
        )

        if (
            manager_role == "manager"
            and target_member.get("role")
                == "manager"
        ):
            raise PermissionError(
                "운영진은 다른 운영진의 상태를 "
                "변경할 수 없습니다."
            )

        if next_status not in {
            "active",
            "suspended",
        }:
            raise ValueError(
                "지원하지 않는 회원 상태입니다."
            )

        current_status = target_member.get(
            "status"
        )

        if current_status not in {
            "active",
            "suspended",
        }:
            raise MemberManagementConflictError(
                "현재 회원 상태에서는 활동 정지나 "
                "복구를 처리할 수 없습니다."
            )

        if current_status == next_status:
            return ClubMemberUpdateResponse(
                club_member_id=club_member_id,
                club_id=club_id,
                user_id=str(
                    target_member["user_id"]
                ),
                role=target_member["role"],
                status=target_member["status"],
                message=(
                    "이미 선택한 회원 상태로 "
                    "설정되어 있습니다."
                ),
            )

        # 정지된 회원을 복구할 때 정원을 확인한다.
        if next_status == "active":
            current_member_count = (
                self.member_repository
                .count_active_members(club_id)
            )

            max_members = club.get(
                "max_members"
            )

            if (
                max_members is not None
                and current_member_count
                    >= int(max_members)
            ):
                raise MemberManagementConflictError(
                    "동호회 정원이 모두 차서 "
                    "회원을 복구할 수 없습니다."
                )

        updated_member = (
            self.member_repository
            .update_member_status(
                club_id=club_id,
                club_member_id=club_member_id,
                member_status=next_status,
            )
        )

        if updated_member is None:
            raise LookupError(
                "회원 상태 변경에 실패했습니다."
            )

        updated_member_count = (
            self.member_repository
            .count_active_members(club_id)
        )

        self.member_repository.update_current_member_count(
            club_id=club_id,
            current_members=updated_member_count,
        )

        status_label = (
            "활동 상태로 복구"
            if next_status == "active"
            else "활동 정지"
        )

        return ClubMemberUpdateResponse(
            club_member_id=club_member_id,
            club_id=club_id,
            user_id=str(
                updated_member["user_id"]
            ),
            role=updated_member["role"],
            status=updated_member["status"],
            message=(
                f"회원을 {status_label}했습니다."
            ),
        )