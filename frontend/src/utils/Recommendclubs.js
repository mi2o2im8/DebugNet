// =========================================================
// ⭐ "이런 활동도 있어요" 추천 동호회 만들기
//
// Main.jsx(가입 전 홈), MainHome.jsx(가입 후 홈) 공통 사용
//
// 1. /api/clubs/search 결과에서 동호회를 랜덤으로 N개 고른다
// 2. 고른 동호회만 /api/clubs/{id} 상세 조회
//    → 실제 대표 이미지 / 종목 / 지역 / 생성일 / 회원 수
// 3. 뱃지 결정
//    - 추천 : 내 관심 종목 또는 활동 지역과 겹침
//    - 신규 : 만들어진 지 NEW_CLUB_DAYS일 이내
//    - HOT  : 회원이 많거나 정원이 거의 찬 동호회
//    (여러 개 해당되면 추천 → 신규 → HOT 순으로 하나만)
// =========================================================

import { supabase } from "../../supabaseClient";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";


// ⭐ 기준값 (필요하면 숫자만 바꾸면 됨)
const NEW_CLUB_DAYS = 14;        // 생성 후 14일 이내 → 신규
const HOT_MIN_MEMBERS = 10;      // 회원 10명 이상 → HOT
const HOT_FULL_RATIO = 0.8;      // 정원의 80% 이상 참 → HOT


// ⭐ 더미(테스트용) 동호회 거르기
//
// 1) 대표 이미지를 등록하지 않은 동호회는 추천에서 뺀다
//    (DB에 미리 넣어둔 더미 동호회는 이미지가 없어서)
//    → 실제 사용자가 사진 없이 만든 동호회도 같이 빠지니,
//      원하지 않으면 false로 바꾸기
const EXCLUDE_NO_IMAGE_CLUBS = true;

// 2) 이미지가 있는 더미도 빼고 싶으면 club_id를 여기에 적기
//    예) [1, 2, 3]
const DUMMY_CLUB_IDS = [1, 2, 3, 4, 5, 6, 7];


// ⭐ 뱃지 종류 / 색상
export const CLUB_BADGES = {
    recommend: { label: "추천", color: "#01A17F" },
    new: { label: "신규", color: "#4A9FD8" },
    hot: { label: "HOT", color: "#FF6B4A" },
};


// ---------------------------------------------------------
// 배열 섞기 (원본은 그대로 두고 새 배열 반환)
// ---------------------------------------------------------
const shuffle = (list) => {
    const copied = [...list];

    for (let i = copied.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copied[i], copied[j]] = [copied[j], copied[i]];
    }

    return copied;
};


// ---------------------------------------------------------
// 배열 / 쉼표 문자열 / 단일 문자열 → 배열
// (검색 API는 sports, regions가 문자열로 오는 경우가 있음)
// ---------------------------------------------------------
const toList = (value) => {
    if (Array.isArray(value)) {
        return value.filter(Boolean).map(String);
    }

    if (typeof value === "string" && value.trim()) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};


const getClubId = (club) =>
    club?.club_id ?? club?.id ?? club?.clubId ?? null;


// ---------------------------------------------------------
// 로그인한 사용자의 관심 종목 / 활동 지역
// (로그인 안 했거나 조회 실패하면 빈 목록 → 추천 뱃지만 안 뜸)
// ---------------------------------------------------------
const getUserPreferences = async () => {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { sports: [], regions: [] };
        }

        const [sportsResult, regionsResult] = await Promise.all([
            supabase
                .from("user_sports")
                .select("sport_id")
                .eq("user_id", user.id),

            supabase
                .from("user_regions")
                .select("region")
                .eq("user_id", user.id),
        ]);

        const sportIds = (sportsResult.data || [])
            .map((item) => item.sport_id)
            .filter(Boolean);

        let sports = [];

        if (sportIds.length > 0) {
            const { data } = await supabase
                .from("sports")
                .select("sport_name")
                .in("sport_id", sportIds);

            sports = (data || []).map((item) => item.sport_name);
        }

        const regions = (regionsResult.data || [])
            .map((item) => item.region)
            .filter(Boolean);

        return { sports, regions };

    } catch (error) {
        console.error("⭐ 추천용 사용자 관심 정보 조회 오류:", error);
        return { sports: [], regions: [] };
    }
};


