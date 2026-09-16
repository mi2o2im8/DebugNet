import {
    FiBell,
    FiCalendar,
    FiCheck,
    FiHome,
    FiRefreshCw,
    FiUserPlus,
    FiUsers
} from "react-icons/fi";

import footballIcon from "../../assets/img/sports/ball.png";
import basketballIcon from "../../assets/img/sports/basketball.png";
import volleyballIcon from "../../assets/img/sports/volleyball-ball.png";
import pingPongIcon from "../../assets/img/sports/ping-pong.png";
import tennisIcon from "../../assets/img/sports/tennis-ball.png";

const SPORT_ICONS = {
    "축구/풋살": footballIcon,
    농구: basketballIcon,
    배구: volleyballIcon,
    탁구: pingPongIcon,
    테니스: tennisIcon
};

const NEXT_ACTIONS = [
    {
        id: "schedule",
        title: "첫 일정 만들기",
        description: "회원들과 함께할 첫 활동을 등록해보세요.",
        icon: FiCalendar
    },
    {
        id: "notice",
        title: "공지사항 작성하기",
        description: "동호회 소개와 안내사항을 공유해보세요.",
        icon: FiBell
    },
    {
        id: "recruit",
        title: "회원 모집 시작하기",
        description: "지금 바로 새로운 회원을 모집해보세요.",
        icon: FiUserPlus
    }
];

function CompletionStep({ formData, onRestart }) {
    const sportIcon = SPORT_ICONS[formData.sport];

    const coverImage =
        formData.activityImages?.[0] ||
        formData.representativeImage;

    const location = [
        formData.city,
        formData.district
    ]
        .filter(Boolean)
        .join(" ");

    const handleNextAction = (actionTitle) => {
        alert(
            `${actionTitle} 화면은 이후 기능 제작 시 연결할 예정입니다.`
        );
    };

    const handleGoHome = () => {
        alert(
            "동호회 홈 화면은 이후 라우터 작업에서 연결할 예정입니다."
        );
    };

    return (
        <div className="club-completion-step">
            {/* 완료 표시 */}
            <div className="club-completion-success">
                <div className="club-completion-confetti">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                </div>

                <div className="club-completion-check">
                    <FiCheck />
                </div>

                <h2>동호회가 만들어졌습니다!</h2>

                <p>
                    이제 멋진 사람들과 함께
                    <br />
                    즐거운 활동을 시작해보세요.
                </p>
            </div>

            {/* 동호회 미리보기 */}
            <div className="club-completion-preview">
                <div className="club-completion-cover">
                    {coverImage ? (
                        <img
                            src={coverImage}
                            alt="동호회 대표 이미지"
                        />
                    ) : (
                        <div className="club-completion-cover-empty">
                            <FiUsers />
                            <span>동호회 대표 이미지</span>
                        </div>
                    )}

                    <div className="club-completion-sport-icon">
                        {sportIcon ? (
                            <img
                                src={sportIcon}
                                alt=""
                            />
                        ) : (
                            <FiUsers />
                        )}
                    </div>
                </div>

                <div className="club-completion-info">
                    <strong>
                        {formData.clubName || "새로운 동호회"}
                    </strong>

                    <p>
                        {[
                            formData.sport,
                            location
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>

                    <span>
                        회원 1명
                        {formData.maxMembers &&
                            formData.maxMembers !== "unlimited" &&
                            ` / 최대 ${formData.maxMembers}명`}
                    </span>
                </div>
            </div>

            {/* 다음 행동 */}
            <div className="club-completion-actions">
                <h3>이제 무엇을 할까요?</h3>

                <div className="club-completion-action-list">
                    {NEXT_ACTIONS.map((action) => {
                        const Icon = action.icon;

                        return (
                            <button
                                key={action.id}
                                type="button"
                                className="club-completion-action"
                                onClick={() =>
                                    handleNextAction(action.title)
                                }
                            >
                                <span className="club-completion-action-icon">
                                    <Icon />
                                </span>

                                <span className="club-completion-action-text">
                                    <strong>{action.title}</strong>
                                    <small>{action.description}</small>
                                </span>

                                <span className="club-completion-action-arrow">
                                    ›
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 완료 화면 버튼 */}
            <div className="club-completion-buttons">
                <button
                    type="button"
                    className="club-completion-home"
                    onClick={handleGoHome}
                >
                    <FiHome />
                    동호회 홈으로 이동
                </button>

                <button
                    type="button"
                    className="club-completion-restart"
                    onClick={onRestart}
                >
                    <FiRefreshCw />
                    다른 동호회도 만들어보기
                </button>
            </div>
        </div>
    );
}

export default CompletionStep;