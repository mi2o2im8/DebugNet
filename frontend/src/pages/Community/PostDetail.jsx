import { useEffect, useRef, useState } from "react";
import { FiMoreVertical, FiX } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import basicProfileImg from "../../assets/img/basic_profile_img.png";
import { supabase } from "../../../supabaseClient";

import "./CSS/PostDetail.css";


const formatDateTime = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};


const parsePostContent = (content) => {
  if (!content) {
    return [];
  }

  const parts = content.split(
    /(\[\[IMAGE:[^\]]+\]\])/g
  );

  return parts
    .filter((part) => part !== "")
    .map((part, index) => {
      const imageMatch = part.match(
        /^\[\[IMAGE:(.+)\]\]$/
      );

      if (imageMatch) {
        return {
          id: `image-${index}`,
          type: "image",
          imageUrl: imageMatch[1],
        };
      }

      return {
        id: `text-${index}`,
        type: "text",
        text: part,
      };
    });
};



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

  // StrictMode에서 같은 게시글 상세 API가
  // 연속으로 두 번 호출되는 것 방지
  const lastFetchedPostId = useRef(null);

  // 댓글 목록 중복 조회 방지
  const lastFetchedCommentsPostId =
    useRef(null);


  // =========================
  // 댓글 수정
  // =========================

  // 현재 수정 중인 댓글 ID
  const [editingCommentId, setEditingCommentId] =
    useState(null);

  // 수정할 댓글 내용
  const [editingCommentContent, setEditingCommentContent] =
    useState("");

  // 댓글 수정 요청 중 여부
  const [isUpdatingComment, setIsUpdatingComment] =
    useState(false);

  // =========================
  // 현재 게시글
  // =========================
  const [post, setPost] = useState(null);

  // 게시글 상세 로딩 여부
  const [isLoadingPost, setIsLoadingPost] =
    useState(true);

  // 게시글 상세 조회 오류
  const [postError, setPostError] =
    useState("");


  // 실제 댓글 목록
  const [comments, setComments] =
    useState([]);

  // 댓글 목록 로딩 여부
  const [isLoadingComments, setIsLoadingComments] =
    useState(true);

  // 댓글 목록 조회 오류
  const [commentsError, setCommentsError] =
    useState("");

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
  // 게시글 상세 API 조회
  // =========================
  useEffect(() => {
    // 같은 게시글을 이미 조회했다면
    // StrictMode의 두 번째 호출은 막음
    if (
      lastFetchedPostId.current === postId
    ) {
      return;
    }

    lastFetchedPostId.current = postId;
    const fetchPostDetail = async () => {
      setIsLoadingPost(true);
      setPostError("");

      try {
        // 현재 로그인 세션 가져오기
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          navigate("/Login", {
            replace: true,
          });

          return;
        }

        // 게시글 상세 요청
        const response = await fetch(
          `http://127.0.0.1:8000/api/posts/${postId}`,
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            errorData?.detail ||
              "게시글을 불러오지 못했습니다."
          );
        }

        const data =
          await response.json();

        setPost(data);

      } catch (error) {
        console.error(
          "게시글 상세 조회 오류:",
          error
        );

        setPost(null);

        setPostError(
          error.message ||
            "게시글을 불러오지 못했습니다."
        );

      } finally {
        setIsLoadingPost(false);
      }
    };

    fetchPostDetail();

  }, [postId, navigate]);


  // =========================
  // 댓글 목록 API 조회
  // =========================
  useEffect(() => {

    // StrictMode에서 같은 게시글 댓글
    // 중복 요청 방지
    if (
      lastFetchedCommentsPostId.current === postId
    ) {
      return;
    }

    lastFetchedCommentsPostId.current = postId;


    const fetchComments = async () => {
      setIsLoadingComments(true);
      setCommentsError("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();


        if (!session?.access_token) {
          navigate("/Login", {
            replace: true,
          });

          return;
        }


        const response = await fetch(
          `http://127.0.0.1:8000/api/posts/${postId}/comments`,
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );


        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            errorData?.detail ||
              "댓글을 불러오지 못했습니다."
          );
        }


        const data =
          await response.json();


        setComments(
          data.comments || []
        );

      } catch (error) {
        console.error(
          "댓글 목록 조회 오류:",
          error
        );

        setComments([]);

        setCommentsError(
          error.message ||
            "댓글을 불러오지 못했습니다."
        );

      } finally {
        setIsLoadingComments(false);
      }
    };


  fetchComments();

}, [postId, navigate]);



  // =========================
  // 게시글 삭제
  // =========================
  const handleDeletePost = async () => {
    const confirmed =
      window.confirm(
        "게시글을 삭제하시겠습니까?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        navigate("/Login", {
          replace: true,
        });

        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/posts/${post.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "게시글 삭제에 실패했습니다."
        );
      }

      setShowPostMenu(false);

      // 삭제 성공 후 커뮤니티 목록으로 이동
      navigate("/community", {
        replace: true,
      });

    } catch (error) {
      console.error(
        "게시글 삭제 오류:",
        error
      );

      alert(
        error.message ||
          "게시글 삭제에 실패했습니다."
      );
    }
  };



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
  const handleBlockUser = async (
    blockedUserId,
    nickname
  ) => {
    if (!blockedUserId) {
      alert("차단할 사용자 정보를 찾을 수 없습니다.");
      return;
    }

    const confirmed =
      window.confirm(
        `${nickname}님을 차단하시겠습니까?\n차단한 사용자의 게시글과 댓글은 보이지 않게 됩니다.`
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        navigate("/Login", {
          replace: true,
        });

        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8000/api/blocks",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            blocked_user_id:
              blockedUserId,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "사용자 차단에 실패했습니다."
        );
      }

      // 차단 성공 후 현재 화면에서도
      // 해당 사용자의 댓글 즉시 제거
      setComments((prevComments) =>
        prevComments.filter(
          (comment) =>
            comment.author_id !==
            blockedUserId
        )
      );

      setOpenCommentMenuId(null);

      alert(
        `${nickname}님을 차단했습니다.`
      );

    } catch (error) {
      console.error(
        "사용자 차단 오류:",
        error
      );

      alert(
        error.message ||
          "사용자 차단에 실패했습니다."
      );
    }
  };

    // =========================
    // 댓글 작성
    // =========================
    const handleCommentSubmit = async (e) => {
      e.preventDefault();

      const content =
        commentInput.trim();


      if (!content) {
        alert("댓글 내용을 입력해주세요.");
        return;
      }


      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();


        if (!session?.access_token) {
          navigate("/Login", {
            replace: true,
          });

          return;
        }


        const response = await fetch(
          `http://127.0.0.1:8000/api/posts/${postId}/comments`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              content: content,
            }),
          }
        );


        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            errorData?.detail ||
              "댓글 등록에 실패했습니다."
          );
        }


        const data =
          await response.json();


        // Backend에서 반환한 실제 댓글 추가
        setComments((prevComments) => [
          ...prevComments,
          data.comment,
        ]);


        // 게시글의 댓글 수 화면에서도 +1
        setPost((prevPost) => ({
          ...prevPost,
          comments:
            (prevPost.comments || 0) + 1,
        }));


        // 입력창 초기화
        setCommentInput("");

      } catch (error) {
        console.error(
          "댓글 등록 오류:",
          error
        );

        alert(
          error.message ||
            "댓글 등록에 실패했습니다."
        );
      }
    };


    // =========================
    // 댓글 수정 저장
    // =========================
    const handleUpdateComment = async (
      commentId
    ) => {
      const content =
        editingCommentContent.trim();


      if (!content) {
        alert("댓글 내용을 입력해주세요.");
        return;
      }


      if (content.length > 1000) {
        alert(
          "댓글은 최대 1000자까지 입력할 수 있습니다."
        );
        return;
      }


      setIsUpdatingComment(true);


      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();


        if (!session?.access_token) {
          navigate("/Login", {
            replace: true,
          });

          return;
        }


        const response = await fetch(
          `http://127.0.0.1:8000/api/comments/${commentId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              content: content,
            }),
          }
        );


        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);


          throw new Error(
            errorData?.detail ||
              "댓글 수정에 실패했습니다."
          );
        }


        const data =
          await response.json();


        // 화면의 댓글도 바로 수정
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  content: data.content,
                  updatedAt: data.updatedAt,
                }
              : comment
          )
        );


        // 수정 상태 종료
        setEditingCommentId(null);
        setEditingCommentContent("");

      } catch (error) {
        console.error(
          "댓글 수정 오류:",
          error
        );


        alert(
          error.message ||
            "댓글 수정에 실패했습니다."
        );

      } finally {
        setIsUpdatingComment(false);
      }
    };



    // =========================
    // 댓글 수정 시작
    // =========================
    const handleStartEditComment = (comment) => {
      setEditingCommentId(comment.id);

      setEditingCommentContent(
        comment.content
      );

      // ... 메뉴 닫기
      setOpenCommentMenuId(null);
    };


  // =========================
  // 댓글 수정 취소
  // =========================
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };




  // =========================
  // 댓글 삭제
  // =========================
  const handleDeleteComment = async (
    commentId
  ) => {
    const confirmed =
      window.confirm(
        "댓글을 삭제하시겠습니까?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        navigate("/Login", {
          replace: true,
        });

        return;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/comments/${commentId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
            "댓글 삭제에 실패했습니다."
        );
      }

      // 화면에서 삭제된 댓글 제거
      setComments((prevComments) =>
        prevComments.filter(
          (comment) =>
            comment.id !== commentId
        )
      );

      // 게시글 댓글 수 -1
      setPost((prevPost) => ({
        ...prevPost,
        comments: Math.max(
          (prevPost.comments || 0) - 1,
          0
        ),
      }));

      setOpenCommentMenuId(null);

    } catch (error) {
      console.error(
        "댓글 삭제 오류:",
        error
      );

      alert(
        error.message ||
          "댓글 삭제에 실패했습니다."
      );
    }
  };



  // =========================
  // 게시글 로딩 중
  // =========================
  if (isLoadingPost) {
    return (
      <div className="post-detail-container">

        <main className="post-not-found">
          <p>
            게시글을 불러오는 중입니다.
          </p>
        </main>

        <BottomNav />

      </div>
    );
  }


  // =========================
  // 게시글 조회 실패
  // =========================
  if (postError || !post) {
    return (
      <div className="post-detail-container">

        <main className="post-not-found">

          <h2>
            게시글을 불러올 수 없습니다.
          </h2>

          <p>
            {postError}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/community")
            }
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

                <span>{formatDateTime( post.createdAt )}</span>
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

                      {/* 게시글 수정 */}
                      <button
                        type="button"
                        className="edit-menu-btn"
                        onClick={() => {
                          setShowPostMenu(false);

                          navigate("/community/write", {
                            state: {
                              board: post.board,
                              editPost: post,
                            },
                          });
                        }}
                      >
                        수정하기
                      </button>


                      {/* 게시글 삭제 */}
                      <button
                        type="button"
                        className="delete-menu-btn"
                        onClick={handleDeletePost}
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
            {parsePostContent(post.content).map((block) => {
              if (block.type === "text") {
                return (
                  <div
                    key={block.id}
                    className="post-detail-text-block"
                  >
                    {block.text}
                  </div>
                );
              }

              if (block.type === "image") {
                return (
                  <img
                    key={block.id}
                    src={block.imageUrl}
                    alt="게시글 첨부 이미지"
                    className="post-detail-image"
                  />
                );
              }

              return null;
            })}
          </div>
        </article>

        {/* 댓글 */}
        <section className="post-comments-section">
          <div className="post-comments-header">
            <h3>댓글</h3>
            <span>{comments.length}</span>
          </div>

          {isLoadingComments ? (

            <div className="comment-empty">
              댓글을 불러오는 중입니다.
            </div>

          ) : commentsError ? (

            <div className="comment-empty">
              {commentsError}
            </div>

          ) : comments.length === 0 ? (

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

                        <span>{formatDateTime( comment.createdAt )}</span>
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

                            <>
                              {/* 댓글 수정 */}
                              <button
                                type="button"
                                className="edit-menu-btn"
                                onClick={() =>
                                  handleStartEditComment(
                                    comment
                                  )
                                }
                              >
                                수정하기
                              </button>


                              {/* 댓글 삭제 */}
                              <button
                                type="button"
                                className="delete-menu-btn"
                                onClick={() =>
                                  handleDeleteComment(
                                    comment.id
                                  )
                                }
                              >
                                댓글 삭제
                              </button>
                            </>
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

                  {editingCommentId === comment.id ? (

                    // =========================
                    // 댓글 수정 모드
                    // =========================
                    <div className="comment-edit-area">

                      <textarea
                        value={editingCommentContent}
                        maxLength={1000}
                        onChange={(e) =>
                          setEditingCommentContent(
                            e.target.value
                          )
                        }
                      />


                      <div className="comment-edit-bottom">

                        <span className="comment-edit-count">
                          {editingCommentContent.length}/1000
                        </span>


                        <div className="comment-edit-actions">

                          <button
                            type="button"
                            className="comment-edit-cancel-btn"
                            onClick={
                              handleCancelEditComment
                            }
                            disabled={
                              isUpdatingComment
                            }
                          >
                            취소
                          </button>


                          <button
                            type="button"
                            className="comment-edit-save-btn"
                            onClick={() =>
                              handleUpdateComment(
                                comment.id
                              )
                            }
                            disabled={
                              isUpdatingComment
                            }
                          >
                            {isUpdatingComment
                              ? "저장 중..."
                              : "저장"}
                          </button>

                        </div>

                      </div>

                    </div>

                  ) : (

                    // =========================
                    // 일반 댓글 표시
                    // =========================
                    <p className="comment-content">
                      {comment.content}
                    </p>

                  )}
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
