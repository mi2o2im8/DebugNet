import {
    FiActivity,
    FiArrowLeft,
    FiBell,
    FiCalendar,
    FiCheckCircle,
    FiChevronRight,
    FiClock,
    FiMapPin,
    FiMoreHorizontal,
    FiSend,
    FiSettings,
    FiUsers
} from "react-icons/fi";

import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    getClubDashboard,
    getClubEvents
} from "../../api/clubApi";

import {
    getMatchManagementSummary
} from "../Match/api/matchApi";

import {
    authenticatedRequest
} from "../../api/apiClient";

import "./ClubDashboard.css";


const MANAGEMENT_MENUS = [
    {
        id: "notice",
        label: "공지 작성",
        icon: FiBell
    },
    {
        id: "members",
        label: "회원 관리",
        icon: FiUsers
    },
    {
        id: "schedules",
        label: "일정 관리",
        icon: FiCalendar
    },
    {
        id: "matches",
        label: "매칭 관리",
        icon: FiActivity
    }
];

const DAY_INDEX = {
    일요일: 0,
    월요일: 1,
    화요일: 2,
    수요일: 3,
    목요일: 4,
    금요일: 5,
    토요일: 6
};

const WEEK_LABELS = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토"
];

function formatRecentPostDate(value) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            month: "numeric",
            day: "numeric"
        }
    ).format(new Date(value));
}

