import { useEffect, useState } from "react";
import { FiMoreVertical, FiX } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import basicProfileImg from "../../assets/img/basic_profile_img.png";
import { supabase } from "../../../supabaseClient";

import communityComments from "./JS/communityComments";
import communityPosts from "./JS/communityPosts";
import "./CSS/PostDetail.css";

function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();

  // 현재 로그인 사용자 UUID
  const [currentUserId, setCurrentUserId] = useState(null);

  // 프로필 모달
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  // 게시글 / 댓글 메뉴
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);

  // 현재 게시글
  const post = communityPosts.find(
    (item) => item.id === Number(postId)
  );

  // 현재 게시글 댓글
  const initialComments = communityComments.filter(
    (comment) => comment.postId === Number(postId)
  );

  const [comments, setComments] = useState(initialComments);
  const [commentInput, setCommentInput] = useState("");

  // 백엔드 연결 후 실제 작성자 정보 사용
  const authorProfile = post?.author_profile || null;

  // 현재 사용자가 작성한 게시글인지 확인
  const isMyPost =
    currentUserId && post?.author_id === currentUserId;

  // =========================
  // 현재 로그인 사용자 가져오기
  // =========================
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);
    };

    getCurrentUser();
  }, []);

  // =========================
  // 프로필 모달 열기
  // 게시글 작성자 / 댓글 작성자 공통 사용
  // =========================
  const handleOpenProfile = (profile, nickname) => {
    setSelectedProfile({
      profile_image:
        profile?.profile_image || basicProfileImg,
      nickname:
        profile?.nickname || nickname || "사용자",
      bio: profile?.bio || null,
      sports: profile?.sports || [],
      regions: profile?.regions || [],
      trust_score: profile?.trust_score ?? null,
    });

    setShowProfileModal(true);
  };

  // =========================
  // 사용자 차단
  // =========================
  const handleBlockUser = (blockedUserId, nickname) => {
    const confirmed = window.confirm(
      `${nickname}님을 차단하시겠습니까?\n차단한 사용자의 게시글과 댓글은 보이지 않게 됩니다.`
    );

    if (!confirmed) {
      return;
    }

    // 현재 더미 데이터에는 author_id가 없을 수 있음
    if (!blockedUserId) {
      alert(
        "현재 더미 데이터에는 사용자 UUID가 없습니다.\n백엔드 연결 후 실제 차단됩니다."
      );
      setOpenCommentMenuId(null);
      return;
    }

    // 백엔드 연결 후 user_blocks 저장 API로 변경
    const requestData = {
      blocked_user_id: blockedUserId,
    };

    console.log("사용자 차단 요청:", requestData);
    alert(`${nickname}님 차단 요청이 준비되었습니다.`);
    setOpenCommentMenuId(null);
  };

  // =========================
  // 댓글 작성
  // =========================
  const handleCommentSubmit = (e) => {
    e.preventDefault();

    const content = commentInput.trim();

    if (!content) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    // 현재는 프론트 확인용 댓글
    // 백엔드 연결 후 POST API로 교체
    const newComment = {
      id: Date.now(),
      postId: Number(postId),
      author_id: currentUserId,
      author: "나",
      content,
      createdAt: "방금 전",
      author_profile: null,
    };

    setComments((prevComments) => [
      ...prevComments,
      newComment,
    ]);

    setCommentInput("");
  };

  // =========================
  // 존재하지 않는 게시글
  // =========================
  if (!post) {
    return (
      <div className="post-detail-container">
        <main className="post-not-found">
          <h2>존재하지 않는 게시글입니다.</h2>

          <button
            type="button"
            onClick={() => navigate("/community")}
          >
            커뮤니티로 돌아가기
          </button>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      {/* 상단 */}
      <header className="post-detail-header">
        <button
          type="button"
          className="post-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h1>게시글</h1>
      </header>

      <main className="post-detail-main">
        {/* 게시글 */}
        <article className="post-detail-post">
          <div className="post-detail-title-area">
            <h2>{post.title}</h2>

            <div className="post-detail-info-row">
              <div className="post-detail-info">
                {/* 작성자 프로필 */}
                <div className="post-detail-author">
                  <button
                    type="button"
                    className="post-detail-author-image-btn"
                    onClick={() =>
                      handleOpenProfile(
                        authorProfile,
                        post.author
                      )
                    }
                    aria-label="작성자 프로필 보기"
                  >
                    <img
                      src={
                        authorProfile?.profile_image ||
                        basicProfileImg
                      }
                      alt="작성자 프로필"
                      className="post-detail-author-image"
                    />
                  </button>

                  <span className="post-author">
                    {authorProfile?.nickname || post.author}
                  </span>
                </div>

                <span>{post.createdAt}</span>
                <span>조회 {post.views}</span>
              </div>

              {/* 내가 작성한 게시글일 때만 ... 메뉴 표시 */}
              {isMyPost && (
                <div className="post-menu-wrap">
                  <button
                    type="button"
                    className="post-more-btn"
                    onClick={() =>
                      setShowPostMenu(!showPostMenu)
                    }
                  >
                    <FiMoreVertical />
                  </button>

                  {showPostMenu && (
                    <div className="post-more-menu">
                      <button
                        type="button"
                        className="delete-menu-btn"
                        onClick={() => {
                          const confirmed = window.confirm(
                            "게시글을 삭제하시겠습니까?"
                          );

                          if (!confirmed) {
                            return;
                          }

                          setShowPostMenu(false);
                          alert(
                            "게시글 삭제 API 연결 후 실제 삭제됩니다."
                          );
                        }}
                      >
                        게시글 삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 게시글 본문 */}
          <div className="post-detail-content">
            <p>{post.content}</p>
          </div>
        </article>

        {/* 댓글 */}
        <section className="post-comments-section">
          <div className="post-comments-header">
            <h3>댓글</h3>
            <span>{comments.length}</span>
          </div>

          {comments.length === 0 ? (
            <div className="comment-empty">
              아직 댓글이 없습니다.
            </div>
          ) : (
            <div className="comment-list">
              {comments.map((comment) => (
                <article
                  key={comment.id}
                  className="comment-item"
                >
                  <div className="comment-top">
                    {/* 댓글 작성자 */}
                    <div className="comment-author-area">
                      <button
                        type="button"
                        className="comment-author-image-btn"
                        onClick={() =>
                          handleOpenProfile(
                            comment.author_profile,
                            comment.author
                          )
                        }
                        aria-label="댓글 작성자 프로필 보기"
                      >
                        <img
                          src={
                            comment.author_profile?.profile_image ||
                            basicProfileImg
                          }
                          alt="댓글 작성자 프로필"
                          className="comment-author-image"
                        />
                      </button>

                      <div className="comment-author-text">
                        <strong>
                          {comment.author_profile?.nickname ||
                            comment.author}
                        </strong>

                        <span>{comment.createdAt}</span>
                      </div>
                    </div>

                    {/* 댓글 ... 메뉴 */}
                    <div className="comment-menu-wrap">
                      <button
                        type="button"
                        className="comment-more-btn"
                        onClick={() =>
                          setOpenCommentMenuId(
                            openCommentMenuId === comment.id
                              ? null
                              : comment.id
                          )
                        }
                      >
                        <FiMoreVertical />
                      </button>

                      {openCommentMenuId === comment.id && (
                        <div className="comment-more-menu">
                          {currentUserId &&
                          comment.author_id === currentUserId ? (
                            <button
                              type="button"
                              className="delete-menu-btn"
                              onClick={() => {
                                const confirmed =
                                  window.confirm(
                                    "댓글을 삭제하시겠습니까?"
                                  );

                                if (!confirmed) {
                                  return;
                                }

                                setComments(
                                  comments.filter(
                                    (item) =>
                                      item.id !== comment.id
                                  )
                                );
                                setOpenCommentMenuId(null);
                              }}
                            >
                              댓글 삭제
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="block-menu-btn"
                              onClick={() =>
                                handleBlockUser(
                                  comment.author_id,
                                  comment.author_profile?.nickname ||
                                    comment.author
                                )
                              }
                            >
                              차단하기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="comment-content">
                    {comment.content}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* 댓글 작성 */}
          <form
            className="comment-form"
            onSubmit={handleCommentSubmit}
          >
            <input
              type="text"
              placeholder="댓글을 입력해주세요."
              value={commentInput}
              onChange={(e) =>
                setCommentInput(e.target.value)
              }
            />

            <button type="submit">등록</button>
          </form>
        </section>
      </main>

      {/* 공통 사용자 프로필 모달 */}
      {showProfileModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>프로필</h2>

              <button
                type="button"
                className="profile-modal-close"
                onClick={() => {
                  setShowProfileModal(false);
                  setSelectedProfile(null);
                }}
              >
                <FiX />
              </button>
            </div>

            <div className="profile-modal-body">
              <img
                src={
                  selectedProfile?.profile_image || basicProfileImg
                }
                alt="프로필"
                className="profile-modal-image"
              />

              <h3>
                {selectedProfile?.nickname || "사용자"}
              </h3>

              {selectedProfile?.bio && (
                <p className="profile-modal-bio">
                  {selectedProfile.bio}
                </p>
              )}

              {selectedProfile?.sports?.length > 0 && (
                <div className="profile-modal-info">
                  <strong>활동 종목</strong>
                  <span>
                    {selectedProfile.sports.join(", ")}
                  </span>
                </div>
              )}

              {selectedProfile?.regions?.length > 0 && (
                <div className="profile-modal-info">
                  <strong>활동 지역</strong>
                  <span>
                    {selectedProfile.regions.join(", ")}
                  </span>
                </div>
              )}

              {selectedProfile?.trust_score != null && (
                <div className="profile-modal-info">
                  <strong>신뢰 점수</strong>
                  <span>{selectedProfile.trust_score}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default PostDetail;
