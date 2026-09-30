// 내가 쓴 글 / 댓글 모음 페이지
//
// GET /api/posts/my      내가 쓴 글
// GET /api/comments/my   내가 쓴 댓글
//
// 두 API 모두 글마다 boardType / clubId / clubName 을 내려준다.
//   - 커뮤니티 글 (free / sports / recruit / notice) → /community/post/:postId
//   - 동호회 커뮤니티 글 (club)                        → /clubs/:clubId/community/post/:postId
//
// 화면: [내가 쓴 글 | 내가 쓴 댓글] 탭
//       → [전체 | 커뮤니티 | 동호회] 범위
//       → (동호회 선택 시) 동호회별 칩

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiEdit3,
    FiMessageCircle,
    FiUsers,
} from "react-icons/fi";

import PageHeader from "../../components/PageHeader/PageHeader";
import BottomNav from "../../components/BottomNav";

import { authenticatedRequest } from "../../api/apiClient";

import "./MyPostComment.css";


/* ========================================
   ⭐ 게시판 이름 (Community.jsx 와 같은 이름)
   ======================================== */

const BOARD_LABELS = {
    free: "자유게시판",
    sports: "종목별게시판",
    recruit: "홍보·회원구인",
    notice: "공지사항",
    club: "동호회",
};

const SCOPES = [
    { key: "all", label: "전체" },
    { key: "community", label: "커뮤니티" },
    { key: "club", label: "동호회" },
];

const ALL_CLUBS = "all";

const isClubItem = (item) => item.boardType === "club" && item.clubId != null;


/* ========================================
   ⭐ 날짜: "오늘" / "어제" / "9월 27일" / "2025년 12월 3일"
   ======================================== */

const formatDate = (value) => {

    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const days = Math.round((today - target) / 86400000);

    if (days === 0) return "오늘";
    if (days === 1) return "어제";

    if (date.getFullYear() !== today.getFullYear()) {
        return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
    }

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};


/* ========================================
   ⭐ 글이 어디에 있는지 표시 (게시판 / 동호회)
   ======================================== */

function PlaceTag({ item }) {

    if (isClubItem(item)) {
        return (
            <span className="mpc-tag club">
                <FiUsers aria-hidden="true" />
                {item.clubName || "동호회"}
            </span>
        );
    }

    return (
        <span className="mpc-tag community">
            {BOARD_LABELS[item.boardType] || "커뮤니티"}
        </span>
    );
}


