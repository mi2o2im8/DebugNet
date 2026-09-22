import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiCalendar,
    FiChevronLeft,
    FiClock,
    FiMapPin,
    FiSave,
    FiUsers
} from "react-icons/fi";

import {
    createClubEvent,
    getClubEvent,
    updateClubEvent
} from "../../api/clubApi";

import "./ClubEventForm.css";


const INITIAL_FORM = {
    title: "",
    description: "",

    eventDate: "",
    startTime: "",
    endTime: "",

    location: "",

    eventType: "regular",
    recurrenceType: "none",

    maxParticipants: "",
    participationMethod: "open",

    guestAllowed: false,
    maxGuests: "0",

    registrationDeadline: "",
    eventImageUrl: "",

    voteOptions: [
        "참석",
        "불참",
        "미정"
    ]
};


function toDatetimeLocal(value) {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 16);
}


function ClubEventForm() {
    const {
        clubId,
        eventId
    } = useParams();

    const navigate = useNavigate();

    const isEditMode = Boolean(eventId);

    const [formData, setFormData] =
        useState(INITIAL_FORM);

    const [isLoading, setIsLoading] =
        useState(isEditMode);

    const [isSaving, setIsSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    // -----------------------------------------------------
    // 수정 화면인 경우 기존 일정 조회
    // -----------------------------------------------------
    useEffect(() => {
        if (!isEditMode) {
            return undefined;
        }

        let cancelled = false;

        getClubEvent(
            clubId,
            eventId
        )
            .then((event) => {
                if (cancelled) {
                    return;
                }

                setFormData({
                    title: event.title || "",

                    description:
                        event.description || "",

                    eventDate:
                        event.event_date || "",

                    startTime:
                        event.start_time
                            ?.slice(0, 5) || "",

                    endTime:
                        event.end_time
                            ?.slice(0, 5) || "",

                    location:
                        event.location || "",

                    eventType:
                        event.event_type ||
                        "regular",

                    recurrenceType:
                        event.recurrence_type ||
                        "none",

                    maxParticipants:
                        event.max_participants ??
                        "",

                    participationMethod:
                        event.participation_method ||
                        "open",

                    guestAllowed:
                        Boolean(
                            event.guest_allowed
                        ),

                    maxGuests:
                        String(
                            event.max_guests ?? 0
                        ),

                    registrationDeadline:
                        toDatetimeLocal(
                            event
                                .registration_deadline
                        ),

                    eventImageUrl:
                        event.event_image_url || "",

                    voteOptions:
                        event.vote_options
                            ?.length >= 2
                            ? event.vote_options
                            : INITIAL_FORM
                                .voteOptions
                });
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "일정 정보를 불러오지 못했습니다."
                );
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [
        clubId,
        eventId,
        isEditMode
    ]);

    // -----------------------------------------------------
    // 입력값 변경
    // -----------------------------------------------------
    const updateField = (
        fieldName,
        value
    ) => {
        setFormData(
            (current) => ({
                ...current,
                [fieldName]: value
            })
        );
    };

    const handleGuestAllowedChange = (
        checked
    ) => {
        setFormData(
            (current) => ({
                ...current,

                guestAllowed: checked,

                maxGuests: checked
                    ? (
                        current.maxGuests === "0"
                            ? "1"
                            : current.maxGuests
                    )
                    : "0"
            })
        );
    };

    // -----------------------------------------------------
    // 일정 생성 또는 수정
    // -----------------------------------------------------
    const handleSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");

        if (
            formData.endTime
            && formData.endTime
                <= formData.startTime
        ) {
            setErrorMessage(
                "종료 시간은 시작 시간보다 "
                + "늦어야 합니다."
            );

            return;
        }

        const requestData = {
            title: formData.title.trim(),

            description:
                formData.description.trim() ||
                null,

            eventDate:
                formData.eventDate,

            startTime:
                formData.startTime,

            endTime:
                formData.endTime || null,

            location:
                formData.location.trim() ||
                null,

            eventType:
                formData.eventType,

            recurrenceType:
                formData.recurrenceType,

            maxParticipants:
                formData.maxParticipants === ""
                    ? null
                    : Number(
                        formData.maxParticipants
                    ),

            participationMethod:
                formData.participationMethod,

            guestAllowed:
                formData.guestAllowed,

            maxGuests:
                formData.guestAllowed
                    ? Number(
                        formData.maxGuests
                    )
                    : 0,

            registrationDeadline:
                formData.registrationDeadline ||
                null,

            eventImageUrl:
                formData.eventImageUrl ||
                null,

            voteOptions:
                formData.voteOptions
        };

        setIsSaving(true);

        try {
            const result = isEditMode
                ? await updateClubEvent(
                    clubId,
                    eventId,
                    requestData
                )
                : await createClubEvent(
                    clubId,
                    requestData
                );

            alert(result.message);

            navigate(
                `/clubs/${clubId}/manage/events`,
                {
                    replace: true
                }
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "일정을 저장하지 못했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-event-form-state">
                일정 정보를 불러오는 중입니다.
            </main>
        );
    }

    return (
        <main className="club-event-form-page">
            <header className="club-event-form-header">
                <button
                    type="button"
                    aria-label="이전"
                    onClick={() => navigate(-1)}
                >
                    <FiChevronLeft />
                </button>

                <div>
                    <h1>
                        {isEditMode
                            ? "일정 수정"
                            : "일정 만들기"}
                    </h1>

                    <p>
                        {isEditMode
                            ? `일정 #${eventId}`
                            : "새 활동 일정을 등록합니다."}
                    </p>
                </div>
            </header>

            <form
                className="club-event-form"
                onSubmit={handleSubmit}
            >
                <section>
                    <h2>
                        <FiCalendar />
                        기본 정보
                    </h2>

                    <label>
                        <span>
                            일정명
                            <strong> *</strong>
                        </span>

                        <input
                            type="text"
                            maxLength="50"
                            required
                            value={formData.title}
                            onChange={(event) =>
                                updateField(
                                    "title",
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label>
                        <span>일정 설명</span>

                        <textarea
                            rows="4"
                            maxLength="2000"
                            value={
                                formData.description
                            }
                            onChange={(event) =>
                                updateField(
                                    "description",
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <div className="club-event-form-grid">
                        <label>
                            <span>일정 유형</span>

                            <select
                                value={
                                    formData.eventType
                                }
                                onChange={(event) =>
                                    updateField(
                                        "eventType",
                                        event.target.value
                                    )
                                }
                            >
                                <option value="regular">
                                    정기 활동
                                </option>

                                <option value="special">
                                    특별 활동
                                </option>
                            </select>
                        </label>

                        <label>
                            <span>반복</span>

                            <select
                                value={
                                    formData
                                        .recurrenceType
                                }
                                onChange={(event) =>
                                    updateField(
                                        "recurrenceType",
                                        event.target.value
                                    )
                                }
                            >
                                <option value="none">
                                    반복 안 함
                                </option>

                                <option value="weekly">
                                    매주 반복
                                </option>

                                <option value="monthly">
                                    매월 반복
                                </option>

                                <option value="custom">
                                    직접 날짜 선택
                                </option>
                            </select>
                        </label>
                    </div>
                </section>

                <section>
                    <h2>
                        <FiClock />
                        날짜와 시간
                    </h2>

                    <label>
                        <span>
                            활동 날짜
                            <strong> *</strong>
                        </span>

                        <input
                            type="date"
                            required
                            value={formData.eventDate}
                            onChange={(event) =>
                                updateField(
                                    "eventDate",
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <div className="club-event-form-grid">
                        <label>
                            <span>
                                시작 시간
                                <strong> *</strong>
                            </span>

                            <input
                                type="time"
                                required
                                value={
                                    formData.startTime
                                }
                                onChange={(event) =>
                                    updateField(
                                        "startTime",
                                        event.target.value
                                    )
                                }
                            />
                        </label>

                        <label>
                            <span>종료 시간</span>

                            <input
                                type="time"
                                value={
                                    formData.endTime
                                }
                                onChange={(event) =>
                                    updateField(
                                        "endTime",
                                        event.target.value
                                    )
                                }
                            />
                        </label>
                    </div>

                    <label>
                        <span>신청 마감</span>

                        <input
                            type="datetime-local"
                            value={
                                formData
                                    .registrationDeadline
                            }
                            onChange={(event) =>
                                updateField(
                                    "registrationDeadline",
                                    event.target.value
                                )
                            }
                        />
                    </label>
                </section>

                <section>
                    <h2>
                        <FiMapPin />
                        장소
                    </h2>

                    <label>
                        <span>활동 장소</span>

                        <input
                            type="text"
                            maxLength="200"
                            placeholder="예: 여의도 한강공원"
                            value={formData.location}
                            onChange={(event) =>
                                updateField(
                                    "location",
                                    event.target.value
                                )
                            }
                        />
                    </label>
                </section>

                <section>
                    <h2>
                        <FiUsers />
                        참여 설정
                    </h2>

                    <div className="club-event-form-grid">
                        <label>
                            <span>전체 정원</span>

                            <input
                                type="number"
                                min="1"
                                placeholder="제한 없음"
                                value={
                                    formData
                                        .maxParticipants
                                }
                                onChange={(event) =>
                                    updateField(
                                        "maxParticipants",
                                        event.target.value
                                    )
                                }
                            />
                        </label>

                        <label>
                            <span>참여 방식</span>

                            <select
                                value={
                                    formData
                                        .participationMethod
                                }
                                onChange={(event) =>
                                    updateField(
                                        "participationMethod",
                                        event.target.value
                                    )
                                }
                            >
                                <option value="open">
                                    바로 참여
                                </option>

                                <option value="approval">
                                    운영자 승인
                                </option>
                            </select>
                        </label>
                    </div>

                    <label className="club-event-toggle-row">
                        <span>
                            <strong>게스트 모집</strong>

                            <small>
                                운영자 승인 후 참여가
                                확정됩니다.
                            </small>
                        </span>

                        <input
                            type="checkbox"
                            checked={
                                formData.guestAllowed
                            }
                            onChange={(event) =>
                                handleGuestAllowedChange(
                                    event.target.checked
                                )
                            }
                        />
                    </label>

                    {formData.guestAllowed && (
                        <label>
                            <span>
                                최대 게스트 인원
                            </span>

                            <input
                                type="number"
                                min="1"
                                required
                                value={
                                    formData.maxGuests
                                }
                                onChange={(event) =>
                                    updateField(
                                        "maxGuests",
                                        event.target.value
                                    )
                                }
                            />
                        </label>
                    )}
                </section>

                {errorMessage && (
                    <p className="club-event-form-error">
                        {errorMessage}
                    </p>
                )}

                <div className="club-event-form-actions">
                    <button
                        type="button"
                        className="secondary"
                        disabled={isSaving}
                        onClick={() => navigate(-1)}
                    >
                        취소
                    </button>

                    <button
                        type="submit"
                        className="primary"
                        disabled={isSaving}
                    >
                        <FiSave />

                        {isSaving
                            ? "저장 중..."
                            : "일정 저장"}
                    </button>
                </div>
            </form>
        </main>
    );
}


export default ClubEventForm;