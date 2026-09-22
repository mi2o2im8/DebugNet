import {
    FiActivity,
    FiAward,
    FiCheck,
    FiGrid,
    FiSmile,
    FiTrendingUp,
    FiUsers
} from "react-icons/fi";

const LEVEL_OPTIONS = [
    {
        value: "입문 가능",
        label: "입문 가능",
        description: "초보자 환영",
        icon: FiSmile
    },
    {
        value: "초급 중심",
        label: "초급 중심",
        icon: FiTrendingUp
    },
    {
        value: "중급 중심",
        label: "중급 중심",
        icon: FiActivity
    },
    {
        value: "상급 중심",
        label: "상급 중심",
        icon: FiAward
    },
    {
        value: "수준 무관",
        label: "수준 무관",
        icon: FiUsers
    },
    {
        value: "실력별 그룹 운영",
        label: "실력별 그룹 운영",
        icon: FiGrid
    }
];

const GENDER_OPTIONS = [
    {
        value: "all",
        label: "남녀 모두"
    },
    {
        value: "male",
        label: "남성만"
    },
    {
        value: "female",
        label: "여성만"
    }
];

const AGE_OPTIONS = [
    "10대",
    "20대",
    "30대",
    "40대",
    "50대",
    "60대 이상"
];

function ConditionStep({ formData, onChange }) {
    const activityLevels = formData.activityLevels ?? [];
    const ageGroups = formData.ageGroups ?? [];

    const toggleActivityLevel = (level) => {
        const isSelected = activityLevels.includes(level);

        const updatedLevels = isSelected
            ? activityLevels.filter((item) => item !== level)
            : [...activityLevels, level];

        onChange("activityLevels", updatedLevels);
    };

    const toggleAgeGroup = (age) => {
        const isSelected = ageGroups.includes(age);

        const updatedAges = isSelected
            ? ageGroups.filter((item) => item !== age)
            : [...ageGroups, age];

        onChange("ageGroups", updatedAges);
        onChange("noAgeLimit", false);
    };

    const handleNoAgeLimit = () => {
        const nextValue = !formData.noAgeLimit;

        onChange("noAgeLimit", nextValue);

        if (nextValue) {
            onChange("ageGroups", []);
        }
    };

    return (
        <div className="club-condition-step">
            <div className="club-condition-heading">
                <h2>어떤 스타일의 동호회인가요?</h2>

                <p>
                    우리 동호회의 성격과 가입 대상을 설정해요.
                </p>
            </div>

            {/* 운동 수준 */}
            <div className="club-create-field">
                <label>
                    운동 수준 <span>(복수 선택 가능)</span>
                    <em>*</em>
                </label>

                <div className="club-level-grid">
                    {LEVEL_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected = activityLevels.includes(
                            option.value
                        );

                        return (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    isSelected
                                        ? "club-level-option selected"
                                        : "club-level-option"
                                }
                                onClick={() =>
                                    toggleActivityLevel(option.value)
                                }
                                aria-pressed={isSelected}
                            >
                                <span className="club-level-icon">
                                    <Icon />
                                </span>

                                <span className="club-level-text">
                                    <strong>{option.label}</strong>

                                    {option.description && (
                                        <small>
                                            {option.description}
                                        </small>
                                    )}
                                </span>

                                <span className="club-option-check">
                                    {isSelected && <FiCheck />}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 가입 대상 */}
            <div className="club-create-field">
                <label>
                    가입 대상 <span>(단일 선택)</span>
                    <em>*</em>
                </label>

                <div
                    className="club-gender-grid"
                    role="radiogroup"
                    aria-label="가입 대상 선택"
                >
                    {GENDER_OPTIONS.map((option) => {
                        const isSelected =
                            formData.joinTarget === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                className={
                                    isSelected
                                        ? "club-gender-option selected"
                                        : "club-gender-option"
                                }
                                onClick={() =>
                                    onChange(
                                        "joinTarget",
                                        option.value
                                    )
                                }
                            >
                                <span className="club-option-radio">
                                    {isSelected && <span />}
                                </span>

                                <span>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 연령 조건 */}
            <div className="club-create-field">
                <label>
                    연령 조건 <span>(복수 선택 가능)</span>
                    <em>*</em>
                </label>

                <div className="club-age-grid">
                    {AGE_OPTIONS.map((age) => {
                        const isSelected = ageGroups.includes(age);

                        return (
                            <button
                                key={age}
                                type="button"
                                className={
                                    isSelected
                                        ? "club-age-option selected"
                                        : "club-age-option"
                                }
                                onClick={() => toggleAgeGroup(age)}
                                aria-pressed={isSelected}
                            >
                                <span className="club-age-checkbox">
                                    {isSelected && <FiCheck />}
                                </span>

                                <span>{age}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className={
                        formData.noAgeLimit
                            ? "club-no-age-limit selected"
                            : "club-no-age-limit"
                    }
                    onClick={handleNoAgeLimit}
                    aria-pressed={formData.noAgeLimit}
                >
                    <span className="club-age-checkbox">
                        {formData.noAgeLimit && <FiCheck />}
                    </span>

                    <span>연령 제한 없음</span>
                </button>

                <p className="club-condition-guide">
                    선택한 연령대의 회원들이 가입할 수 있어요.
                </p>
            </div>
        </div>
    );
}

export default ConditionStep;