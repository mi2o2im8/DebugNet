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