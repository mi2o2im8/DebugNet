// 내가 쓴 글 / 댓글 모음 페이지

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";

import {
    authenticatedRequest,
} from "../../api/apiClient";

import "./MyPostComment.css";


function MyPostComment() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 현재 탭
    // =========================================================

    const [activeTab, setActiveTab] = useState("posts");


    // =========================================================
    // ⭐ 내가 작성한 게시글
    // =========================================================

    const [myPosts, setMyPosts] = useState([]);


    // =========================================================
    // ⭐ 게시글 조회 상태
    // =========================================================

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // =========================================================
    // ⭐ 내가 작성한 댓글
    // =========================================================

    const [myComments, setMyComments] = useState([]);

    const [commentLoading, setCommentLoading] = useState(true);

    const [commentError, setCommentError] = useState("");


    // =========================================================
    // ⭐ 내가 작성한 게시글 조회
    //
    // GET /api/posts/my
    // =========================================================

    useEffect(() => {

        const fetchMyPosts = async () => {

            try {

                setLoading(true);

                setError("");


                // -------------------------------------------------
                // 백엔드에서 현재 로그인 사용자의 게시글 조회
                // -------------------------------------------------

                const data = await authenticatedRequest(
                    "/api/posts/my"
                );


                // -------------------------------------------------
                // Backend 응답을 Frontend 형태로 변환
                // -------------------------------------------------

                setMyPosts(
                    (data.items || []).map((post) => ({

                        postId: post.id,

                        title: post.title,

                        content: post.content,

                        createdAt: post.createdAt,

                        commentCount: post.comments,

                    }))
                );


            } catch (error) {

                console.error(
                    "내가 작성한 게시글 조회 실패:",
                    error
                );


                setError(
                    error.message ||
                    "게시글을 불러오지 못했습니다."
                );


            } finally {

                setLoading(false);

            }

        };


        fetchMyPosts();

    }, []);


    // =========================================================
    // ⭐ 내가 작성한 댓글 조회
    //
    // GET /api/comments/my
    // =========================================================

    useEffect(() => {

        const fetchMyComments = async () => {

            try {

                setCommentLoading(true);

                setCommentError("");


                // -------------------------------------------------
                // 백엔드에서 현재 로그인 사용자의 댓글 조회
                // -------------------------------------------------

                const data = await authenticatedRequest(
                    "/api/comments/my"
                );


                // -------------------------------------------------
                // Backend 응답 저장
                // -------------------------------------------------

                setMyComments(
                    data.items || []
                );


            } catch (error) {

                console.error(
                    "내가 작성한 댓글 조회 실패:",
                    error
                );


                setCommentError(
                    error.message ||
                    "댓글을 불러오지 못했습니다."
                );


            } finally {

                setCommentLoading(false);

            }

        };


        fetchMyComments();

    }, []);


    // =========================================================
    // ⭐ 내가 쓴 글 상세 이동
    // =========================================================

    const handlePostClick = (postId) => {

        navigate(
            `/community/post/${postId}`
        );

    };


    // =========================================================
    // ⭐ 댓글이 달린 게시글 상세 이동
    // =========================================================

    const handleCommentClick = (postId) => {

        navigate(
            `/community/post/${postId}`
        );

    };


    return (

        <div className="my-post-comment-page">


            {/* =================================================
                뒤로가기
            ================================================= */}

            <BackButton />


            {/* =================================================
                헤더
            ================================================= */}

            <header className="my-post-comment-header">

                <h2>
                    내가 쓴 글 / 댓글
                </h2>

            </header>


            {/* =================================================
                탭
            ================================================= */}

            <div className="my-post-comment-tabs">

                <button
                    type="button"
                    className={
                        activeTab === "posts"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("posts")
                    }
                >
                    내가 쓴 글
                </button>


                <button
                    type="button"
                    className={
                        activeTab === "comments"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("comments")
                    }
                >
                    내가 쓴 댓글
                </button>

            </div>


            {/* =================================================
                내가 쓴 글
            ================================================= */}

            {activeTab === "posts" && (

                <section className="my-post-comment-section">


                    {/* -------------------------------------------------
                        작성한 글 개수
                    ------------------------------------------------- */}

                    <div className="my-post-comment-count">

                        내가 작성한 글 {myPosts.length}

                    </div>


                    {/* -------------------------------------------------
                        로딩 중
                    ------------------------------------------------- */}

                    {loading ? (

                        <div className="my-post-comment-empty">

                            게시글을 불러오는 중입니다.

                        </div>


                    ) : error ? (


                        /* -------------------------------------------------
                           조회 오류
                        ------------------------------------------------- */

                        <div className="my-post-comment-empty">

                            {error}

                        </div>


                    ) : myPosts.length === 0 ? (


                        /* -------------------------------------------------
                            작성한 글 없음
                        ------------------------------------------------- */

                        <div className="my-post-comment-empty">

                            작성한 글이 없습니다.

                        </div>


                    ) : (


                        /* -------------------------------------------------
                            게시글 목록
                        ------------------------------------------------- */

                        <div className="my-post-list">

                            {myPosts.map((post) => (

                                <button
                                    key={post.postId}
                                    type="button"
                                    className="my-post-card"
                                    onClick={() =>
                                        handlePostClick(
                                            post.postId
                                        )
                                    }
                                >


                                    {/* -------------------------------------
                                        제목 + 날짜
                                    ------------------------------------- */}

                                    <div className="my-post-top">

                                        <h3>

                                            {post.title}

                                        </h3>


                                        <span>

                                            {post.createdAt}

                                        </span>

                                    </div>


                                    {/* -------------------------------------
                                        게시글 내용
                                    ------------------------------------- */}

                                    <p className="my-post-content">

                                        {post.content}

                                    </p>


                                    {/* -------------------------------------
                                        댓글 수 + 화살표
                                    ------------------------------------- */}

                                    <div className="my-post-bottom">

                                        <span>

                                            댓글 {post.commentCount}

                                        </span>


                                        <span className="my-post-arrow">

                                            ›

                                        </span>

                                    </div>


                                </button>

                            ))}

                        </div>

                    )}

                </section>

            )}


            {/* =================================================
                내가 쓴 댓글
            ================================================= */}

            {activeTab === "comments" && (

                <section className="my-post-comment-section">


                    {/* -------------------------------------------------
                        작성한 댓글 개수
                    ------------------------------------------------- */}

                    <div className="my-post-comment-count">

                        내가 작성한 댓글 {myComments.length}

                    </div>


                    {/* -------------------------------------------------
                        로딩 중
                    ------------------------------------------------- */}

                    {commentLoading ? (

                        <div className="my-post-comment-empty">

                            댓글을 불러오는 중입니다.

                        </div>


                    ) : commentError ? (

                        /* -------------------------------------------------
                           조회 오류
                        ------------------------------------------------- */

                        <div className="my-post-comment-empty">

                            {commentError}

                        </div>


                    ) : myComments.length === 0 ? (

                        /* -------------------------------------------------
                            작성한 댓글 없음
                        ------------------------------------------------- */

                        <div className="my-post-comment-empty">

                            작성한 댓글이 없습니다.

                        </div>


                    ) : (

                        <div className="my-comment-list">

                            {myComments.map((comment) => (

                                <button
                                    key={comment.commentId}
                                    type="button"
                                    className="my-comment-card"
                                    onClick={() =>
                                        handleCommentClick(
                                            comment.postId
                                        )
                                    }
                                >


                                    {/* -------------------------------------
                                        댓글 작성 정보
                                    ------------------------------------- */}

                                    <div className="my-comment-header">

                                        <span>

                                            내가 댓글을 남긴 글

                                        </span>


                                        <span>

                                            {comment.createdAt}

                                        </span>

                                    </div>


                                    {/* -------------------------------------
                                        원본 게시글 제목
                                    ------------------------------------- */}

                                    <h3>

                                        {comment.postTitle}

                                    </h3>


                                    {/* -------------------------------------
                                        내가 작성한 댓글
                                    ------------------------------------- */}

                                    <p>

                                        {comment.content}

                                    </p>


                                    {/* -------------------------------------
                                        화살표
                                    ------------------------------------- */}

                                    <span className="my-comment-arrow">

                                        ›

                                    </span>


                                </button>

                            ))}

                        </div>

                    )}

                </section>

            )}


            {/* =================================================
                공통 하단 네비게이션
            ================================================= */}

            <BottomNav />

        </div>

    );

}


export default MyPostComment;