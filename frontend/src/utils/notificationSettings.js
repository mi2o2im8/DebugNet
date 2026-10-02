// 알림 설정 저장 / 불러오기
//
// ⭐ 지금은 localStorage(이 기기)에만 저장
// ⭐ 나중에 DB로 옮길 때는 load / save 두 함수만 바꾸면 됨


const STORAGE_KEY = "notificationSettings";

// ⭐ 설정이 바뀌었을 때 NotificationContext 에 알려주는 이벤트 이름
export const NOTIFICATION_SETTINGS_EVENT = "notificationSettingsChange";


// =========================================================
// ⭐ 설정 항목
//
// types 는 백엔드에서 보내는 notification_type 값
// (club_service / match_service / notification_scheduler_service 참고)
// =========================================================

export const NOTIFICATION_GROUPS = [
    {
        title: "동호회",
        items: [
            {
                key: "clubJoin",
                label: "가입 신청 · 승인 결과",
                description: "가입 신청이 들어오거나 승인·거절됐을 때",
                types: [
                    "club_application",
                    "join_approved",
                    "join_rejected",
                ],
            },
            {
                key: "roleChanged",
                label: "동호회 역할 변경",
                description: "운영진으로 지정되거나 일반 회원으로 바뀌었을 때",
                types: [
                    "role_changed",
                ],
            },
            {
                key: "guest",
                label: "게스트 신청 · 승인",
                description: "게스트 신청이 들어오거나 내 신청이 승인됐을 때",
                types: [
                    "guest_application",
                    "guest_approved",
                ],
            },
            {
                key: "clubCreated",
                label: "새 동호회 개설",
                description: "새로운 공개 동호회가 생겼을 때",
                types: [
                    "club_created",
                ],
            },
            {
                key: "activityReview",
                label: "활동 후기 요청",
                description: "참여한 활동의 후기를 남길 수 있을 때",
                types: [
                    "activity_review",
                ],
            },
        ],
    },
    {
        title: "경기 · 일정",
        items: [
            {
                key: "scheduleReminder",
                label: "일정 리마인드",
                description: "참여하는 일정이 다가올 때",
                types: [
                    "schedule_reminder",
                ],
            },
            {
                key: "vote",
                label: "참석 투표",
                description: "투표가 열리거나 결과가 나왔을 때",
                types: [
                    "vote_created",
                    "vote_result",
                    "attendance_response",
                ],
            },
            {
                key: "teamMatching",
                label: "팀 매칭 결과",
                description: "매칭 신청이 수락·거절됐을 때",
                types: [
                    "team_matching",
                    "team_matching_approved",
                    "team_matching_rejected",
                ],
            },
        ],
    },
    {
        title: "커뮤니티",
        items: [
            {
                key: "communityComment",
                label: "내 글에 달린 댓글",
                description: "내가 쓴 글에 새 댓글이 달렸을 때",
                types: [
                    "community_comment",
                ],
            },
            {
                key: "clubCommunity",
                label: "동호회 공지 · 댓글",
                description: "동호회에 공지가 올라오거나 내 동호회 글에 댓글이 달렸을 때",
                types: [
                    "club_notice_post",
                    "club_community_comment",
                ],
            },
        ],
    },
];


// =========================================================
// ⭐ 기본값 (전부 켜짐)
// =========================================================

const buildDefaultSettings = () => {

    const settings = { all: true };

    NOTIFICATION_GROUPS.forEach((group) => {
        group.items.forEach((item) => {
            settings[item.key] = true;
        });
    });

    return settings;

};


// =========================================================
// ⭐ 불러오기
// =========================================================

export const loadNotificationSettings = () => {

    const defaults = buildDefaultSettings();

    try {

        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        );

        // 새 항목이 추가돼도 기본값(켜짐)으로 채워지도록 합침
        return { ...defaults, ...(saved || {}) };

    } catch {

        return defaults;

    }

};


// =========================================================
// ⭐ 저장
// =========================================================

export const saveNotificationSettings = (settings) => {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
    );

    window.dispatchEvent(
        new Event(NOTIFICATION_SETTINGS_EVENT)
    );

};


// =========================================================
// ⭐ 이 알림을 보여줘도 되는지
//
// 사용 예) notifications.filter((n) =>
//            isNotificationEnabled(n.notification_type)
//         )
//
// 설정 항목에 없는 타입(서비스 점검 공지 등)은
// 전체 알림을 꺼도 항상 보여줌
// =========================================================

export const isNotificationEnabled = (
    notificationType,
    settings = loadNotificationSettings()
) => {

    for (const group of NOTIFICATION_GROUPS) {
        for (const item of group.items) {
            if (item.types.includes(notificationType)) {
                return settings.all && settings[item.key] !== false;
            }
        }
    }

    return true;

};