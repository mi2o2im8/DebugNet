import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiArrowLeft,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiEdit2,
    FiHelpCircle,
    FiMapPin,
    FiRepeat,
    FiTrash2,
    FiUserPlus,
    FiUsers,
    FiXCircle
} from "react-icons/fi";

import {
    deleteClubEvent,
    getClubEvent,
    getClubEventAttendance,
    getClubEvents,
    updateClubEventAttendance
} from "../../api/clubApi";

import "./ClubEventDetail.css";


const EVENT_TYPE_LABELS = {
    regular: "정기 활동",
    meetup: "번개 모임",
    match: "교류전",
    training: "훈련",
    other: "기타"
};

const RECURRENCE_LABELS = {
    none: "반복 없음",
    weekly: "매주 반복",
    monthly: "매월 반복",
    custom: "직접 날짜 선택"
};

const PARTICIPATION_LABELS = {
    open: "바로 참여",
    approval: "운영자 승인"
};


function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(
        `${dateString}T00:00:00`
    );

    return new Intl.DateTimeFormat(
        "ko-KR",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short"
        }
    ).format(date);
}


function formatTime(timeString) {
    return timeString
        ? timeString.slice(0, 5)
        : "-";
}


// ⭐ 마감 시각은 입력한 한국 시각이 "+00" 이 붙은 채로 저장돼 있어서
//    new Date() 로 바꾸면 9시간이 더해져 보인다.
//    → 저장된 날짜/시각 숫자를 그대로 보여준다. (수정 폼과 같은 방식)
function formatDeadline(dateString) {
    if (!dateString) {
        return "마감일 없음";
    }

    const matched = String(dateString).match(
        /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/
    );

    if (!matched) {
        return "마감일 없음";
    }

    const [, year, month, day, hour, minute] = matched;
    const hourNumber = Number(hour);
    const period = hourNumber < 12 ? "오전" : "오후";
    const hour12 = String(hourNumber % 12 || 12).padStart(2, "0");

    return `${year}년 ${Number(month)}월 ${Number(day)}일 ${period} ${hour12}:${minute}`;
}


