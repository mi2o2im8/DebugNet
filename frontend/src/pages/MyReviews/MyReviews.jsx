// 경기 후기 모아보기 페이지
//
// 운영자: 내가 운영하는 모든 동호회의 팀매칭 후기를 한곳에서 확인
//         (작성할 후기 / 작성한 후기 / 받은 후기)
// 멤버:   후기는 운영진 전용이라 안내만 표시
//
// ※ 팀원이 만든 팀매칭 API(getMatchManagementMatches)를
//   import만 해서 사용한다. matchApi.js는 수정하지 않음.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";

// ⭐ API
import { authenticatedRequest } from "../../api/apiClient";
import { getMatchManagementMatches } from "../Match/api/matchApi";

import "./MyReviews.css";


/* ========================================
   ⭐ 동호회별 색상 (달력 페이지와 같은 팔레트)
   ======================================== */

const CLUB_COLORS = [
    "#01a17f",
    "#5b8def",
    "#f2994a",
    "#bb6bd9",
    "#eb5757",
    "#27aeb9",
];


/* ========================================
   ⭐ 탭
   ======================================== */

const TABS = [
    { key: "todo", label: "작성할 후기" },
    { key: "written", label: "작성한 후기" },
    { key: "received", label: "받은 후기" },
];

const EMPTY_MESSAGES = {
    todo: "후기를 남길 경기가 없어요.",
    written: "아직 작성한 후기가 없어요.",
    received: "아직 받은 후기가 없어요.",
};


/* ========================================
   ⭐ 날짜 표시 ("2026-09-27" → "9월 27일 (일)")
   ======================================== */

const formatDateLabel = (dateString) => {

    if (!dateString) return "";

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    const weekday = ["일", "월", "화", "수", "목", "금", "토"][
        new Date(year, month - 1, day).getDay()
    ];

    return `${month}월 ${day}일 (${weekday})`;
};


/* ========================================
   ⭐ /api/clubs/my → 운영 / 멤버 동호회 분리
   ======================================== */

const splitMyClubs = (clubData) => {

    const operatingClubs = clubData?.operating_clubs ?? [];

    const operatingIds = new Set(
        operatingClubs.map((club) => club.club_id)
    );

    const memberClubs = (clubData?.joined_clubs ?? []).filter(
        (club) => !operatingIds.has(club.club_id)
    );

    return { operatingClubs, memberClubs };
};


/* ========================================
   ⭐ 운영 동호회 하나의 후기 데이터 가져오기
   ======================================== */

const fetchClubReviewData = async (club) => {

    const [history, written, received] = await Promise.all([
        getMatchManagementMatches(club.club_id, "history"),
        getMatchManagementMatches(club.club_id, "writtenReviews"),
        getMatchManagementMatches(club.club_id, "receivedReviews"),
    ]);

    // 각 항목에 "내 동호회" 정보 붙이기
    const withMyClub = (items) =>
        (items ?? []).map((item) => ({
            ...item,
            myClubId: club.club_id,
            myClubName: club.club_name,
        }));

    return {
        // 지난 경기 중 아직 후기를 안 쓴 경기
        todo: withMyClub(
            history.items.filter((item) => !item.hasWrittenReview)
        ),
        written: withMyClub(written.items),
        received: withMyClub(received.items),
    };
};


/* ========================================
   ⭐ 카드 오른쪽 버튼 + 이동 경로
   ======================================== */

const getCardAction = (tab, item) => {

    const base = `/clubs/${item.myClubId}/matches/${item.clubMatchId}`;

    if (tab === "written") {
        return {
            text: "보기",
            className: "view",
            path: `${base}/review-detail?type=written`,
        };
    }

    if (tab === "received") {
        return {
            text: "보기",
            className: "view",
            path: `${base}/review-detail?type=received`,
        };
    }

    // 작성할 후기: 결과가 확정돼야 후기 작성 가능
    if (item.recordStatus === "COMPLETED") {
        return {
            text: "후기 쓰기",
            className: "write",
            path: `${base}/review`,
        };
    }

    // 결과 입력/확인이 먼저 필요한 경기 → 매칭 상세
    return {
        text: "기록 먼저",
        className: "record",
        path: base,
    };
};


