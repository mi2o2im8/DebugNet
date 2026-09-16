import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import "./CSS/PostWrite.css";

function PostWrite() {
  const navigate = useNavigate();
  const location = useLocation();

  // 백엔드 권한 확인 연결 후 Community에서 전달하거나 API 결과로 교체
  const canWriteRecruit = location.state?.canWriteRecruit === true;
  const canWriteNotice = location.state?.canWriteNotice === true;

  // 커뮤니티 화면에서 선택했던 게시판
  const receivedBoard = location.state?.board || "free";

  // 권한이 필요한 게시판을 직접 열었을 경우 안전하게 자유게시판으로 시작
  const initialBoard =
    receivedBoard === "recruit" && !canWriteRecruit
      ? "free"
      : receivedBoard === "notice" && !canWriteNotice
      ? "free"
      : receivedBoard;

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
    if (boardType === "notice" && !canWriteNotice) {
      alert("공지사항은 관리자만 작성할 수 있습니다.");
      return;
    }

    if (boardType === "recruit" && !canWriteRecruit) {
      alert("홍보·회원구인 글은 동호회 운영진만 작성할 수 있습니다.");
      return;
    }

    if (boardType === "sports" && !selectedSportId) {
      alert("종목을 선택해주세요.");
      return;
    }

    if (boardType === "recruit" && !selectedClubId) {
      alert("동호회를 선택해주세요.");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    // 백엔드 posts 테이블에 맞춰 전송할 게시글 데이터
    const requestData = {
      board_type: boardType,
      sport_id: selectedSportId,
      club_id: selectedClubId,
      title: title.trim(),
      content: content.trim(),
    };

    console.log("게시글 등록 데이터:", requestData);

    alert("현재는 프론트 확인 단계입니다.");
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
                setSelectedSportId(Number(e.target.value))
              }
              disabled
            >
              <option value="">
                종목 목록은 백엔드 연결 후 불러옵니다.
              </option>
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
                setSelectedClubId(Number(e.target.value))
              }
              disabled
            >
              <option value="">
                운영 중인 동호회 목록은 백엔드 연결 후 불러옵니다.
              </option>
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
