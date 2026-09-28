import {
    FiArrowLeft,
    FiBell,
    FiMoreHorizontal,
    FiCheckCircle,
    FiChevronLeft,
    FiChevronRight,
    FiCalendar,
    FiClock,
    FiMapPin,
    FiUsers,
    FiRepeat,
    FiMessageCircle,
    FiFileText,
    FiCheck,
    FiX,
    FiActivity,
} from "react-icons/fi";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getClubUserDashboard,
    getClubEvents,
    getClubEventAttendance,
    updateClubEventAttendance,
    getClubScheduleAttendance,
    updateClubScheduleAttendance,
} from "../../api/clubApi";

import "./ClubUserDashboard.css";


const WEEK_LABELS = [
    "일", "월", "화", "수", "목", "금", "토",
];

const DAY_INDEX = {
    일요일: 0,
    월요일: 1,
    화요일: 2,
    수요일: 3,
    목요일: 4,
    금요일: 5,
    토요일: 6,
};


// 날짜를 YYYY-MM-DD 형식으로 변환
function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 해당 요일의 다음 활동 날짜 계산
function getNextDate(dayOfWeek, baseDate = new Date()) {
    const targetDay = DAY_INDEX[dayOfWeek];

    if (targetDay === undefined) return null;

    const date = new Date(baseDate);
    date.setHours(0, 0, 0, 0);

    let diff = targetDay - date.getDay();

    if (diff < 0) {
        diff += 7;
    }

    date.setDate(date.getDate() + diff);

    return date;
}


