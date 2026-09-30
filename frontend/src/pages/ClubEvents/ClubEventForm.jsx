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
    getClubEventRecommendations,
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

const H3_MISSING_LABELS = {
    venue_availability: "장소 이용 가능 시간",
    venue_coordinates: "장소 좌표",
    travel_minutes: "회원별 이동시간",
    club_sport: "동호회 종목",
    club_region: "동호회 지역",
    club_activity_frequency: "활동 빈도",
    club_schedules: "정기 일정",
    active_members: "활성 회원",
    member_availability: "일부 회원의 가능 시간",
    club_venue: "동호회 장소",
    venue_selection: "복수 장소 중 선택",
    supported_candidate_time: "추천 가능한 시간대",
    overnight_schedule_unsupported: "자정을 넘기는 정기 일정"
};

function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}


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

    const [recommendationWindow, setRecommendationWindow] =
        useState(() => {
            const start = new Date();
            const end = new Date(start);
            end.setDate(end.getDate() + 13);
            return {
                startDate: localDateString(start),
                endDate: localDateString(end),
                minimumParticipants: ""
            };
        });
    const [recommendationData, setRecommendationData] =
        useState(null);
    const [recommendationError, setRecommendationError] =
        useState("");
    const [isRecommending, setIsRecommending] =
        useState(false);

    useEffect(() => {
        setRecommendationData(null);
    }, [
        recommendationWindow.startDate,
        recommendationWindow.endDate,
        recommendationWindow.minimumParticipants,
        formData.guestAllowed,
        formData.maxGuests,
        formData.maxParticipants
    ]);

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

    const handleRecommend = async () => {
        setRecommendationError("");
        setRecommendationData(null);
        if (!recommendationWindow.minimumParticipants) {
            setRecommendationError(
                "추천에 필요한 최소 참여 인원을 입력해주세요."
            );
            return;
        }
        if (
            formData.maxParticipants !== ""
            && Number(recommendationWindow.minimumParticipants)
                > Number(formData.maxParticipants)
        ) {
            setRecommendationError(
                "최소 참여 인원은 전체 정원을 넘을 수 없습니다."
            );
            return;
        }
        setIsRecommending(true);
        try {
            const result = await getClubEventRecommendations(
                clubId,
                {
                    start_date: recommendationWindow.startDate,
                    end_date: recommendationWindow.endDate,
                    minimum_participants: Number(
                        recommendationWindow.minimumParticipants
                    ),
                    guest_allowed: formData.guestAllowed,
                    max_guests: formData.guestAllowed
                        ? Number(formData.maxGuests)
                        : 0
                }
            );
            setRecommendationData(result);
        } catch (error) {
            setRecommendationError(
                error.message || "일정 추천을 불러오지 못했습니다."
            );
        } finally {
            setIsRecommending(false);
        }
    };

    const applyRecommendation = (recommendation) => {
        setFormData((current) => ({
            ...current,
            eventDate: recommendation.event_date,
            startTime: recommendation.start_time.slice(0, 5),
            endTime: recommendation.end_time.slice(0, 5),
            ...(recommendation.venue_name ? {
                location: recommendation.venue_name,
                locationAddress: recommendation.venue_address || "",
                latitude: null,
                longitude: null
            } : {})
        }));
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

                if (isEditMode) {
            const confirmed = window.confirm(
                "일정을 수정하면 참여 확정 사용자에게 "
                + "변경 알림이 발송됩니다. 수정할까요?"
            );

            if (!confirmed) {
                return;
            }
        }

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
                isEditMode
                    ? (
                        `/clubs/${clubId}/manage/events/`
                        + eventId
                    )
                    : `/clubs/${clubId}/manage/events`,
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

                        {!isEditMode && (
                            <div className="club-event-h3">
                                <div className="club-event-h3-heading">
                                    <strong>AI 일정 추천</strong>
                                    <p>
                                        정기 일정과 회원 가능 시간을 바탕으로
                                        최대 3개를 제안합니다.
                                    </p>
                                </div>
                                <div className="club-event-h3-inputs">
                                    <label>
                                        <span>시작 날짜</span>
                                        <input
                                            type="date"
                                            value={recommendationWindow.startDate}
                                            onChange={(event) =>
                                                setRecommendationWindow(
                                                    (current) => ({
                                                        ...current,
                                                        startDate: event.target.value
                                                    })
                                                )
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>종료 날짜</span>
                                        <input
                                            type="date"
                                            value={recommendationWindow.endDate}
                                            onChange={(event) =>
                                                setRecommendationWindow(
                                                    (current) => ({
                                                        ...current,
                                                        endDate: event.target.value
                                                    })
                                                )
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span>최소 참여 인원</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="1000"
                                            placeholder="직접 입력"
                                            value={recommendationWindow.minimumParticipants}
                                            onChange={(event) =>
                                                setRecommendationWindow(
                                                    (current) => ({
                                                        ...current,
                                                        minimumParticipants: event.target.value
                                                    })
                                                )
                                            }
                                        />
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    className="club-event-h3-request"
                                    disabled={isRecommending}
                                    onClick={handleRecommend}
                                >
                                    {isRecommending
                                        ? "추천 계산 중..."
                                        : "추천 보기"}
                                </button>
                                {recommendationError && (
                                    <p className="club-event-h3-error">
                                        {recommendationError}
                                    </p>
                                )}
                                {recommendationData && (
                                    <div className="club-event-h3-results">
                                        <p className="club-event-h3-coverage">
                                            가능 시간 데이터가 있는 회원
                                            {" "}
                                            {recommendationData.data_coverage
                                                .members_with_availability}
                                            /{recommendationData.data_coverage
                                                .active_members}명
                                        </p>
                                        {recommendationData.recommendations
                                            .length === 0 && (
                                            <p>
                                                조건에 맞는 추천이 없습니다.
                                                기간이나 최소 인원을 조정해보세요.
                                            </p>
                                        )}
                                        {recommendationData.recommendations.map(
                                            (item) => (
                                                <div
                                                    className="club-event-h3-card"
                                                    key={`${item.event_date}-${item.start_time}`}
                                                >
                                                    <strong>
                                                        {item.rank}. {item.event_date}
                                                        {" "}
                                                        {item.start_time.slice(0, 5)}~
                                                        {item.end_time.slice(0, 5)}
                                                    </strong>
                                                    <span>
                                                        시간대 일치 회원
                                                        {" "}
                                                        {item.matching_member_count}
                                                        /{item.total_members}명
                                                    </span>
                                                    {item.guest_needed > 0 && (
                                                        <span>
                                                            게스트 {item.guest_needed}명 필요
                                                        </span>
                                                    )}
                                                    {item.venue_name && (
                                                        <span>
                                                            장소: {item.venue_name}
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            applyRecommendation(item)
                                                        }
                                                    >
                                                        폼에 적용
                                                    </button>
                                                </div>
                                            )
                                        )}
                                        <p className="club-event-h3-missing">
                                            장소 이용 가능 시간·이동시간은
                                            추천에 미적용입니다.
                                            {recommendationData.missing_fields
                                                .length > 0 && (
                                                <>
                                                    {" "}누락: {recommendationData
                                                        .missing_fields
                                                        .map((field) =>
                                                            H3_MISSING_LABELS[field]
                                                            || field
                                                        ).join(", ")}
                                                </>
                                            )}
                                        </p>
                                        <p className="club-event-h3-missing">
                                            추천을 적용해도 등록되지 않습니다.
                                            입력 내용을 확인한 뒤 기존 등록
                                            버튼을 눌러주세요.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

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
                                disabled={isEditMode}
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

                        {isEditMode && (
                            <p className="club-event-recurrence-note">
                                반복 설정 변경은 날짜별 일정과
                                참석 기록 보호를 위해 지원하지
                                않습니다.
                            </p>
                        )}

                        {
                            !isEditMode
                            &&
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
