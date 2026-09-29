// =========================================================
// ⭐ 메인 화면 커뮤니티 미리보기
//
// Main.jsx(가입 전 홈), MainHome.jsx(가입 후 홈) 공통
//
// [인기글] [자유게시판] [동호회 이야기]   더보기 >
//  🔥 제목                                  [사진]
//     게시판 · 댓글 N · N분 전
//
// - 인기글       : 자유 + 종목별 게시판을 조회수 순으로 합쳐 상위 3개
// - 자유게시판   : 자유게시판 최신 3개
// - 동호회 이야기 : 내 동호회 게시판 최신 3개
//                  (가입한 동호회가 없으면 홍보·회원구인 게시판)
//
// ⭐ 사진은 백엔드 목록 응답의 thumbnailUrl을 사용
//    (없으면 사진 칸 없이 표시)
// =========================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { authenticatedRequest } from "../../api/apiClient";
import { safeImageUrl } from "../../utils/recommendClubs";

import "./CommunityPreview.css";


const TABS = [
    { key: "popular", label: "인기글" },
    { key: "free", label: "자유게시판" },
    { key: "club", label: "동호회 이야기" },
];

// 게시판별 아이콘 / 이름
const BOARD_ICON = {
    free: "💬",
    sports: "🏅",
    recruit: "📢",
    club: "📢",
    notice: "📌",
};

const BOARD_LABEL = {
    free: "자유게시판",
    sports: "종목별 게시판",
    recruit: "홍보·회원구인",
    notice: "공지사항",
    club: "동호회 게시판",
};

const PREVIEW_COUNT = 3;


// ---------------------------------------------------------
// 게시글 목록 조회 (실패하면 빈 목록)
// ---------------------------------------------------------
const fetchPosts = async (params) => {
    try {
        const query = new URLSearchParams({
            page: "1",
            size: String(PREVIEW_COUNT + 2),
            sort: "latest",
            ...params,
        });

        const data = await authenticatedRequest(
            `/api/posts?${query.toString()}`,
            { method: "GET" }
        );

        return Array.isArray(data?.items) ? data.items : [];

    } catch (error) {
        console.error("⭐ 커뮤니티 미리보기 조회 오류:", params, error);
        return [];
    }
};


