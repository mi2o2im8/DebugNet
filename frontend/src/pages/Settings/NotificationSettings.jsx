// 알림 설정 페이지

import {
    useEffect,
    useState,
} from "react";

import BackButton from "../../components/BackButton/BackButton";

import {
    NOTIFICATION_GROUPS,
    loadNotificationSettings,
    saveNotificationSettings,
} from "../../utils/notificationSettings";

import "./Settings.css";
import "./NotificationSettings.css";


// =========================================================
// ⭐ 스위치 (Settings 페이지와 같은 모양)
// =========================================================

function SettingSwitch({ checked, disabled, onChange, label }) {

    return (

        <label className="settings-switch noti-switch">

            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)}
                aria-label={label}
            />

            <span className="switch-slider"></span>

        </label>

    );

}


// =========================================================
// ⭐ 알림 설정 페이지
// =========================================================

function NotificationSettings() {

    const [settings, setSettings] = useState(
        loadNotificationSettings
    );


    // ⭐ 바뀔 때마다 저장
    useEffect(() => {
        saveNotificationSettings(settings);
    }, [settings]);


    // ⭐ 항목 하나 변경
    const handleToggle = (key, value) => {

        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));

    };


    const isAllOff = !settings.all;


    return (

        <div className="settings-page noti-settings-page">

            {/* =================================================
                상단
            ================================================= */}

            <header className="settings-header">
                <BackButton />
                <h2>알림 설정</h2>
            </header>


            <main className="settings-content">

                {/* =================================================
                    전체 알림
                ================================================= */}

                <section className="settings-section">

                    <div className="settings-card">

                        <div className="settings-row noti-row">

                            <div className="noti-text">
                                <span className="noti-label">
                                    전체 알림 받기
                                </span>
                                <span className="noti-desc">
                                    끄면 모든 알림을 받지 않아요
                                </span>
                            </div>

                            <SettingSwitch
                                checked={settings.all}
                                onChange={(value) =>
                                    handleToggle("all", value)
                                }
                                label="전체 알림 받기"
                            />

                        </div>

                    </div>

                </section>


                {/* =================================================
                    항목별 알림
                ================================================= */}

                {NOTIFICATION_GROUPS.map((group) => (

                    <section
                        key={group.title}
                        className={`settings-section ${isAllOff ? "noti-disabled" : ""}`}
                    >

                        <h3>{group.title}</h3>

                        <div className="settings-card">

                            {group.items.map((item, index) => (

                                <div key={item.key}>

                                    {index > 0 && (
                                        <div className="settings-divider"></div>
                                    )}

                                    <div className="settings-row noti-row">

                                        <div className="noti-text">
                                            <span className="noti-label">
                                                {item.label}
                                            </span>
                                            <span className="noti-desc">
                                                {item.description}
                                            </span>
                                        </div>

                                        <SettingSwitch
                                            checked={settings[item.key]}
                                            disabled={isAllOff}
                                            onChange={(value) =>
                                                handleToggle(item.key, value)
                                            }
                                            label={item.label}
                                        />

                                    </div>

                                </div>

                            ))}

                        </div>

                    </section>

                ))}


                {/* =================================================
                    안내
                ================================================= */}

                <p className="noti-footnote">
                    알림 설정은 지금 사용 중인 기기에 저장돼요.
                    서비스 점검 같은 중요한 공지는 설정과 관계없이 보내드려요.
                </p>

            </main>

        </div>

    );

}

export default NotificationSettings;
