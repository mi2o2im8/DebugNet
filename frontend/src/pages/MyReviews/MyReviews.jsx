// 경기 후기 모아보기 페이지
//
// 운영자: 내가 운영하는 모든 동호회의 팀매칭 후기를 한곳에서 확인
//         (작성할 후기 / 작성한 후기 / 받은 후기)
// 멤버:   후기는 운영진 전용이라 안내만 표시
// 게스트: 다른 동호회 일정에 게스트로 참여(확정)한 경기의
//         활동 후기를 이 페이지에서 바로 작성 / 확인
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
import { getMyGuestEvents } from "../../api/userApi";
import {
    createEventReview,
    getMyEventReview,
} from "../../api/clubApi";

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


/* ========================================
   ⭐ 게스트 경기: 활동이 끝났는지
   (서버 EventReviewService.is_event_finished 와 같은 기준:
    종료 시간이 지나야 후기 작성 가능)
   ======================================== */

const isGuestEventFinished = (event) => {

    if (!event?.event_date || !event?.end_time) return false;

    const [year, month, day] = String(event.event_date)
        .slice(0, 10)
        .split("-")
        .map(Number);

    const [hour, minute] = String(event.end_time)
        .split(":")
        .map(Number);

    const endAt = new Date(year, month - 1, day, hour || 0, minute || 0);

    return Date.now() >= endAt.getTime();
};


/* ========================================
   ⭐ 게스트로 참여한 경기 + 내 후기 가져오기
   ======================================== */

const fetchGuestReviewData = async () => {

    const data = await getMyGuestEvents();

    // 참여 확정(joined) + 이미 끝난 경기만
    const finishedEvents = (data?.events ?? []).filter(
        (event) =>
            event.guest_status === "joined" &&
            isGuestEventFinished(event)
    );

    // 경기마다 내가 쓴 후기가 있는지 확인
    // (하나가 실패해도 나머지는 보여준다 → 실패한 건 "작성 전"으로 표시)
    const reviewResults = await Promise.allSettled(
        finishedEvents.map((event) =>
            getMyEventReview(event.club_id, event.event_id)
        )
    );

    const items = finishedEvents.map((event, index) => {
        const result = reviewResults[index];

        return {
            ...event,
            myReview:
                result.status === "fulfilled"
                    ? result.value ?? null
                    : null,
        };
    });

    // 작성 전: 오래된 경기부터 / 작성 완료: 최신 경기부터
    const todo = items
        .filter((item) => !item.myReview)
        .sort((a, b) =>
            String(a.event_date).localeCompare(String(b.event_date))
        );

    const written = items
        .filter((item) => item.myReview)
        .sort((a, b) =>
            String(b.event_date).localeCompare(String(a.event_date))
        );

    return [...todo, ...written];
};


