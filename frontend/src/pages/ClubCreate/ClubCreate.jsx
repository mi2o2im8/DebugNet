import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import BasicInfoStep from "./BasicInfoStep";
import ScheduleStep from "./ScheduleStep";
import ConditionStep from "./ConditionStep";
import IntroductionStep from "./IntroductionStep";
import OperationStep from "./OperationStep";
import CompletionStep from "./CompletionStep";

import "./ClubCreate.css";

const STEP_TITLES = [
    "기본 정보 입력",
    "활동 일정 설정",
    "활동 조건 및 가입 대상",
    "동호회 소개 작성 (AI)",
    "가입 및 운영 방식",
    "개설 완료"
];

function ClubCreate() {
    const navigate = useNavigate();

    // 현재 페이지 단계
    const [currentStep, setCurrentStep] = useState(1);

    const [clubForm, setClubForm] = useState({
    // 1단계
    representativeImage: "",
    clubName: "",
    sport: "",
    city: "서울특별시",
    district: "",
    detailLocation: "",

    // 2단계
    schedules: [
            {
                id: 1,
                day: "월요일",
                startTime: "19:00",
                endTime: "21:00",
                enabled: true
            },
            {
                id: 2,
                day: "수요일",
                startTime: "19:00",
                endTime: "21:00",
                enabled: true
            },
            {
                id: 3,
                day: "토요일",
                startTime: "08:00",
                endTime: "10:00",
                enabled: true
            }
        ],

        activityPlace: "여의도 한강공원",
        activityPlaceDetail: "",
        activityFrequency: "주 2회",

        // 3단계
        activityLevels: [
            "입문 가능",
            "초급 중심"
        ],
        joinTarget: "모두",
        ageGroups: [
            "20대",
            "30대",
            "50대"
        ],
        noAgeLimit: false,

        // 4단계
        introKeywords: [
            "한강",
            "초보자 환영",
            "즐거운 분위기"
        ],
        clubDescription: "",
        activityImages: [],

        // 5단계
        joinMethod: "approval",
        maxMembers: "50",
        joinQuestions: [],

    });

    

    const handleFormChange = (field, value) => {
    setClubForm((previous) => ({
        ...previous,
        [field]: value
    }));
    };

    // 이전 버튼
    const handlePrevious = () => {
        if (currentStep === 1) {
            navigate(-1);
            return;
        }

        setCurrentStep(currentStep - 1);
        window.scrollTo(0, 0);
    };

    // 다음 버튼
    const handleNext = () => {
        if (currentStep >= 6) {
            return;
        }

        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };

    return (
        <main className="club-create-page">
            <section className="club-create-container">

                {/* 앱 상단 헤더 */}
                <header className="club-create-header">
                    <button
                        type="button"
                        className="club-create-back-button"
                        onClick={handlePrevious}
                        aria-label="이전 화면으로 이동"
                    >
                        <FiChevronLeft />
                    </button>

                    <h1 className="club-create-header-title">동호회 만들기</h1>

                    <span
                        className="club-create-header-space"
                        aria-hidden="true"
                    />
                </header>

                {/* 진행 단계 */}
                <div className="club-create-progress">

                    <div className="club-create-progress-top">
                        <span className="club-create-step-number">
                            {currentStep}
                        </span>

                        <div className="club-create-progress-track">
                            <div
                                className="club-create-progress-bar"
                                style={{
                                    width: `${(currentStep / 6) * 100}%`
                                }}
                            />
                        </div>
                    </div>

                    <div className="club-create-progress-info">
                        <span>{currentStep}/6</span>

                        <strong>
                            {STEP_TITLES[currentStep - 1]}
                        </strong>
                    </div>

                </div>

                {/* 각 페이지 내용 */}
                <div className="club-create-content">

                    {currentStep === 1 && (
                        <BasicInfoStep
                            formData={clubForm}
                            onChange={handleFormChange}
                        />
                    )}

                    {currentStep === 2 && (
                        <ScheduleStep
                            formData={clubForm}
                            onChange={handleFormChange}
                        />
                    )}

                    {currentStep === 3 && (
                        <ConditionStep
                            formData={clubForm}
                            onChange={handleFormChange}
                        />
                    )}

                    {currentStep === 4 && (
                        <IntroductionStep
                            formData={clubForm}
                            onChange={handleFormChange}
                        />
                    )}

                    {currentStep === 5 && (
                        <OperationStep
                            formData={clubForm}
                            onChange={handleFormChange}
                        />
                    )}

                    {currentStep === 6 && (
                        <CompletionStep
                            formData={clubForm}
                            onRestart={() => setCurrentStep(1)}
                        />
                    )}
                </div>

                {/* 하단 이전/다음 버튼 */}
                <nav className="club-create-navigation">

                    {currentStep > 1 && (
                        <button
                            type="button"
                            className="club-create-button previous"
                            onClick={handlePrevious}
                        >
                            이전
                        </button>
                    )}

                    {currentStep < 6 && (
                        <button
                            type="button"
                            className="club-create-button next"
                            onClick={handleNext}
                        >
                            {currentStep === 5 ? "동호회 개설하기" : "다음"}
                        </button>
                    )}

                </nav>

            </section>
        </main>
    );
}

export default ClubCreate;