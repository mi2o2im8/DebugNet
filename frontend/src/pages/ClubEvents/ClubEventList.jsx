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
    FiList,
    FiPlus
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
                                <article key={event.event_id}>
                                    <h2>{event.title}</h2>

                                    <p>
                                        {event.start_time.slice(0, 5)}
                                        {event.end_time
                                            ? ` ~ ${event.end_time.slice(0, 5)}`
                                            : ""}
                                    </p>

                                    <p>
                                        {event.location || "장소 미정"}
                                    </p>
                                </article>
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
                                        <article
                                            className="club-event-card"
                                            key={event.event_id}
                                        >
                                            <h3>{event.title}</h3>

                                            <p>
                                                {event.event_date}
                                                {" · "}
                                                {event.start_time.slice(0, 5)}
                                                {event.end_time
                                                    ? ` ~ ${event.end_time.slice(0, 5)}`
                                                    : ""}
                                            </p>

                                            <p>
                                                {event.location || "장소 미정"}
                                            </p>

                                            {event.guest_allowed && (
                                                <p className="club-event-guest">
                                                    게스트 모집 가능
                                                    {" · "}
                                                    최대 {event.max_guests}명
                                                </p>
                                            )}
                                        </article>
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
                                        <article
                                            className="club-event-card past"
                                            key={event.event_id}
                                        >
                                            <h3>{event.title}</h3>

                                            <p>
                                                {event.event_date}
                                                {" · "}
                                                {event.start_time.slice(0, 5)}
                                                {event.end_time
                                                    ? ` ~ ${event.end_time.slice(0, 5)}`
                                                    : ""}
                                            </p>

                                            <p>
                                                {event.location || "장소 미정"}
                                            </p>
                                        </article>
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