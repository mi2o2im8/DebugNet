import {
    FiChevronLeft,
    FiChevronRight,
    FiEdit3,
    FiFileText,
    FiHelpCircle,
    FiMapPin,
    FiShield,
    FiTrash2,
    FiUserCheck
} from "react-icons/fi";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import "./ClubSettings.css";


const SETTING_MENUS = [
    {
        id: "basic",
        label: "기본 정보 수정",
        icon: FiEdit3
    },
    {
        id: "introduction",
        label: "동호회 소개 수정",
        icon: FiFileText
    },
    {
        id: "activity",
        label: "활동 지역·종목 수정",
        icon: FiMapPin
    },
    {
        id: "join",
        label: "가입 방식 설정",
        icon: FiUserCheck
    },
    {
        id: "questions",
        label: "가입 질문 관리",
        icon: FiHelpCircle
    },
    {
        id: "operators",
        label: "운영진 관리",
        icon: FiShield
    },
    {
        id: "delete",
        label: "동호회 삭제",
        icon: FiTrash2,
        danger: true
    }
];


function ClubSettingsHome() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const openSettingMenu = (menuId) => {
        navigate(
            `/clubs/${clubId}/manage/settings/${menuId}`
        );
    };

    return (
        <main className="club-settings-page">
            <header className="club-settings-header">
                <button
                    type="button"
                    className="club-settings-back-button"
                    aria-label="동호회 운영 홈으로 돌아가기"
                    onClick={() =>
                        navigate(`/clubs/${clubId}/manage`)
                    }
                >
                    <FiChevronLeft />
                </button>

                <h1>동호회 설정</h1>

                <span
                    className="club-settings-header-space"
                    aria-hidden="true"
                />
            </header>

            <section className="club-settings-content">
                <div className="club-settings-menu-card">
                    {SETTING_MENUS.map((menu, index) => {
                        const Icon = menu.icon;

                        return (
                            <div key={menu.id}>
                                {index > 0 && (
                                    <div className="club-settings-divider" />
                                )}

                                <button
                                    type="button"
                                    className={[
                                        "club-settings-menu-button",
                                        menu.danger ? "danger" : ""
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    onClick={() =>
                                        openSettingMenu(menu.id)
                                    }
                                >
                                    <span className="club-settings-menu-icon">
                                        <Icon />
                                    </span>

                                    <span className="club-settings-menu-label">
                                        {menu.label}
                                    </span>

                                    <FiChevronRight className="club-settings-menu-arrow" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <p className="club-settings-description">
                    동호회의 기본 정보를 수정하고
                    운영 방식을 관리할 수 있어요.
                </p>
            </section>
        </main>
    );
}


export default ClubSettingsHome;