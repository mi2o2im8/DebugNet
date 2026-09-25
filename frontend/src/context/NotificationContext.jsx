// 알림 목록 + 안읽은 개수를 앱 전체에서 공유하는 Context
//
// ⭐ 알림 실시간 구독은 앱 전체에서 여기 한 곳에서만 한다.
//    (Main.jsx / MainHome.jsx 에 있던 개별 구독은 제거하고
//     useNotifications().unreadCount 를 쓰도록 변경)

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

import { supabase } from "../../supabaseClient";


// 알림 Context
// - 알림 목록 / 안읽은 개수를 앱 전체에서 공유하기 위한 Context
// - Notification.jsx, Main.jsx, MainHome.jsx 의 벨 아이콘 배지가 같은 데이터를 사용
const NotificationContext = createContext(null);


export function NotificationProvider({ children }) {

    // 알림 목록
    const [notifications, setNotifications] = useState([]);

    // 로딩
    const [loading, setLoading] = useState(true);

    // ⭐ 현재 로그인한 사용자 id (로그인/로그아웃을 따라감)
    const [userId, setUserId] = useState(null);


    // ⭐ 로그인 상태 추적
    // - 앱을 로그아웃 상태로 열었다가 로그인해도 알림이 바로 불러와지도록
    // - INITIAL_SESSION 이벤트로 최초 상태도 함께 받음
    useEffect(() => {

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };

    }, []);


    // DB에서 알림 조회
    const fetchNotifications = useCallback(async () => {

        if (!userId) {
            setNotifications([]);
            setLoading(false);
            return;
        }

        try {

            setLoading(true);

            const { data, error } = await supabase
                .from("notifications")
                .select(`
                    notification_id,
                    user_id,
                    notification_type,
                    link_path,
                    title,
                    content,
                    related_type,
                    related_id,
                    is_read,
                    created_at
                `)
                .eq("user_id", userId)
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            setNotifications(data || []);

        } catch (error) {

            console.error("알림 조회 오류:", error);
            setNotifications([]);

        } finally {

            setLoading(false);

        }

    }, [userId]);


    // ⭐ 로그인 사용자가 바뀔 때마다 다시 조회
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);


    // ⭐ 실시간 반영
    // - 로그인한 경우에만 구독
    // - 내 알림(user_id)만 받도록 filter 적용
    // - 채널 이름을 매번 다르게 해서 StrictMode 재마운트 때 이름 충돌 방지
    useEffect(() => {

        if (!userId) {
            return;
        }

        const channelName =
            `notifications:${userId}:${Math.random().toString(36).slice(2)}`;

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    fetchNotifications();
                }
            )
            .subscribe((status, error) => {

                // 개발 중에만 연결 상태 확인용 로그
                // (페이지 이동/StrictMode 정리 때 CLOSED 가 찍히는 건 정상)
                if (import.meta.env.DEV) {
                    console.log("[notifications realtime]", status, error ?? "");
                }

                if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    console.error("알림 실시간 연결 오류:", status, error);
                }

            });

        return () => {
            supabase.removeChannel(channel);
        };

    }, [userId, fetchNotifications]);


    // ⭐ 알림 하나 읽음 처리
    const markAsRead = useCallback(async (notificationId) => {

        // 화면 먼저 반영 (낙관적 업데이트)
        setNotifications((prev) =>
            prev.map((item) =>
                item.notification_id === notificationId
                    ? { ...item, is_read: true }
                    : item
            )
        );

        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("notification_id", notificationId);

        if (error) {
            console.error("알림 읽음 처리 오류:", error);
        }

    }, []);


    // ⭐ 전체 읽음 처리
    const markAllAsRead = useCallback(async () => {

        if (!userId) {
            return;
        }

        try {

            setNotifications((prev) =>
                prev.map((item) => ({ ...item, is_read: true }))
            );

            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false);

            if (error) {
                throw error;
            }

        } catch (error) {

            console.error("모두 읽음 처리 오류:", error);

        }

    }, [userId]);


    // ⭐ 안읽은 알림 개수 (벨 아이콘 배지에서 사용)
    const unreadCount = notifications.filter(
        (notification) => !notification.is_read
    ).length;


    const value = {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    };


    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );

}


// ⭐ 편의 훅
export function useNotifications() {

    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "useNotifications는 NotificationProvider 안에서만 사용할 수 있습니다."
        );
    }

    return context;

}
