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
    FiCheck,
    FiChevronLeft,
    FiChevronRight,
    FiClock,
    FiMapPin,
    FiSave,
    FiUsers
} from "react-icons/fi";

import ClubEventPlacePicker
    from "./components/ClubEventPlacePicker";

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
    locationAddress: "",
    latitude: null,
    longitude: null,

    eventType: "regular",
    recurrenceType: "none",

    maxParticipants: "",
    participationMethod: "open",

    guestAllowed: false,
    maxGuests: "0",

    registrationDeadline: "",
    eventImageUrl: ""
};

const EVENT_STEPS = [
    {
        number: 1,
        label: "기본 정보"
    },
    {
        number: 2,
        label: "날짜·시간"
    },
    {
        number: 3,
        label: "장소"
    },
    {
        number: 4,
        label: "참여·투표"
    },
    {
        number: 5,
        label: "확인"
    }
];


const EVENT_TYPE_LABELS = {
    regular: "정기 활동",
    special: "특별 활동"
};


const RECURRENCE_TYPE_LABELS = {
    none: "반복 안 함",
    weekly: "매주 반복",
    monthly: "매월 반복",
    custom: "직접 날짜 선택"
};


const PARTICIPATION_METHOD_LABELS = {
    open: "바로 참여",
    approval: "운영자 승인"
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

    const [activeStep, setActiveStep] =
        useState(1);

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

                    locationAddress:
                        event.location_address || "",

                    latitude:
                        event.latitude ?? null,

                    longitude:
                        event.longitude ?? null,

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
                        event.event_image_url || ""

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


    // -----------------------------------------------------
    // 장소 정보 전체 변경
    // -----------------------------------------------------
    const handlePlaceChange = (
        placeData
    ) => {
        setFormData(
            (current) => ({
                ...current,
                ...placeData
            })
        );
    };


    // -----------------------------------------------------
    // 게스트 모집 설정 변경
    // -----------------------------------------------------
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
    // 단계별 입력값 검증
    // -----------------------------------------------------
    const validateStep = (
        stepNumber
    ) => {
        setErrorMessage("");

        if (stepNumber === 1) {
            if (!formData.title.trim()) {
                setErrorMessage(
                    "일정명을 입력해주세요."
                );

                return false;
            }
        }

        if (stepNumber === 2) {
            if (!formData.eventDate) {
                setErrorMessage(
                    "활동 날짜를 선택해주세요."
                );

                return false;
            }

            if (!formData.startTime) {
                setErrorMessage(
                    "시작 시간을 입력해주세요."
                );

                return false;
            }

            if (
                formData.endTime
                && formData.endTime
                    <= formData.startTime
            ) {
                setErrorMessage(
                    "종료 시간은 시작 시간보다 "
                    + "늦어야 합니다."
                );

                return false;
            }
        }

        if (stepNumber === 3) {
            const hasLatitude =
                formData.latitude !== null;

            const hasLongitude =
                formData.longitude !== null;

            if (hasLatitude !== hasLongitude) {
                setErrorMessage(
                    "장소 좌표를 다시 선택해주세요."
                );

                return false;
            }
        }

        if (stepNumber === 4) {
            if (
                formData.maxParticipants !== ""
                && Number(
                    formData.maxParticipants
                ) < 1
            ) {
                setErrorMessage(
                    "전체 정원은 1명 이상이어야 합니다."
                );

                return false;
            }

            if (
                formData.guestAllowed
                && Number(formData.maxGuests) < 1
            ) {
                setErrorMessage(
                    "최대 게스트 인원을 "
                    + "입력해주세요."
                );

                return false;
            }

            if (
                formData.guestAllowed
                && formData.maxParticipants !== ""
                && Number(formData.maxGuests)
                    > Number(
                        formData.maxParticipants
                    )
            ) {
                setErrorMessage(
                    "최대 게스트 인원은 전체 정원을 "
                    + "초과할 수 없습니다."
                );

                return false;
            }

            if (
                formData.registrationDeadline
                && formData.eventDate
                && formData
                    .registrationDeadline
                    .slice(0, 10)
                    > formData.eventDate
            ) {
                setErrorMessage(
                    "투표 마감일은 일정 날짜보다 "
                    + "늦을 수 없습니다."
                );

                return false;
            }
        }

        return true;
    };


    // -----------------------------------------------------
    // 다음·이전 단계 이동
    // -----------------------------------------------------
    const handleNextStep = () => {
        if (!validateStep(activeStep)) {
            return;
        }

        setActiveStep(
            (current) =>
                Math.min(current + 1, 5)
        );
    };


    const handlePreviousStep = () => {
        setErrorMessage("");

        setActiveStep(
            (current) =>
                Math.max(current - 1, 1)
        );
    };


    const handleHeaderBack = () => {
        if (activeStep > 1) {
            handlePreviousStep();
            return;
        }

        navigate(-1);
    };

    // -----------------------------------------------------
    // 일정 생성 또는 수정
    // -----------------------------------------------------
    const handleSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");

        for (
            let stepNumber = 1;
            stepNumber <= 4;
            stepNumber += 1
        ) {
            if (!validateStep(stepNumber)) {
                setActiveStep(stepNumber);
                return;
            }
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

            locationAddress:
                formData.locationAddress.trim()
                || null,

            latitude:
                formData.latitude,

            longitude:
                formData.longitude,

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
                null
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
                    onClick={handleHeaderBack}
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
                        {EVENT_STEPS[
                            activeStep - 1
                        ].label}
                    </p>
                </div>
            </header>

            <nav
                className="club-event-step-progress"
                aria-label="일정 등록 단계"
            >
                {EVENT_STEPS.map((step) => (
                    <div
                        key={step.number}
                        className={[
                            activeStep === step.number
                                ? "active"
                                : "",
                            activeStep > step.number
                                ? "completed"
                                : ""
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        <span>
                            {activeStep > step.number
                                ? <FiCheck />
                                : step.number}
                        </span>

                        <small>{step.label}</small>
                    </div>
                ))}
            </nav>

            <form
                className="club-event-form"
                onSubmit={handleSubmit}
            >
                {activeStep === 1 && (
                    <section className="club-event-form-step">
                        <div className="club-event-step-heading">
                            <span>1</span>

                            <div>
                                <h2>기본 정보</h2>

                                <p>
                                    일정의 이름과 활동 종류를
                                    입력해주세요.
                                </p>
                            </div>
                        </div>

                        <label>
                            <span>
                                일정명
                                <strong> *</strong>
                            </span>

                            <input
                                type="text"
                                maxLength="50"
                                value={formData.title}
                                placeholder="예: 한강 저녁 러닝"
                                onChange={(event) =>
                                    updateField(
                                        "title",
                                        event.target.value
                                    )
                                }
                            />

                            <small className="club-event-field-count">
                                {formData.title.length}/50
                            </small>
                        </label>

                        <label>
                            <span>활동 종류</span>

                            <select
                                value={formData.eventType}
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
                            <span>일정 설명</span>

                            <textarea
                                rows="5"
                                maxLength="2000"
                                placeholder={
                                    "참여자가 알아야 할 내용을 "
                                    + "입력해주세요."
                                }
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
                    </section>
                )}

                {activeStep === 2 && (
                    <section className="club-event-form-step">
                        <div className="club-event-step-heading">
                            <span>2</span>

                            <div>
                                <h2>날짜와 시간</h2>

                                <p>
                                    활동이 진행되는 날짜와 시간을
                                    설정해주세요.
                                </p>
                            </div>
                        </div>

                        <label>
                            <span>
                                활동 날짜
                                <strong> *</strong>
                            </span>

                            <input
                                type="date"
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
                                    value={formData.endTime}
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
                            <span>반복 일정</span>

                            <select
                                value={
                                    formData.recurrenceType
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

                        {
                            formData.recurrenceType
                            !== "none"
                            && (
                                <p className="club-event-recurrence-note">
                                    반복 일정의 날짜별 참석 투표는
                                    준비된 반복 일정 구조를 기준으로
                                    연결됩니다.
                                </p>
                            )
                        }
                    </section>
                )}

                {activeStep === 3 && (
                    <section className="club-event-form-step">
                        <div className="club-event-step-heading">
                            <span>3</span>

                            <div>
                                <h2>장소 설정</h2>

                                <p>
                                    지도에서 장소를 찾거나 직접
                                    설명을 입력할 수 있습니다.
                                </p>
                            </div>
                        </div>

                        <ClubEventPlacePicker
                            location={formData.location}
                            locationAddress={
                                formData.locationAddress
                            }
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onChange={handlePlaceChange}
                        />
                    </section>
                )}

                {activeStep === 4 && (
                    <section className="club-event-form-step">
                        <div className="club-event-step-heading">
                            <span>4</span>

                            <div>
                                <h2>참여 및 투표 설정</h2>

                                <p>
                                    참여 인원과 참석 투표 방식을
                                    설정해주세요.
                                </p>
                            </div>
                        </div>

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

                        <label>
                            <span>투표 마감</span>

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
                )}

                {activeStep === 5 && (
                    <section className="club-event-form-step">
                        <div className="club-event-step-heading">
                            <span>5</span>

                            <div>
                                <h2>확인 및 등록</h2>

                                <p>
                                    입력한 내용을 마지막으로
                                    확인해주세요.
                                </p>
                            </div>
                        </div>

                        <div className="club-event-review">
                            <div>
                                <FiCalendar />

                                <span>
                                    <small>일정 제목</small>
                                    <strong>
                                        {formData.title}
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiUsers />

                                <span>
                                    <small>활동 종류</small>
                                    <strong>
                                        {
                                            EVENT_TYPE_LABELS[
                                                formData
                                                    .eventType
                                            ]
                                        }
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiCalendar />

                                <span>
                                    <small>날짜</small>
                                    <strong>
                                        {formData.eventDate}
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiClock />

                                <span>
                                    <small>시간</small>
                                    <strong>
                                        {formData.startTime}
                                        {
                                            formData.endTime
                                                ? (
                                                    ` - ${
                                                        formData
                                                            .endTime
                                                    }`
                                                )
                                                : ""
                                        }
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiClock />

                                <span>
                                    <small>반복</small>
                                    <strong>
                                        {
                                            RECURRENCE_TYPE_LABELS[
                                                formData
                                                    .recurrenceType
                                            ]
                                        }
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiMapPin />

                                <span>
                                    <small>장소</small>
                                    <strong>
                                        {
                                            formData.location
                                            || "장소 미정"
                                        }
                                    </strong>

                                    {formData.locationAddress && (
                                        <em>
                                            {
                                                formData
                                                    .locationAddress
                                            }
                                        </em>
                                    )}
                                </span>
                            </div>

                            <div>
                                <FiUsers />

                                <span>
                                    <small>전체 정원</small>
                                    <strong>
                                        {
                                            formData
                                                .maxParticipants
                                            ? (
                                                `${
                                                    formData
                                                        .maxParticipants
                                                }명`
                                            )
                                            : "제한 없음"
                                        }
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiCheck />

                                <span>
                                    <small>참여 방식</small>
                                    <strong>
                                        {
                                            PARTICIPATION_METHOD_LABELS[
                                                formData
                                                    .participationMethod
                                            ]
                                        }
                                    </strong>
                                </span>
                            </div>

                            <div>
                                <FiUsers />

                                <span>
                                    <small>게스트 모집</small>
                                    <strong>
                                        {
                                            formData.guestAllowed
                                                ? (
                                                    `허용 · 최대 ${
                                                        formData
                                                            .maxGuests
                                                    }명`
                                                )
                                                : "허용 안 함"
                                        }
                                    </strong>
                                </span>
                            </div>

                        </div>
                    </section>
                )}

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
                        onClick={
                            activeStep === 1
                                ? () => navigate(-1)
                                : handlePreviousStep
                        }
                    >
                        <FiChevronLeft />

                        {activeStep === 1
                            ? "취소"
                            : "이전"}
                    </button>

                    {activeStep < 5 ? (
                        <button
                            type="button"
                            className="primary"
                            disabled={isSaving}
                            onClick={handleNextStep}
                        >
                            다음
                            <FiChevronRight />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            className="primary"
                            disabled={isSaving}
                        >
                            <FiSave />

                            {isSaving
                                ? "저장 중..."
                                : (
                                    isEditMode
                                        ? "수정 완료"
                                        : "일정 등록하기"
                                )}
                        </button>
                    )}
                </div>
            </form>
        </main>
);
}


export default ClubEventForm;