function MyReviews() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 상태
    // =========================================================
    const [activeTab, setActiveTab] = useState("todo");

    const [operatingClubs, setOperatingClubs] = useState([]);
    const [memberClubs, setMemberClubs] = useState([]);

    const [reviewData, setReviewData] = useState({
        todo: [],
        written: [],
        received: [],
    });

    // 일부 동호회 조회가 실패했을 때 이름 표시용
    const [failedClubNames, setFailedClubNames] = useState([]);

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");


    // =========================================================
    // ⭐ 데이터 불러오기
    // =========================================================
    useEffect(() => {

        let ignore = false;

        const fetchAll = async () => {

            try {

                setLoading(true);
                setErrorMessage("");

                // 1. 내 동호회 (운영 / 멤버)
                const clubData = await authenticatedRequest(
                    "/api/clubs/my",
                    { method: "GET" }
                );

                if (ignore) return;

                const split = splitMyClubs(clubData);

                setOperatingClubs(split.operatingClubs);
                setMemberClubs(split.memberClubs);

                // 2. 운영 동호회마다 후기 데이터
                //    한 동호회가 실패해도 나머지는 보여준다
                const results = await Promise.allSettled(
                    split.operatingClubs.map(fetchClubReviewData)
                );

                if (ignore) return;

                const merged = { todo: [], written: [], received: [] };
                const failed = [];

                results.forEach((result, index) => {

                    if (result.status === "fulfilled") {
                        merged.todo.push(...result.value.todo);
                        merged.written.push(...result.value.written);
                        merged.received.push(...result.value.received);
                    } else {
                        console.error(
                            "후기 조회 실패:",
                            split.operatingClubs[index]?.club_name,
                            result.reason
                        );
                        failed.push(split.operatingClubs[index]?.club_name);
                    }
                });

                // 작성할 후기: 오래된 경기부터 (먼저 처리할 것)
                merged.todo.sort((a, b) =>
                    String(a.matchDate).localeCompare(String(b.matchDate))
                );

                // 작성한 / 받은 후기: 최신 경기부터
                const newestFirst = (a, b) =>
                    String(b.matchDate).localeCompare(String(a.matchDate));

                merged.written.sort(newestFirst);
                merged.received.sort(newestFirst);

                setReviewData(merged);
                setFailedClubNames(failed.filter(Boolean));

            } catch (error) {

                if (ignore) return;

                console.error("경기 후기 페이지 조회 오류:", error);
                setErrorMessage(error.message);

            } finally {

                if (!ignore) setLoading(false);

            }
        };

        fetchAll();

        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // ⭐ 운영 동호회 id → 색상
    // =========================================================
    const colorByClubId = useMemo(() => {

        const map = {};

        operatingClubs.forEach((club, index) => {
            map[club.club_id] = CLUB_COLORS[index % CLUB_COLORS.length];
        });

        return map;

    }, [operatingClubs]);


    const isOperator = operatingClubs.length > 0;
    const visibleItems = reviewData[activeTab] ?? [];


    // =========================================================
    // ⭐ 화면
    // =========================================================
    return (
        <div className="my-reviews-page">

            {/* ⭐ 헤더 */}
            <div className="my-reviews-header">
                <BackButton
                    className="my-reviews-back-btn"
                    aria-label="뒤로가기"
                />

                <h2 className="my-reviews-title">
                    경기 후기
                </h2>
            </div>


            {loading ? (

                <p className="my-reviews-message">
                    후기를 불러오는 중...
                </p>

            ) : errorMessage ? (

                <p className="my-reviews-message">
                    후기를 불러오지 못했습니다.
                    <br />
                    {errorMessage}
                </p>

            ) : (

                <>
                    {/* ========================================
                       ⭐ 운영자 영역
                       ======================================== */}

                    {isOperator && (
                        <section className="my-reviews-operator">

                            {/* 탭 */}
                            <div
                                className="my-reviews-tabs"
                                role="tablist"
                            >
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === tab.key}
                                        className={
                                            activeTab === tab.key
                                                ? "my-reviews-tab active"
                                                : "my-reviews-tab"
                                        }
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        {tab.label}
                                        <span className="my-reviews-tab-count">
                                            {reviewData[tab.key].length}
                                        </span>
                                    </button>
                                ))}
                            </div>


                            {/* 일부 동호회 조회 실패 안내 */}
                            {failedClubNames.length > 0 && (
                                <p className="my-reviews-warning">
                                    {failedClubNames.join(", ")}의 후기를
                                    불러오지 못했어요. 잠시 후 다시 시도해주세요.
                                </p>
                            )}


                            {/* 목록 */}
                            {visibleItems.length === 0 ? (

                                <p className="my-reviews-message">
                                    {EMPTY_MESSAGES[activeTab]}
                                </p>

                            ) : (

                                <ul className="my-reviews-list">
                                    {visibleItems.map((item) => {

                                        const action = getCardAction(activeTab, item);
                                        const clubColor = colorByClubId[item.myClubId];

                                        return (
                                            <li key={`${item.myClubId}-${item.clubMatchId}`}>
                                                <button
                                                    type="button"
                                                    className="my-reviews-card"
                                                    style={{ borderLeftColor: clubColor }}
                                                    onClick={() => navigate(action.path)}
                                                >

                                                    {/* 상대 동호회 대표 이미지 (없으면 이름 첫 글자) */}
                                                    {item.opponentClubProfileImage ? (
                                                        <img
                                                            className="my-reviews-thumb"
                                                            src={item.opponentClubProfileImage}
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <span
                                                            className="my-reviews-thumb placeholder"
                                                            aria-hidden="true"
                                                        >
                                                            {item.opponentClubName?.slice(0, 1)}
                                                        </span>
                                                    )}

                                                    <span className="my-reviews-info">

                                                        <span className="my-reviews-opponent">
                                                            vs {item.opponentClubName}
                                                        </span>

                                                        <span className="my-reviews-meta">
                                                            {formatDateLabel(item.matchDate)}
                                                            {item.sportName && `, ${item.sportName}`}
                                                        </span>

                                                        <span
                                                            className="my-reviews-club"
                                                            style={{ color: clubColor }}
                                                        >
                                                            {item.myClubName}
                                                        </span>

                                                    </span>

                                                    <span
                                                        className={`my-reviews-action ${action.className}`}
                                                    >
                                                        {action.text}
                                                    </span>

                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                            )}

                        </section>
                    )}


                    {/* ========================================
                       ⭐ 멤버 영역
                       ======================================== */}

                    {memberClubs.length > 0 && (
                        <section className="my-reviews-member">

                            <h3 className="my-reviews-member-title">
                                멤버로 활동 중인 동호회
                            </h3>

                            <p className="my-reviews-member-desc">
                                팀매칭 경기 후기는 각 동호회의 운영진이 작성하고 확인해요.
                            </p>

                            <ul className="my-reviews-member-list">
                                {memberClubs.map((club) => (
                                    <li key={club.club_id}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/clubs/${club.club_id}`)}
                                        >
                                            <span>{club.club_name}</span>
                                            <span className="my-reviews-member-sport">
                                                {club.sport_name || ""}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>

                        </section>
                    )}


                    {/* ⭐ 가입한 동호회가 하나도 없을 때 */}
                    {!isOperator && memberClubs.length === 0 && (
                        <p className="my-reviews-message">
                            가입한 동호회가 없어요.
                            <br />
                            동호회에 가입하면 팀매칭 후기를 확인할 수 있어요.
                        </p>
                    )}
                </>

            )}


            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}


export default MyReviews;