function ClubEventDetail() {
    const {
        clubId,
        eventId
    } = useParams();

    const navigate = useNavigate();
    const mapRef = useRef(null);

    const [event, setEvent] = useState(null);
    const [summary, setSummary] = useState(null);
    const [
        attendanceStatus,
        setAttendanceStatus
    ] = useState("undecided");

    const [isLoading, setIsLoading] =
        useState(true);

    const [
        isAttendanceSaving,
        setIsAttendanceSaving
    ] = useState(false);

    const [isDeleting, setIsDeleting] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");


    useEffect(() => {
        let cancelled = false;

        const loadEvent = async () => {
            setIsLoading(true);
            setErrorMessage("");

            try {
                const [
                    eventResult,
                    eventListResult
                ] = await Promise.all([
                    getClubEvent(
                        clubId,
                        eventId
                    ),
                    getClubEvents(clubId)
                ]);

                if (cancelled) {
                    return;
                }

                setEvent(eventResult);

                const currentSummary = (
                    eventListResult.events || []
                ).find(
                    (item) =>
                        Number(item.event_id)
                        === Number(eventId)
                );

                setSummary(currentSummary || null);

                try {
                    const attendanceResult =
                        await getClubEventAttendance(
                            clubId,
                            eventId
                        );

                    if (!cancelled) {
                        setAttendanceStatus(
                            attendanceResult
                                .attendance_status
                            || "undecided"
                        );
                    }
                } catch (attendanceError) {
                    console.warn(
                        "참석 상태 조회 실패:",
                        attendanceError
                    );
                }
            } catch (error) {
                console.error(
                    "일정 상세 조회 실패:",
                    error
                );

                if (!cancelled) {
                    setErrorMessage(
                        error.message ||
                        "일정 정보를 불러오지 못했습니다."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        loadEvent();

        return () => {
            cancelled = true;
        };
    }, [clubId, eventId]);


    useEffect(() => {
        if (
            !event ||
            event.latitude == null ||
            event.longitude == null ||
            !mapRef.current
        ) {
            return;
        }

        const kakao = window.kakao;

        if (!kakao?.maps) {
            return;
        }

        kakao.maps.load(() => {
            const position = new kakao.maps.LatLng(
                Number(event.latitude),
                Number(event.longitude)
            );

            const map = new kakao.maps.Map(
                mapRef.current,
                {
                    center: position,
                    level: 3
                }
            );

            const marker = new kakao.maps.Marker({
                position
            });

            marker.setMap(map);
        });
    }, [event]);


    const handleAttendanceChange = async (
        nextStatus
    ) => {
        if (isAttendanceSaving) {
            return;
        }

        setIsAttendanceSaving(true);

        try {
            const result =
                await updateClubEventAttendance(
                    clubId,
                    eventId,
                    nextStatus
                );

            setAttendanceStatus(
                result.attendance_status
            );

            try {
                const eventListResult =
                    await getClubEvents(clubId);

                const updatedSummary = (
                    eventListResult.events || []
                ).find(
                    (item) =>
                        Number(item.event_id)
                        === Number(eventId)
                );

                setSummary(updatedSummary || null);
            } catch (summaryError) {
                console.error(
                    "참석 현황 새로고침 실패:",
                    summaryError
                );
            }
        } catch (error) {
            alert(
                error.message ||
                "참석 상태를 변경하지 못했습니다."
            );
        } finally {
            setIsAttendanceSaving(false);
        }
    };


    const handleDelete = async () => {
        const confirmed = window.confirm(
            `“${event.title}” 일정을 삭제할까요?\n`
            + "참가 및 투표 기록은 보존됩니다."
        );

        if (!confirmed) {
            return;
        }

        setIsDeleting(true);

        try {
            const result = await deleteClubEvent(
                clubId,
                eventId
            );

            alert(result.message);

            navigate(
                `/clubs/${clubId}/manage/events`,
                {
                    replace: true
                }
            );
        } catch (error) {
            alert(
                error.message ||
                "일정을 삭제하지 못했습니다."
            );
        } finally {
            setIsDeleting(false);
        }
    };


    if (isLoading) {
        return (
            <main className="club-event-detail-state">
                일정을 불러오는 중입니다.
            </main>
        );
    }


    if (errorMessage || !event) {
        return (
            <main className="club-event-detail-state error">
                <p>{errorMessage}</p>

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage/events`
                        )
                    }
                >
                    일정 목록으로 돌아가기
                </button>
            </main>
        );
    }


    const startTime = formatTime(
        event.start_time
    );

    const endTime = event.end_time
        ? formatTime(event.end_time)
        : null;

    const hasCoordinates = (
        event.latitude != null &&
        event.longitude != null
    );

    const kakaoMapUrl = hasCoordinates
        ? (
            "https://map.kakao.com/link/map/"
            + `${encodeURIComponent(
                event.location || event.title
            )},`
            + `${event.latitude},${event.longitude}`
        )
        : null;


    return (
        <main className="club-event-detail-page">
            <header className="club-event-detail-header">
                <button
                    type="button"
                    aria-label="이전 화면"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage/events`
                        )
                    }
                >
                    <FiArrowLeft />
                </button>

                <h1>일정 상세</h1>
            </header>

            <section className="club-event-detail-hero">
                {event.event_image_url ? (
                    <img
                        src={event.event_image_url}
                        alt=""
                    />
                ) : (
                    <div className="club-event-detail-placeholder">
                        <FiCalendar />
                    </div>
                )}

                <div className="club-event-detail-hero-content">
                    <span className="club-event-detail-type">
                        {EVENT_TYPE_LABELS[
                            event.event_type
                        ] || event.event_type}
                    </span>

                    <h2>{event.title}</h2>

                    <p>
                        <FiCalendar />
                        {formatDate(event.event_date)}
                    </p>

                    <p>
                        <FiClock />

                        {startTime}
                        {endTime
                            ? ` ~ ${endTime}`
                            : ""}
                    </p>

                    <p>
                        <FiMapPin />
                        {event.location || "장소 미정"}
                    </p>
                </div>
            </section>

            <section className="club-event-detail-counts">
                <div>
                    <strong>
                        {summary?.attending_count ?? 0}
                    </strong>
                    <span>참석</span>
                </div>

                <div>
                    <strong>
                        {summary?.absent_count ?? 0}
                    </strong>
                    <span>불참</span>
                </div>

                <div>
                    <strong>
                        {summary?.undecided_count ?? 0}
                    </strong>
                    <span>미응답</span>
                </div>

                <div>
                    <strong>
                        {summary?.guest_count ?? 0}
                    </strong>
                    <span>게스트</span>
                </div>
            </section>

            <section className="club-event-detail-section">
                <h3>내 참석 응답</h3>

                <div className="club-event-attendance-options">
                    <button
                        type="button"
                        className={
                            attendanceStatus === "attending"
                                ? "attending active"
                                : "attending"
                        }
                        disabled={isAttendanceSaving}
                        onClick={() =>
                            handleAttendanceChange(
                                "attending"
                            )
                        }
                    >
                        <FiCheckCircle />
                        참석
                    </button>

                    <button
                        type="button"
                        className={
                            attendanceStatus === "absent"
                                ? "absent active"
                                : "absent"
                        }
                        disabled={isAttendanceSaving}
                        onClick={() =>
                            handleAttendanceChange(
                                "absent"
                            )
                        }
                    >
                        <FiXCircle />
                        불참
                    </button>

                    <button
                        type="button"
                        className={
                            attendanceStatus === "undecided"
                                ? "undecided active"
                                : "undecided"
                        }
                        disabled={isAttendanceSaving}
                        onClick={() =>
                            handleAttendanceChange(
                                "undecided"
                            )
                        }
                    >
                        <FiHelpCircle />
                        미정
                    </button>
                </div>
            </section>

            <section className="club-event-detail-section">
                <h3>일정 정보</h3>

                <dl className="club-event-detail-information">
                    <div>
                        <dt>
                            <FiRepeat />
                            반복 일정
                        </dt>

                        <dd>
                            {RECURRENCE_LABELS[
                                event.recurrence_type
                            ] || event.recurrence_type}
                        </dd>
                    </div>

                    <div>
                        <dt>
                            <FiUsers />
                            참여 방식
                        </dt>

                        <dd>
                            {PARTICIPATION_LABELS[
                                event.participation_method
                            ] || event.participation_method}
                        </dd>
                    </div>

                    <div>
                        <dt>최대 참여 인원</dt>

                        <dd>
                            {event.max_participants
                                ? `${event.max_participants}명`
                                : "제한 없음"}
                        </dd>
                    </div>

                    <div>
                        <dt>게스트 참여</dt>

                        <dd>
                            {event.guest_allowed
                                ? `허용 · 최대 ${event.max_guests}명`
                                : "허용 안 함"}
                        </dd>
                    </div>

                    <div>
                        <dt>참여 신청 마감</dt>

                        <dd>
                            {formatDeadline(
                                event.registration_deadline
                            )}
                        </dd>
                    </div>
                </dl>
            </section>

            <section className="club-event-detail-section">
                <h3>장소</h3>

                <div className="club-event-detail-location">
                    <strong>
                        {event.location || "장소 미정"}
                    </strong>

                    {event.location_address && (
                        <p>{event.location_address}</p>
                    )}

                    {hasCoordinates && (
                        <>
                            <div
                                ref={mapRef}
                                className="club-event-detail-map"
                            />

                            <a
                                href={kakaoMapUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                카카오맵에서 보기
                            </a>
                        </>
                    )}
                </div>
            </section>

            <section className="club-event-detail-section">
                <h3>일정 소개</h3>

                <p className="club-event-detail-description">
                    {event.description ||
                        "작성된 일정 소개가 없습니다."}
                </p>
            </section>

            {event.vote_options?.length > 0 && (
                <section className="club-event-detail-section">
                    <h3>투표 항목</h3>

                    <div className="club-event-vote-options">
                        {event.vote_options.map(
                            (option) => (
                                <span key={option}>
                                    {option}
                                </span>
                            )
                        )}
                    </div>
                </section>
            )}

            <section className="club-event-detail-section management">
                <h3>일정 관리</h3>

                {(summary?.pending_guest_count ?? 0) > 0 && (
                    <p className="club-event-detail-pending">
                        승인 대기 게스트가
                        {" "}
                        {summary.pending_guest_count}명 있습니다.
                    </p>
                )}

                <div className="club-event-management-buttons">
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/clubs/${clubId}/manage/events/`
                                + `${eventId}/participants`
                            )
                        }
                    >
                        <FiUserPlus />
                        참가자 관리
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/clubs/${clubId}/manage/events/`
                                + `${eventId}/edit`
                            )
                        }
                    >
                        <FiEdit2 />
                        일정 수정
                    </button>

                    <button
                        type="button"
                        className="danger"
                        disabled={isDeleting}
                        onClick={handleDelete}
                    >
                        <FiTrash2 />

                        {isDeleting
                            ? "삭제 중"
                            : "일정 삭제"}
                    </button>
                </div>
            </section>
        </main>
    );
}


export default ClubEventDetail;