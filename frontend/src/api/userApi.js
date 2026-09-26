import { supabase } from "../../supabaseClient";
import { authenticatedRequest } from "./apiClient";

export const getMyGender = async () => {
    return authenticatedRequest(
        "/api/users/me/gender",
        {
            method: "GET"
        }
    );
};

// =========================================================
// 내 정보 조회 (마이페이지 / 내 정보 수정 공용)
//
// GET /api/users/me
// 응답: { user_id, name, nickname, email, profile_image,
//         gender, birth_date,
//         sports: [{ sport_id, sport_name, sport_level }],
//         regions: ["강서구", ...] }
// =========================================================
export const getMyProfile = async () => {
    return authenticatedRequest(
        "/api/users/me",
        {
            method: "GET"
        }
    );
};

// =========================================================
// 내 정보 수정
//
// PATCH /api/users/me
// body: { name, nickname, gender, birth_date,
//         sports: [{ sport_id, sport_level }],
//         regions: ["강서구", ...] }
// =========================================================
export const updateMyProfile = async (profileData) => {
    return authenticatedRequest(
        "/api/users/me",
        {
            method: "PATCH",
            body: profileData
        }
    );
};

// =========================================================
// 프로필 이미지 업로드 (Supabase Storage)
//
// 회원가입과 같은 규칙:
// bucket: user_images / 경로: {user_id}/profile.{확장자}
//
// 같은 경로에 덮어쓰면 URL이 똑같아서 브라우저가 예전 사진을
// 캐시로 보여줄 수 있다. 그래서 ?v=시간 을 붙여서 반환한다.
// =========================================================
export const uploadProfileImage = async (userId, file) => {

    const fileExtension = file.name
        .split(".")
        .pop()
        .toLowerCase();

    const filePath = `${userId}/profile.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
        .from("user_images")
        .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
        });

    if (uploadError) {
        throw new Error(
            `프로필 이미지 업로드에 실패했습니다: ${uploadError.message}`
        );
    }

    const { data } = supabase.storage
        .from("user_images")
        .getPublicUrl(filePath);

    return `${data.publicUrl}?v=${Date.now()}`;
};

// =========================================================
// 프로필 이미지 URL 저장 (users.profile_image)
//
// PATCH /api/users/me/profile-image
// =========================================================
export const updateProfileImage = async (profileImageUrl) => {
    return authenticatedRequest(
        "/api/users/me/profile-image",
        {
            method: "PATCH",
            body: {
                profile_image: profileImageUrl
            }
        }
    );
};