// ---------------------------------------------------------
// "N분 전" 표시
// ---------------------------------------------------------
const timeAgo = (value) => {
    if (!value) return "";

    const diff = (Date.now() - new Date(value).getTime()) / 1000;

    if (Number.isNaN(diff)) return "";
    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`;

    const date = new Date(value);
    return `${date.getMonth() + 1}.${date.getDate()}`;
};


// ---------------------------------------------------------
// 탭별 게시글 가져오기
// ---------------------------------------------------------
const loadTabPosts = async (tabKey, clubIds) => {

    if (tabKey === "popular") {
        const [freePosts, sportsPosts] = await Promise.all([
            fetchPosts({ board_type: "free", sort: "views" }),
            fetchPosts({ board_type: "sports", sort: "views" }),
        ]);

        return [...freePosts, ...sportsPosts]
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, PREVIEW_COUNT);
    }

    if (tabKey === "free") {
        const posts = await fetchPosts({ board_type: "free" });
        return posts.slice(0, PREVIEW_COUNT);
    }

    // 동호회 이야기
    if (clubIds.length > 0) {
        const results = await Promise.all(
            clubIds.slice(0, 3).map((clubId) =>
                fetchPosts({
                    board_type: "club",
                    club_id: String(clubId),
                })
            )
        );

        const clubPosts = results
            .flat()
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .slice(0, PREVIEW_COUNT);

        if (clubPosts.length > 0) {
            return clubPosts;
        }
    }

    // 가입한 동호회가 없거나 동호회 글이 없으면 → 홍보·회원구인
    const recruitPosts = await fetchPosts({ board_type: "recruit" });
    return recruitPosts.slice(0, PREVIEW_COUNT);
};


// ---------------------------------------------------------
// 게시글 상세 주소 (동호회 게시판은 동호회 커뮤니티 안으로)
// ---------------------------------------------------------
const getPostLink = (post) =>
    post.board === "club" && post.clubId
        ? `/clubs/${post.clubId}/community/post/${post.id}`
        : `/community/post/${post.id}`;


function CommunityPreview({ icon, clubIds = [] }) {

    const [activeTab, setActiveTab] = useState("popular");

    // 탭별로 한 번 불러온 결과는 저장해두고 재사용
    const [postsByTab, setPostsByTab] = useState({});
    const [loadingTab, setLoadingTab] = useState(null);

    // 배열은 매번 새로 만들어지므로 문자열로 비교
    const clubIdsKey = clubIds.map(String).join(",");


    // 동호회 목록이 바뀌면 저장된 결과 비우기
    useEffect(() => {
        setPostsByTab({});
    }, [clubIdsKey]);


    useEffect(() => {

        if (postsByTab[activeTab]) {
            return;
        }

        let isActive = true;

        setLoadingTab(activeTab);

        loadTabPosts(
            activeTab,
            clubIdsKey ? clubIdsKey.split(",") : []
        ).then((posts) => {
            if (!isActive) return;

            setPostsByTab((prev) => ({
                ...prev,
                [activeTab]: posts,
            }));

            setLoadingTab(null);
        });

        return () => {
            isActive = false;
        };

    }, [activeTab, clubIdsKey, postsByTab]);


    const posts = postsByTab[activeTab] || [];
    const isLoading = loadingTab === activeTab && !postsByTab[activeTab];


    return (
        <section className="cp-section">

            {/* ⭐ 제목 + 더보기 */}
            <div className="cp-header">

                <div className="cp-title">
                    {icon && <img src={icon} alt="" />}
                    <h3>커뮤니티</h3>
                </div>

                <Link to="/community" className="cp-more">
                    더보기 <span aria-hidden="true">›</span>
                </Link>

            </div>


            {/* ⭐ 탭 */}
            <div className="cp-tabs" role="tablist">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        className={
                            activeTab === tab.key
                                ? "cp-tab active"
                                : "cp-tab"
                        }
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>


            {/* ⭐ 게시글 목록 */}
            <div className="cp-list">

                {isLoading ? (

                    <p className="cp-empty">게시글을 불러오는 중이에요.</p>

                ) : posts.length === 0 ? (

                    <p className="cp-empty">아직 게시글이 없어요.</p>

                ) : (

                    posts.map((post, index) => {

                        const thumbnail = safeImageUrl(post.thumbnailUrl);

                        // 인기글 1위는 🔥, 나머지는 게시판별 아이콘
                        const rowIcon =
                            activeTab === "popular" && index === 0
                                ? "🔥"
                                : BOARD_ICON[post.board] || "💬";

                        const boardName =
                            post.clubName ||
                            post.sportName ||
                            BOARD_LABEL[post.board] ||
                            "커뮤니티";

                        return (
                            <Link
                                key={`${post.board}-${post.id}`}
                                to={getPostLink(post)}
                                className="cp-item"
                            >

                                <span className="cp-item-icon" aria-hidden="true">
                                    {rowIcon}
                                </span>

                                <div className="cp-item-body">
                                    <p className="cp-item-title">
                                        {post.title || "제목 없음"}
                                    </p>

                                    <p className="cp-item-meta">
                                        {boardName}
                                        <span>·</span>
                                        댓글 {post.comments ?? 0}
                                        <span>·</span>
                                        {timeAgo(post.createdAt)}
                                    </p>
                                </div>

                                {thumbnail && (
                                    <img
                                        src={thumbnail}
                                        alt=""
                                        className="cp-item-thumb"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                )}

                            </Link>
                        );
                    })

                )}

            </div>

        </section>
    );
}

export default CommunityPreview;
