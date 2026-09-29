import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiChevronLeft,
    FiSave
} from "react-icons/fi";

import CustomSelect from "../../components/common/CustomSelect";

import {
    getClubSettings,
    updateClubSettings
} from "../../api/clubApi";

import "./ClubSettings.css";


const FREQUENCY_OPTIONS = [
    { value: "주 1회", label: "주 1회" },
    { value: "주 2회", label: "주 2회" },
    { value: "주 3~4회", label: "주 3~4회" },
    { value: "비정기 활동", label: "비정기 활동" },
    { value: "자유 참여", label: "자유 참여" }
];


function ClubBasicSettings() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        clubName: "",
        sportName: "",
        activityFrequency: "",
        maxMembers: "",
        monthlyFee: 30000
    });

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {
        let isActive = true;

        getClubSettings(clubId)
            .then((result) => {
                if (!isActive) {
                    return;
                }

                setFormData({
                    clubName:
                        result.club_name || "",
                    sportName:
                        result.sport_name || "",
                    activityFrequency:
                        result.activity_frequency || "",
                    maxMembers:
                        result.max_members ?? "",
                    monthlyFee:
                        result.monthly_fee ?? 30000
                });
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "동호회 설정을 불러오지 못했습니다."
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
        const trimmedClubName =
            formData.clubName.trim();

        if (!trimmedClubName) {
            alert("동호회 이름을 입력해주세요.");
            return;
        }

        if (!formData.activityFrequency) {
            alert("활동 빈도를 선택해주세요.");
            return;
        }

        if (
            formData.maxMembers !== ""
            && Number(formData.maxMembers) < 1
        ) {
            alert(
                "최대 회원 수는 1명 이상으로 입력해주세요."
            );
            return;
        }

        if (
            formData.monthlyFee === ""
            || Number(formData.monthlyFee) < 0
        ) {
            alert(
                "월 회비를 0원 이상으로 입력해주세요."
            );
            return;
        }

        setIsSaving(true);
        setErrorMessage("");

        try {
            const result = await updateClubSettings(
                clubId,
                {
                    clubName: trimmedClubName,
                    activityFrequency:
                        formData.activityFrequency,
                    maxMembers:
                        formData.maxMembers === ""
                            ? null
                            : Number(
                                formData.maxMembers
                            ),
                    monthlyFee: Number(
                        formData.monthlyFee
                    )
                }
            );

            alert(
                result.message ||
                "동호회 기본 정보가 수정되었습니다."
            );

            navigate(
                `/clubs/${clubId}/manage/settings`
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "동호회 기본 정보 수정에 실패했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-settings-state">
                동호회 설정을 불러오는 중입니다.
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
                    <FiChevronLeft />
                </button>

                <h1>기본 정보 수정</h1>

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
                        <label htmlFor="settings-club-name">
                            동호회 이름
                        </label>

                        <input
                            id="settings-club-name"
                            type="text"
                            className="club-settings-input"
                            maxLength={50}
                            value={formData.clubName}
                            onChange={(event) =>
                                updateField(
                                    "clubName",
                                    event.target.value
                                )
                            }
                        />

                        <span className="club-settings-character-count">
                            {formData.clubName.length}/50
                        </span>
                    </div>

                    <div className="club-settings-field">
                        <label>운동 종목</label>

                        <input
                            type="text"
                            className="club-settings-input readonly"
                            value={formData.sportName}
                            readOnly
                        />

                        <small>
                            운동 종목은 활동 정보 수정에서
                            변경할 수 있습니다.
                        </small>
                    </div>

                    <div className="club-settings-field">
                        <label>활동 빈도</label>

                        <CustomSelect
                            value={
                                formData.activityFrequency
                            }
                            options={FREQUENCY_OPTIONS}
                            placeholder="활동 빈도를 선택해주세요"
                            ariaLabel="활동 빈도 선택"
                            onChange={(value) =>
                                updateField(
                                    "activityFrequency",
                                    value
                                )
                            }
                        />
                    </div>

                    <div className="club-settings-field">
                        <label htmlFor="settings-max-members">
                            최대 회원 수
                        </label>

                        <div className="club-settings-unit-input">
                            <input
                                id="settings-max-members"
                                type="number"
                                className="club-settings-input"
                                min="1"
                                inputMode="numeric"
                                value={formData.maxMembers}
                                placeholder="비워두면 제한 없음"
                                onChange={(event) =>
                                    updateField(
                                        "maxMembers",
                                        event.target.value
                                    )
                                }
                            />

                            <span>명</span>
                        </div>
                    </div>

                    <div className="club-settings-field">
                        <label htmlFor="settings-monthly-fee">
                            월 회비
                        </label>

                        <div className="club-settings-unit-input">
                            <input
                                id="settings-monthly-fee"
                                type="number"
                                className="club-settings-input"
                                min="0"
                                step="1000"
                                inputMode="numeric"
                                value={formData.monthlyFee}
                                onChange={(event) =>
                                    updateField(
                                        "monthlyFee",
                                        event.target.value
                                    )
                                }
                            />

                            <span>원</span>
                        </div>

                        <small>
                            회비가 없다면 0원을 입력해주세요.
                        </small>
                    </div>
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


export default ClubBasicSettings;