const REVIEW_MAX_LENGTH = 500;


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

    // 게스트로 참여한 (끝난) 경기
    const [guestItems, setGuestItems] = useState([]);
    const [guestErrorMessage, setGuestErrorMessage] = useState("");

    // 게스트 후기 팝업 ("write" 작성 / "view" 내 후기 보기)
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
                setGuestErrorMessage("");

                // 1. 내 동호회 (운영 / 멤버) + 게스트 경기 (동시에)
                //    게스트 조회가 실패해도 동호회 후기는 보여준다
                const [clubData, guestResult] = await Promise.all([
                    authenticatedRequest(
                        "/api/clubs/my",
                        { method: "GET" }
                    ),
                    fetchGuestReviewData().then(
                        (value) => ({ status: "fulfilled", value }),
                        (reason) => ({ status: "rejected", reason })
                    ),
                ]);

                if (ignore) return;

                if (guestResult.status === "fulfilled") {
                    setGuestItems(guestResult.value);
                } else {
                    console.error(
                        "게스트 경기 후기 조회 실패:",
                        guestResult.reason
                    );
                    setGuestItems([]);
                    setGuestErrorMessage(
                        "게스트로 참여한 경기를 불러오지 못했어요. 잠시 후 다시 시도해주세요."
                    );
                }

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

    const hasGuestSection =
        guestItems.length > 0 || Boolean(guestErrorMessage);

    const guestTodoCount = guestItems.filter(
        (item) => !item.myReview
    ).length;


    // =========================================================
    // ⭐ 게스트 후기 팝업 열기 / 닫기
    // =========================================================
    const openGuestReview = (item) => {

        if (item.myReview) {
            setReviewModal({ mode: "view", item });
            return;
        }

        setReviewRating(5);
        setReviewText("");
        setReviewModal({ mode: "write", item });
    };

    const closeGuestReview = () => {
        if (reviewSubmitting) return;
        setReviewModal(null);
    };


    // =========================================================
    // ⭐ 게스트 후기 저장
    // =========================================================
    const handleSubmitGuestReview = async () => {

        const item = reviewModal?.item;
        if (!item) return;

        const trimmedText = reviewText.trim();

        if (!reviewRating) {
            alert("별점을 선택해주세요.");
            return;
        }

        if (!trimmedText) {
            alert("후기 내용을 작성해주세요.");
            return;
        }

        setReviewSubmitting(true);

        try {

            const savedReview = await createEventReview(
                item.club_id,
                item.event_id,
                reviewRating,
                trimmedText
            );

            // 목록에서 "작성 완료"로 바꾸기
            setGuestItems((current) =>
                current.map((guestItem) =>
                    guestItem.event_id === item.event_id
                        ? {
                            ...guestItem,
                            myReview: savedReview ?? {
                                rating: reviewRating,
                                review_text: trimmedText,
                            },
                        }
                        : guestItem
                )
            );

            alert("후기가 등록되었습니다.");
            setReviewModal(null);

        } catch (error) {

            console.error("게스트 후기 등록 실패:", error);
            alert(error?.message || "후기 등록에 실패했습니다.");

        } finally {

            setReviewSubmitting(false);

        }
    };


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
                       ⭐ 게스트 영역
                       ======================================== */}

                    {hasGuestSection && (
                        <section className="my-reviews-guest">

                            <h3 className="my-reviews-guest-title">
                                게스트로 참여한 경기
                                {guestTodoCount > 0 && (
                                    <span className="my-reviews-guest-count">
                                        작성 전 {guestTodoCount}
                                    </span>
                                )}
                            </h3>

                            <p className="my-reviews-guest-desc">
                                다른 동호회 일정에 게스트로 참여한 경기는 활동 후기를 남길 수 있어요.
                            </p>

                            {guestErrorMessage && (
                                <p className="my-reviews-warning">
                                    {guestErrorMessage}
                                </p>
                            )}

                            {guestItems.length > 0 && (
                                <ul className="my-reviews-list">
                                    {guestItems.map((item) => (
                                        <li key={`guest-${item.event_id}`}>
                                            <button
                                                type="button"
                                                className="my-reviews-card guest"
                                                onClick={() => openGuestReview(item)}
                                            >

                                                {item.event_image_url ? (
                                                    <img
                                                        className="my-reviews-thumb"
                                                        src={item.event_image_url}
                                                        alt=""
                                                    />
                                                ) : (
                                                    <span
                                                        className="my-reviews-thumb placeholder guest"
                                                        aria-hidden="true"
                                                    >
                                                        {item.club_name?.slice(0, 1)}
                                                    </span>
                                                )}

                                                <span className="my-reviews-info">

                                                    <span className="my-reviews-opponent">
                                                        {item.title}
                                                    </span>

                                                    <span className="my-reviews-meta">
                                                        {formatDateLabel(item.event_date)}
                                                        {item.location && `, ${item.location}`}
                                                    </span>

                                                    <span className="my-reviews-club guest">
                                                        <span className="my-reviews-guest-badge">
                                                            게스트
                                                        </span>
                                                        {item.club_name}
                                                    </span>

                                                </span>

                                                <span
                                                    className={
                                                        item.myReview
                                                            ? "my-reviews-action view"
                                                            : "my-reviews-action write"
                                                    }
                                                >
                                                    {item.myReview ? "내 후기" : "후기 쓰기"}
                                                </span>

                                            </button>
                                        </li>
                                    ))}
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


                    {/* ⭐ 가입한 동호회도, 게스트로 참여한 경기도 없을 때 */}
                    {!isOperator && memberClubs.length === 0 && !hasGuestSection && (
                        <p className="my-reviews-message">
                            아직 확인할 경기 후기가 없어요.
                            <br />
                            동호회에 가입하거나 게스트로 경기에 참여하면
                            <br />
                            후기를 남기고 확인할 수 있어요.
                        </p>
                    )}
                </>

            )}


            {/* ========================================
               ⭐ 게스트 후기 팝업 (작성 / 내 후기 보기)
               ======================================== */}

            {reviewModal && (
                <div
                    className="my-reviews-modal-overlay"
                    onClick={closeGuestReview}
                >
                    <div
                        className="my-reviews-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="my-reviews-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <div className="my-reviews-modal-header">
                            <h3 id="my-reviews-modal-title">
                                {reviewModal.mode === "write"
                                    ? "활동 후기 작성"
                                    : "내가 쓴 후기"}
                            </h3>

                            <button
                                type="button"
                                className="my-reviews-modal-close"
                                aria-label="닫기"
                                onClick={closeGuestReview}
                                disabled={reviewSubmitting}
                            >
                                ×
                            </button>
                        </div>

                        <div className="my-reviews-modal-event">
                            <strong>{reviewModal.item.title}</strong>
                            <span>
                                {reviewModal.item.club_name}
                                {" · "}
                                {formatDateLabel(reviewModal.item.event_date)}
                            </span>
                        </div>

                        {reviewModal.mode === "write" ? (
                            <>
                                <div className="my-reviews-modal-rating">
                                    <p>이번 경기는 어땠나요?</p>

                                    <div className="my-reviews-stars">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                aria-label={`${star}점`}
                                                className={
                                                    star <= reviewRating
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() => setReviewRating(star)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>

                                    <span>{reviewRating}점</span>
                                </div>

                                <div className="my-reviews-modal-text">
                                    <textarea
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="게스트로 참여한 경기에 대한 후기를 남겨주세요."
                                        maxLength={REVIEW_MAX_LENGTH}
                                    />
                                    <small>
                                        {reviewText.length}/{REVIEW_MAX_LENGTH}
                                    </small>
                                </div>

                                <div className="my-reviews-modal-actions">
                                    <button
                                        type="button"
                                        onClick={closeGuestReview}
                                        disabled={reviewSubmitting}
                                    >
                                        취소
                                    </button>

                                    <button
                                        type="button"
                                        className="primary"
                                        onClick={handleSubmitGuestReview}
                                        disabled={reviewSubmitting}
                                    >
                                        {reviewSubmitting ? "등록 중..." : "후기 등록"}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="my-reviews-modal-rating">
                                    <div
                                        className="my-reviews-stars readonly"
                                        aria-label={`${reviewModal.item.myReview.rating ?? 0}점`}
                                    >
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                                key={star}
                                                className={
                                                    star <= (reviewModal.item.myReview.rating ?? 0)
                                                        ? "active"
                                                        : ""
                                                }
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>

                                    <span>{reviewModal.item.myReview.rating ?? 0}점</span>
                                </div>

                                <p className="my-reviews-modal-review">
                                    {reviewModal.item.myReview.review_text}
                                </p>

                                <div className="my-reviews-modal-actions">
                                    <button
                                        type="button"
                                        className="primary"
                                        onClick={closeGuestReview}
                                    >
                                        닫기
                                    </button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            )}


            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}


export default MyReviews;
