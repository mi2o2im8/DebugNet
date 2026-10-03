// =========================================================
// ⭐ "이런 활동도 있어요" 추천 동호회 만들기
//
// Main.jsx(가입 전 홈), MainHome.jsx(가입 후 홈) 공통 사용
//
// 1. /api/clubs/search 결과에서 동호회를 랜덤으로 N개 고른다
// 2. 고른 동호회만 /api/clubs/{id} 상세 조회
//    → 실제 대표 이미지 / 종목 / 지역 / 생성일 / 회원 수
// 3. 뱃지 (fixedBadges = true, 기본값)
//    한 화면(3개)마다 [추천, 신규, HOT] 카드가 항상 하나씩 나오게 고른다.
//    - 추천 : 내 관심 종목 또는 활동 지역과 겹치는 동호회 (없으면 남은 것 중 랜덤)
//    - 신규 : 남은 동호회 중 가장 최근에 만들어진 곳
//    - HOT  : 남은 동호회 중 회원이 가장 많은(정원 대비 많이 찬) 곳
//
//    fixedBadges = false 이면 예전 방식:
//    조건(NEW_CLUB_DAYS 등)을 만족할 때만 뱃지를 붙이고, 추천 → 신규 → HOT 순으로 하나만
// =========================================================

import { supabase } from "../../supabaseClient";
import { buildApiUrl } from "../api/apiClient";

 


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


// =========================================================
// ⭐ 깨진 이미지 주소 거르기
//
// 더미 데이터에 지금은 없는 Supabase 프로젝트 주소가 들어 있어서
// 그 주소로 이미지를 요청하면 콘솔에 ERR_NAME_NOT_RESOLVED가 뜬다.
// → 화면에 그리기 전에 미리 빼서, 요청 자체를 보내지 않게 한다.
// =========================================================
const BROKEN_IMAGE_HOSTS = [
    "kzzznqcmvkclhaxyognx.supabase.co",
];

export const safeImageUrl = (url) => {
    if (!url) return null;

    try {
        const { host } = new URL(url);

        if (BROKEN_IMAGE_HOSTS.includes(host)) {
            return null;
        }
    } catch {
        // 상대 경로(프로젝트 안 이미지 등)는 그대로 사용
    }

    return url;
};


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
export const getUserPreferences = async () => {
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
            buildApiUrl(`/api/clubs/${clubId}`)
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
export const isSameSport = (a, b) => {
    const clean = (text) => String(text).replace(/\s/g, "");
    const x = clean(a);
    const y = clean(b);

    return x === y || x.includes(y) || y.includes(x);
};

// 지역 비교 ("서울 강서구" / "강서구" 모두 대응)
export const isSameRegion = (a, b) => {
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
    fixedBadges = true,
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
            safeImageUrl(club.image_url) ||
            safeImageUrl(club.representative_image_url) ||
            safeImageUrl(club.club_image)
        );

        if (EXCLUDE_NO_IMAGE_CLUBS && !hasImage) return false;

        seen.add(key);
        return true;
    });

    // ⭐ 후보를 넉넉히 뽑아서 상세 조회 (뱃지별로 고르려면 여유가 필요)
    const poolSize = fixedBadges
        ? Math.max(count * 3, 24)
        : count;

    const pool = shuffle(candidates).slice(0, poolSize);

    // ⭐ 상세 조회 + 사용자 관심 정보 동시에
    const [details, preferences] = await Promise.all([
        Promise.all(pool.map((club) => getClubDetail(getClubId(club)))),
        getUserPreferences(),
    ]);

    const normalizedClubs = pool.map((club, index) =>
        normalizeClub(club, details[index] || {})
    );

    // ---------------------------------------------------------
    // 예전 방식: 조건을 만족할 때만 뱃지
    // ---------------------------------------------------------
    if (!fixedBadges) {
        return normalizedClubs.slice(0, count).map((club) => ({
            ...club,
            badge: pickBadge(club, preferences),
        }));
    }

    // ---------------------------------------------------------
    // ⭐ 고정 방식: 3개마다 [추천, 신규, HOT]
    // ---------------------------------------------------------
    const remaining = [...normalizedClubs];
    const result = [];

    const takeFrom = (list) => {
        const club = list[0];

        if (!club) return null;

        remaining.splice(remaining.indexOf(club), 1);
        return club;
    };

    const pickers = {
        // 관심 종목/지역이 겹치는 곳 우선, 없으면 랜덤(이미 섞여 있음)
        recommend: () =>
            takeFrom(remaining.filter((club) => matchesPreference(club, preferences)))
            || takeFrom(remaining),

        // 가장 최근에 만들어진 곳
        new: () =>
            takeFrom(
                [...remaining].sort(
                    (a, b) => toTime(b.createdAt) - toTime(a.createdAt)
                )
            ),

        // 회원이 가장 많은 곳 (같으면 정원 대비 많이 찬 곳)
        hot: () =>
            takeFrom(
                [...remaining].sort(
                    (a, b) =>
                        (Number(b.memberCount) || 0) - (Number(a.memberCount) || 0)
                        || fillRatio(b) - fillRatio(a)
                )
            ),
    };

    const SLOT_ORDER = ["recommend", "new", "hot"];

    for (let index = 0; index < count && remaining.length > 0; index += 1) {

        const slot = SLOT_ORDER[index % SLOT_ORDER.length];
        const club = pickers[slot]();

        if (!club) break;

        result.push({
            ...club,
            badge: CLUB_BADGES[slot],
        });
    }

    return result;
};


// ---------------------------------------------------------
// 보조 함수
// ---------------------------------------------------------

const toTime = (value) => {
    const time = value ? new Date(value).getTime() : 0;
    return Number.isNaN(time) ? 0 : time;
};

const fillRatio = (club) => {
    const max = Number(club.maxMembers) || 0;
    return max > 0 ? (Number(club.memberCount) || 0) / max : 0;
};

const matchesPreference = (club, preferences) =>
    club.sports.some((sport) =>
        preferences.sports.some((mine) => isSameSport(sport, mine))
    )
    || club.regions.some((region) =>
        preferences.regions.some((mine) => isSameRegion(region, mine))
    );


// 검색 결과 + 상세 조회 결과 → 화면용 데이터
const normalizeClub = (club, detail) => {

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
        [
            mainImage?.image_url,
            detail.representative_image_url,
            club.representative_image_url,
            club.image_url,
            club.club_image,
        ]
            .map(safeImageUrl)
            .find(Boolean) || null;

    const intro = detail.club_intro || club.club_intro || "";

    // 카드 아래 한 줄: "축구 · 강서구" / 없으면 소개글
    const subText =
        [sports[0], regions[0]].filter(Boolean).join(" · ") ||
        intro ||
        "동호회 소개가 없어요";

    return {
        id: getClubId(club),
        name: detail.club_name || club.club_name || club.name || "동호회",
        image,
        sports,
        regions,
        intro,
        createdAt: detail.created_at || club.created_at || null,
        memberCount:
            detail.current_members ??
            club.current_members ??
            club.member_count ??
            0,
        maxMembers: detail.max_members ?? club.max_members ?? 0,
        subText,
    };
};
