// 내가 쓴 글 / 댓글 모음 페이지

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";

import "./MyPostComment.css";


// ⭐ 임시 데이터
// 실제 백엔드 연결 전 화면 확인용
const myPosts = [
    {
        postId: 1,
        title: "이번 주말 축구 같이 하실 분!",
        content:
            "토요일 오후 3시에 강서구에서 축구하실 분 구합니다.",
        createdAt: "2026.09.22",
        commentCount: 3,
    },
    {
        postId: 2,
        title: "풋살 동호회 추천해주세요",
        content:
            "강서구 근처 풋살 동호회 추천 부탁드립니다.",
        createdAt: "2026.09.20",
        commentCount: 5,
    },
];


const myComments = [
    {
        commentId: 1,
        postId: 1,
        postTitle: "이번 주말 축구 같이 하실 분!",
        content: "저도 참여하고 싶어요!",
        createdAt: "2026.09.22",
    },
    {
        commentId: 2,
        postId: 2,
        postTitle: "풋살 동호회 추천해주세요",
        content: "강서구 쪽이면 여기 한번 찾아보세요.",
        createdAt: "2026.09.21",
    },
];


function MyPostComment() {

    const navigate = useNavigate();

    // ⭐ 현재 탭
    const [activeTab, setActiveTab] = useState("posts");


    // =========================================================
    // ⭐ 게시글 상세 이동
    // =========================================================

    const handlePostClick = (postId) => {

        navigate(`/board/${postId}`);
    };


    // =========================================================
    // ⭐ 댓글이 달린 게시글 상세 이동
    // =========================================================

    const handleCommentClick = (postId) => {

        navigate(`/board/${postId}`);
    };


    return (

        <div className="my-post-comment-page">

            {/* ⭐ 뒤로가기 */}
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
                    onClick={() => setActiveTab("posts")}
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
                    onClick={() => setActiveTab("comments")}
                >
                    내가 쓴 댓글
                </button>

            </div>


            {/* =================================================
                내가 쓴 글
            ================================================= */}

            {activeTab === "posts" && (

                <section className="my-post-comment-section">

                    <div className="my-post-comment-count">
                        내가 작성한 글 {myPosts.length}
                    </div>


                    {myPosts.length === 0 ? (

                        <div className="my-post-comment-empty">
                            작성한 글이 없습니다.
                        </div>

                    ) : (

                        <div className="my-post-list">

                            {myPosts.map((post) => (

                                <button
                                    key={post.postId}
                                    type="button"
                                    className="my-post-card"
                                    onClick={() =>
                                        handlePostClick(post.postId)
                                    }
                                >

                                    <div className="my-post-top">

                                        <h3>
                                            {post.title}
                                        </h3>

                                        <span>
                                            {post.createdAt}
                                        </span>

                                    </div>


                                    <p className="my-post-content">
                                        {post.content}
                                    </p>


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

                    <div className="my-post-comment-count">
                        내가 작성한 댓글 {myComments.length}
                    </div>


                    {myComments.length === 0 ? (

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

                                    <div className="my-comment-header">

                                        <span>
                                            내가 댓글을 남긴 글
                                        </span>

                                        <span>
                                            {comment.createdAt}
                                        </span>

                                    </div>


                                    <h3>
                                        {comment.postTitle}
                                    </h3>


                                    <p>
                                        {comment.content}
                                    </p>


                                    <span className="my-comment-arrow">
                                        ›
                                    </span>

                                </button>

                            ))}

                        </div>

                    )}

                </section>

            )}


            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}


export default MyPostComment;
