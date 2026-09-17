import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../supabaseClient";
import "./CSS/PostWrite.css";

function PostWrite() {
  const navigate = useNavigate();
  const location = useLocation();


  // 커뮤니티 화면에서 선택했던 게시판
  const receivedBoard = location.state?.board || "free";

  // 권한이 필요한 게시판을 직접 열었을 경우 안전하게 자유게시판으로 시작
  const initialBoard = receivedBoard;

  // 게시판
  const [boardType, setBoardType] = useState(initialBoard);

  // 제목
  const [title, setTitle] = useState("");

  // 내용
  const [content, setContent] = useState("");

  // 미리보기 여부
  const [showPreview, setShowPreview] = useState(false);

  // 종목별 게시판에서 선택한 종목의 sport_id 저장
  const [selectedSportId, setSelectedSportId] = useState(null);

  // 홍보·회원구인 게시판에서 선택한 동호회의 club_id 저장
  const [selectedClubId, setSelectedClubId] = useState(null);

  // 백엔드에서 받아온 종목 목록
  const [sports, setSports] =
    useState([]);

  // 내가 운영할 수 있는 동호회 목록
  const [managedClubs, setManagedClubs] =
    useState([]);

  // 홍보·회원구인 작성 권한
  const [canWriteRecruit, setCanWriteRecruit] =
    useState(false);

  // 공지사항 작성 권한
  const [canWriteNotice, setCanWriteNotice] =
    useState(false);

  // 글쓰기 옵션 로딩 여부
  const [isLoadingOptions, setIsLoadingOptions] =
    useState(true);



  // =========================
  // 글쓰기 옵션 불러오기
  // =========================
  useEffect(() => {
    const fetchWriteOptions = async () => {
      setIsLoadingOptions(true);

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
          "http://127.0.0.1:8000/api/posts/write-options",
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
              "글쓰기 정보를 불러오지 못했습니다."
          );
        }

        const data =
          await response.json();

        setSports(
          data.sports || []
        );

        setManagedClubs(
          data.managedClubs || []
        );

        setCanWriteRecruit(
          data.canWriteRecruit === true
        );

        setCanWriteNotice(
          data.canWriteNotice === true
        );

      } catch (error) {
        console.error(
          "글쓰기 옵션 조회 오류:",
          error
        );

        alert(
          error.message ||
            "글쓰기 정보를 불러오지 못했습니다."
        );

      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchWriteOptions();

  }, [navigate]);

  // =========================
  // 게시판 변경
  // =========================
  const handleBoardTypeChange = (e) => {
    const newBoardType = e.target.value;

    setBoardType(newBoardType);
    setSelectedSportId(null);
    setSelectedClubId(null);
    setShowPreview(false);
  };

  // =========================
  // 미리보기
  // =========================
  const handlePreview = () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setShowPreview(true);
  };


  // =========================
  // 게시글 등록
  // =========================
  const handleSubmit = async () => {

    // 글쓰기 옵션을 아직 불러오는 중
    if (isLoadingOptions) {
      alert("글쓰기 정보를 불러오는 중입니다.");
      return;
    }


    // 종목별 게시판
    if (
      boardType === "sports" &&
      !selectedSportId
    ) {
      alert("종목을 선택해주세요.");
      return;
    }


    // 홍보·회원구인 권한
    if (
      boardType === "recruit" &&
      !canWriteRecruit
    ) {
      alert(
        "홍보·회원구인 게시판은 동호회장 또는 운영진만 작성할 수 있습니다."
      );
      return;
    }


    // 홍보·회원구인 동호회 선택
    if (
      boardType === "recruit" &&
      !selectedClubId
    ) {
      alert("동호회를 선택해주세요.");
      return;
    }


    // 공지사항 권한
    if (
      boardType === "notice" &&
      !canWriteNotice
    ) {
      alert(
        "공지사항은 관리자만 작성할 수 있습니다."
      );
      return;
    }


    // 제목
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }


    // 내용
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }


    try {

      // 현재 로그인 세션
      const {
        data: { session },
      } = await supabase.auth.getSession();


      if (!session?.access_token) {
        navigate("/Login", {
          replace: true,
        });

        return;
      }


      // Backend Request
      const requestData = {
        board_type: boardType,

        sport_id:
          boardType === "sports"
            ? selectedSportId
            : null,

        club_id:
          boardType === "recruit"
            ? selectedClubId
            : null,

        title: title.trim(),

        content: content.trim(),
      };


      const response = await fetch(
        "http://127.0.0.1:8000/api/posts",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

          body: JSON.stringify(
            requestData
          ),
        }
      );


      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(() => null);


        throw new Error(
          errorData?.detail ||
            "게시글 등록에 실패했습니다."
        );
      }


      const data =
        await response.json();


      // 등록된 게시글 상세화면으로 이동
      navigate(
        `/community/post/${data.id}`,
        {
          replace: true,
        }
      );

    } catch (error) {

      console.error(
        "게시글 등록 오류:",
        error
      );


      alert(
        error.message ||
          "게시글 등록에 실패했습니다."
      );
    }
  };

  return (
    <div className="post-write-container">
      {/* 상단 */}
      <header className="post-write-header">
        <button
          type="button"
          className="post-write-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <h1>새 게시글</h1>
      </header>

      <main className="post-write-main">
        {/* 게시판 선택 */}
        <div className="post-write-field">
          <label htmlFor="board">게시판</label>

          <select
            id="board"
            value={boardType}
            onChange={handleBoardTypeChange}
          >
            <option value="free">자유게시판</option>
            <option value="sports">종목별게시판</option>
            <option value="recruit" disabled={!canWriteRecruit}>
              홍보·회원구인 (운영진만)
            </option>
            <option value="notice" disabled={!canWriteNotice}>
              공지사항 (관리자만)
            </option>
          </select>
        </div>

        {/* 종목별게시판일 때만 종목 선택 */}
        {boardType === "sports" && (
          <div className="post-write-field">
            <label htmlFor="sport">종목</label>

            <select
              id="sport"
              value={selectedSportId || ""}
              onChange={(e) =>
                setSelectedSportId(
                  Number(e.target.value)
                )
              }
              disabled={isLoadingOptions}
            >
              <option value="">
                종목을 선택해주세요.
              </option>

              {sports.map((sport) => (
                <option
                  key={sport.sport_id}
                  value={sport.sport_id}
                >
                  {sport.sport_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 홍보·회원구인 게시판일 때만 동호회 선택 */}
        {boardType === "recruit" && (
          <div className="post-write-field">
            <label htmlFor="club">동호회</label>

            <select
              id="club"
              value={selectedClubId || ""}
              onChange={(e) =>
                setSelectedClubId(
                  Number(e.target.value)
                )
              }
              disabled={
                isLoadingOptions ||
                !canWriteRecruit
              }
            >
              <option value="">
                {canWriteRecruit
                  ? "동호회를 선택해주세요."
                  : "운영 가능한 동호회가 없습니다."}
              </option>

              {managedClubs.map((club) => (
                <option
                  key={club.club_id}
                  value={club.club_id}
                >
                  {club.club_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 제목 */}
        <div className="post-write-field">
          <label htmlFor="postTitle">제목</label>

          <input
            id="postTitle"
            type="text"
            placeholder="제목을 입력해주세요."
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <span className="post-write-count">
            {title.length}/100
          </span>
        </div>

        {/* 내용 */}
        <div className="post-write-field">
          <label htmlFor="postContent">내용</label>

          <textarea
            id="postContent"
            placeholder="내용을 입력해주세요."
            maxLength={3000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <span className="post-write-count">
            {content.length}/3000
          </span>
        </div>

        {/* 버튼 */}
        <div className="post-write-actions">
          <button
            type="button"
            className="post-preview-btn"
            onClick={handlePreview}
          >
            미리보기
          </button>

          <button
            type="button"
            className="post-submit-btn"
            onClick={handleSubmit}
          >
            등록
          </button>
        </div>
      </main>

      {/* 게시글 미리보기 모달 */}
      {showPreview && (
        <div className="post-preview-overlay">
          <div className="post-preview-modal">
            <div className="post-preview-modal-header">
              <h2>게시글 미리보기</h2>

              <button
                type="button"
                className="post-preview-close"
                onClick={() => setShowPreview(false)}
              >
                ×
              </button>
            </div>

            <div className="post-preview-modal-body">
              <div className="post-preview-board">
                {boardType === "free"
                  ? "자유게시판"
                  : boardType === "sports"
                  ? "종목별게시판"
                  : boardType === "recruit"
                  ? "홍보·회원구인"
                  : "공지사항"}
              </div>

              <h3 className="post-preview-title">{title}</h3>

              <div className="post-preview-info">
                <span className="post-preview-author">나</span>
                <span>방금 전</span>
                <span>조회 0</span>
              </div>

              <div className="post-preview-divider" />

              <div className="post-preview-content">{content}</div>
            </div>

            <div className="post-preview-modal-footer">
              <button
                type="button"
                className="post-preview-submit"
                onClick={handleSubmit}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

export default PostWrite;
