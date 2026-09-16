import { useEffect, useMemo, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import communityPosts from "./JS/communityPosts";
import "./CSS/Community.css";

const boards = [
  { id: "free", name: "자유게시판" },
  { id: "sports", name: "종목별게시판" },
  { id: "recruit", name: "홍보·회원구인" },
  { id: "notice", name: "공지사항" },
];

const POSTS_PER_PAGE = 10;

function Community() {
  const navigate = useNavigate();

  // 기본 게시판 = 자유게시판
  const [selectedBoard, setSelectedBoard] = useState("free");

  // 정렬
  const [sortType, setSortType] = useState("latest");

  // 검색할 게시판
  const [searchBoard, setSearchBoard] = useState("free");

  // 검색 범위
  const [searchType, setSearchType] = useState("title");

  // 검색창 입력값
  const [searchInput, setSearchInput] = useState("");

  // 실제 검색에 사용할 값
  const [searchKeyword, setSearchKeyword] = useState("");

  // 현재 페이지
  const [currentPage, setCurrentPage] = useState(1);

  // 백엔드 권한 API 연결 전에는 제한 게시판 작성 권한을 잠금 처리
  // 이후 관리자 여부 / 운영진 동호회 보유 여부 API 결과로 교체
  const canWriteNotice = false;
  const canWriteRecruit = false;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBoard, sortType, searchKeyword, searchType]);

  // =========================
  // 게시판 변경
  // =========================
  const handleBoardChange = (boardId) => {
    setSelectedBoard(boardId);
    setSearchBoard(boardId);
    setSearchInput("");
    setSearchKeyword("");
  };

  // =========================
  // 새 게시글
  // =========================
  const handleWritePost = () => {
    if (selectedBoard === "notice" && !canWriteNotice) {
      alert(
        "공지사항은 관리자만 작성할 수 있습니다.\n백엔드 권한 확인 연결 후 관리자 계정에서 활성화됩니다."
      );
      return;
    }

    if (selectedBoard === "recruit" && !canWriteRecruit) {
      alert(
        "홍보·회원구인 글은 동호회 운영진만 작성할 수 있습니다.\n백엔드 권한 확인 연결 후 운영진 계정에서 활성화됩니다."
      );
      return;
    }

    navigate("/community/write", {
      state: {
        board: selectedBoard,
        canWriteNotice,
        canWriteRecruit,
      },
    });
  };

  // =========================
  // 검색
  // =========================
  const handleSearch = () => {
    setSelectedBoard(searchBoard);
    setSearchKeyword(searchInput.trim());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // =========================
  // 게시글 필터 + 정렬
  // =========================
  const visiblePosts = useMemo(() => {
    let result = communityPosts.filter(
      (post) => post.board === selectedBoard
    );

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();

      result = result.filter((post) => {
        if (searchType === "title") {
          return post.title.toLowerCase().includes(keyword);
        }

        if (searchType === "content") {
          return post.content.toLowerCase().includes(keyword);
        }

        if (searchType === "titleContent") {
          return (
            post.title.toLowerCase().includes(keyword) ||
            post.content.toLowerCase().includes(keyword)
          );
        }

        return true;
      });
    }

    result = [...result];

    if (sortType === "latest") {
      result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }

    if (sortType === "views") {
      result.sort((a, b) => b.views - a.views);
    }

    if (sortType === "comments") {
      result.sort((a, b) => b.comments - a.comments);
    }

    return result;
  }, [selectedBoard, sortType, searchKeyword, searchType]);

  // =========================
  // 페이지네이션
  // =========================
  const totalPages = Math.ceil(
    visiblePosts.length / POSTS_PER_PAGE
  );

  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;

  const paginatedPosts = visiblePosts.slice(
    startIndex,
    startIndex + POSTS_PER_PAGE
  );

  const getVisiblePages = () => {
    if (totalPages <= 3) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      );
    }

    let startPage = currentPage - 1;

    if (currentPage <= 2) {
      startPage = 1;
    }

    if (currentPage >= totalPages - 1) {
      startPage = totalPages - 2;
    }

    return [startPage, startPage + 1, startPage + 2];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="community-container">
      {/* 상단 */}
      <header className="community-header">
        <h1>소통하기</h1>

        <button
          type="button"
          className="community-notification-btn"
          aria-label="알림"
          onClick={() => {
            alert("알림 기능 연결 예정입니다.");
          }}
        >
          <FiBell />
        </button>
      </header>

      <main className="community-main">
        {/* 게시판 선택 */}
        <nav className="community-board-tabs">
          {boards.map((board) => (
            <button
              key={board.id}
              type="button"
              className={
                selectedBoard === board.id
                  ? "community-board-tab active"
                  : "community-board-tab"
              }
              onClick={() => handleBoardChange(board.id)}
            >
              {board.name}
            </button>
          ))}
        </nav>

        <section className="community-board-section">
          {/* 정렬 + 새 게시글 */}
          <div className="community-list-tools">
            <div className="community-sort">
              <button
                type="button"
                className={sortType === "latest" ? "active" : ""}
                onClick={() => setSortType("latest")}
              >
                최신순
              </button>

              <button
                type="button"
                className={sortType === "views" ? "active" : ""}
                onClick={() => setSortType("views")}
              >
                조회수순
              </button>

              <button
                type="button"
                className={sortType === "comments" ? "active" : ""}
                onClick={() => setSortType("comments")}
              >
                댓글순
              </button>
            </div>

            <button
              type="button"
              className="community-write-btn"
              onClick={handleWritePost}
            >
              새 게시글
            </button>
          </div>

          {/* 검색 */}
          <div className="community-search">
            <select
              value={searchBoard}
              onChange={(e) => setSearchBoard(e.target.value)}
            >
              {boards.map((board) => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </select>

            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="title">제목</option>
              <option value="content">내용</option>
              <option value="titleContent">제목+내용</option>
            </select>

            <input
              type="text"
              placeholder="검색어를 입력하세요"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />

            <button type="button" onClick={handleSearch}>
              검색
            </button>
          </div>

          {/* 게시글 목록 */}
          <div className="community-post-list">
            {visiblePosts.length === 0 ? (
              <p>게시글이 없습니다.</p>
            ) : (
              paginatedPosts.map((post) => (
                <article
                  key={post.id}
                  className="community-post-item"
                  onClick={() =>
                    navigate(`/community/post/${post.id}`)
                  }
                >
                  <h3>{post.title}</h3>

                  <div className="community-post-info">
                    <span>{post.author}</span>
                    <span>{post.createdAt}</span>
                    <span>조회 {post.views}</span>
                    <span>댓글 {post.comments}</span>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 0 && (
            <div className="community-pagination">
              <button
                type="button"
                className="pagination-arrow"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                &lt;
              </button>

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={
                    currentPage === pageNumber
                      ? "pagination-number active"
                      : "pagination-number"
                  }
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              {!visiblePages.includes(totalPages) && (
                <>
                  {totalPages -
                    visiblePages[visiblePages.length - 1] >
                    1 && (
                    <span className="pagination-ellipsis">...</span>
                  )}

                  <button
                    type="button"
                    className={
                      currentPage === totalPages
                        ? "pagination-number active"
                        : "pagination-number"
                    }
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                type="button"
                className="pagination-arrow"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export default Community;
