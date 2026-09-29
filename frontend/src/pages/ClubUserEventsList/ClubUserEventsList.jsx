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
    FiCheckCircle,
    FiCalendar,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiCopy,
    FiEdit2,
    FiEye,
    FiList,
    FiMapPin,
    FiMoreVertical,
    FiPlus,
    FiTrash2,
    FiUsers,
    FiX
} from "react-icons/fi";

import {
    copyClubEvent,
    deleteClubEvent,
    getClubEvents,
    getClubEventAttendance,
    getMyEventReview,
    createEventReview,
} from "../../api/clubApi";

import "./ClubUserEventsList.css";


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

function getEventEndDate(event) {
    if (!event.event_date || !event.end_time) {
        return null;
    }

    const [year, month, day] =
        event.event_date.split("-").map(Number);

    const [hour, minute, second = 0] =
        event.end_time.split(":").map(Number);

    return new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        second
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
    eventAttendance = {},
    onChanged,
    onReview
}) {

    const navigate = useNavigate();
    const { clubId } = useParams();

    const [isMenuOpen, setIsMenuOpen] =
        useState(false);

    const [isProcessing, setIsProcessing] =
        useState(false);
    
    const eventEndDate = getEventEndDate(event);

    const isPast =
        eventEndDate !== null &&
        eventEndDate < new Date();

    const handleCopy = async () => {
        setIsMenuOpen(false);

        const confirmed = window.confirm(
            `“${event.title}” 일정을 복사할까요?`
        );

        if (!confirmed) {
            return;
        }

        setIsProcessing(true);

        try {
            const result = await copyClubEvent(
                clubId,
                event.event_id
            );

            alert(result.message);
            onChanged();
        } catch (error) {
            alert(
                error.message ||
                "일정을 복사하지 못했습니다."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        setIsMenuOpen(false);

        const confirmed = window.confirm(
            `“${event.title}” 일정을 삭제할까요?\n`
            + "참가 및 투표 기록은 보존됩니다."
        );

        if (!confirmed) {
            return;
        }

        setIsProcessing(true);

        try {
            const result = await deleteClubEvent(
                clubId,
                event.event_id
            );

            alert(result.message);
            onChanged();
        } catch (error) {
            alert(
                error.message ||
                "일정을 삭제하지 못했습니다."
            );
        } finally {
            setIsProcessing(false);
        }
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
                        className="club-event-attendance-button"
                        onClick={() =>
                            navigate(
                                `/clubs/${clubId}/events/`
                                + `${event.event_id}/attendance`,
                                {
                                    state: {
                                        eventTitle: event.title,
                                    },
                                }
                            )
                        }
                    >
                        <FiCheckCircle />
                        내 참석 응답
                    </button>
                    {isPast &&
                        eventAttendance[event.event_id] === "attending" && (
                            <button
                                type="button"
                                className="club-event-review-button"
                                onClick={() => onReview(event)}
                            >
                                후기 작성
                            </button>
                        )}
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
    const [viewMode, setViewMode] = useState("calendar");

    const [eventAttendance, setEventAttendance] = useState({});

    // 활동 후기
    const [reviewEvent, setReviewEvent] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState("");
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const [reloadKey, setReloadKey] = useState(0);

    const [currentTime, setCurrentTime] =
    useState(() => new Date());

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
    }, [clubId, reloadKey]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // 일정별 내 출석 투표 상태 조회
    useEffect(() => {
        if (!clubId || events.length === 0) {
            return;
        }

        let cancelled = false;

        const loadEventAttendance = async () => {
            try {
                const results = await Promise.all(
                    events.map(async (event) => {
                        try {
                            const result =
                                await getClubEventAttendance(
                                    clubId,
                                    event.event_id
                                );

                            return {
                                eventId: event.event_id,
                                attendanceStatus:
                                    result.attendance_status,
                            };
                        } catch (error) {
                            console.error(
                                `일정 ${event.event_id} 출석 상태 조회 실패:`,
                                error
                            );

                            return {
                                eventId: event.event_id,
                                attendanceStatus: null,
                            };
                        }
                    })
                );

                if (cancelled) {
                    return;
                }

                const attendanceMap = {};

                results.forEach((item) => {
                    attendanceMap[item.eventId] =
                        item.attendanceStatus;
                });

                setEventAttendance(attendanceMap);
            } catch (error) {
                console.error(
                    "출석 상태 조회 실패:",
                    error
                );
            }
        };

        loadEventAttendance();

        return () => {
            cancelled = true;
        };
    }, [clubId, events]);

    const handleEventsChanged = () => {
        setReloadKey(
            (current) => current + 1
        );
    };

    // ---------------------------------------------------------
    // 활동 후기 작성 팝업 열기
    // ---------------------------------------------------------
    const handleOpenReview = async (event) => {
        try {
            const existingReview = await getMyEventReview(
                clubId,
                event.event_id
            );

            if (existingReview) {
                alert(
                    "이미 해당 활동에 대한 후기를 작성했습니다."
                );
                return;
            }

            setReviewEvent(event);
            setReviewRating(5);
            setReviewText("");
            setReviewModalOpen(true);
        } catch (error) {
            console.error(
                "기존 후기 조회 실패:",
                error
            );

            alert(
                "후기 정보를 확인할 수 없습니다."
            );
        }
    };

    // ---------------------------------------------------------
    // 활동 후기 저장
    // ---------------------------------------------------------
    const handleSubmitReview = async () => {
        if (!reviewEvent) {
            return;
        }

        if (!reviewRating) {
            alert("별점을 선택해주세요.");
            return;
        }

        setReviewSubmitting(true);

        try {
            await createEventReview(
                clubId,
                reviewEvent.event_id,
                reviewRating,
                reviewText.trim()
            );

            alert("후기가 등록되었습니다.");

            setReviewModalOpen(false);
            setReviewEvent(null);
            setReviewRating(5);
            setReviewText("");
        } catch (error) {
            console.error(
                "활동 후기 등록 실패:",
                error
            );

            alert(
                error?.message ||
                "후기 등록에 실패했습니다."
            );
        } finally {
            setReviewSubmitting(false);
        }
    };

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
        const upcoming = [];
        const past = [];

        events.forEach((event) => {
            const eventEndDate =
                getEventEndDate(event);

            console.log("리뷰 날짜 판정:", {
                eventId: event.event_id,
                eventDate: event.event_date,
                endTime: event.end_time,
                eventEndDate: eventEndDate,
                currentTime: currentTime,
                isPast: eventEndDate
                    ? eventEndDate < currentTime
                    : null,
            });

            if (!eventEndDate) {
                const todayKey = getTodayKey();

                if (event.event_date < todayKey) {
                    past.push(event);
                } else {
                    upcoming.push(event);
                }

                return;
            }

            const eventEndTimestamp = eventEndDate.getTime();
            const currentTimestamp = currentTime.getTime();

            console.log("리뷰 시간 비교:", {
                eventId: event.event_id,
                eventEndDate,
                currentTime,
                eventEndTimestamp,
                currentTimestamp,
                isPast: eventEndTimestamp < currentTimestamp,
            });

            if (eventEndTimestamp < currentTimestamp) {
                past.push(event);
            } else {
                upcoming.push(event);
            }
        });

        upcoming.sort(
            (first, second) =>
                first.event_date.localeCompare(
                    second.event_date
                ) ||
                first.start_time.localeCompare(
                    second.start_time
                )
        );

        past.sort(
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
    }, [events, currentTime]);

    console.log("===== 지난 일정 확인 =====");
    console.log("pastEvents:", pastEvents);
    console.log(
        "pastEventIds:",
        pastEvents.map((event) => event.event_id)
    );

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

            {/* -------------------------------------------------
                활동 후기 작성 팝업
            ------------------------------------------------- */}
            {reviewModalOpen && reviewEvent && (
                <div
                    className="club-user-review-overlay"
                    onClick={() => {
                        if (!reviewSubmitting) {
                            setReviewModalOpen(false);
                        }
                    }}
                >
                    <div
                        className="club-user-review-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="club-user-review-header">
                            <h3>활동 후기 작성</h3>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!reviewSubmitting) {
                                        setReviewModalOpen(false);
                                    }
                                }}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="club-user-review-event">
                            <strong>
                                {reviewEvent.title ||
                                    "동호회 활동"}
                            </strong>

                            <span>
                                {reviewEvent.event_date}
                            </span>
                        </div>

                        <div className="club-user-review-rating">
                            <p>
                                이번 활동은 어땠나요?
                            </p>

                            <div className="club-user-review-stars">
                                {[1, 2, 3, 4, 5].map(
                                    (star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={
                                                star <= reviewRating
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setReviewRating(
                                                    star
                                                )
                                            }
                                        >
                                            ★
                                        </button>
                                    )
                                )}
                            </div>

                            <span>
                                {reviewRating}점
                            </span>
                        </div>

                        <div className="club-user-review-text">
                            <textarea
                                value={reviewText}
                                onChange={(e) =>
                                    setReviewText(
                                        e.target.value
                                    )
                                }
                                placeholder="활동에 대한 후기를 작성해주세요."
                                maxLength={500}
                            />

                            <small>
                                {reviewText.length}/500
                            </small>
                        </div>

                        <div className="club-user-review-actions">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!reviewSubmitting) {
                                        setReviewModalOpen(false);
                                    }
                                }}
                                disabled={reviewSubmitting}
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitting}
                            >
                                {reviewSubmitting
                                    ? "등록 중..."
                                    : "후기 등록"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header>
                <button
                    type="button"
                    onClick={() => navigate(`/clubs/${clubId}/home`)}
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
                                    eventAttendance={eventAttendance}
                                    onChanged={handleEventsChanged}
                                    onReview={handleOpenReview}
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
                                            eventAttendance={eventAttendance}
                                            onChanged={handleEventsChanged}
                                            onReview={handleOpenReview}
                                        />
                                    ))
                                )}
                            </section>

                            <section className="club-events-group">

                                {console.log("지난 일정 목록:", pastEvents)}

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
                                            eventAttendance={eventAttendance}
                                            onChanged={handleEventsChanged}
                                            onReview={handleOpenReview}
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