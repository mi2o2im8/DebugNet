// 신청 현황 페이지 (마이페이지 → 신청 현황)
//
// 동호회 가입 신청: 승인 대기 / 가입 완료 / 탈퇴함 / 거절됨
// 게스트 신청:      승인 대기 / 참여 확정 / 참여 완료 / 거절됨 / 신청 취소 / 일정 취소
// 받은 신청:        운영자에게만 보임. 내가 운영하는 동호회에 들어온
//                   승인 대기 가입 신청 + 게스트 신청 (누르면 관리 화면으로)
//
// GET /api/users/me/applications           (내가 보낸 신청)
// GET /api/users/me/received-applications  (내가 받은 신청, 운영자용)

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";

import {
    getMyApplications,
    getMyReceivedApplications,
} from "../../api/userApi";
import {
    cancelMyClubEventGuestApplication,
    decideClubApplication,
    decideClubEventParticipant,
} from "../../api/clubApi";

import { FiCheck, FiX } from "react-icons/fi";

import "./MyApplications.css";


/* ========================================
   ⭐ 탭
   ======================================== */

const BASE_TABS = [
    { key: "club", label: "동호회 가입" },
    { key: "guest", label: "게스트 신청" },
];

// 운영 동호회가 있을 때만 추가
const RECEIVED_TAB = { key: "received", label: "받은 신청" };


/* ========================================
   ⭐ 운영자 여부 기억해두기
   
   페이지를 열 때 운영자인지 서버 응답 전에는 모르므로
   지난번 결과를 저장해두고 처음부터 그 탭 수로 그린다.
   (탭이 2개 → 3개로 늘어나며 출렁이는 문제 방지)

   같은 브라우저에서 다른 계정으로 로그인한 경우를 구분하려고
   닉네임도 같이 저장해서, 닉네임이 다르면 기억한 값을 쓰지 않는다.
   탭 표시에만 쓰는 값이고, 실제 목록은 항상 서버 응답 기준.
   ======================================== */

const OPERATOR_CACHE_KEY = "playbridge_is_operator";
const NICKNAME_CACHE_KEY = "playbridge_user_nickname";

// true / false / null(모름)
const readCachedOperator = () => {
    try {
        const cached = JSON.parse(
            localStorage.getItem(OPERATOR_CACHE_KEY) || "null"
        );

        const nickname = localStorage.getItem(NICKNAME_CACHE_KEY) || "";

        if (!cached || cached.nickname !== nickname) return null;

        return Boolean(cached.isOperator);
    } catch {
        return null;
    }
};

const saveCachedOperator = (isOperator) => {
    try {
        localStorage.setItem(
            OPERATOR_CACHE_KEY,
            JSON.stringify({
                nickname: localStorage.getItem(NICKNAME_CACHE_KEY) || "",
                isOperator,
            })
        );
    } catch {
        // 저장 실패해도 화면 동작에는 문제 없음
    }
};


/* ========================================
   ⭐ 날짜 / 시간 표시
   ======================================== */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-09-27" → "9월 27일 (일)"
const formatEventDate = (dateString) => {

    if (!dateString) return "";

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    const weekday = WEEKDAYS[new Date(year, month - 1, day).getDay()];

    return `${month}월 ${day}일 (${weekday})`;
};

// "2026-09-20T10:00:00+00:00" → "9월 20일"
const formatAppliedDate = (dateTimeString) => {

    if (!dateTimeString) return "";

    const date = new Date(dateTimeString);

    if (Number.isNaN(date.getTime())) return "";

    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
};

// 며칠 전에 신청했는지: "오늘" / "어제" / "3일 전"
const formatDaysAgo = (dateTimeString) => {

    if (!dateTimeString) return "";

    const date = new Date(dateTimeString);

    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const days = Math.round((today - target) / 86400000);

    if (days <= 0) return "오늘";
    if (days === 1) return "어제";
    return `${days}일 전`;
};

// 일정까지 남은 날: "오늘" / "내일" / "D-3"
const getDaysUntil = (dateString) => {

    if (!dateString) return null;

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round(
        (new Date(year, month - 1, day) - today) / 86400000
    );
};

