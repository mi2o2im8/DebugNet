import { supabase } from "../../supabaseClient";
import {
    authenticatedRequest,
    getAuthenticatedSession
} from "./apiClient";

const CLUB_IMAGE_BUCKET = "club-images";

const getFileExtension = (file) => {
    const extension = file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (["jpg", "jpeg", "png", "webp"].includes(extension)) {
        return extension;
    }

    return "jpg";
};

const createUploadId = () => {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
};

const uploadImage = async (
    file,
    filePath,
    uploadedPaths
) => {
    const { error } = await supabase.storage
        .from(CLUB_IMAGE_BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false
        });

    if (error) {
        throw new Error(
            `이미지 업로드에 실패했습니다: ${error.message}`
        );
    }

    uploadedPaths.push(filePath);

    const { data } = supabase.storage
        .from(CLUB_IMAGE_BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

const removeUploadedImages = async (filePaths) => {
    if (filePaths.length === 0) {
        return;
    }

    const { error } = await supabase.storage
        .from(CLUB_IMAGE_BUCKET)
        .remove(filePaths);

    if (error) {
        console.error(
            "업로드 이미지 정리 실패:",
            error
        );
    }
};

export const createClub = async (formData) => {
    const session = await getAuthenticatedSession();

    const userId = session.user.id;
    const uploadId = createUploadId();
    const uploadRoot =
        `${userId}/clubs/${uploadId}`;

    const uploadedPaths = [];

    try {
        let representativeImageUrl = null;

        if (formData.representativeImageFile) {
            const file =
                formData.representativeImageFile;

            const extension =
                getFileExtension(file);

            representativeImageUrl =
                await uploadImage(
                    file,
                    `${uploadRoot}/representative.${extension}`,
                    uploadedPaths
                );
        }

        const activityImageUrls = [];

        for (
            let index = 0;
            index < formData.activityImageFiles.length;
            index += 1
        ) {
            const file =
                formData.activityImageFiles[index];

            const extension =
                getFileExtension(file);

            const imageUrl = await uploadImage(
                file,
                `${uploadRoot}/activity-${index + 1}.${extension}`,
                uploadedPaths
            );

            activityImageUrls.push(imageUrl);
        }

        const requestData = {
            representativeImageUrl,
            clubName: formData.clubName,
            sport: formData.sport,
            city: formData.city,
            district: formData.district,
            detailLocation:
                formData.detailLocation || null,

            schedules: formData.schedules.map(
                (schedule) => ({
                    day: schedule.day,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    enabled: schedule.enabled
                })
            ),

            activityPlace: formData.activityPlace,
            activityPlaceDetail:
                formData.activityPlaceDetail || null,
            activityFrequency:
                formData.activityFrequency,

            activityLevels:
                formData.activityLevels,
            joinTarget: formData.joinTarget,
            ageGroups: formData.ageGroups,
            noAgeLimit: formData.noAgeLimit,

            introKeywords:
                formData.introKeywords,
            clubDescription:
                formData.clubDescription,
            activityImageUrls,

            joinMethod: formData.joinMethod,
            maxMembers: formData.maxMembers,

            joinQuestions:
                formData.joinQuestions.map(
                    (question) => ({
                        question: question.question
                    })
                ),

            visibility: "public"
        };

        return await authenticatedRequest(
            "/api/clubs",
            {
                method: "POST",
                body: requestData
            }
        );
    } catch (error) {
        await removeUploadedImages(uploadedPaths);
        throw error;
    }
};

export async function getClubDashboard(clubId) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/dashboard`,
        {
            method: "GET"
        }
    );
}

export async function getClubEvents(clubId) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/events`,
        {
            method: "GET"
        }
    );
}

export async function createClubEvent(
    clubId,
    requestData
) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/events`,
        {
            method: "POST",
            body: requestData
        }
    );
}

export async function getClubEvent(
    clubId,
    eventId
) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/events/${eventId}`,
        {
            method: "GET"
        }
    );
}

