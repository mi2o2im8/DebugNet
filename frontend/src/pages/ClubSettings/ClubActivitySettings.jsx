import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiSave
} from "react-icons/fi";

import {
    BackButtonIcon
} from "../../components/BackButton/BackButton";

import CustomSelect from "../../components/common/CustomSelect";
import ScheduleStep from "../ClubCreate/ScheduleStep";

import {
    getClubActivitySettings,
    updateClubActivitySettings
} from "../../api/clubApi";

import footballIcon from "../../assets/img/sports/ball.png";
import basketballIcon from "../../assets/img/sports/basketball.png";
import volleyballIcon from "../../assets/img/sports/volleyball-ball.png";
import pingPongIcon from "../../assets/img/sports/ping-pong.png";
import tennisIcon from "../../assets/img/sports/tennis-ball.png";

import "./ClubSettings.css";
import "../ClubCreate/ClubCreate.css";


const SPORT_OPTIONS = [
    {
        value: "축구·풋살",
        label: "축구/풋살",
        icon: footballIcon
    },
    {
        value: "농구",
        label: "농구",
        icon: basketballIcon
    },
    {
        value: "배구",
        label: "배구",
        icon: volleyballIcon
    },
    {
        value: "탁구",
        label: "탁구",
        icon: pingPongIcon
    },
    {
        value: "테니스",
        label: "테니스",
        icon: tennisIcon
    }
];


const createDefaultSchedule = () => ({
    id: Date.now(),
    day: "월요일",
    startTime: "19:00",
    endTime: "21:00",
    enabled: true
});


const parseRegion = (region) => {
    const parts = String(region || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return {
            city: "서울특별시",
            district: ""
        };
    }

    if (parts.length === 1) {
        const onlyValue = parts[0];

        if (
            onlyValue.endsWith("구")
            || onlyValue.endsWith("군")
        ) {
            return {
                city: "서울특별시",
                district: onlyValue
            };
        }

        return {
            city: onlyValue,
            district: ""
        };
    }

    return {
        city: parts[0],
        district: parts.slice(1).join(" ")
    };
};


function ClubActivitySettings() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        sport: "",
        city: "서울특별시",
        district: "",
        activityPlace: "",
        activityPlaceDetail: "",
        activityFrequency: "",
        schedules: [
            createDefaultSchedule()
        ]
    });

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {
        let isActive = true;

        getClubActivitySettings(clubId)
            .then((result) => {
                if (!isActive) {
                    return;
                }

                const parsedRegion = parseRegion(
                    result.region
                );

                const loadedSchedules = (
                    result.schedules || []
                ).map((schedule) => ({
                    id:
                        schedule.club_schedule_id
                        ?? `${schedule.day_of_week}-${schedule.start_time}`,
                    clubScheduleId:
                        schedule.club_schedule_id ?? null,
                    day:
                        schedule.day_of_week || "",
                    startTime: String(
                        schedule.start_time || ""
                    ).slice(0, 5),
                    endTime: String(
                        schedule.end_time || ""
                    ).slice(0, 5),
                    enabled: true
                }));

                setFormData({
                    sport:
                        result.sport_name || "",
                    city:
                        parsedRegion.city,
                    district:
                        parsedRegion.district,
                    activityPlace:
                        result.venue_name || "",
                    activityPlaceDetail:
                        result.venue_address || "",
                    activityFrequency:
                        result.activity_frequency || "",
                    schedules:
                        loadedSchedules.length > 0
                            ? loadedSchedules
                            : [createDefaultSchedule()]
                });
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setErrorMessage(
                    error.message
                    || "동호회 활동 정보를 불러오지 못했습니다."
                );
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [clubId]);

    const updateField = (field, value) => {
        setFormData((previous) => ({
            ...previous,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.sport) {
            alert("운동 종목을 선택해주세요.");
            return;
        }

        if (
            !formData.city
            || !formData.district
        ) {
            alert("주요 활동 지역을 선택해주세요.");
            return;
        }

        if (!formData.activityPlace) {
            alert("주요 활동 장소를 선택해주세요.");
            return;
        }

        if (!formData.activityFrequency) {
            alert("활동 빈도를 선택해주세요.");
            return;
        }

        const activeSchedules =
            formData.schedules.filter(
                (schedule) => schedule.enabled
            );

        if (activeSchedules.length === 0) {
            alert("하나 이상의 활동 일정을 선택해주세요.");
            return;
        }

        const hasIncompleteSchedule =
            activeSchedules.some(
                (schedule) =>
                    !schedule.day
                    || !schedule.startTime
                    || !schedule.endTime
            );

        if (hasIncompleteSchedule) {
            alert(
                "활성화한 일정의 요일과 시간을 모두 입력해주세요."
            );
            return;
        }

        setIsSaving(true);
        setErrorMessage("");

        try {
            const result =
                await updateClubActivitySettings(
                    clubId,
                    {
                        sportName:
                            formData.sport,
                        region: [
                            formData.city,
                            formData.district
                        ]
                            .filter(Boolean)
                            .join(" "),
                        venueName:
                            formData.activityPlace,
                        venueAddress:
                            formData.activityPlaceDetail.trim()
                            || null,
                        activityFrequency:
                            formData.activityFrequency,
                        schedules:
                            formData.schedules.map(
                                (schedule) => ({
                                    clubScheduleId:
                                        schedule.clubScheduleId ?? null,
                                    day:
                                        schedule.day,
                                    startTime:
                                        schedule.startTime,
                                    endTime:
                                        schedule.endTime,
                                    enabled:
                                        schedule.enabled
                                })
                            )
                    }
                );

            alert(
                result.message
                || "동호회 활동 정보가 수정되었습니다."
            );

            navigate(
                `/clubs/${clubId}/manage/settings`
            );
        } catch (error) {
            setErrorMessage(
                error.message
                || "동호회 활동 정보 수정에 실패했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-settings-state">
                동호회 활동 정보를 불러오는 중입니다.
            </main>
        );
    }

    return (
        <main className="club-settings-page">
            <header className="club-settings-header">
                <button
                    type="button"
                    className="club-settings-back-button"
                    aria-label="동호회 설정으로 돌아가기"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage/settings`
                        )
                    }
                >
                    <BackButtonIcon />
                </button>

                <h1>활동 정보 수정</h1>

                <span
                    className="club-settings-header-space"
                    aria-hidden="true"
                />
            </header>

            <section className="club-settings-form-content">
                {errorMessage && (
                    <p className="club-settings-error">
                        {errorMessage}
                    </p>
                )}

                <div className="club-settings-form-card">
                    <div className="club-settings-field">
                        <label>운동 종목</label>

                        <CustomSelect
                            value={formData.sport}
                            options={SPORT_OPTIONS}
                            placeholder="운동 종목을 선택해주세요"
                            ariaLabel="운동 종목 선택"
                            onChange={(value) =>
                                updateField(
                                    "sport",
                                    value
                                )
                            }
                        />

                        <small>
                            종목을 변경하면 모집 추천과
                            가입 적합도 분석에도 반영됩니다.
                        </small>
                    </div>
                </div>

                <div className="club-settings-activity-form">
                    <ScheduleStep
                        formData={formData}
                        onChange={updateField}
                    />
                </div>

                <button
                    type="button"
                    className="club-settings-save-button"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <FiSave />

                    {isSaving
                        ? "저장 중..."
                        : "변경사항 저장"}
                </button>
            </section>
        </main>
    );
}


export default ClubActivitySettings;