const formatDDay = (dateString) => {

    if (!dateString) return "";

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Math.round(
        (new Date(year, month - 1, day) - today) / 86400000
    );

    if (days <= 0) return "오늘";
    if (days === 1) return "내일";
    return `D-${days}`;
};

// "18:00:00" → "18:00"
const formatTime = (timeString) =>
    timeString ? String(timeString).slice(0, 5) : "";


/* ========================================
   ⭐ 일정 시작 / 종료 여부 (한국 시간 기준, 기기 시간 사용)
   ======================================== */

const toDateTime = (dateString, timeString) => {

    if (!dateString || !timeString) return null;

    const [year, month, day] = String(dateString)
        .slice(0, 10)
        .split("-")
        .map(Number);

    const [hour, minute] = String(timeString)
        .split(":")
        .map(Number);

    return new Date(year, month - 1, day, hour || 0, minute || 0);
};

const hasStarted = (item) => {
    const startAt = toDateTime(item.event_date, item.start_time);
    return startAt ? Date.now() >= startAt.getTime() : false;
};

const hasEnded = (item) => {
    // 종료 시간이 없으면 시작 시간 기준
    const endAt = toDateTime(
        item.event_date,
        item.end_time || item.start_time
    );
    return endAt ? Date.now() >= endAt.getTime() : false;
};


/* ========================================
   ⭐ 동호회 가입 신청 상태
   ======================================== */

const getClubStatus = (item) => {

    if (item.status === "pending") {
        return { label: "승인 대기", tone: "waiting" };
    }

    if (item.status === "approved") {
        return item.is_active_member
            ? { label: "가입 완료", tone: "done" }
            : { label: "탈퇴함", tone: "muted" };
    }

    if (item.status === "rejected") {
        return { label: "거절됨", tone: "rejected" };
    }

    return { label: item.status, tone: "muted" };
};


/* ========================================
   ⭐ 게스트 신청 상태
   ======================================== */

const getGuestStatus = (item) => {

    if (item.event_status === "cancelled") {
        return { label: "일정 취소", tone: "muted" };
    }

    if (item.guest_status === "pending") {
        return hasStarted(item)
            ? { label: "미승인 마감", tone: "muted" }
            : { label: "승인 대기", tone: "waiting" };
    }

    if (item.guest_status === "joined") {
        if (hasEnded(item)) return { label: "참여 완료", tone: "finished" };
        if (hasStarted(item)) return { label: "진행 중", tone: "done" };
        return { label: "참여 확정", tone: "done" };
    }

    if (item.guest_status === "rejected") {
        return { label: "거절됨", tone: "rejected" };
    }

    if (item.guest_status === "cancelled") {
        return { label: "신청 취소", tone: "muted" };
    }

    return { label: item.guest_status, tone: "muted" };
};

// 시작 전이고 아직 살아있는 신청만 취소 가능
const canCancelGuest = (item) =>
    item.event_status !== "cancelled" &&
    (item.guest_status === "pending" || item.guest_status === "joined") &&
    !hasStarted(item);


