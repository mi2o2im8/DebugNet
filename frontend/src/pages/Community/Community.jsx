import { useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import { supabase } from "../../../supabaseClient";
import "./CSS/Community.css";

const boards = [
  { id: "free", name: "자유게시판" },
  { id: "sports", name: "종목별게시판" },
  { id: "recruit", name: "홍보·회원구인" },
  { id: "notice", name: "공지사항" },
];

const formatDateTime = (dateString) => {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  const hours =
    String(
      date.getHours()
    ).padStart(2, "0");

  const minutes =
    String(
      date.getMinutes()
    ).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const POSTS_PER_PAGE = 10;

function Community() {
  const navigate = useNavigate();

  // 기본 게시판 = 자유게시판
  const [selectedBoard, setSelectedBoard] = useState("free");

  // 정렬
  const [sortType, setSortType] = useState("latest");

  // 종목별게시판에서 선택한 종목
  // null = 전체 종목
  const [selectedSportId, setSelectedSportId] =
    useState(null);

  // 실제 종목 목록
  const [sports, setSports] =
    useState([]);

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

  // 백엔드에서 받아온 게시글
  const [posts, setPosts] = useState([]);

  // 백엔드에서 받아온 전체 페이지 수
  const [totalPages, setTotalPages] = useState(0);

  // 목록 로딩 여부
  const [isLoading, setIsLoading] = useState(false);

  // 목록 조회 오류
  const [listError, setListError] = useState("");


  // =========================
  // 종목 목록 불러오기
  // =========================
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
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
          throw new Error(
            "종목 목록을 불러오지 못했습니다."
          );
        }

        const data =
          await response.json();

        setSports(
          data.sports || []
        );

      } catch (error) {
        console.error(
          "종목 목록 조회 오류:",
          error
        );
      }
    };

    fetchSports();

  }, []);


  // =========================
  // 게시글 목록 API 조회
  // =========================
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setListError("");

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

        // GET /api/posts Query 생성
        const params = new URLSearchParams({
          board_type: selectedBoard,
          page: String(currentPage),
          size: String(POSTS_PER_PAGE),
          sort: sortType,
        });

        // 종목별게시판에서 특정 종목을 선택했을 때만
        if (
          selectedBoard === "sports" &&
          selectedSportId
        ) {
          params.set(
            "sport_id",
            String(selectedSportId)
          );
        }

        // 검색 중일 때만 검색 조건 추가
        if (searchKeyword) {
          params.set(
            "search_type",
            searchType
          );

          params.set(
            "keyword",
            searchKeyword
          );
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/posts?${params.toString()}`,
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
              "게시글 목록을 불러오지 못했습니다."
          );
        }

        const data =
          await response.json();

        setPosts(
          data.items || []
        );

        setTotalPages(
          data.totalPages || 0
        );

      } catch (error) {
        console.error(
          "게시글 목록 조회 오류:",
          error
        );

        setPosts([]);
        setTotalPages(0);

        setListError(
          error.message ||
            "게시글 목록을 불러오지 못했습니다."
        );

      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();

  }, [
    selectedBoard,
    selectedSportId,
    currentPage,
    sortType,
    searchKeyword,
    searchType,
    navigate,
  ]);

  // =========================
  // 게시판 변경
  // =========================
  const handleBoardChange = (boardId) => {
    setSelectedBoard(boardId);
    setSearchBoard(boardId);
    setSearchInput("");
    setSearchKeyword("");
    setSelectedSportId(null);
    setCurrentPage(1);
  };

  // =========================
  // 새 게시글
  // =========================
  const handleWritePost = () => {
    navigate("/community/write", {
      state: {
        board: selectedBoard,
      },
    });
  };





  // =========================
  // 정렬 변경
  // =========================
  const handleSortChange = (
    nextSortType
  ) => {
    setSortType(nextSortType);
    setCurrentPage(1);
  };


  // =========================
  // 검색
  // =========================
  const handleSearch = () => {
    setSelectedBoard(searchBoard);
    setSearchKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };


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

          {/* =========================
                      종목별게시판 종목 탭
                  ========================= */}
                  {selectedBoard === "sports" && (

                    <div className="community-sport-tabs">

                      {/* 전체 종목 */}
                      <button
                        type="button"
                        className={
                          selectedSportId === null
                            ? "community-sport-tab active"
                            : "community-sport-tab"
                        }
                        onClick={() => {
                          setSelectedSportId(null);
                          setCurrentPage(1);
                        }}
                      >
                        전체
                      </button>


                      {/* 실제 종목 목록 */}
                      {sports.map((sport) => (

                        <button
                          key={sport.sport_id}
                          type="button"
                          className={
                            selectedSportId === sport.sport_id
                              ? "community-sport-tab active"
                              : "community-sport-tab"
                          }
                          onClick={() => {
                            setSelectedSportId(
                              sport.sport_id
                            );

                            setCurrentPage(1);
                          }}
                        >
                          {sport.sport_name}
                        </button>

                      ))}

                    </div>

                  )}


        <section className="community-board-section">



          {/* 정렬 + 새 게시글 */}
          <div className="community-list-tools">
            <div className="community-sort">
              <button
                type="button"
                className={sortType === "latest" ? "active" : ""}
                onClick={() => handleSortChange("latest")}
              >
                최신순
              </button>

              <button
                type="button"
                className={sortType === "views" ? "active" : ""}
                onClick={() => handleSortChange("views")}
              >
                조회수순
              </button>

              <button
                type="button"
                className={sortType === "comments" ? "active" : ""}
                onClick={() => handleSortChange("comments")}
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

          <div className="community-post-list">

            {isLoading ? (

              <p>
                게시글을 불러오는 중입니다.
              </p>

            ) : listError ? (

              <p>
                {listError}
              </p>

            ) : posts.length === 0 ? (

              <p>
                게시글이 없습니다.
              </p>

            ) : (

              posts.map((post) => (

                <article
                  key={post.id}
                  className="community-post-item"
                  onClick={() =>
                    navigate(
                      `/community/post/${post.id}`
                    )
                  }
                >

                  <h3>
                    {post.title}
                  </h3>

                  <div className="community-post-info">

                    <span>
                      {post.author}
                    </span>

                    <span>
                      {formatDateTime(
                        post.createdAt
                      )}
                    </span>

                    <span>
                      조회 {post.views}
                    </span>

                    <span>
                      댓글 {post.comments}
                    </span>

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