function getTodayDateKey() {
    const today = new Date();

    return [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");
}


function getEventDateParts(dateString) {
    const [
        year,
        month,
        day
    ] = dateString
        .split("-")
        .map(Number);

    const date = new Date(
        year,
        month - 1,
        day
    );

    return {
        month,
        day,
        weekday: WEEK_LABELS[date.getDay()]
    };
}

function getEventImageUrl(event) {
    if (!event) {
        return "";
    }

    if (Array.isArray(event.event_image_urls)) {
        const firstImage = event.event_image_urls.find(
            (imageUrl) =>
                typeof imageUrl === "string"
                && imageUrl.trim()
        );

        if (firstImage) {
            return firstImage.trim();
        }
    }

    if (
        typeof event.event_image_url === "string"
        && event.event_image_url.trim()
    ) {
        return event.event_image_url.trim();
    }

    return "";
}

function getNextScheduleDate(dayOfWeek) {
    const today = new Date();
    const targetDay = DAY_INDEX[dayOfWeek];

    if (targetDay === undefined) {
        return today;
    }

    let difference =
        targetDay - today.getDay();

    if (difference < 0) {
        difference += 7;
    }

    const nextDate = new Date(today);

    nextDate.setDate(
        today.getDate() + difference
    );

    return nextDate;
}


function ClubDashboard() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [clubEvents, setClubEvents] =
        useState([]);

    const [eventsLoading, setEventsLoading] =
        useState(true);

    const [eventsError, setEventsError] =
        useState("");

    // 활동 일정 달력에서 선택한 날짜
    const [
        selectedEventDateKey,
        setSelectedEventDateKey
    ] = useState("");

    const [recentPosts, setRecentPosts] =
        useState([]);

    const [recentPostsError, setRecentPostsError] =
        useState("");

    const [matchSummary, setMatchSummary] =
        useState({
            received: 0,
            sent: 0,
            upcoming: 0
        });

    const [matchSummaryLoading, setMatchSummaryLoading] =
        useState(true);

    const [matchSummaryError, setMatchSummaryError] =
        useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const result =
                    await getClubDashboard(clubId);

                if (!cancelled) {
                    setDashboard(result);
                }
            } catch (error) {
                console.error(
                    "동호회 허브 조회 실패:",
                    error
                );

                if (!cancelled) {
                    setErrorMessage(
                        error.message ||
                        "동호회 정보를 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [clubId]);

    // =========================
    // 동호회 커뮤니티 최근 게시글 조회
    // =========================
    useEffect(() => {
        let cancelled = false;

        const loadRecentPosts = async () => {
            setRecentPostsError("");

            try {
                const params = new URLSearchParams({
                    board_type: "club",
                    club_id: String(clubId),
                    page: "1",
                    size: "3",
                    sort: "latest"
                });

                const result =
                    await authenticatedRequest(
                        `/api/posts?${params.toString()}`
                    );

                if (!cancelled) {
                    setRecentPosts(
                        result.items || []
                    );
                }
            } catch (error) {
                console.error(
                    "동호회 최근 게시글 조회 실패:",
                    error
                );

                if (!cancelled) {
                    setRecentPosts([]);

                    setRecentPostsError(
                        error.message ||
                        "최근 게시글을 불러오지 못했습니다."
                    );
                }
            }
        };

        loadRecentPosts();

        return () => {
            cancelled = true;
        };
    }, [clubId]);

    // =========================
    // 실제 매칭 관리 요약 조회
    // =========================
    useEffect(() => {
        let cancelled = false;

        const loadMatchSummary = async () => {
            setMatchSummaryLoading(true);
            setMatchSummaryError("");

            try {
                const result =
                    await getMatchManagementSummary(
                        clubId
                    );

                if (!cancelled) {
                    setMatchSummary({
                        received: result.received || 0,
                        sent: result.sent || 0,
                        upcoming: result.upcoming || 0
                    });
                }
            } catch (error) {
                console.error(
                    "운영진 대시보드 매칭 현황 조회 실패:",
                    error
                );

                if (!cancelled) {
                    setMatchSummaryError(
                        error.message ||
                        "매칭 현황을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setMatchSummaryLoading(false);
                }
            }
        };

        if (clubId) {
            loadMatchSummary();
        }

        return () => {
            cancelled = true;
        };
    }, [clubId]);

    // =========================
    // 실제 생성 일정 조회
    // =========================
    useEffect(() => {
        let cancelled = false;

        const loadClubEvents = async () => {
            setEventsLoading(true);
            setEventsError("");

            try {
                const result =
                    await getClubEvents(clubId);

                if (!cancelled) {
                    setClubEvents(
                        result.events || []
                    );
                }
            } catch (error) {
                console.error(
                    "운영진 대시보드 일정 조회 실패:",
                    error
                );

                if (!cancelled) {
                    setClubEvents([]);

                    setEventsError(
                        error.message ||
                        "일정을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setEventsLoading(false);
                }
            }
        };

        loadClubEvents();

        return () => {
            cancelled = true;
        };
    }, [clubId]);

    const calendarData = useMemo(() => {
        const today = new Date();

        const year = today.getFullYear();
        const month = today.getMonth();

        const firstDay = new Date(
            year,
            month,
            1
        ).getDay();

        const lastDate = new Date(
            year,
            month + 1,
            0
        ).getDate();

        const cells = [
            ...Array(firstDay).fill(null),
            ...Array.from(
                { length: lastDate },
                (_, index) => index + 1
            )
        ];

        return {
            year,
            month: month + 1,
            today: today.getDate(),
            cells
        };
    }, []);


    const upcomingEvents = useMemo(() => {
        const todayKey = getTodayDateKey();

        return clubEvents
            .filter(
                (event) =>
                    event.status === "open" &&
                    event.event_date >= todayKey
            )
            .sort((first, second) => {
                const dateDifference =
                    first.event_date.localeCompare(
                        second.event_date
                    );

                if (dateDifference !== 0) {
                    return dateDifference;
                }

                return (first.start_time || "").localeCompare(
                    second.start_time || ""
                );
            })
            .slice(0, 3);
    }, [clubEvents]);

    // 실제 일정이 등록된 날짜
    const eventDateKeys = useMemo(() => {
        return new Set(
            clubEvents
                .filter(
                    (event) =>
                        event.status === "open"
                )
                .map(
                    (event) =>
                        event.event_date
                )
        );
    }, [clubEvents]);


    // 달력에서 선택한 날짜의 일정
    const selectedDateEvents = useMemo(() => {
        if (!selectedEventDateKey) {
            return [];
        }

        return clubEvents
            .filter(
                (event) =>
                    event.status === "open" &&
                    event.event_date ===
                        selectedEventDateKey
            )
            .sort(
                (first, second) =>
                    (first.start_time || "")
                        .localeCompare(
                            second.start_time || ""
                        )
            );
    }, [
        clubEvents,
        selectedEventDateKey
    ]);


    // 선택 날짜에서 가장 빠른 일정
    const selectedEvent =
        selectedDateEvents[0] || null;


    // 일정 조회가 끝나면 가장 가까운 일정을 기본 선택
    useEffect(() => {
        if (
            selectedEventDateKey ||
            upcomingEvents.length === 0
        ) {
            return;
        }

        setSelectedEventDateKey(
            upcomingEvents[0].event_date
        );
    }, [
        selectedEventDateKey,
        upcomingEvents
    ]);

    // 매칭 현황 숫자 표시
    const getMatchSummaryValue = (key) => {
        if (
            matchSummaryLoading
            || matchSummaryError
        ) {
            return "-";
        }

        return matchSummary[key] ?? 0;
    };

    const handleManagementMenu = (menuId) => {
        if (menuId === "members") {
            navigate(
                `/clubs/${clubId}/manage/members`
            );
            return;
        }

        if (menuId === "schedules") {
            navigate(
                `/clubs/${clubId}/manage/events`
            );
            return;
        }

        if (menuId === "notice") {
            navigate(
                `/clubs/${clubId}/manage/community/write`,
                {
                    state: {
                        board: "club",
                        isClubNotice: true
                    }
                }
            );
            return;
        }

        if (menuId === "matches") {
            navigate(
                `/clubs/${clubId}/matches`
            );
            return;
        }

        alert(
            "해당 관리 기능은 이후 단계에서 연결합니다."
        );
    };

    if (isLoading) {
        return (
            <main className="club-dashboard-page">
                <div className="club-dashboard-state">
                    동호회 정보를 불러오는 중입니다.
                </div>
            </main>
        );
    }

    if (errorMessage || !dashboard) {
        return (
            <main className="club-dashboard-page">
                <div className="club-dashboard-state error">
                    <strong>
                        동호회 정보를 불러오지 못했습니다.
                    </strong>

                    <p>{errorMessage}</p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        다시 시도
                    </button>
                </div>
            </main>
        );
    }

    const coverImage =
        dashboard.activity_image_urls?.[0] ||
        dashboard.representative_image_url;

    const profileImage =
        dashboard.representative_image_url ||
        coverImage;

    const roleLabel =
        dashboard.user_role === "owner"
            ? "운영자"
            : "운영진";

    const selectedEventDate =
        selectedEvent
            ? getEventDateParts(
                selectedEvent.event_date
            )
            : null;

    const selectedEventImage =
        getEventImageUrl(selectedEvent);

    return (
        <main className="club-dashboard-page">
            <div className="club-dashboard-container">
                <header className="club-dashboard-header">
                    <button
                        type="button"
                        aria-label="이전 화면"
                        onClick={() => navigate("/mainhome")}
                    >
                        <FiArrowLeft />
                    </button>

                    <div className="club-dashboard-header-actions">
                        <button
                            type="button"
                            aria-label="알림"
                        >
                            <FiBell />
                        </button>

                        <button
                            type="button"
                            aria-label="더보기"
                        >
                            <FiMoreHorizontal />
                        </button>
                    </div>
                </header>

                <div className="club-dashboard-scroll">
                    <section className="club-dashboard-hero">
                        <div className="club-dashboard-cover">
                            {coverImage ? (
                                <img
                                    src={coverImage}
                                    alt=""
                                />
                            ) : (
                                <div className="club-dashboard-cover-empty">
                                    <FiUsers />
                                </div>
                            )}

                            <div className="club-dashboard-cover-filter" />
                        </div>

                        <div className="club-dashboard-profile-card">
                            <div className="club-dashboard-profile-image">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt={`${dashboard.club_name} 대표 이미지`}
                                    />
                                ) : (
                                    <FiUsers />
                                )}
                            </div>

                            <div className="club-dashboard-title-row">
                                <div>
                                    <div className="club-dashboard-name-row">
                                        <h1>
                                            {dashboard.club_name}
                                        </h1>

                                        <span className="club-dashboard-role">
                                            <FiCheckCircle />
                                            {roleLabel}
                                        </span>
                                    </div>

                                    <p className="club-dashboard-summary">
                                        {[
                                            dashboard.sport_name,
                                            dashboard.region,
                                            `회원 ${dashboard.current_members}명`
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="club-dashboard-setting-button"
                                    onClick={() =>
                                        navigate(
                                            `/clubs/${clubId}/manage/settings`
                                        )
                                    }
                                >
                                    <FiSettings />
                                    설정
                                </button>
                            </div>

                            <p className="club-dashboard-intro">
                                {dashboard.club_intro ||
                                    "동호회 소개가 아직 없습니다."}
                            </p>
                        </div>
                    </section>

                    <section className="club-dashboard-quick-section">
                        <div className="club-dashboard-quick-menu">
                            {MANAGEMENT_MENUS.map(
                                (menu) => {
                                    const Icon = menu.icon;

                                    return (
                                        <button
                                            key={menu.id}
                                            type="button"
                                            onClick={() =>
                                                handleManagementMenu(
                                                    menu.id
                                                )
                                            }
                                        >
                                            <span>
                                                <Icon />
                                            </span>

                                            <strong>
                                                {menu.label}
                                            </strong>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </section>

                    <section className="club-dashboard-section">
                        <div className="club-dashboard-section-heading">
                            <h2>활동 일정</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    handleManagementMenu(
                                        "schedules"
                                    )
                                }
                            >
                                일정 관리
                                <FiChevronRight />
                            </button>
                        </div>

                        <div className="club-dashboard-calendar-layout">
                            <div className="club-dashboard-calendar">
                                <div className="club-dashboard-calendar-title">
                                    <FiCalendar />

                                    <strong>
                                        {calendarData.year}년{" "}
                                        {calendarData.month}월
                                    </strong>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedEventDateKey(
                                                getTodayDateKey()
                                            )
                                        }
                                    >
                                        오늘
                                    </button>
                                </div>

                                <div className="club-dashboard-calendar-week">
                                    {WEEK_LABELS.map(
                                        (label) => (
                                            <span key={label}>
                                                {label}
                                            </span>
                                        )
                                    )}
                                </div>

                                <div className="club-dashboard-calendar-days">
                                    {calendarData.cells.map(
                                        (day, index) => {
                                            if (!day) {
                                                return (
                                                    <span
                                                        key={`empty-${index}`}
                                                    />
                                                );
                                            }

                                            const dateKey = [
                                                calendarData.year,
                                                String(
                                                    calendarData.month
                                                ).padStart(2, "0"),
                                                String(day).padStart(2, "0")
                                            ].join("-");

                                            const hasEvent =
                                                eventDateKeys.has(dateKey);

                                            const isToday =
                                                dateKey === getTodayDateKey();

                                            const isSelected =
                                                dateKey === selectedEventDateKey;

                                            return (
                                                <span
                                                    key={day}
                                                    className={[
                                                        hasEvent
                                                            ? "scheduled"
                                                            : "",
                                                        isToday
                                                            ? "today"
                                                            : "",
                                                        isSelected
                                                            ? "selected"
                                                            : ""
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                    role={
                                                        hasEvent
                                                            ? "button"
                                                            : undefined
                                                    }
                                                    tabIndex={
                                                        hasEvent
                                                            ? 0
                                                            : undefined
                                                    }
                                                    onClick={() => {
                                                        if (hasEvent) {
                                                            setSelectedEventDateKey(
                                                                dateKey
                                                            );
                                                        }
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (
                                                            hasEvent &&
                                                            (
                                                                event.key === "Enter" ||
                                                                event.key === " "
                                                            )
                                                        ) {
                                                            setSelectedEventDateKey(
                                                                dateKey
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {day}
                                                </span>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            <div className="club-dashboard-selected-schedule">
                                {eventsLoading ? (
                                    <div className="club-dashboard-small-empty">
                                        일정을 불러오는 중입니다.
                                    </div>
                                ) : eventsError ? (
                                    <div className="club-dashboard-small-empty">
                                        {eventsError}
                                    </div>
                                ) : selectedEvent ? (
                                    <>
                                        <div className="club-dashboard-selected-date">
                                            {selectedEventDate.month}월{" "}
                                            {selectedEventDate.day}일 일정
                                        </div>

                                        <div className="club-dashboard-selected-image">
                                            {selectedEventImage ? (
                                                <img
                                                    src={selectedEventImage}
                                                    alt={`${selectedEvent.title} 일정`}
                                                />
                                            ) : (
                                                <FiCalendar aria-hidden="true" />
                                            )}
                                        </div>

                                        <strong>
                                            {selectedEvent.title}
                                        </strong>

                                        <span>
                                            <FiClock />

                                            {selectedEvent.start_time
                                                ? selectedEvent.start_time.slice(
                                                    0,
                                                    5
                                                )
                                                : "시간 미정"}

                                            {selectedEvent.end_time
                                                ? (
                                                    ` - ${selectedEvent.end_time.slice(
                                                        0,
                                                        5
                                                    )}`
                                                )
                                                : ""}
                                        </span>

                                        <span>
                                            <FiMapPin />
                                            {selectedEvent.location ||
                                                "장소 미정"}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/clubs/${clubId}/manage/events/${selectedEvent.event_id}`
                                                )
                                            }
                                        >
                                            일정 상세
                                        </button>
                                    </>
                                ) : (
                                    <div className="club-dashboard-small-empty">
                                        선택한 날짜에 일정이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="club-dashboard-section">
                        <div className="club-dashboard-section-heading">
                            <h2>다가오는 일정</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    handleManagementMenu(
                                        "schedules"
                                    )
                                }
                            >
                                전체 일정 보기
                                <FiChevronRight />
                            </button>
                        </div>

                        <div className="club-dashboard-upcoming-list">
                            {eventsLoading ? (
                                <div className="club-dashboard-small-empty">
                                    일정을 불러오는 중입니다.
                                </div>
                            ) : eventsError ? (
                                <div className="club-dashboard-small-empty">
                                    {eventsError}
                                </div>
                            ) : upcomingEvents.length === 0 ? (
                                <div className="club-dashboard-small-empty">
                                    예정된 일정이 없습니다.
                                </div>
                            ) : (
                                upcomingEvents.map((event) => {
                                    const eventDate =
                                        getEventDateParts(
                                            event.event_date
                                        );

                                    const eventImage =
                                        getEventImageUrl(event);

                                    const openEventDetail = () => {
                                        navigate(
                                            `/clubs/${clubId}/manage/events/${event.event_id}`
                                        );
                                    };

                                    return (
                                        <article
                                            key={event.event_id}
                                            className="club-dashboard-upcoming-item"
                                            role="button"
                                            tabIndex={0}
                                            onClick={openEventDetail}
                                            onKeyDown={(keyboardEvent) => {
                                                if (
                                                    keyboardEvent.key === "Enter" ||
                                                    keyboardEvent.key === " "
                                                ) {
                                                    keyboardEvent.preventDefault();
                                                    openEventDetail();
                                                }
                                            }}
                                        >
                                            <div className="club-dashboard-upcoming-date">
                                                <strong>
                                                    {eventDate.month}.
                                                    {eventDate.day}
                                                </strong>

                                                <span>
                                                    {eventDate.weekday}
                                                </span>
                                            </div>

                                            <div className="club-dashboard-upcoming-thumbnail">
                                                {eventImage ? (
                                                    <img
                                                        src={eventImage}
                                                        alt={`${event.title} 일정`}
                                                    />
                                                ) : (
                                                    <FiCalendar aria-hidden="true" />
                                                )}
                                            </div>

                                            <div className="club-dashboard-upcoming-info">
                                                <strong>
                                                    {event.title}
                                                </strong>

                                                <span>
                                                    <FiClock />

                                                    {event.start_time.slice(0, 5)}

                                                    {event.end_time
                                                        ? ` - ${event.end_time.slice(0, 5)}`
                                                        : ""}
                                                </span>

                                                <span>
                                                    <FiMapPin />

                                                    {event.location ||
                                                        event.location_address ||
                                                        "장소 미정"}
                                                </span>
                                            </div>

                                            <span className="club-dashboard-schedule-status">
                                                예정
                                            </span>

                                            <span
                                                className="club-dashboard-item-more"
                                                aria-hidden="true"
                                            >
                                                <FiChevronRight />
                                            </span>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </section>

                    <section className="club-dashboard-section">
                        <div className="club-dashboard-section-heading">
                            <h2>매칭 현황</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(`/clubs/${clubId}/matches`)
                                }
                            >
                                더 보기
                                <FiChevronRight />
                            </button>
                        </div>

                        <div className="club-dashboard-match-stats">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/clubs/${clubId}/matches/list?tab=received`
                                    )
                                }
                            >
                                <span className="received">
                                    <FiActivity />
                                </span>
                                받은 매칭
                                <strong>{getMatchSummaryValue("received")}</strong>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/clubs/${clubId}/matches/list?tab=sent`
                                    )
                                }
                            >
                                <span className="sent">
                                    <FiSend />
                                </span>
                                보낸 매칭
                                <strong>{getMatchSummaryValue("sent")}</strong>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/clubs/${clubId}/matches/list?tab=upcoming`
                                    )
                                }
                            >
                                <span className="confirmed">
                                    <FiCheckCircle />
                                </span>
                                확정된 경기
                                <strong>{getMatchSummaryValue("upcoming")}</strong>
                            </button>
                        </div>
                    </section>

                    <section className="club-dashboard-section">
                        <div className="club-dashboard-section-heading">
                            <h2>최근 소식</h2>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        `/clubs/${clubId}/manage/community`
                                    )
                                }
                            >
                                전체 보기
                                <FiChevronRight />
                            </button>
                        </div>

                        {recentPostsError ? (
                            <div className="club-dashboard-empty">
                                {recentPostsError}
                            </div>
                        ) : recentPosts.length === 0 ? (
                            <div className="club-dashboard-empty">
                                아직 작성된 게시글이 없습니다.
                            </div>
                        ) : (
                            <div className="club-dashboard-community-list">
                                {recentPosts.map((post) => (
                                    <button
                                        key={post.id}
                                        type="button"
                                        className={
                                            post.isClubNotice
                                                ? "club-dashboard-community-notice"
                                                : ""
                                        }
                                        onClick={() =>
                                            navigate(
                                                `/clubs/${clubId}/manage/community/post/${post.id}`
                                            )
                                        }
                                    >
                                        <span>
                                            <strong>
                                                {post.isClubNotice && (
                                                    <span className="club-dashboard-notice-badge">
                                                        [공지]
                                                    </span>
                                                )}

                                                {post.title}
                                            </strong>

                                            <small>
                                                {post.author}
                                            </small>
                                        </span>

                                        <span className="club-dashboard-community-meta">
                                            <small>
                                                {formatRecentPostDate(
                                                    post.createdAt
                                                )}
                                            </small>

                                            <small>
                                                댓글 {post.comments}
                                            </small>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

export default ClubDashboard;