// ---------------------------------------------------------
// 동호회 상세 조회 (실패하면 검색 결과만 사용)
// ---------------------------------------------------------
const getClubDetail = async (clubId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/clubs/${clubId}`
        );

        if (!response.ok) {
            return null;
        }

        return await response.json();

    } catch {
        return null;
    }
};


// ---------------------------------------------------------
// 종목 이름 비교 ("축구ㆍ풋살"과 "축구"도 같은 종목으로 봄)
// ---------------------------------------------------------
const isSameSport = (a, b) => {
    const clean = (text) => String(text).replace(/\s/g, "");
    const x = clean(a);
    const y = clean(b);

    return x === y || x.includes(y) || y.includes(x);
};

// 지역 비교 ("서울 강서구" / "강서구" 모두 대응)
const isSameRegion = (a, b) => {
    const x = String(a).trim();
    const y = String(b).trim();

    return x === y || x.endsWith(y) || y.endsWith(x);
};


// ---------------------------------------------------------
// 뱃지 결정
// ---------------------------------------------------------
const pickBadge = (club, preferences) => {

    // 1. 추천: 관심 종목 또는 지역이 겹침
    const matchesSport = club.sports.some((sport) =>
        preferences.sports.some((mine) => isSameSport(sport, mine))
    );

    const matchesRegion = club.regions.some((region) =>
        preferences.regions.some((mine) => isSameRegion(region, mine))
    );

    if (matchesSport || matchesRegion) {
        return CLUB_BADGES.recommend;
    }

    // 2. 신규: 만들어진 지 얼마 안 됨
    if (club.createdAt) {
        const createdTime = new Date(club.createdAt).getTime();
        const days = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);

        if (!Number.isNaN(days) && days >= 0 && days <= NEW_CLUB_DAYS) {
            return CLUB_BADGES.new;
        }
    }

    // 3. HOT: 회원이 많거나 정원이 거의 참
    const members = Number(club.memberCount) || 0;
    const maxMembers = Number(club.maxMembers) || 0;

    const isFull =
        maxMembers > 0 && members / maxMembers >= HOT_FULL_RATIO;

    if (members >= HOT_MIN_MEMBERS || isFull) {
        return CLUB_BADGES.hot;
    }

    return null;
};


// =========================================================
// ⭐ 메인에서 부르는 함수
//
// clubs      : /api/clubs/search 응답 목록
// excludeIds : 빼고 싶은 동호회 ID (내 동호회 등)
// count      : 보여줄 개수
//
// 반환 형태 (화면에서 바로 사용):
// {
//   id, name, image, sports, regions, subText, badge
// }
// =========================================================
export const buildRecommendedClubs = async ({
    clubs = [],
    excludeIds = [],
    count = 4,
} = {}) => {

    const excludeSet = new Set(
        [...excludeIds, ...DUMMY_CLUB_IDS].map(String)
    );

    // 중복 제거 + 제외 목록 빼기
    const seen = new Set();

    const candidates = clubs.filter((club) => {
        const id = getClubId(club);

        if (!id) return false;

        const key = String(id);

        if (seen.has(key) || excludeSet.has(key)) return false;

        // ⭐ 이미지 없는 동호회(더미) 제외
        const hasImage = Boolean(
            club.image_url ||
            club.representative_image_url ||
            club.club_image
        );

        if (EXCLUDE_NO_IMAGE_CLUBS && !hasImage) return false;

        seen.add(key);
        return true;
    });

    // ⭐ 랜덤으로 N개
    const picked = shuffle(candidates).slice(0, count);

    // ⭐ 상세 조회 + 사용자 관심 정보 동시에
    const [details, preferences] = await Promise.all([
        Promise.all(picked.map((club) => getClubDetail(getClubId(club)))),
        getUserPreferences(),
    ]);

    return picked.map((club, index) => {

        const detail = details[index] || {};

        const sports = toList(detail.sports).length
            ? toList(detail.sports)
            : toList(club.sports ?? club.sport_name);

        const regions = toList(detail.regions).length
            ? toList(detail.regions)
            : toList(club.regions ?? club.region);

        // 대표 이미지: 대표로 지정된 이미지 → 첫 번째 이미지 → 검색 결과 이미지
        const images = Array.isArray(detail.images) ? detail.images : [];

        const mainImage =
            images.find((img) =>
                ["main", "representative", "thumbnail"].includes(
                    img?.image_type
                )
            ) || images[0];

        const image =
            mainImage?.image_url ||
            detail.representative_image_url ||
            club.representative_image_url ||
            club.image_url ||
            club.club_image ||
            null;

        const normalized = {
            id: getClubId(club),
            name: detail.club_name || club.club_name || club.name || "동호회",
            image,
            sports,
            regions,
            intro: detail.club_intro || club.club_intro || "",
            createdAt: detail.created_at || club.created_at || null,
            memberCount:
                detail.current_members ??
                club.current_members ??
                club.member_count ??
                0,
            maxMembers: detail.max_members ?? club.max_members ?? 0,
        };

        // 카드 아래 한 줄: "축구 · 강서구" / 없으면 소개글
        const subText =
            [sports[0], regions[0]].filter(Boolean).join(" · ") ||
            normalized.intro ||
            "동호회 소개가 없어요";

        return {
            ...normalized,
            subText,
            badge: pickBadge(normalized, preferences),
        };
    });
};