function MyPostComment() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 화면 상태
    // =========================================================
    const [activeTab, setActiveTab] = useState("posts");
    const [scope, setScope] = useState("all");
    const [clubFilter, setClubFilter] = useState(ALL_CLUBS);


    // =========================================================
    // ⭐ 데이터
    // =========================================================
    const [myPosts, setMyPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [myComments, setMyComments] = useState([]);
    const [commentLoading, setCommentLoading] = useState(true);
    const [commentError, setCommentError] = useState("");


    // =========================================================
    // ⭐ 내가 쓴 글  GET /api/posts/my
    // =========================================================
    useEffect(() => {

        let ignore = false;

        authenticatedRequest("/api/posts/my")
            .then((data) => {
                if (ignore) return;

                setMyPosts(
                    (data.items || []).map((post) => ({
                        key: `post-${post.id}`,
                        postId: post.id,
                        title: post.title,
                        content: post.content,
                        createdAt: post.createdAt,
                        commentCount: post.comments,
                        boardType: post.boardType,
                        clubId: post.clubId,
                        clubName: post.clubName,
                    }))
                );
            })
            .catch((fetchError) => {
                console.error("내가 작성한 게시글 조회 실패:", fetchError);
                if (!ignore) {
                    setError(fetchError.message || "게시글을 불러오지 못했습니다.");
                }
            })
            .finally(() => {
                if (!ignore) setLoading(false);
            });

        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // ⭐ 내가 쓴 댓글  GET /api/comments/my
    // =========================================================
    useEffect(() => {

        let ignore = false;

        authenticatedRequest("/api/comments/my")
            .then((data) => {
                if (ignore) return;

                setMyComments(
                    (data.items || []).map((comment) => ({
                        key: `comment-${comment.commentId}`,
                        commentId: comment.commentId,
                        postId: comment.postId,
                        postTitle: comment.postTitle,
                        content: comment.content,
                        createdAt: comment.createdAt,
                        boardType: comment.boardType,
                        clubId: comment.clubId,
                        clubName: comment.clubName,
                    }))
                );
            })
            .catch((fetchError) => {
                console.error("내가 작성한 댓글 조회 실패:", fetchError);
                if (!ignore) {
                    setCommentError(fetchError.message || "댓글을 불러오지 못했습니다.");
                }
            })
            .finally(() => {
                if (!ignore) setCommentLoading(false);
            });

        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // ⭐ 현재 탭 데이터
    // =========================================================
    const isPostsTab = activeTab === "posts";

    const items = isPostsTab ? myPosts : myComments;
    const isLoading = isPostsTab ? loading : commentLoading;
    const errorMessage = isPostsTab ? error : commentError;

    // 범위별 개수
    const scopeCounts = useMemo(() => {
        const club = items.filter(isClubItem).length;

        return {
            all: items.length,
            community: items.length - club,
            club,
        };
    }, [items]);

    // 동호회 칩 (내 글/댓글이 있는 동호회만, 많은 순)
    const clubChips = useMemo(() => {
        const clubMap = new Map();

        items.filter(isClubItem).forEach((item) => {
            const previous = clubMap.get(item.clubId);

            clubMap.set(item.clubId, {
                id: item.clubId,
                name: item.clubName || "동호회",
                count: (previous?.count || 0) + 1,
            });
        });

        return [...clubMap.values()].sort((a, b) => b.count - a.count);
    }, [items]);

    const visibleItems = items.filter((item) => {
        if (scope === "community") return !isClubItem(item);

        if (scope === "club") {
            if (!isClubItem(item)) return false;
            return clubFilter === ALL_CLUBS || item.clubId === clubFilter;
        }

        return true;
    });


    // 탭 / 범위를 바꾸면 동호회 선택은 처음으로
    const changeTab = (tab) => {
        setActiveTab(tab);
        setClubFilter(ALL_CLUBS);
    };

    const changeScope = (nextScope) => {
        setScope(nextScope);
        setClubFilter(ALL_CLUBS);
    };


    // =========================================================
    // ⭐ 글 상세로 이동 (동호회 글은 동호회 커뮤니티 경로)
    // =========================================================
    const openPost = (item) => {

        if (isClubItem(item)) {
            navigate(`/clubs/${item.clubId}/community/post/${item.postId}`);
            return;
        }

        navigate(`/community/post/${item.postId}`);
    };


    // =========================================================
    // ⭐ 빈 화면 문구
    // =========================================================
    const emptyText = (() => {
        const what = isPostsTab ? "쓴 글" : "남긴 댓글";

        if (scope === "community") return `커뮤니티에 ${what}이 아직 없어요.`;
        if (scope === "club") return `동호회 커뮤니티에 ${what}이 아직 없어요.`;
        return `아직 ${what}이 없어요.`;
    })();


    return (
        <div className="my-post-comment-page">

            {/* ⭐ 상단 제목 (공용) */}
            <PageHeader title="내가 쓴 글 / 댓글" />


            {/* ⭐ 글 / 댓글 탭 */}
            <div className="mpc-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={isPostsTab}
                    className={isPostsTab ? "active" : ""}
                    onClick={() => changeTab("posts")}
                >
                    <FiEdit3 aria-hidden="true" />
                    내가 쓴 글
                    {!loading && <span>{myPosts.length}</span>}
                </button>

                <button
                    type="button"
                    role="tab"
                    aria-selected={!isPostsTab}
                    className={!isPostsTab ? "active" : ""}
                    onClick={() => changeTab("comments")}
                >
                    <FiMessageCircle aria-hidden="true" />
                    내가 쓴 댓글
                    {!commentLoading && <span>{myComments.length}</span>}
                </button>
            </div>


            {/* ⭐ 범위: 전체 / 커뮤니티 / 동호회 */}
            <div className="mpc-scopes" role="radiogroup" aria-label="어디에 쓴 글인지">
                {SCOPES.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        role="radio"
                        aria-checked={scope === item.key}
                        className={
                            scope === item.key
                                ? `mpc-scope ${item.key} active`
                                : `mpc-scope ${item.key}`
                        }
                        onClick={() => changeScope(item.key)}
                    >
                        {item.label}
                        {!isLoading && <span>{scopeCounts[item.key]}</span>}
                    </button>
                ))}
            </div>


            {/* ⭐ 동호회별 칩 (동호회를 골랐고, 동호회가 있을 때만) */}
            {scope === "club" && clubChips.length > 0 && (
                <div className="mpc-clubs" role="radiogroup" aria-label="동호회">
                    <button
                        type="button"
                        role="radio"
                        aria-checked={clubFilter === ALL_CLUBS}
                        className={clubFilter === ALL_CLUBS ? "mpc-club active" : "mpc-club"}
                        onClick={() => setClubFilter(ALL_CLUBS)}
                    >
                        모든 동호회
                    </button>

                    {clubChips.map((club) => (
                        <button
                            key={club.id}
                            type="button"
                            role="radio"
                            aria-checked={clubFilter === club.id}
                            className={clubFilter === club.id ? "mpc-club active" : "mpc-club"}
                            onClick={() => setClubFilter(club.id)}
                        >
                            {club.name}
                            <span>{club.count}</span>
                        </button>
                    ))}
                </div>
            )}


            {/* ⭐ 목록 */}
            {isLoading ? (

                <p className="mpc-message">
                    {isPostsTab ? "게시글을" : "댓글을"} 불러오는 중이에요...
                </p>

            ) : errorMessage ? (

                <p className="mpc-message">
                    {errorMessage}
                </p>

            ) : visibleItems.length === 0 ? (

                <div className="mpc-empty">
                    <p>{emptyText}</p>

                    <button
                        type="button"
                        onClick={() => navigate("/community")}
                    >
                        커뮤니티 둘러보기
                    </button>
                </div>

            ) : isPostsTab ? (

                <ul className="mpc-list">
                    {visibleItems.map((post) => (
                        <li key={post.key}>
                            <button
                                type="button"
                                className={`mpc-card ${isClubItem(post) ? "club" : "community"}`}
                                onClick={() => openPost(post)}
                            >
                                <PlaceTag item={post} />

                                <strong className="mpc-title">
                                    {post.title}
                                </strong>

                                {post.content && (
                                    <p className="mpc-content">
                                        {post.content}
                                    </p>
                                )}

                                <span className="mpc-meta">
                                    <span>{formatDate(post.createdAt)}</span>
                                    <span className="mpc-meta-comments">
                                        <FiMessageCircle aria-hidden="true" />
                                        {post.commentCount}
                                    </span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>

            ) : (

                <ul className="mpc-list">
                    {visibleItems.map((comment) => (
                        <li key={comment.key}>
                            <button
                                type="button"
                                className={`mpc-card ${isClubItem(comment) ? "club" : "community"}`}
                                onClick={() => openPost(comment)}
                            >
                                <PlaceTag item={comment} />

                                <span className="mpc-origin">
                                    {comment.postTitle}
                                </span>

                                {/* 내 댓글: 말풍선 */}
                                <span className="mpc-bubble">
                                    {comment.content}
                                </span>

                                <span className="mpc-meta">
                                    <span>{formatDate(comment.createdAt)}</span>
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>

            )}


            <BottomNav />

        </div>
    );
}


export default MyPostComment;