function MyApplications() {

    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();


    // =========================================================
    // ⭐ 상태
    // =========================================================
    const [clubApplications, setClubApplications] = useState([]);
    const [guestApplications, setGuestApplications] = useState([]);

    // 지난번에 저장해둔 운영자 여부 (true / false / null=처음 방문)
    const [cachedOperator] = useState(readCachedOperator);

    // 받은 신청 (운영자용)
    // 서버 응답 전에는 기억해둔 값으로 탭을 먼저 그린다
    const [received, setReceived] = useState({
        isOperator: cachedOperator === true,
        club: [],
        guest: [],
    });
    const [receivedErrorMessage, setReceivedErrorMessage] = useState("");

    const tabs = received.isOperator
        ? [...BASE_TABS, RECEIVED_TAB]
        : BASE_TABS;

    // 주소의 ?tab= 값이 지금 보여줄 수 있는 탭이 아니면 첫 탭
    const requestedTab = searchParams.get("tab");
    const activeTab = tabs.some((tab) => tab.key === requestedTab)
        ? requestedTab
        : "club";

    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    // 취소 요청 중인 게스트 신청 (중복 클릭 방지)
    const [cancellingEventId, setCancellingEventId] = useState(null);

    // 받은 신청 승인/거절 처리 중인 카드 ("club-12" / "guest-3")
    const [processingKey, setProcessingKey] = useState(null);

    // 받은 신청 처리 결과 안내 (잠깐 보였다 사라짐)
    const [receivedNotice, setReceivedNotice] = useState("");


    // =========================================================
    // ⭐ 데이터 불러오기
    // =========================================================
    useEffect(() => {

        let ignore = false;

        const fetchApplications = async () => {

            try {

                setLoading(true);
                setErrorMessage("");
                setReceivedErrorMessage("");

                // 보낸 신청 + 받은 신청 동시에
                // (받은 신청이 실패해도 보낸 신청은 보여준다)
                const [data, receivedResult] = await Promise.all([
                    getMyApplications(),
                    getMyReceivedApplications().then(
                        (value) => ({ ok: true, value }),
                        (error) => ({ ok: false, error })
                    ),
                ]);

                if (ignore) return;

                setClubApplications(data?.club_applications ?? []);
                setGuestApplications(data?.guest_applications ?? []);

                if (receivedResult.ok) {
                    const isOperator = Boolean(
                        receivedResult.value?.is_operator
                    );

                    setReceived({
                        isOperator,
                        club: receivedResult.value?.club_applications ?? [],
                        guest: receivedResult.value?.guest_applications ?? [],
                    });

                    saveCachedOperator(isOperator);
                } else {
                    console.error("받은 신청 조회 오류:", receivedResult.error);
                    setReceivedErrorMessage(
                        "받은 신청을 불러오지 못했어요. 잠시 후 다시 시도해주세요."
                    );
                }

            } catch (error) {

                if (ignore) return;

                console.error("신청 현황 조회 오류:", error);
                setErrorMessage(error.message);

            } finally {

                if (!ignore) setLoading(false);

            }
        };

        fetchApplications();

        return () => {
            ignore = true;
        };

    }, []);


    // =========================================================
    // ⭐ 탭별 "진행 중" 개수 (승인 대기 등 아직 결과가 안 난 것)
    // =========================================================
    const waitingCount = useMemo(() => ({
        club: clubApplications.filter(
            (item) => item.status === "pending"
        ).length,
        guest: guestApplications.filter(
            (item) => getGuestStatus(item).tone === "waiting"
        ).length,
        received: received.club.length + received.guest.length,
    }), [clubApplications, guestApplications, received]);


    const changeTab = (tabKey) => {
        setSearchParams(
            tabKey === "club" ? {} : { tab: tabKey },
            { replace: true }
        );
    };


    // =========================================================
    // ⭐ 카드 누르면 이동할 곳
    // =========================================================
    const handleClubClick = (item) => {

        // 활동 중인 동호회 → 동호회 홈, 그 외 → 동호회 소개
        if (item.status === "approved" && item.is_active_member) {
            navigate(`/clubs/${item.club_id}/home`);
            return;
        }

        navigate(`/clubs/${item.club_id}`);
    };

    const getGuestClickAction = (item) => {

        if (item.event_status === "cancelled") return null;

        // 참여 완료 → 경기 후기 페이지
        if (item.guest_status === "joined" && hasEnded(item)) {
            return () => navigate("/my-reviews");
        }

        // 시작 전 신청 → 게스트 모집 상세 (일정 정보 그대로 전달)
        if (
            (item.guest_status === "pending" ||
                item.guest_status === "joined") &&
            !hasStarted(item)
        ) {
            return () =>
                navigate(`/guest-recruit/${item.event_id}`, {
                    state: { event: item },
                });
        }

        return null;
    };


    // =========================================================
    // ⭐ 게스트 신청 취소
    // =========================================================
    const handleCancelGuest = async (item) => {

        if (cancellingEventId) return;

        const message =
            item.guest_status === "joined"
                ? "참여 확정된 게스트 신청을 취소할까요?\n취소하면 다시 승인을 받아야 해요."
                : "게스트 신청을 취소할까요?";

        if (!window.confirm(message)) return;

        setCancellingEventId(item.event_id);

        try {

            await cancelMyClubEventGuestApplication(
                item.club_id,
                item.event_id
            );

            setGuestApplications((current) =>
                current.map((guestItem) =>
                    guestItem.event_id === item.event_id
                        ? { ...guestItem, guest_status: "cancelled" }
                        : guestItem
                )
            );

        } catch (error) {

            console.error("게스트 신청 취소 실패:", error);
            alert(error?.message || "게스트 신청 취소에 실패했습니다.");

        } finally {

            setCancellingEventId(null);

        }
    };


    // =========================================================
    // ⭐ 목록 화면
    // =========================================================
    const renderClubList = () => {

        if (clubApplications.length === 0) {
            return (
                <div className="my-apps-empty">
                    <p>아직 가입 신청한 동호회가 없어요.</p>
                    <button
                        type="button"
                        onClick={() => navigate("/clubs/recruit")}
                    >
                        모집 중인 동호회 보기
                    </button>
                </div>
            );
        }

        return (
            <ul className="my-apps-list">
                {clubApplications.map((item) => {

                    const statusInfo = getClubStatus(item);

                    return (
                        <li
                            key={`club-${item.application_id}`}
                            className="my-apps-card"
                        >
                            <button
                                type="button"
                                className="my-apps-card-main"
                                onClick={() => handleClubClick(item)}
                            >
                                {item.club_image_url ? (
                                    <img
                                        className="my-apps-thumb"
                                        src={item.club_image_url}
                                        alt=""
                                    />
                                ) : (
                                    <span
                                        className="my-apps-thumb placeholder"
                                        aria-hidden="true"
                                    >
                                        {item.club_name?.slice(0, 1)}
                                    </span>
                                )}

                                <span className="my-apps-info">
                                    <span className="my-apps-name">
                                        {item.club_name}
                                    </span>

                                    <span className="my-apps-meta">
                                        {formatAppliedDate(item.created_at)} 신청
                                        {item.decided_at &&
                                            item.status !== "pending" &&
                                            ` · ${formatAppliedDate(item.decided_at)} 처리`}
                                    </span>
                                </span>

                                <span className={`my-apps-status ${statusInfo.tone}`}>
                                    {statusInfo.label}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        );
    };

    const renderGuestList = () => {

        if (guestApplications.length === 0) {
            return (
                <div className="my-apps-empty">
                    <p>아직 게스트로 신청한 경기가 없어요.</p>
                    <button
                        type="button"
                        onClick={() => navigate("/guest-recruit")}
                    >
                        게스트 모집 보기
                    </button>
                </div>
            );
        }

        return (
            <ul className="my-apps-list">
                {guestApplications.map((item) => {

                    const statusInfo = getGuestStatus(item);
                    const clickAction = getGuestClickAction(item);
                    const showCancel = canCancelGuest(item);
                    const isCancelling = cancellingEventId === item.event_id;

                    const content = (
                        <>
                            {item.event_image_url ? (
                                <img
                                    className="my-apps-thumb"
                                    src={item.event_image_url}
                                    alt=""
                                />
                            ) : (
                                <span
                                    className="my-apps-thumb placeholder guest"
                                    aria-hidden="true"
                                >
                                    {item.club_name?.slice(0, 1)}
                                </span>
                            )}

                            <span className="my-apps-info">
                                <span className="my-apps-name">
                                    {item.title}
                                </span>

                                <span className="my-apps-meta">
                                    {formatEventDate(item.event_date)}{" "}
                                    {formatTime(item.start_time)}
                                    {item.location && ` · ${item.location}`}
                                </span>

                                <span className="my-apps-club">
                                    {item.club_name}
                                </span>
                            </span>

                            <span className={`my-apps-status ${statusInfo.tone}`}>
                                {statusInfo.label}
                            </span>
                        </>
                    );

                    return (
                        <li
                            key={`guest-${item.event_participant_id}`}
                            className="my-apps-card"
                        >
                            {clickAction ? (
                                <button
                                    type="button"
                                    className="my-apps-card-main"
                                    onClick={clickAction}
                                >
                                    {content}
                                </button>
                            ) : (
                                <div className="my-apps-card-main static">
                                    {content}
                                </div>
                            )}

                            {showCancel && (
                                <button
                                    type="button"
                                    className="my-apps-cancel"
                                    onClick={() => handleCancelGuest(item)}
                                    disabled={isCancelling}
                                >
                                    {isCancelling ? "취소 중..." : "신청 취소"}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    };


    // =========================================================
    // ⭐ 받은 신청 승인 / 거절 (이 화면에서 바로)
    //
    // kind: "club" 가입 신청 / "guest" 게스트 신청
    // decision: "approve" / "reject"
    // =========================================================
    useEffect(() => {

        if (!receivedNotice) return undefined;

        const timer = setTimeout(() => setReceivedNotice(""), 2500);

        return () => clearTimeout(timer);

    }, [receivedNotice]);

    const handleReceivedDecision = async (kind, item, decision) => {

        if (processingKey) return;

        const isApprove = decision === "approve";
        const target = kind === "club" ? "가입 신청" : "게스트 신청";

        const confirmed = window.confirm(
            `${item.nickname}님의 ${target}을 ${isApprove ? "승인" : "거절"}할까요?`
        );

        if (!confirmed) return;

        const key =
            kind === "club"
                ? `club-${item.application_id}`
                : `guest-${item.event_participant_id}`;

        setProcessingKey(key);

        try {

            if (kind === "club") {
                await decideClubApplication(
                    item.club_id,
                    item.application_id,
                    decision
                );
            } else {
                await decideClubEventParticipant(
                    item.club_id,
                    item.event_id,
                    item.event_participant_id,
                    decision
                );
            }

            // 처리한 신청은 목록에서 빼기
            setReceived((current) => ({
                ...current,
                club:
                    kind === "club"
                        ? current.club.filter(
                            (row) => row.application_id !== item.application_id
                        )
                        : current.club,
                guest:
                    kind === "guest"
                        ? current.guest.filter(
                            (row) =>
                                row.event_participant_id !==
                                item.event_participant_id
                        )
                        : current.guest,
            }));

            setReceivedNotice(
                `${item.nickname}님의 ${target}을 ${isApprove ? "승인" : "거절"}했어요.`
            );

        } catch (error) {

            console.error("받은 신청 처리 실패:", error);
            alert(error?.message || `${target}을 처리하지 못했습니다.`);

        } finally {

            setProcessingKey(null);

        }
    };

    const renderDecisionButtons = (kind, item) => {

        const key =
            kind === "club"
                ? `club-${item.application_id}`
                : `guest-${item.event_participant_id}`;

        const isProcessing = processingKey === key;
        const disabled = Boolean(processingKey);

        return (
            <div className="my-apps-decision">
                <button
                    type="button"
                    className="my-apps-decision-btn reject"
                    aria-label={`${item.nickname}님 거절`}
                    disabled={disabled}
                    onClick={() => handleReceivedDecision(kind, item, "reject")}
                >
                    <FiX aria-hidden="true" />
                </button>

                <button
                    type="button"
                    className="my-apps-decision-btn approve"
                    aria-label={`${item.nickname}님 승인`}
                    disabled={disabled}
                    onClick={() => handleReceivedDecision(kind, item, "approve")}
                >
                    {isProcessing ? (
                        <span className="my-apps-spinner" aria-hidden="true" />
                    ) : (
                        <FiCheck aria-hidden="true" />
                    )}
                </button>
            </div>
        );
    };


    // =========================================================
    // ⭐ 받은 신청 (운영자용)
    // =========================================================
    const renderApplicant = (item) => (
        item.profile_image ? (
            <img
                className="my-apps-thumb"
                src={item.profile_image}
                alt=""
            />
        ) : (
            <span
                className="my-apps-thumb placeholder"
                aria-hidden="true"
            >
                {item.nickname?.slice(0, 1)}
            </span>
        )
    );

    const renderReceivedList = () => {

        if (receivedErrorMessage) {
            return (
                <p className="my-apps-message">
                    {receivedErrorMessage}
                </p>
            );
        }

        if (received.club.length === 0 && received.guest.length === 0) {
            return (
                <>
                    {receivedNotice && (
                        <p className="my-apps-notice" role="status">
                            {receivedNotice}
                        </p>
                    )}

                    <div className="my-apps-empty">
                        <p>지금 처리할 신청이 없어요.</p>
                    </div>
                </>
            );
        }

        return (
            <>
                {receivedNotice && (
                    <p className="my-apps-notice" role="status">
                        {receivedNotice}
                    </p>
                )}

                {received.club.length > 0 && (
                    <section className="my-apps-received-group">
                        <h3 className="my-apps-received-title">
                            가입 신청
                            <span>{received.club.length}</span>
                        </h3>

                        <ul className="my-apps-list">
                            {received.club.map((item) => (
                                <li
                                    key={`received-club-${item.application_id}`}
                                    className="my-apps-card received"
                                >
                                    <button
                                        type="button"
                                        className="my-apps-card-main"
                                        onClick={() =>
                                            navigate(`/clubs/${item.club_id}/manage/members`)
                                        }
                                    >
                                        {renderApplicant(item)}

                                        <span className="my-apps-info">
                                            <span className="my-apps-name">
                                                {item.nickname}
                                            </span>

                                            <span className="my-apps-meta">
                                                {formatDaysAgo(item.created_at)} 가입 신청
                                            </span>

                                            <span className="my-apps-club received">
                                                {item.club_name}
                                            </span>
                                        </span>

                                    </button>

                                    {renderDecisionButtons("club", item)}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {received.guest.length > 0 && (
                    <section className="my-apps-received-group">
                        <h3 className="my-apps-received-title">
                            게스트 신청
                            <span>{received.guest.length}</span>
                        </h3>

                        <ul className="my-apps-list">
                            {received.guest.map((item) => (
                                <li
                                    key={`received-guest-${item.event_participant_id}`}
                                    className="my-apps-card received"
                                >
                                    <button
                                        type="button"
                                        className="my-apps-card-main"
                                        onClick={() =>
                                            navigate(
                                                `/clubs/${item.club_id}/manage/events/${item.event_id}/participants`
                                            )
                                        }
                                    >
                                        {renderApplicant(item)}

                                        <span className="my-apps-info">
                                            <span className="my-apps-name">
                                                {item.nickname}
                                            </span>

                                            <span className="my-apps-meta">
                                                <span
                                                    className={
                                                        getDaysUntil(item.event_date) <= 1
                                                            ? "my-apps-dday urgent"
                                                            : "my-apps-dday"
                                                    }
                                                >
                                                    {formatDDay(item.event_date)}
                                                </span>
                                                {item.title}, {formatEventDate(item.event_date)}{" "}
                                                {formatTime(item.start_time)}
                                            </span>

                                            <span className="my-apps-club received">
                                                {item.club_name}
                                            </span>
                                        </span>

                                    </button>

                                    {renderDecisionButtons("guest", item)}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </>
        );
    };


    // =========================================================
    // ⭐ 화면
    // =========================================================
    return (
        <div className="my-apps-page">

            {/* ⭐ 헤더 */}
            <div className="my-apps-header">
                <BackButton
                    className="my-apps-back-btn"
                    aria-label="뒤로가기"
                />

                <h2 className="my-apps-title">
                    신청 현황
                </h2>
            </div>


            {/* ⭐ 탭
                - 운영자 여부를 기억해둔 값이 있으면: 처음부터 그 탭 수로 표시
                - 처음 방문(기억한 값 없음)이면: 불러오는 동안 탭 자리만 비워둠 */}
            <div className="my-apps-tabs" role="tablist">
                {(!loading || cachedOperator !== null) && tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        className={
                            activeTab === tab.key
                                ? "my-apps-tab active"
                                : "my-apps-tab"
                        }
                        onClick={() => changeTab(tab.key)}
                    >
                        {tab.label}
                        {!loading && waitingCount[tab.key] > 0 && (
                            <span className="my-apps-tab-count">
                                {waitingCount[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>


            {loading ? (

                <p className="my-apps-message">
                    신청 현황을 불러오는 중...
                </p>

            ) : errorMessage ? (

                <p className="my-apps-message">
                    신청 현황을 불러오지 못했습니다.
                    <br />
                    {errorMessage}
                </p>

            ) : activeTab === "club" ? (

                renderClubList()

            ) : activeTab === "guest" ? (

                renderGuestList()

            ) : (

                renderReceivedList()

            )}


            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}


export default MyApplications;