function ClubUserDashboard() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    // 운영자가 등록한 일정
    const [clubEvents, setClubEvents] = useState([]);

    // 일정별 내 출석 투표 상태
    const [eventAttendance, setEventAttendance] = useState({});

    // 출석 투표 처리 중인 일정
    const [votingEventId, setVotingEventId] = useState(null);

    // 일정 조회 오류
    const [eventError, setEventError] = useState("");

    // 달력 상태
    const [currentMonth, setCurrentMonth] = useState(() => {
        const today = new Date();

        return new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );
    });

    const [selectedDate, setSelectedDate] = useState(new Date());

    // 참석 여부 (현재 화면에서만 유지되는 임시 상태)
    const [attendanceVotes, setAttendanceVotes] = useState({});


        // 대시보드 API 조회
        useEffect(() => {
            let cancelled = false;

            const loadDashboard = async () => {
                setIsLoading(true);
                setErrorMessage("");

                try {
                    const result = await getClubUserDashboard(clubId);

                    if (!cancelled) {
                        setDashboard(result);
                    }
                } catch (error) {
                    console.error("이용자 대시보드 조회 실패:", error);

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


        // 운영자가 등록한 일정 조회
        useEffect(() => {
            if (!clubId) return;

            let cancelled = false;

            const loadClubEvents = async () => {
                setEventError("");

                try {
                    const result = await getClubEvents(clubId);

                    if (!cancelled) {
                        setClubEvents(result.events || []);
                    }
                } catch (error) {
                    console.error("동호회 일정 조회 실패:", error);

                    if (!cancelled) {
                        setEventError(
                            error.message || "일정을 불러오지 못했습니다."
                        );
                    }
                }
            };

            loadClubEvents();

            return () => {
                cancelled = true;
            };
        }, [clubId]);


        // 일정별 내 출석 투표 상태 조회
        useEffect(() => {
            if (!clubId || clubEvents.length === 0) return;

            let cancelled = false;

            const loadEventAttendance = async () => {
                try {
                    const attendanceResults = await Promise.all(
                        clubEvents.map(async (event) => {
                            try {
                                const result = await getClubEventAttendance(
                                    clubId,
                                    event.event_id
                                );

                                return {
                                    eventId: event.event_id,
                                    attendanceStatus: result.attendance_status,
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

                    if (!cancelled) {
                        const attendanceMap = {};

                        attendanceResults.forEach((item) => {
                            if (item.attendanceStatus) {
                                attendanceMap[item.eventId] =
                                    item.attendanceStatus;
                            }
                        });

                        setEventAttendance(attendanceMap);
                    }
                } catch (error) {
                    console.error("출석 상태 조회 실패:", error);
                }
            };

            loadEventAttendance();

            return () => {
                cancelled = true;
            };
        }, [clubId, clubEvents]);


    // 달력 날짜 데이터
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        return [
            ...Array(firstDay).fill(null),
            ...Array.from(
                { length: lastDate },
                (_, index) => index + 1
            ),
        ];
    }, [currentMonth]);


    // 정기 활동이 있는 요일
    const scheduledWeekdays = useMemo(() => {
        return new Set(
            (dashboard?.schedules || []).map(
                (schedule) => DAY_INDEX[schedule.day_of_week]
            )
        );
    }, [dashboard]);


    // 선택한 날짜의 정기 활동
    const selectedSchedules = useMemo(() => {
        if (!dashboard) return [];

        return (dashboard.schedules || []).filter(
            (schedule) =>
                DAY_INDEX[schedule.day_of_week] ===
                selectedDate.getDay()
        );
    }, [dashboard, selectedDate]);


    // 다가오는 일정 3개
    const upcomingSchedules = useMemo(() => {
        if (!dashboard) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const schedules = [];

        // 향후 30일 내 정기 활동 날짜 계산
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            (dashboard.schedules || []).forEach((schedule) => {
                if (
                    DAY_INDEX[schedule.day_of_week] === date.getDay()
                ) {
                    schedules.push({
                        ...schedule,
                        date: new Date(date),
                    });
                }
            });
        }

        return schedules
            .sort((a, b) => a.date - b.date)
            .slice(0, 3);
    }, [dashboard]);

    // 다가오는 정기 일정의 내 투표 상태 조회
    useEffect(() => {
        if (!clubId || upcomingSchedules.length === 0) {
            return;
        }

        let cancelled = false;

        const loadUpcomingAttendance = async () => {
            try {
                const results = await Promise.all(
                    upcomingSchedules.map(async (schedule) => {
                        const date = formatDateKey(schedule.date);
                        const dateKey =
                            `${date}-${schedule.club_schedule_id}`;

                        try {
                            const result =
                                await getClubScheduleAttendance(
                                    clubId,
                                    schedule.club_schedule_id,
                                    date
                                );

                            return {
                                dateKey,
                                attendanceStatus:
                                    result.attendance_status,
                            };
                        } catch (error) {
                            console.error(
                                "다가오는 일정 투표 상태 조회 실패:",
                                error
                            );

                            return {
                                dateKey,
                                attendanceStatus: "undecided",
                            };
                        }
                    })
                );

                if (cancelled) return;

                const attendanceMap = {};

                results.forEach((item) => {
                    attendanceMap[item.dateKey] =
                        item.attendanceStatus;
                });

                setAttendanceVotes(attendanceMap);
            } catch (error) {
                console.error(
                    "다가오는 일정 투표 상태 조회 실패:",
                    error
                );
            }
        };

        loadUpcomingAttendance();

        return () => {
            cancelled = true;
        };
    }, [clubId, upcomingSchedules]);


    // 이전 달 / 다음 달
    const moveMonth = (amount) => {
        setCurrentMonth((prev) => {
            return new Date(
                prev.getFullYear(),
                prev.getMonth() + amount,
                1
            );
        });
    };
    // 운영자 등록 일정 참석 / 불참 투표
    const handleEventAttendanceVote = async (eventId, attendanceStatus) => {
        try {
            setVotingEventId(eventId);
            setEventError("");

            // 백엔드 API를 통해 참석 / 불참 저장
            await updateClubEventAttendance(
                clubId,
                eventId,
                attendanceStatus
            );

            // 저장 성공 후 화면 상태 갱신
            setEventAttendance((prev) => ({
                ...prev,
                [eventId]: attendanceStatus,
            }));

        } catch (error) {
            console.error("참석 투표 저장 실패:", error);
            setEventError("참석 투표 저장에 실패했습니다.");
        } finally {
            setVotingEventId(null);
        }
    };

    // 바로가기 메뉴
    const handleQuickMenu = (menuName) => {
        alert(`${menuName} 기능은 화면 연결 예정입니다.`);
    };


    // 로딩
    if (isLoading) {
        return (
            <main className="club-user-page">
                <div className="club-user-state">
                    동호회 정보를 불러오는 중입니다.
                </div>
            </main>
        );
    }


    // 오류
    if (errorMessage || !dashboard) {
        return (
            <main className="club-user-page">
                <div className="club-user-state error">
                    <h2>동호회 정보를 불러오지 못했습니다.</h2>
                    <p>{errorMessage}</p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        다시 시도
                    </button>
                </div>
            </main>
        );
    }


    const roleLabel =
        dashboard.user_role === "owner"
            ? "운영자"
            : dashboard.user_role === "manager"
            ? "운영진"
            : dashboard.user_role === "member"
            ? "회원"
            : "알 수 없음";


    const profileImage = dashboard.representative_image_url;


    return (
        <main className="club-user-page">
            <div className="club-user-container">

                {/* 상단 헤더 */}
                <header className="club-user-header">
                    <button
                        type="button"
                        aria-label="뒤로가기"
                        onClick={() => navigate(-1)}
                    >
                        <FiArrowLeft />
                    </button>

                    <div className="club-user-header-actions">
                        <button
                            type="button"
                            aria-label="알림"
                            onClick={() => handleQuickMenu("알림")}
                        >
                            <FiBell />
                        </button>

                        <button
                            type="button"
                            aria-label="더보기"
                            onClick={() => handleQuickMenu("더보기")}
                        >
                            <FiMoreHorizontal />
                        </button>
                    </div>
                </header>


                {/* 동호회 프로필 */}
                <section className="club-user-profile">

                    <div className="club-user-cover">
                        {profileImage ? (
                            <img src={profileImage} alt="" />
                        ) : (
                            <div className="club-user-cover-empty">
                                <FiUsers />
                            </div>
                        )}

                        <div className="club-user-cover-overlay" />
                    </div>

                    <div className="club-user-profile-card">

                        <div className="club-user-profile-image">
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt={`${dashboard.club_name} 대표 이미지`}
                                />
                            ) : (
                                <FiUsers />
                            )}
                        </div>

                        <div className="club-user-title-row">
                            <div className="club-user-title-info">
                                <div className="club-user-name-line">
                                    <h1>{dashboard.club_name}</h1>

                                    <span className="club-user-joined">
                                        <FiCheckCircle />
                                        가입 완료
                                    </span>
                                </div>

                                <p className="club-user-meta">
                                    {[
                                        dashboard.sport_name,
                                        dashboard.region,
                                        `회원 ${dashboard.current_members}명`,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            </div>
                        </div>

                        <p className="club-user-intro">
                            {dashboard.club_intro ||
                                "동호회 소개가 아직 없습니다."}
                        </p>

                        <div className="club-user-role">
                            <FiCheckCircle />
                            내 역할: {roleLabel}
                        </div>

                    </div>
                </section>


                {/* 바로가기 */}
                <section className="club-user-quick-section">
                    <div className="club-user-quick-menu">

                        <button
                            type="button"
                            onClick={() => handleQuickMenu("공지사항")}
                        >
                            <FiBell />
                            <span>공지사항</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickMenu("활동 일정")}
                        >
                            <FiCalendar />
                            <span>일정 보기</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickMenu("교류전")}
                        >
                            <FiRepeat />
                            <span>교류전</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleQuickMenu("소통하기")}
                        >
                            <FiMessageCircle />
                            <span>소통하기</span>
                        </button>

                    </div>
                </section>


                {/* 활동 일정 달력 */}
                <section className="club-user-section">

                    <div className="club-user-section-heading">
                        <h2>활동 일정</h2>
                        <span>정기 활동</span>
                    </div>

                    <div className="club-user-calendar-layout">

                        {/* 달력 */}
                        <div className="club-user-calendar">

                            <div className="club-user-calendar-title">
                                <button
                                    type="button"
                                    onClick={() => moveMonth(-1)}
                                    aria-label="이전 달"
                                >
                                    <FiChevronLeft />
                                </button>

                                <strong>
                                    {currentMonth.getFullYear()}년{" "}
                                    {currentMonth.getMonth() + 1}월
                                </strong>

                                <button
                                    type="button"
                                    onClick={() => moveMonth(1)}
                                    aria-label="다음 달"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>

                            <div className="club-user-calendar-week">
                                {WEEK_LABELS.map((day) => (
                                    <span key={day}>{day}</span>
                                ))}
                            </div>

                            <div className="club-user-calendar-days">
                                {calendarData.map((day, index) => {
                                    if (!day) {
                                        return (
                                            <span
                                                key={`empty-${index}`}
                                                className="empty"
                                            />
                                        );
                                    }

                                    const date = new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth(),
                                        day
                                    );

                                    const dateKey = formatDateKey(date);

                                    const isSelected =
                                        formatDateKey(selectedDate) === dateKey;

                                    const isToday =
                                        formatDateKey(new Date()) === dateKey;

                                    const hasSchedule =
                                        scheduledWeekdays.has(date.getDay());

                                    return (
                                        <button
                                            key={dateKey}
                                            type="button"
                                            className={[
                                                isSelected ? "selected" : "",
                                                isToday ? "today" : "",
                                                hasSchedule ? "has-schedule" : "",
                                            ].join(" ")}
                                            onClick={() => setSelectedDate(date)}
                                        >
                                            {day}
                                            {hasSchedule && (
                                                <i className="club-user-calendar-dot" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="club-user-calendar-legend">
                                <i />
                                정기 활동
                            </div>
                        </div>


                        {/* 선택한 날짜 일정 */}
                        <div className="club-user-selected-schedule">

                            <div className="club-user-selected-date">
                                {selectedDate.getMonth() + 1}월{" "}
                                {selectedDate.getDate()}일 (
                                {WEEK_LABELS[selectedDate.getDay()]})
                            </div>

                            {selectedSchedules.length > 0 ? (
                                selectedSchedules.map((schedule, index) => {
                                    const dateKey =
                                        `${formatDateKey(selectedDate)}-${schedule.club_schedule_id}`;

                                    const vote = attendanceVotes[dateKey];

                                    return (
                                        <article
                                            key={`${schedule.club_schedule_id}-${index}`}
                                            className="club-user-selected-card"
                                        >
                                            <div className="club-user-selected-icon">
                                                <FiCalendar />
                                            </div>

                                            <strong>
                                                {schedule.day_of_week} 정기 활동
                                            </strong>

                                            <span>
                                                <FiClock />
                                                {schedule.start_time?.slice(0, 5)}
                                                {" - "}
                                                {schedule.end_time?.slice(0, 5)}
                                            </span>

                                            <span>
                                                <FiMapPin />
                                                {dashboard.venue_name || "장소 미정"}
                                            </span>

                                            <button
                                                type="button"
                                                className="club-user-event-detail-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/clubs/${clubId}/events/regular-${schedule.club_schedule_id}/attendance`,
                                                        {
                                                            state: {
                                                                event: {
                                                                    event_id: `regular-${schedule.club_schedule_id}`,
                                                                    title: `${schedule.day_of_week} 정기 활동`,
                                                                    event_type: "정기 활동",
                                                                    event_date: formatDateKey(
                                                                        selectedDate
                                                                    ),
                                                                    start_time: schedule.start_time,
                                                                    end_time: schedule.end_time,
                                                                    location:
                                                                        dashboard.venue_name,
                                                                    description:
                                                                        "동호회 정기 활동 일정입니다.",
                                                                    club_schedule_id:
                                                                        schedule.club_schedule_id,
                                                                },
                                                            },
                                                        }
                                                    )
                                                }
                                            >
                                                일정 상세보기
                                                <FiChevronRight />
                                            </button>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="club-user-no-schedule">
                                    선택한 날짜에는
                                    <br />
                                    정기 활동이 없습니다.
                                </div>
                            )}

                        </div>
                    </div>
                </section>


                {/* 다가오는 일정 */}
                <section className="club-user-section">

                    <div className="club-user-section-heading">
                        <h2>다가오는 일정</h2>

                        <button
                            type="button"
                            onClick={() => handleQuickMenu("전체 일정")}
                        >
                            전체 일정 보기
                            <FiChevronRight />
                        </button>
                    </div>

                    <div className="club-user-upcoming-list">

                        {upcomingSchedules.length > 0 ? (
                            upcomingSchedules.map((schedule, index) => {
                                const dateKey =
                                    `${formatDateKey(schedule.date)}-${schedule.club_schedule_id}`;

                                const vote = attendanceVotes[dateKey];

                                return (
                                    <article
                                        key={`${schedule.club_schedule_id}-${index}`}
                                        className="club-user-upcoming-item"
                                        onClick={() =>
                                            navigate(
                                                `/clubs/${clubId}/events/regular-${schedule.club_schedule_id}/attendance`,
                                                {
                                                    state: {
                                                        event: {
                                                            event_id: `regular-${schedule.club_schedule_id}`,
                                                            title: `${schedule.day_of_week} 정기 활동`,
                                                            event_type: "정기 활동",
                                                            event_date: formatDateKey(schedule.date),
                                                            start_time: schedule.start_time,
                                                            end_time: schedule.end_time,
                                                            location: dashboard.venue_name,
                                                            description: "동호회 정기 활동 일정입니다.",
                                                            club_schedule_id:
                                                                schedule.club_schedule_id,
                                                        },
                                                    },
                                                }
                                            )
                                        }
                                    >
                                        <div className="club-user-upcoming-date">
                                            <strong>
                                                {schedule.date.getMonth() + 1}.
                                                {schedule.date.getDate()}
                                            </strong>

                                            <span>
                                                {WEEK_LABELS[schedule.date.getDay()]}
                                            </span>
                                        </div>

                                        <div className="club-user-upcoming-info">
                                            <strong>
                                                {schedule.day_of_week} 정기 활동
                                            </strong>

                                            <span>
                                                <FiClock />
                                                {schedule.start_time?.slice(0, 5)}
                                                {" - "}
                                                {schedule.end_time?.slice(0, 5)}
                                            </span>

                                            <span>
                                                <FiMapPin />
                                                {dashboard.venue_name || "장소 미정"}
                                            </span>
                                        </div>

                                        <div className="club-user-upcoming-vote">
                                            {vote && vote !== "undecided" ? (
                                                <span className="completed">
                                                    투표완료
                                                </span>
                                            ) : (
                                                <span className="undecided">
                                                    미투표
                                                </span>
                                            )}
                                        </div>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="club-user-empty">
                                등록된 정기 활동이 없습니다.
                            </div>
                        )}

                    </div>
                </section>


                {/* 매칭 현황 - 운영자만 표시 */}
                {dashboard.user_role === "owner" && (
                    <section className="club-user-section">

                        <div className="club-user-section-heading">
                            <h2>매칭 현황</h2>

                            <button
                                type="button"
                                onClick={() => handleQuickMenu("매칭 현황")}
                            >
                                더 보기
                                <FiChevronRight />
                            </button>
                        </div>

                        <div className="club-user-match-stats">

                            <div className="club-user-match-card">
                                <span className="received">
                                    <FiActivity />
                                </span>
                                <p>받은 매칭</p>
                                <strong>0</strong>
                            </div>

                            <div className="club-user-match-card">
                                <span className="sent">
                                    <FiRepeat />
                                </span>
                                <p>보낸 매칭</p>
                                <strong>0</strong>
                            </div>

                            <div className="club-user-match-card">
                                <span className="confirmed">
                                    <FiCheckCircle />
                                </span>
                                <p>확정된 경기</p>
                                <strong>0</strong>
                            </div>

                        </div>
                    </section>
                )}

                {/* 최근 소식 */}
                <section className="club-user-section">

                    <div className="club-user-section-heading">
                        <h2>최근 소식</h2>

                        <button
                            type="button"
                            onClick={() => handleQuickMenu("최근 소식")}
                        >
                            전체 보기
                            <FiChevronRight />
                        </button>
                    </div>

                    <div className="club-user-news-empty">
                        <FiFileText />
                        <p>
                            새로운 공지나 소식이 등록되면
                            <br />
                            이곳에서 확인할 수 있습니다.
                        </p>
                    </div>
                </section>

            </div>
        </main>
    );
}

export default ClubUserDashboard;