export async function updateClubEvent(
    clubId,
    eventId,
    requestData
) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/events/${eventId}`,
        {
            method: "PUT",
            body: requestData
        }
    );
}

export async function copyClubEvent(
    clubId,
    eventId
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/events/` +
            `${eventId}/copy`
        ),
        {
            method: "POST"
        }
    );
}

export async function deleteClubEvent(
    clubId,
    eventId
) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/events/${eventId}`,
        {
            method: "DELETE"
        }
    );
}

export async function getClubEventParticipants(
    clubId,
    eventId
) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/events/${eventId}/participants`,
        {
            method: "GET"
        }
    );
}

export async function decideClubEventGuest(
    clubId,
    eventId,
    eventParticipantId,
    decision
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/events/${eventId}` +
            `/participants/${eventParticipantId}/decision`
        ),
        {
            method: "PATCH",
            body: {
                decision
            }
        }
    );
}

export async function getClubEventAttendance(
    clubId,
    eventId
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/events/`
            + `${eventId}/attendance`
        ),
        {
            method: "GET"
        }
    );
}

export async function updateClubEventAttendance(
    clubId,
    eventId,
    attendanceStatus
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/events/`
            + `${eventId}/attendance`
        ),
        {
            method: "PUT",
            body: {
                attendanceStatus
            }
        }
    );
}

// ---------------------------------------------------------
// 현재 동호회 회원 목록 조회
// ---------------------------------------------------------
export async function getClubMembers(
    clubId
) {
    return authenticatedRequest(
        `/api/clubs/${clubId}/members`,
        {
            method: "GET"
        }
    );
}

// ---------------------------------------------------------
// 동호회 가입 신청 목록 조회
// ---------------------------------------------------------
export async function getClubApplications(
    clubId,
    applicationStatus = "pending"
) {
    const query = new URLSearchParams({
        application_status: applicationStatus
    });

    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/applications`
            + `?${query.toString()}`
        ),
        {
            method: "GET"
        }
    );
}


// ---------------------------------------------------------
// 동호회 가입 신청 승인·거절
// ---------------------------------------------------------
export async function decideClubApplication(
    clubId,
    applicationId,
    decision
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/applications/`
            + `${applicationId}/decision`
        ),
        {
            method: "PATCH",
            body: {
                decision
            }
        }
    );
}

// =========================================================
// ⭐ 내 동호회 조회
//
// 운영 중인 동호회 또는
// 운영자 승인을 받아 가입한 동호회 확인
// =========================================================

export async function getMyClub() {
    return authenticatedRequest(
        "/api/clubs/my",
        {
            method: "GET"
        }
    );
}


// =========================================================
// ⭐ 특정 동호회 가입 상태 조회
//
// pending
//   → 승인 대기
//
// active
//   → 운영자 승인 완료 + 정식 회원
//
// rejected
//   → 가입 거절
// =========================================================

export async function getClubMemberStatus(
    clubId,
    userId
) {
    const query = new URLSearchParams({
        user_id: userId
    });

    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/member-status`
            + `?${query.toString()}`
        ),
        {
            method: "GET"
        }
    );
}


// ---------------------------------------------------------
// 회원 역할 변경
// ---------------------------------------------------------
export async function updateClubMemberRole(
    clubId,
    clubMemberId,
    role
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/members/`
            + `${clubMemberId}/role`
        ),
        {
            method: "PATCH",
            body: {
                role
            }
        }
    );
}


// ---------------------------------------------------------
// 회원 활동 상태 변경
// ---------------------------------------------------------
export async function updateClubMemberStatus(
    clubId,
    clubMemberId,
    memberStatus
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/members/`
            + `${clubMemberId}/status`
        ),
        {
            method: "PATCH",
            body: {
                status: memberStatus
            }
        }
    );
}


// ---------------------------------------------------------
// 동호회 회원 내보내기
// ---------------------------------------------------------
export async function removeClubMember(
    clubId,
    clubMemberId
) {
    return authenticatedRequest(
        (
            `/api/clubs/${clubId}/members/`
            + clubMemberId
        ),
        {
            method: "DELETE"
        }
    );
}