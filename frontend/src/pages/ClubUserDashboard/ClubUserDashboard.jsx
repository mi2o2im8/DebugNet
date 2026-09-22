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
    getClubUserDashboard
} from "../../api/clubApi";

import "./ClubUserDashboard.css";


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


function ClubUserDashboard() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const result =
                    await getClubUserDashboard(clubId);

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

    const scheduledWeekdays = useMemo(() => {
        if (!dashboard) {
            return new Set();
        }

        return new Set(
            dashboard.schedules.map(
                (schedule) =>
                    DAY_INDEX[schedule.day_of_week]
            )
        );
    }, [dashboard]);

    const upcomingSchedules = useMemo(() => {
        if (!dashboard) {
            return [];
        }

        return dashboard.schedules
            .map((schedule) => ({
                ...schedule,
                nextDate: getNextScheduleDate(
                    schedule.day_of_week
                )
            }))
            .sort(
                (first, second) =>
                    first.nextDate - second.nextDate
            )
            .slice(0, 3);
    }, [dashboard]);

    const handleManagementMenu = (menuId) => {
        if (menuId === "schedules") {
            navigate(
                `/clubs/${clubId}/manage/events`
            );
            return;
        }

        if (menuId === "notice") {
            alert(
                "공지 기능은 팀원 작업과 연결할 예정입니다."
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

    const selectedSchedule =
        upcomingSchedules[0];

    return (
        <main className="club-dashboard-page">
            <div className="club-dashboard-container">
                <header className="club-dashboard-header">
                    <button
                        type="button"
                        aria-label="이전 화면"
                        onClick={() => navigate("/main")}
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
                                        alert(
                                            "동호회 설정은 이후 연결합니다."
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

                                    <button type="button">
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

                                            const date = new Date(
                                                calendarData.year,
                                                calendarData.month - 1,
                                                day
                                            );

                                            const hasSchedule =
                                                scheduledWeekdays.has(
                                                    date.getDay()
                                                );

                                            const isToday =
                                                day ===
                                                calendarData.today;

                                            return (
                                                <span
                                                    key={day}
                                                    className={[
                                                        hasSchedule
                                                            ? "scheduled"
                                                            : "",
                                                        isToday
                                                            ? "today"
                                                            : ""
                                                    ]
                                                        .filter(Boolean)
                                                        .join(" ")}
                                                >
                                                    {day}
                                                </span>
                                            );
                                        }
                                    )}
                                </div>
                            </div>

                            <div className="club-dashboard-selected-schedule">
                                {selectedSchedule ? (
                                    <>
                                        <div className="club-dashboard-selected-date">
                                            {selectedSchedule.nextDate.getMonth() +
                                                1}
                                            월{" "}
                                            {selectedSchedule.nextDate.getDate()}
                                            일 일정
                                        </div>

                                        <div className="club-dashboard-selected-image">
                                            {dashboard.activity_image_urls?.[1] ||
                                            coverImage ? (
                                                <img
                                                    src={
                                                        dashboard
                                                            .activity_image_urls?.[1] ||
                                                        coverImage
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <FiCalendar />
                                            )}
                                        </div>

                                        <strong>
                                            {
                                                selectedSchedule.day_of_week
                                            } 정기 활동
                                        </strong>

                                        <span>
                                            <FiClock />
                                            {selectedSchedule.start_time.slice(
                                                0,
                                                5
                                            )}
                                            {" - "}
                                            {selectedSchedule.end_time.slice(
                                                0,
                                                5
                                            )}
                                        </span>

                                        <span>
                                            <FiMapPin />
                                            {dashboard.venue_name ||
                                                "장소 미정"}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleManagementMenu(
                                                    "schedules"
                                                )
                                            }
                                        >
                                            일정 관리
                                        </button>
                                    </>
                                ) : (
                                    <div className="club-dashboard-small-empty">
                                        등록된 일정이 없습니다.
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
                            {upcomingSchedules.map(
                                (schedule, index) => (
                                    <article
                                        key={
                                            schedule.club_schedule_id
                                        }
                                        className="club-dashboard-upcoming-item"
                                    >
                                        <div className="club-dashboard-upcoming-date">
                                            <strong>
                                                {schedule.nextDate.getMonth() +
                                                    1}
                                                .
                                                {schedule.nextDate.getDate()}
                                            </strong>

                                            <span>
                                                {
                                                    WEEK_LABELS[
                                                        schedule.nextDate.getDay()
                                                    ]
                                                }
                                            </span>
                                        </div>

                                        <div className="club-dashboard-upcoming-thumbnail">
                                            {dashboard
                                                .activity_image_urls?.[
                                                index
                                            ] || coverImage ? (
                                                <img
                                                    src={
                                                        dashboard
                                                            .activity_image_urls?.[
                                                            index
                                                        ] ||
                                                        coverImage
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <FiCalendar />
                                            )}
                                        </div>

                                        <div className="club-dashboard-upcoming-info">
                                            <strong>
                                                {
                                                    schedule.day_of_week
                                                } 정기 활동
                                            </strong>

                                            <span>
                                                <FiClock />
                                                {schedule.start_time.slice(
                                                    0,
                                                    5
                                                )}
                                                {" - "}
                                                {schedule.end_time.slice(
                                                    0,
                                                    5
                                                )}
                                            </span>

                                            <span>
                                                <FiMapPin />
                                                {dashboard.venue_name ||
                                                    "장소 미정"}
                                            </span>
                                        </div>

                                        <span className="club-dashboard-schedule-status">
                                            예정
                                        </span>

                                        <button
                                            type="button"
                                            className="club-dashboard-item-more"
                                        >
                                            <FiMoreHorizontal />
                                        </button>
                                    </article>
                                )
                            )}
                        </div>
                    </section>

                    <section className="club-dashboard-section">
                        <div className="club-dashboard-section-heading">
                            <h2>매칭 현황</h2>

                            <button type="button">
                                더 보기
                                <FiChevronRight />
                            </button>
                        </div>

                        <div className="club-dashboard-match-stats">
                            <button type="button">
                                <span className="received">
                                    <FiActivity />
                                </span>
                                받은 매칭
                                <strong>0</strong>
                            </button>

                            <button type="button">
                                <span className="sent">
                                    <FiSend />
                                </span>
                                보낸 매칭
                                <strong>0</strong>
                            </button>

                            <button type="button">
                                <span className="confirmed">
                                    <FiCheckCircle />
                                </span>
                                확정된 경기
                                <strong>0</strong>
                            </button>
                        </div>
                    </section>

                    <section className="club-dashboard-section">
                        <div className="club-dashboard-section-heading">
                            <h2>최근 소식</h2>

                            <button type="button">
                                전체 보기
                                <FiChevronRight />
                            </button>
                        </div>

                        <div className="club-dashboard-empty">
                            게시글 기능 연결 후 최근 소식이
                            표시됩니다.
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

export default ClubUserDashboard;