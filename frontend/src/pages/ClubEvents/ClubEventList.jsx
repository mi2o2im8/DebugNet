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
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiCopy,
    FiEdit2,
    FiList,
    FiMapPin,
    FiMoreVertical,
    FiPlus,
    FiTrash2,
    FiUsers
} from "react-icons/fi";

import {
    getClubEvents
} from "../../api/clubApi";

import "./ClubEventList.css";


const WEEK_LABELS = [
    "일",
    "월",
    "화",
    "수",
    "목",
    "금",
    "토"
];


function createDateKey(
    year,
    monthIndex,
    day
) {
    return [
        year,
        String(monthIndex + 1).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}


function getTodayKey() {
    const today = new Date();

    return createDateKey(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );
}

function formatEventDate(dateString) {
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

    const weekdayLabels = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];

    return {
        month: `${month}월`,
        day,
        weekday:
            `${weekdayLabels[date.getDay()]}요일`
    };
}

function ClubEventCard({
    event,
    isPast = false
}) {
    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const showPendingAction = (
        actionName
    ) => {
        setIsMenuOpen(false);

        alert(
            `${actionName} 기능은 다음 단계에서 연결합니다.`
        );
    };
    const formattedDate =
        formatEventDate(event.event_date);

    const startTime =
        event.start_time.slice(0, 5);

    const endTime = event.end_time
        ? event.end_time.slice(0, 5)
        : null;

    return (
        <article
            className={[
                "club-event-card",
                isPast ? "past" : ""
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="club-event-card-image">
                {event.event_image_url ? (
                    <img
                        src={event.event_image_url}
                        alt=""
                    />
                ) : (
                    <div className="club-event-image-placeholder">
                        <FiCalendar />
                    </div>
                )}

                <div className="club-event-date-badge">
                    <strong>
                        {formattedDate.day}
                    </strong>

                    <span>
                        {formattedDate.month}
                    </span>

                    <small>
                        {formattedDate.weekday}
                    </small>
                </div>
            </div>

            <div className="club-event-card-content">
                <div className="club-event-card-title-row">
                    <h3>{event.title}</h3>

                    <div className="club-event-more-menu">
                        <button
                            type="button"
                            className="club-event-more-button"
                            aria-label="일정 메뉴 열기"
                            aria-expanded={isMenuOpen}
                            onClick={() =>
                                setIsMenuOpen(
                                    (current) => !current
                                )
                            }
                        >
                            <FiMoreVertical />
                        </button>

                        {isMenuOpen && (
                            <div
                                className="club-event-menu-popup"
                                role="menu"
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() =>
                                        showPendingAction(
                                            "일정 수정"
                                        )
                                    }
                                >
                                    <FiEdit2 />
                                    일정 수정
                                </button>

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() =>
                                        showPendingAction(
                                            "일정 복사"
                                        )
                                    }
                                >
                                    <FiCopy />
                                    일정 복사
                                </button>

                                <button
                                    type="button"
                                    role="menuitem"
                                    className="danger"
                                    onClick={() =>
                                        showPendingAction(
                                            "일정 삭제"
                                        )
                                    }
                                >
                                    <FiTrash2 />
                                    일정 삭제
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <p className="club-event-card-information">
                    <FiClock />

                    <span>
                        {startTime}
                        {endTime
                            ? ` ~ ${endTime}`
                            : ""}
                    </span>
                </p>

                <p className="club-event-card-information">
                    <FiMapPin />

                    <span>
                        {event.location || "장소 미정"}
                    </span>
                </p>

                <div className="club-event-attendance-summary">
                    <div className="attending">
                        <strong>
                            {event.attending_count ?? 0}
                        </strong>

                        <span>참여</span>
                    </div>

                    <div className="absent">
                        <strong>
                            {event.absent_count ?? 0}
                        </strong>

                        <span>불참</span>
                    </div>

                    <div className="undecided">
                        <strong>
                            {event.undecided_count ?? 0}
                        </strong>

                        <span>미정</span>
                    </div>

                    <div className="guest">
                        <strong>
                            {event.guest_count ?? 0}
                        </strong>

                        <span>게스트</span>
                    </div>
                </div>

                {(event.pending_guest_count ?? 0) > 0 && (
                    <p className="club-event-pending-guests">
                        승인 대기 게스트
                        {" "}
                        {event.pending_guest_count}명
                    </p>
                )}

                <div className="club-event-card-tags">
                    {event.max_participants && (
                        <span>
                            <FiUsers />
                            정원 {event.max_participants}명
                        </span>
                    )}

                    {event.guest_allowed && (
                        <span className="guest">
                            게스트 최대 {event.max_guests}명
                        </span>
                    )}
                </div>

                <div className="club-event-card-actions">
                    <button
                        type="button"
                        className="club-event-participants-button"
                        onClick={() =>
                            showPendingAction(
                                "참가자 관리"
                            )
                        }
                    >
                        <FiUsers />
                        참가자 관리
                    </button>
                </div>
            </div>
        </article>
    );
}

function ClubEventList() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [viewMode, setViewMode] = useState("list");

    const [calendarDate, setCalendarDate] =
        useState(() => new Date());

    const [selectedDate, setSelectedDate] =
        useState(getTodayKey);

    useEffect(() => {
        let cancelled = false;

        const loadEvents = async () => {
            try {
                const result =
                    await getClubEvents(clubId);

                if (!cancelled) {
                    setEvents(result.events || []);
                }
            } catch (error) {
                console.error(
                    "일정 목록 조회 실패:",
                    error
                );

                if (!cancelled) {
                    setErrorMessage(
                        error.message ||
                        "일정을 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadEvents();

        return () => {
            cancelled = true;
        };
    }, [clubId]);

    const calendarData = useMemo(() => {
        const year = calendarDate.getFullYear();
        const monthIndex = calendarDate.getMonth();

        const firstWeekday = new Date(
            year,
            monthIndex,
            1
        ).getDay();

        const lastDate = new Date(
            year,
            monthIndex + 1,
            0
        ).getDate();

        const eventDateKeys = new Set(
            events.map((event) => event.event_date)
        );

        const cells = [
            ...Array(firstWeekday).fill(null),
            ...Array.from(
                { length: lastDate },
                (_, index) => {
                    const day = index + 1;

                    const dateKey = createDateKey(
                        year,
                        monthIndex,
                        day
                    );

                    return {
                        day,
                        dateKey,
                        hasEvent:
                            eventDateKeys.has(dateKey),
                        isToday:
                            dateKey === getTodayKey()
                    };
                }
            )
        ];

        return {
            year,
            month: monthIndex + 1,
            cells
        };
    }, [calendarDate, events]);


    const selectedEvents = useMemo(
        () =>
            events.filter(
                (event) =>
                    event.event_date === selectedDate
            ),
        [events, selectedDate]
    );

    const {
        upcomingEvents,
        pastEvents
    } = useMemo(() => {
        const todayKey = getTodayKey();

        const upcoming = events
            .filter(
                (event) =>
                    event.event_date >= todayKey
            )
            .sort(
                (first, second) =>
                    first.event_date.localeCompare(
                        second.event_date
                    ) ||
                    first.start_time.localeCompare(
                        second.start_time
                    )
            );

        const past = events
            .filter(
                (event) =>
                    event.event_date < todayKey
            )
            .sort(
                (first, second) =>
                    second.event_date.localeCompare(
                        first.event_date
                    ) ||
                    second.start_time.localeCompare(
                        first.start_time
                    )
            );

        return {
            upcomingEvents: upcoming,
            pastEvents: past
        };
    }, [events]);

    const moveMonth = (difference) => {
        setCalendarDate(
            (currentDate) =>
                new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + difference,
                    1
                )
        );
    };


    const moveToToday = () => {
        const today = new Date();

        setCalendarDate(today);
        setSelectedDate(getTodayKey());
    };

    if (isLoading) {
        return (
            <main className="club-events-page club-events-state">
                일정을 불러오는 중입니다.
            </main>
        );
    }

    if (errorMessage) {
        return (
            <main className="club-events-page club-events-state error">
                {errorMessage}
            </main>
        );
    }

    return (
        <main className="club-events-page">
            <header>
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage`
                        )
                    }
                >
                    이전
                </button>

                <h1>일정 관리</h1>
            </header>

            <section className="club-events-toolbar">
                <div
                    className="club-events-view-tabs"
                    role="tablist"
                >
                    <button
                        type="button"
                        className={
                            viewMode === "calendar"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setViewMode("calendar")
                        }
                    >
                        <FiCalendar />
                        캘린더 보기
                    </button>

                    <button
                        type="button"
                        className={
                            viewMode === "list"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setViewMode("list")
                        }
                    >
                        <FiList />
                        목록 보기
                    </button>
                </div>

                <button
                    type="button"
                    className="club-events-create-button"
                    onClick={() =>
                        alert(
                            "다음 단계에서 일정 만들기 화면을 연결합니다."
                        )
                    }
                >
                    <FiPlus />
                    일정 만들기
                </button>
            </section>

            {viewMode === "calendar" ? (
                <section className="club-events-calendar">
                    <div className="club-events-month-navigation">
                        <strong>
                            {calendarData.year}년
                            {" "}
                            {calendarData.month}월
                        </strong>

                        <div>
                            <button
                                type="button"
                                aria-label="이전 달"
                                onClick={() => moveMonth(-1)}
                            >
                                <FiChevronLeft />
                            </button>

                            <button
                                type="button"
                                onClick={moveToToday}
                            >
                                오늘
                            </button>

                            <button
                                type="button"
                                aria-label="다음 달"
                                onClick={() => moveMonth(1)}
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>

                    <div className="club-events-weekdays">
                        {WEEK_LABELS.map((label) => (
                            <span key={label}>
                                {label}
                            </span>
                        ))}
                    </div>

                    <div className="club-events-calendar-grid">
                        {calendarData.cells.map(
                            (cell, index) =>
                                cell ? (
                                    <button
                                        key={cell.dateKey}
                                        type="button"
                                        className={[
                                            cell.hasEvent
                                                ? "has-event"
                                                : "",
                                            cell.isToday
                                                ? "today"
                                                : "",
                                            cell.dateKey ===
                                            selectedDate
                                                ? "selected"
                                                : ""
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={() =>
                                            setSelectedDate(
                                                cell.dateKey
                                            )
                                        }
                                    >
                                        {cell.day}
                                    </button>
                                ) : (
                                    <span
                                        key={`empty-${index}`}
                                        aria-hidden="true"
                                    />
                                )
                        )}
                    </div>

                    <div className="club-events-selected-date">
                        <h2>{selectedDate} 일정</h2>

                        {selectedEvents.length === 0 ? (
                            <p>선택한 날짜에 일정이 없습니다.</p>
                        ) : (
                            selectedEvents.map((event) => (
                                <ClubEventCard
                                    key={event.event_id}
                                    event={event}
                                />
                            ))
                        )}
                    </div>
                </section>
            ) : (
                <section className="club-events-list">
                    <p className="club-events-count">
                        총 {events.length}개의 일정
                    </p>

                    {events.length === 0 ? (
                        <div className="club-events-empty">
                            등록된 일정이 없습니다.
                        </div>
                    ) : (
                        <>
                            <section className="club-events-group">
                                <div className="club-events-group-header">
                                    <h2>다가오는 일정</h2>

                                    <span>
                                        {upcomingEvents.length}개
                                    </span>
                                </div>

                                {upcomingEvents.length === 0 ? (
                                    <p className="club-events-group-empty">
                                        예정된 일정이 없습니다.
                                    </p>
                                ) : (
                                    upcomingEvents.map((event) => (
                                        <ClubEventCard
                                            key={event.event_id}
                                            event={event}
                                        />
                                    ))
                                )}
                            </section>

                            <section className="club-events-group">
                                <div className="club-events-group-header">
                                    <h2>지난 일정</h2>

                                    <span>
                                        {pastEvents.length}개
                                    </span>
                                </div>

                                {pastEvents.length === 0 ? (
                                    <p className="club-events-group-empty">
                                        지난 일정이 없습니다.
                                    </p>
                                ) : (
                                    pastEvents.map((event) => (
                                        <ClubEventCard
                                            key={event.event_id}
                                            event={event}
                                            isPast
                                        />
                                    ))
                                )}
                            </section>
                        </>
                    )}
                </section>
            )}
        </main>
    );
}

export default ClubEventList;