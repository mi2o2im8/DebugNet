// 가입 후 메인 홈

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import "./MainHome.css";

import { supabase } from "../../../supabaseClient";

// ⭐ API
import { getMyClub, getClubEvents } from "../../api/clubApi";

// ⭐ 이미지
import profileIcon from "../../assets/img/basic_profile_img.png";
import createClubImage from "../../assets/img/playbridge_16_assets/create_club.png";
import calendarIcon from "../../assets/img/playbridge_16_assets/calendar_icon.png";
import activityIcon from "../../assets/img/playbridge_16_assets/activity.png";
import backIcon from "../../assets/img/back.png";

import soccerImage from "../../assets/img/playbridge_16_assets/soccer.png";
import basketballImage from "../../assets/img/playbridge_16_assets/basketball.png";
import badmintonImage from "../../assets/img/playbridge_16_assets/badminton.png";
import climbingImage from "../../assets/img/playbridge_16_assets/climbing.png";
import runningImage from "../../assets/img/playbridge_16_assets/running.png";
import yogaImage from "../../assets/img/playbridge_16_assets/16_yoga.png";
import volleyballImage from "../../assets/img/volleyball.png";

// ⭐ 종목별 기본 이미지
const sportImages = {
    "축구": soccerImage,
    "풋살": soccerImage,
    "축구ㆍ풋살": soccerImage,
    "배구": volleyballImage,
    "농구": basketballImage,
    "배드민턴": badmintonImage,
    "테니스": badmintonImage,
    "탁구": badmintonImage,
    "클라이밍": climbingImage,
    "러닝": runningImage,
    "요가": yogaImage,
};

// ⭐ 챗봇
import ChatbotButton from "../../components/Chatbot/ChatbotButton";
import Chatbot from "../Chatbot/Chatbot";


function MainHome() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 가입 후 메인 홈 진입 기준
    //
    // - 운영 중인 동호회가 있으면 진입 가능
    // - 운영자 승인 후 active 회원이면 진입 가능
    // - 둘 다 없으면 가입 전 메인으로 이동
    // =========================================================

    const [
        isMainHomeAccessChecked,
        setIsMainHomeAccessChecked,
    ] = useState(false);


    // ⭐ 현재 동호회 ID
    const [clubId, setClubId] = useState(null);

    // ⭐ 내 동호회
    // 운영 중인 동호회 1개 + 가입 동호회 최대 3개
    const [myClubs, setMyClubs] = useState([]);
    const myClubListRef = useRef(null);

    // ⭐ 내 동호회 가로 스크롤 그림자 상태
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);


    // =========================================================
    // ⭐ 사용자 정보
    // =========================================================

    const [userName, setUserName] = useState(
        () =>
            localStorage.getItem(
                "playbridge_user_nickname"
            ) || ""
    );


    const [profileImage, setProfileImage] = useState(
        () =>
            localStorage.getItem(
                "playbridge_profile_image"
            ) || ""
    );


    // =========================================================
    // ⭐ 알림
    // =========================================================

    const [
        unreadNotificationCount,
        setUnreadNotificationCount,
    ] = useState(0);


    // =========================================================
    // ⭐ 달력 / 챗봇
    // =========================================================

    const today = new Date();


    const todayString =
        `${today.getFullYear()}-${String(
            today.getMonth() + 1
        ).padStart(2, "0")}-${String(
            today.getDate()
        ).padStart(2, "0")}`;


    const [selectedDate, setSelectedDate] =
        useState(todayString);


    const [isChatbotOpen, setIsChatbotOpen] =
        useState(false);


    // =========================================================
    // ⭐ 일정 참여 상태
    // =========================================================

    const [participated, setParticipated] =
        useState({
            0: false,
            1: false,
            2: false,
        });


    // =========================================================
    // ⭐ 내 동호회
    //
    // 운영 동호회 1개 + 가입 동호회 최대 3개
    // 실제 데이터는 getMyClub()에서 가져옴
    // =========================================================


    // =========================================================
    // ⭐ 일정
    // =========================================================

    const [schedules, setSchedules] = useState([]);

    // =========================================================
    // ⭐ 내 동호회 일정
    //
    // ⭐ 중요:
    // 일정 관리 페이지(ClubEventList)에서 실제로 사용하는
    // getClubEvents(clubId)와 동일한 API를 사용한다.
    //
    // MainHome에서 club_events를 직접 조회하지 않고,
    // getMyClub()으로 내 동호회 ID를 가져온 다음
    // 각 동호회의 getClubEvents()를 호출한다.
    // =========================================================

    useEffect(() => {

        let isActive = true;

        const loadSchedules = async () => {

            try {

                // =================================================
                // ⭐ 내 동호회 목록
                // =================================================

                const myClub = await getMyClub();

                console.log(
                    "⭐ 일정 조회용 내 동호회 정보:",
                    myClub
                );

                const operatingClubList =
                    Array.isArray(myClub?.operating_clubs)
                        ? myClub.operating_clubs
                        : myClub?.operating_club
                            ? [myClub.operating_club]
                            : [];

                const joinedClubList =
                    Array.isArray(myClub?.joined_clubs)
                        ? myClub.joined_clubs
                        : myClub?.joined_club
                            ? [myClub.joined_club]
                            : [];

                // ⭐ 운영 + 가입 동호회
                const allClubs = [
                    ...operatingClubList,
                    ...joinedClubList,
                ];

                // ⭐ 실제 club_id만 추출
                const clubIds = [
                    ...new Set(
                        allClubs
                            .map(
                                (club) =>
                                    club?.club_id ||
                                    club?.id ||
                                    club?.clubId
                            )
                            .filter(Boolean)
                            .map((id) => String(id))
                    ),
                ];

                console.log(
                    "⭐ MainHome 일정 조회 clubIds:",
                    clubIds
                );

                if (clubIds.length === 0) {

                    console.log(
                        "⭐ 일정 조회할 동호회가 없습니다."
                    );

                    if (isActive) {
                        setSchedules([]);
                    }

                    return;
                }

                // =================================================
                // ⭐ 일정 관리 페이지와 동일한 API 사용
                // =================================================

                const eventResults =
                    await Promise.all(
                        clubIds.map(
                            async (currentClubId) => {

                                try {

                                    const result =
                                        await getClubEvents(
                                            currentClubId
                                        );

                                    console.log(
                                        `⭐ 동호회 ${currentClubId} 일정:`,
                                        result
                                    );

                                    return (
                                        result?.events || []
                                    );

                                } catch (error) {

                                    console.error(
                                        `⭐ 동호회 ${currentClubId} 일정 조회 실패:`,
                                        error
                                    );

                                    return [];
                                }
                            }
                        )
                    );

                // ⭐ 여러 동호회의 일정 하나로 합치기
                const events = eventResults.flat();

                console.log(
                    "⭐ MainHome 전체 일정 원본:",
                    events
                );

                // =================================================
                // ⭐ MainHome 일정 형태로 변환
                // =================================================

                const mappedSchedules =
                    events.map((event) => {

                        const normalizedDate =
                            event?.event_date
                                ? String(
                                      event.event_date
                                  ).slice(0, 10)
                                : "";

                        return {
                            eventId:
                                event?.event_id,
                            clubId:
                                event?.club_id,

                            date:
                                normalizedDate,

                            time:
                                event?.start_time
                                    ? String(
                                          event.start_time
                                      ).slice(0, 5)
                                    : "",

                            endTime:
                                event?.end_time
                                    ? String(
                                          event.end_time
                                      ).slice(0, 5)
                                    : "",

                            // ⭐ 일정 관리 페이지에서 내려오는
                            // event_image_url이 있으면 사용
                            image:
                                event?.event_image_url ||
                                badmintonImage,

                            alt:
                                event?.title ||
                                "동호회 일정",

                            title:
                                event?.title ||
                                "동호회 일정",

                            place:
                                event?.location ||
                                "장소 미정",

                            status:
                                event?.status,
                        };
                    });

                // ⭐ 같은 event_id 중복 제거
                const uniqueSchedules =
                    mappedSchedules.filter(
                        (schedule, index, array) => {

                            if (!schedule.eventId) {
                                return true;
                            }

                            return (
                                array.findIndex(
                                    (item) =>
                                        String(
                                            item.eventId
                                        ) ===
                                        String(
                                            schedule.eventId
                                        )
                                ) === index
                            );
                        }
                    );

                // ⭐ 날짜 → 시간 순 정렬
                uniqueSchedules.sort(
                    (a, b) =>
                        a.date.localeCompare(b.date) ||
                        a.time.localeCompare(b.time)
                );

                console.log(
                    "⭐ MainHome 최종 일정:",
                    uniqueSchedules
                );

                if (isActive) {
                    setSchedules(
                        uniqueSchedules
                    );
                }

            } catch (error) {

                console.error(
                    "⭐ MainHome 일정 조회 오류:",
                    error
                );

                if (isActive) {
                    setSchedules([]);
                }
            }
        };

        loadSchedules();

        return () => {
            isActive = false;
        };

    }, []);

    // =========================================================
    // ⭐ 게스트 모집
    // =========================================================

    const guests = [

        {
            image: soccerImage,
            alt: "미국 풋살 모임",
            title: "미국 풋살 모임",
            time: "수요일 오후 19:00",
            place: "마곡 풋살장",
        },

        {
            image: basketballImage,
            alt: "아하 농구 모임",
            title: "아하 농구 모임",
            time: "토요일 17:00",
            place: "한강 농구공원",
        },

        {
            image: runningImage,
            alt: "러닝 함께해요",
            title: "러닝 함께해요",
            time: "일요일 07:00",
            place: "한강공원",
        },

        {
            image: climbingImage,
            alt: "클라이밍 입문",
            title: "클라이밍 입문",
            time: "매주 화 19:00",
            place: "강서 클라이밍장",
        },

    ];


    // =========================================================
    // ⭐ 커뮤니티
    // =========================================================

    // ⭐ 백엔드에서 받아온 최신 게시글
    const [posts, setPosts] = useState([]);
    // =========================================================
    // ⭐ 활동 추천 동호회
    // /api/clubs/search에서 실제 동호회 목록을 가져옴
    // =========================================================

    const [activityClubs, setActivityClubs] =
        useState([]);



    // =========================================================
    // ⭐ 내 동호회 가로 스크롤 상태 확인
    // =========================================================

    const checkClubScroll = (element) => {
        if (!element) {
            return;
        }

        const { scrollLeft, clientWidth, scrollWidth } = element;

        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(
            scrollLeft + clientWidth < scrollWidth - 5
        );
    };

    // =========================================================
    // ⭐ MainHome 진입 권한 확인
    //
    // 운영 중인 동호회가 있거나
    // 운영자 승인 후 가입한 동호회가 있으면 진입
    // =========================================================

    useEffect(() => {

        let isActive = true;


        const checkMainHomeAccess =
            async () => {

                try {

                    const myClub =
                        await getMyClub();


                    console.log(
                        "⭐ 내 동호회 정보:",
                        myClub
                    );


                    // ⭐ API에서 받은 DB 기준 동호회 목록
                    const operatingClubList =
                        Array.isArray(myClub?.operating_clubs)
                            ? myClub.operating_clubs
                            : myClub?.operating_club
                                ? [myClub.operating_club]
                                : [];

                    const joinedClubList =
                        Array.isArray(myClub?.joined_clubs)
                            ? myClub.joined_clubs
                            : myClub?.joined_club
                                ? [myClub.joined_club]
                                : [];

                    // ⭐ DB의 operating_clubs = 운영 중인 동호회
                    const operatingList = operatingClubList.map((club) => ({
                        ...club,
                        isOperating: true,
                        clubType: "operating",
                    }));

                    // ⭐ DB의 joined_clubs = 가입한 동호회
                    const joinedList = joinedClubList
                        .map((club) => ({
                            ...club,
                            isOperating: false,
                            clubType: "joined",
                        }))
                        .filter((club, index, array) => {
                            const id =
                                club?.club_id ||
                                club?.id ||
                                club?.clubId;

                            if (!id) {
                                return true;
                            }

                            return (
                                array.findIndex((item) => {
                                    const itemId =
                                        item?.club_id ||
                                        item?.id ||
                                        item?.clubId;

                                    return String(itemId) === String(id);
                                }) === index
                            );
                        })
                        .filter((club) => {
                            const joinedId =
                                club?.club_id ||
                                club?.id ||
                                club?.clubId;

                            return !operatingClubList.some((operatingClub) => {
                                const operatingId =
                                    operatingClub?.club_id ||
                                    operatingClub?.id ||
                                    operatingClub?.clubId;

                                return (
                                    operatingId &&
                                    joinedId &&
                                    String(operatingId) === String(joinedId)
                                );
                            });
                        })
                        .slice(0, 3);

                    let displayClubs = [
                        ...operatingList,
                        ...joinedList,
                    ];

                    // =================================================
                    // ⭐ 동호회 정보는 getMyClub() API에서 사용
                    //
                    // 백엔드 /api/clubs/my 에서
                    //  → current_members : 실제 active 회원 수
                    //  → representative_image_url : 대표 이미지 URL
                    // 를 함께 내려줌
                    //
                    // ⭐ React에서 clubs / club_images를 직접 조회하지 않음
                    // =================================================

                    displayClubs = displayClubs.map((club) => ({
                        ...club,

                        // ⭐ 백엔드에서 내려온 실제 회원 수
                        current_members:
                            club?.current_members ??
                            club?.member_count ??
                            0,

                        // ⭐ 백엔드에서 내려온 DB 대표 이미지
                        representative_image_url:
                            club?.representative_image_url ||
                            club?.club_image ||
                            null,
                    }));

                    console.log(
                        "⭐ MainHome 내 동호회 최종 데이터:",
                        displayClubs
                    );

                    // ⭐ ClubEventList 이동에 사용할 실제 동호회 ID
                    const currentClubId =
                        operatingClubList[0]?.club_id ||
                        operatingClubList[0]?.id ||
                        operatingClubList[0]?.clubId ||
                        joinedList[0]?.club_id ||
                        joinedList[0]?.id ||
                        joinedList[0]?.clubId ||
                        null;

                    if (isActive) {
                        setClubId(currentClubId);
                        setMyClubs(displayClubs);
                    }

                    const hasOperatingClub =
                        operatingClubList.length > 0;

                    const hasJoinedClub =
                        joinedList.length > 0;


                    // -----------------------------------------
                    // ⭐ 운영 동호회도 없고
                    // ⭐ 가입 승인 동호회도 없는 경우
                    // -----------------------------------------

                    if (
                        !hasOperatingClub &&
                        !hasJoinedClub
                    ) {

                        navigate(
                            "/main",
                            {
                                replace: true,
                            }
                        );

                        return;
                    }


                    // -----------------------------------------
                    // ⭐ MainHome 진입 허용
                    // -----------------------------------------

                    if (isActive) {

                        setIsMainHomeAccessChecked(
                            true
                        );

                    }

                } catch (error) {

                    console.error(
                        "가입 후 메인 홈 진입 권한 확인 오류:",
                        error
                    );


                    if (isActive) {

                        navigate(
                            "/main",
                            {
                                replace: true,
                            }
                        );

                    }

                }

            };


        checkMainHomeAccess();


        return () => {

            isActive = false;

        };

    }, [navigate]);

    // =========================================================
    // ⭐ 내 동호회 카드가 로드되면 스크롤 가능 여부 확인
    // =========================================================

    useEffect(() => {
        const element = myClubListRef.current;

        if (!element) {
            return;
        }

        const updateScrollState = () => {
            checkClubScroll(element);
        };

        updateScrollState();

        window.addEventListener(
            "resize",
            updateScrollState
        );

        return () => {
            window.removeEventListener(
                "resize",
                updateScrollState
            );
        };
    }, [myClubs]);


    // =========================================================
    // ⭐ 사용자 정보 + 알림 조회
    // =========================================================

    useEffect(() => {

        let isActive = true;

        let notificationChannel = null;


        const getUserInfo =
            async () => {

                try {

                    // -----------------------------------------
                    // ⭐ 현재 로그인 사용자
                    // -----------------------------------------

                    const {
                        data: {
                            user,
                        },
                    } =
                        await supabase.auth.getUser();


                    if (
                        !user ||
                        !isActive
                    ) {

                        return;

                    }


                    // -----------------------------------------
                    // ⭐ 사용자 정보
                    // -----------------------------------------

                    const {
                        data,
                        error,
                    } =
                        await supabase
                            .from("users")
                            .select(
                                "nickname, profile_image"
                            )
                            .eq(
                                "user_id",
                                user.id
                            )
                            .maybeSingle();


                    if (error) {

                        console.error(
                            "가입 후 홈 사용자 정보 조회 오류:",
                            error
                        );

                    } else if (
                        isActive &&
                        data
                    ) {

                        // ⭐ 닉네임

                        if (
                            data.nickname
                        ) {

                            setUserName(
                                data.nickname
                            );


                            localStorage.setItem(
                                "playbridge_user_nickname",
                                data.nickname
                            );

                        }


                        // ⭐ 프로필 이미지

                        if (
                            data.profile_image
                        ) {

                            setProfileImage(
                                data.profile_image
                            );


                            localStorage.setItem(
                                "playbridge_profile_image",
                                data.profile_image
                            );

                        } else {

                            setProfileImage("");


                            localStorage.removeItem(
                                "playbridge_profile_image"
                            );

                        }

                    }


                    // -----------------------------------------
                    // ⭐ 안 읽은 알림 개수
                    // -----------------------------------------

                    const {
                        count,
                        error:
                            notificationError,
                    } =
                        await supabase
                            .from("notifications")
                            .select(
                                "notification_id",
                                {
                                    count: "exact",
                                    head: true,
                                }
                            )
                            .eq(
                                "user_id",
                                user.id
                            )
                            .eq(
                                "is_read",
                                false
                            );


                    if (
                        notificationError
                    ) {

                        console.error(
                            "안 읽은 알림 개수 조회 오류:",
                            notificationError
                        );

                    } else if (
                        isActive
                    ) {

                        setUnreadNotificationCount(
                            count || 0
                        );

                    }


                    // -----------------------------------------
                    // ⭐ 알림 실시간 갱신
                    //
                    // 반드시
                    // channel()
                    // → on()
                    // → subscribe()
                    // 순서
                    // -----------------------------------------

                    const channelName =
                        `main-home-notifications-${user.id}`;


                    notificationChannel =
                        supabase.channel(
                            channelName
                        );


                    notificationChannel.on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "notifications",
                            filter:
                                `user_id=eq.${user.id}`,
                        },
                        async () => {

                            try {

                                const {
                                    count:
                                        latestCount,
                                    error,
                                } =
                                    await supabase
                                        .from(
                                            "notifications"
                                        )
                                        .select(
                                            "notification_id",
                                            {
                                                count:
                                                    "exact",
                                                head: true,
                                            }
                                        )
                                        .eq(
                                            "user_id",
                                            user.id
                                        )
                                        .eq(
                                            "is_read",
                                            false
                                        );


                                if (error) {

                                    console.error(
                                        "알림 개수 실시간 갱신 오류:",
                                        error
                                    );

                                    return;
                                }


                                if (
                                    isActive
                                ) {

                                    setUnreadNotificationCount(
                                        latestCount ||
                                            0
                                    );

                                }

                            } catch (
                                realtimeError
                            ) {

                                console.error(
                                    "알림 실시간 갱신 오류:",
                                    realtimeError
                                );

                            }

                        }
                    );


                    // -----------------------------------------
                    // ⭐ on 등록 후 마지막에 subscribe
                    // -----------------------------------------

                    notificationChannel.subscribe(
                        (status) => {

                            console.log(
                                "알림 realtime 상태:",
                                status
                            );

                        }
                    );

                } catch (error) {

                    console.error(
                        "가입 후 홈 사용자/알림 정보 조회 오류:",
                        error
                    );

                }

            };


        getUserInfo();


        // =====================================================
        // ⭐ Cleanup
        // =====================================================

        return () => {

            isActive = false;


            if (
                notificationChannel
            ) {

                supabase.removeChannel(
                    notificationChannel
                );

                notificationChannel = null;

            }

        };

    }, []);


    // =========================================================
    // ⭐ 일정 참여 / 취소
    // =========================================================

    const handleParticipation =
        (index) => {

            setParticipated(
                (prev) => ({
                    ...prev,
                    [index]:
                        !prev[index],
                })
            );

        };


    // =========================================================
    // ⭐ 선택 날짜 일정
    // =========================================================

    const selectedSchedules =
        schedules.filter(
            (schedule) =>
                schedule.date ===
                selectedDate
        );


    // =========================================================
    // ⭐ 커뮤니티 최신 게시글 조회
    //
    // Community.jsx와 동일한 /api/posts 백엔드 사용
    // 최신 자유게시판 게시글 3개만 MainHome에 표시
    // =========================================================

    useEffect(() => {

        let isActive = true;

        const loadCommunityPosts = async () => {

            try {

                // ⭐ 현재 로그인 세션
                const {
                    data: {
                        session,
                    },
                } = await supabase.auth.getSession();

                if (!session?.access_token) {

                    console.log(
                        "⭐ 커뮤니티 조회: 로그인 세션 없음"
                    );

                    return;
                }

                // ⭐ Community.jsx와 동일한 API 파라미터
                const params = new URLSearchParams({
                    board_type: "free",
                    page: "1",
                    size: "3",
                    sort: "latest",
                });

                const response = await fetch(
                    `http://127.0.0.1:8000/api/posts?${params.toString()}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (!response.ok) {

                    const errorData =
                        await response
                            .json()
                            .catch(() => null);

                    throw new Error(
                        errorData?.detail ||
                        "커뮤니티 게시글을 불러오지 못했습니다."
                    );
                }

                const data =
                    await response.json();

                console.log(
                    "⭐ MainHome 커뮤니티 게시글:",
                    data
                );

                if (!isActive) {
                    return;
                }

                // ⭐ 백엔드 응답을 MainHome 카드 형태로 변환
                const mappedPosts =
                    (data.items || [])
                        .slice(0, 3)
                        .map((post) => ({

                            id:
                                post.id ??
                                post.post_id,

                            category:
                                post.category ??
                                post.board_name ??
                                "자유게시판",

                            title:
                                post.title ??
                                "제목 없음",

                            description:
                                post.content ??
                                post.description ??
                                "",

                            date:
                                post.createdAt ??
                                post.created_at ??
                                "",

                            comments:
                                post.comments ??
                                post.comment_count ??
                                0,

                        }));

                setPosts(mappedPosts);

            } catch (error) {

                console.error(
                    "⭐ MainHome 커뮤니티 조회 오류:",
                    error
                );

                if (isActive) {
                    setPosts([]);
                }

            }

        };

        loadCommunityPosts();

        return () => {
            isActive = false;
        };

    }, []);


    // =========================================================
    // ⭐ 활동 추천 동호회 조회
    //
    // ClubHome에서 사용하는
    // /api/clubs/search API와 동일한 백엔드 연결
    //
    // ⭐ 내 동호회는 제외하고 다른 동호회를 표시
    // =========================================================

    useEffect(() => {

        let isActive = true;

        const loadActivityClubs = async () => {

            try {

                const response = await fetch(
                    "http://127.0.0.1:8000/api/clubs/search"
                );

                if (!response.ok) {

                    throw new Error(
                        "활동 추천 동호회를 불러오지 못했습니다."
                    );

                }

                const data =
                    await response.json();

                console.log(
                    "⭐ MainHome 활동 추천 동호회:",
                    data
                );

                if (!isActive) {
                    return;
                }

                // ⭐ /api/clubs/search 응답
                // 배열 / data 배열 형태 모두 대응
                const clubList =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.items)
                            ? data.items
                            : [];

                // ⭐ 현재 내 동호회 ID
                const myClubIds =
                    new Set(
                        myClubs
                            .map(
                                (club) =>
                                    club?.club_id ||
                                    club?.id ||
                                    club?.clubId
                            )
                            .filter(Boolean)
                            .map((id) =>
                                String(id)
                            )
                    );

                // ⭐ 내 동호회를 제외한 다른 동호회
                const recommendedClubs =
                    clubList
                        .filter((club) => {

                            const currentId =
                                club?.club_id ||
                                club?.id ||
                                club?.clubId;

                            if (!currentId) {
                                return true;
                            }

                            return !myClubIds.has(
                                String(currentId)
                            );

                        })
                        .slice(0, 4);

                setActivityClubs(
                    recommendedClubs
                );

            } catch (error) {

                console.error(
                    "⭐ MainHome 활동 추천 동호회 조회 오류:",
                    error
                );

                if (isActive) {
                    setActivityClubs([]);
                }

            }

        };

        loadActivityClubs();

        return () => {
            isActive = false;
        };

    }, [myClubs]);



    // =========================================================
    // ⭐ MainHome 접근 확인 중
    //
    // ⭐ 중요:
    // 모든 Hook 실행 후 return 해야 함
    // =========================================================

    if (
        !isMainHomeAccessChecked
    ) {

        return (
            <div className="main-home-loading">
                동호회 정보를 확인하는 중...
            </div>
        );

    }


    // =========================================================
    // ⭐ 화면
    // =========================================================

    return (

        <div className="main-home">

            <main className="main-home-main">


                {/* =====================================================
                    ⭐ 상단 인사
                ===================================================== */}

                <section className="main-welcome-section">

                    <div className="main-welcome-content">

                        <div className="main-welcome-text">

                            <h2>

                                안녕하세요,{" "}

                                {userName
                                    ? `${userName}님!`
                                    : "회원님!"}

                            </h2>


                            <p>
                                다양한 동호회와 활동을 만나보세요.
                            </p>

                        </div>


                        <div className="main-welcome-actions">

                            {/* ⭐ 알림 */}

                            <Link
                                to="/notification"
                                className="main-welcome-icon notification-icon-wrap"
                                aria-label="알림"
                            >

                                <svg
                                    className="notification-icon-svg"
                                    viewBox="0 0 24 24"
                                    width="22"
                                    height="22"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >

                                    <path
                                        d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 14 3 16 3 18H21C21 16 18 14 18 8Z"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    <path
                                        d="M10 21H14"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />

                                </svg>


                                {unreadNotificationCount > 0 && (

                                    <span className="notification-badge">

                                        {unreadNotificationCount >=
                                        10
                                            ? "10+"
                                            : unreadNotificationCount}

                                    </span>

                                )}

                            </Link>


                            {/* ⭐ 프로필 */}

                            <Link
                                to="/mypage"
                                className="main-welcome-icon"
                                aria-label="내 정보"
                            >

                                <img
                                    src={
                                        profileImage ||
                                        profileIcon
                                    }
                                    alt="내 정보"
                                    onError={(e) => {

                                        e.currentTarget.src =
                                            profileIcon;

                                    }}
                                />

                            </Link>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 내 동호회
                ===================================================== */}

                <section className="my-club-section">

                    <div className="section-header">

                        <h3>
                            내 동호회
                        </h3>

                        <span className="section-more">
                            {myClubs.length}개 활동 중
                        </span>

                    </div>


                    <div
                        className={`my-club-list-wrap ${
                            canScrollLeft ? "has-left-shadow" : ""
                        } ${
                            canScrollRight ? "has-right-shadow" : ""
                        }`}
                    >

                        <div
                            className="my-club-list"
                            ref={myClubListRef}
                            onScroll={(e) =>
                                checkClubScroll(e.currentTarget)
                            }
                        >

                            {myClubs.map((club, index) => {

                            const clubIdValue =
                                club?.club_id ||
                                club?.id ||
                                club?.clubId;

                            const clubName =
                                club?.club_name ||
                                club?.name ||
                                club?.title ||
                                "동호회";

                            const sportName =
                                club?.sport_name ||
                                club?.sport ||
                                club?.sportName ||
                                "운동";

                            const memberCount =
                                club?.current_members ??
                                club?.member_count ??
                                club?.members_count ??
                                club?.current_member_count ??
                                club?.memberCount ??
                                club?.members ??
                                0;

                            // ⭐ DB 대표 이미지 우선
                            // ⭐ 이미지가 없을 때만 종목 기본 이미지 사용
                            const image =
                                club?.representative_image_url ||
                                club?.club_image ||
                                sportImages[sportName] ||
                                badmintonImage;

                            const isOperating =
                                Boolean(club?.isOperating);

                            return (

                                <Link
                                    key={
                                        clubIdValue ||
                                        `${clubName}-${index}`
                                    }
                                    to={
                                        clubIdValue
                                            ? `/clubs/${clubIdValue}`
                                            : "/clubs"
                                    }
                                    className="my-club-card"
                                >

                                    <div className="my-club-image">

                                        <span className="club-role-badge">
                                            {club?.clubType === "operating"
                                                ? "운영"
                                                : "가입"}
                                        </span>

                                        <img
                                            src={image}
                                            alt={clubName}
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    sportImages[sportName] ||
                                                    badmintonImage;
                                            }}
                                        />

                                    </div>

                                    <div className="my-club-info">

                                        <div className="my-club-name-row">

                                            <h4>
                                                {clubName}
                                            </h4>

                                            <span className="my-club-arrow">
                                                ›
                                            </span>

                                        </div>

                                        <p>
                                            {sportName}
                                        </p>

                                    </div>

                                    <div className="my-club-status-row">

                                        <span className="my-club-active-badge">
                                            활동 중
                                        </span>

                                        <span className="my-club-member-count">
                                            {Number(memberCount) || 0}명
                                        </span>

                                    </div>

                                    <div className="my-club-action">

                                        <span>
                                            동호회 보기
                                        </span>

                                        <span>
                                            →
                                        </span>

                                    </div>

                                </Link>

                            );

                        })}


                        {/* ⭐ 동호회 만들기 - 기존 코드 그대로 유지 */}

                        <Link
                            to="/clubs/create"
                            className="my-club-create-card"
                        >

                            <img
                                src={
                                    createClubImage
                                }
                                alt="동호회 만들기"
                            />

                            <p>
                                내 동호회를
                                <br />
                                만들어보세요!
                            </p>

                        </Link>

                        </div>


                    </div>

                </section>


                {/* =====================================================
                    ⭐ 이번 달 일정
                ===================================================== */}

                <section className="main-schedule-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={
                                    calendarIcon
                                }
                                alt="일정"
                            />

                            <h3>
                                이번 달 일정
                            </h3>

                        </div>


                        <Link
                            to={clubId ? `/clubs/${clubId}/manage/events` : "/myschedule"}
                            className="section-more"
                        >
                            전체 일정 보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />
                        </Link>

                    </div>


                    {/* ⭐ 월간 달력 */}

                    <MainHomeCalendar
                        selectedDate={
                            selectedDate
                        }
                        onSelectDate={
                            setSelectedDate
                        }
                        schedules={
                            schedules
                        }
                    />


                    {/* ⭐ 선택한 날짜 일정 */}

                    <div className="schedule-list">

                        {selectedSchedules.length >
                        0 ? (

                            selectedSchedules.map(
                                (schedule) => {

                                    const scheduleIndex =
                                        schedules.indexOf(
                                            schedule
                                        );


                                    return (

                                        <div
                                            className="schedule-item"
                                            key={
                                                schedule.title
                                            }
                                        >

                                            <div className="schedule-time">

                                                <span>
                                                    {
                                                        schedule.time
                                                    }
                                                </span>

                                                <span>
                                                    ~
                                                    {
                                                        schedule.endTime
                                                    }
                                                </span>

                                            </div>


                                            <img
                                                src={
                                                    schedule.image
                                                }
                                                alt={
                                                    schedule.alt
                                                }
                                            />


                                            <div className="schedule-info">

                                                <h4>
                                                    {
                                                        schedule.title
                                                    }
                                                </h4>

                                                <p>
                                                    {
                                                        schedule.place
                                                    }
                                                </p>

                                            </div>


                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleParticipation(
                                                        scheduleIndex
                                                    )
                                                }
                                                className={
                                                    participated[
                                                        scheduleIndex
                                                    ]
                                                        ? "participated"
                                                        : ""
                                                }
                                            >

                                                {
                                                    participated[
                                                        scheduleIndex
                                                    ]
                                                        ? "참여 취소"
                                                        : "참여 예정"
                                                }

                                            </button>

                                        </div>

                                    );

                                }
                            )

                        ) : (

                            <div className="main-home-no-schedule">
                                선택한 날짜에 일정이 없습니다.
                            </div>

                        )}

                    </div>


                    {/* ⭐ 전체 일정 */}

                    <Link 
                        to={clubId ? `/clubs/${clubId}/manage/events` : "/myschedule"}
                        className="schedule-all-button"
                    >
                        전체 일정 보기
                    </Link>

                </section>


                {/* =====================================================
                    ⭐ 게스트 모집
                ===================================================== */}

                <section className="guest-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={
                                    activityIcon
                                }
                                alt="게스트 모집"
                            />

                            <h3>
                                다른 동호회 게스트 모집
                            </h3>

                        </div>


                        <Link
                            to="/clubs"
                            className="section-more"
                        >

                            더보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />

                        </Link>

                    </div>


                    <div className="guest-list">

                        {guests.map(
                            (guest) => (

                                <Link
                                    key={
                                        guest.title
                                    }
                                    to="/clubs"
                                    className="guest-card"
                                >

                                    <div className="guest-image">

                                        <img
                                            src={
                                                guest.image
                                            }
                                            alt={
                                                guest.alt
                                            }
                                        />

                                        {/* ⭐ 게스트 모집 팝업 글씨 */}
                                        <span className="guest-badge">
                                            게스트 모집
                                        </span>

                                    </div>

                                    <h4>
                                        {
                                            guest.title
                                        }
                                    </h4>

                                    <p>
                                        {
                                            guest.time
                                        }
                                    </p>

                                    <p>
                                        {
                                            guest.place
                                        }
                                    </p>

                                    <span>
                                        자세히 보기
                                    </span>

                                </Link>

                            )
                        )}

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 커뮤니티
                ===================================================== */}

                <section className="community-section">

                    <div className="section-header">

                        <h3>
                            커뮤니티
                        </h3>


                        <Link
                            to="/community"
                            className="section-more"
                        >

                            더보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />

                        </Link>

                    </div>


                    <div className="community-list">

                        {posts.map(
                            (post) => (

                                <Link
                                    key={
                                        post.id
                                    }
                                    to={
                                        `/community/post/${post.id}`
                                    }
                                    className="community-card"
                                >

                                    <span className="community-category">
                                        {
                                            post.category
                                        }
                                    </span>


                                    <div className="community-content">

                                        <h4>
                                            {
                                                post.title
                                            }
                                        </h4>

                                        <p>
                                            {
                                                post.description
                                            }
                                        </p>

                                    </div>


                                    <div className="community-meta">

                                        <span>
                                            {
                                                post.date
                                            }
                                        </span>

                                        <span>
                                            댓글 {post.comments}
                                        </span>

                                    </div>

                                </Link>

                            )
                        )}

                    </div>

                </section>


                {/* =====================================================
                    ⭐ 이런 활동도 있어요
                ===================================================== */}

                <section className="main-home-activity-section">

                    <div className="section-header">

                        <div className="section-title">

                            <img
                                src={
                                    activityIcon
                                }
                                alt="활동 추천"
                            />

                            <h3>
                                이런 활동도 있어요
                            </h3>

                        </div>

                    </div>


                    <div
                        className="main-home-activity-list"
                        style={{
                            width: "100%",
                            display: "flex",
                            gap: "6px",
                            overflowX: "auto",
                            overflowY: "hidden",
                            padding: "0 1px 5px",
                            boxSizing: "border-box",
                            scrollbarWidth: "none",
                        }}
                    >

                        {activityClubs.slice(0, 4).map(
                            (club, index) => {

                                const clubIdValue =
                                    club?.club_id ||
                                    club?.id ||
                                    club?.clubId;

                                const clubName =
                                    club?.club_name ||
                                    club?.name ||
                                    club?.title ||
                                    "동호회";

                                const sportName =
                                    club?.sport_name ||
                                    club?.sport ||
                                    club?.sportName ||
                                    "운동";

                                const memberCount =
                                    club?.current_members ??
                                    club?.member_count ??
                                    club?.members_count ??
                                    0;

                                const image =
                                    club?.representative_image_url ||
                                    club?.club_image ||
                                    sportImages[sportName] ||
                                    badmintonImage;

                                const region =
                                    club?.region ||
                                    club?.club_region ||
                                    club?.activity_region ||
                                    "지역 정보 없음";

                                return (

                                    <Link
                                        key={
                                            clubIdValue ||
                                            `${clubName}-${index}`
                                        }
                                        to={
                                            clubIdValue
                                                ? `/clubs/${clubIdValue}`
                                                : "/clubs"
                                        }
                                        className="main-home-activity-card"
                                        style={{
                                            flex: "0 0 calc((100% - 18px) / 4)",
                                            width: "calc((100% - 18px) / 4)",
                                            minWidth: "calc((100% - 18px) / 4)",
                                            display: "block",
                                            boxSizing: "border-box",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            background: "#fff",
                                            textDecoration: "none",
                                            color: "#333",
                                        }}
                                    >

                                        <div
                                            className="main-home-activity-image"
                                            style={{
                                                position: "relative",
                                                width: "100%",
                                                height: "58px",
                                                overflow: "hidden",
                                            }}
                                        >

                                            <span
                                                className="main-home-activity-category"
                                                style={{
                                                    position: "absolute",
                                                    top: "4px",
                                                    left: "4px",
                                                    zIndex: 2,
                                                    padding: "2px 5px",
                                                    borderRadius: "4px",
                                                    background: "#01A17F",
                                                    color: "#fff",
                                                    fontSize: "7px",
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                운동
                                            </span>

                                            <img
                                                src={image}
                                                alt={clubName}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "block",
                                                    objectFit: "cover",
                                                }}
                                                onError={(e) => {

                                                    e.currentTarget.src =
                                                        sportImages[sportName] ||
                                                        badmintonImage;

                                                }}
                                            />

                                        </div>


                                        <h4
                                            style={{
                                                margin: "6px 5px 4px",
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {clubName}
                                        </h4>


                                        <p
                                            style={{
                                                margin: "3px 5px",
                                                fontSize: "7px",
                                                color: "#888",
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {sportName}
                                            {" · "}
                                            {region}
                                        </p>


                                        <span
                                            className="main-home-activity-action"
                                            style={{
                                                display: "block",
                                                margin: "6px 5px 7px",
                                                padding: "4px 0",
                                                border: "1px solid #01A17F",
                                                borderRadius: "5px",
                                                background: "#fff",
                                                color: "#01A17F",
                                                textAlign: "center",
                                                fontSize: "7px",
                                            }}
                                        >
                                            자세히 보기
                                        </span>

                                    </Link>

                                );

                            }
                        )}

                    </div>

                </section>

                {/* ⭐ 이용도우미가 활동 카드 버튼을 가리지 않도록 하단 스크롤 여유 공간 */}
                <div
                    aria-hidden="true"
                    style={{
                        height: "100px",
                    }}
                />

            </main>


            {/* ⭐ 챗봇 */}

            {!isChatbotOpen && (

                <ChatbotButton
                    onClick={() =>
                        setIsChatbotOpen(
                            true
                        )
                    }
                />

            )}


            {isChatbotOpen && (

                <Chatbot
                    onClose={() =>
                        setIsChatbotOpen(
                            false
                        )
                    }
                />

            )}


            {/* ⭐ 하단 네비 */}

            <BottomNav />

        </div>

    );
}


// =========================================================
// ⭐ 메인 홈 월간 달력
// =========================================================

function MainHomeCalendar({
    selectedDate,
    onSelectDate,
    schedules = [],
}) {

    const today = new Date();


    const [viewYear, setViewYear] =
        useState(
            today.getFullYear()
        );


    const [viewMonth, setViewMonth] =
        useState(
            today.getMonth() + 1
        );


    // =========================================================
    // ⭐ 날짜가 선택되면 해당 월로 이동
    // =========================================================

    useEffect(() => {

        if (!selectedDate) {
            return;
        }


        const [
            year,
            month,
        ] = selectedDate
            .split("-")
            .map(Number);


        setViewYear(year);
        setViewMonth(month);

    }, [selectedDate]);


    // =========================================================
    // ⭐ 일정 날짜
    // =========================================================

    const scheduleDateSet =
        new Set(
            schedules.map(
                (schedule) =>
                    schedule.date
            )
        );


    // =========================================================
    // ⭐ 달력 날짜 생성
    // =========================================================

    const firstDay =
        new Date(
            viewYear,
            viewMonth - 1,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            viewYear,
            viewMonth,
            0
        ).getDate();


    const calendarCells = [];


    // ⭐ 시작 빈칸

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        calendarCells.push(
            null
        );

    }


    // ⭐ 실제 날짜

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        calendarCells.push(
            day
        );

    }


    // ⭐ 마지막 빈칸

    while (
        calendarCells.length %
            7 !==
        0
    ) {

        calendarCells.push(
            null
        );

    }


    // =========================================================
    // ⭐ 이전 / 다음 달
    // =========================================================

    const moveMonth =
        (direction) => {

            let nextYear =
                viewYear;

            let nextMonth =
                viewMonth +
                direction;


            if (
                nextMonth < 1
            ) {

                nextYear -= 1;
                nextMonth = 12;

            }


            if (
                nextMonth > 12
            ) {

                nextYear += 1;
                nextMonth = 1;

            }


            setViewYear(
                nextYear
            );

            setViewMonth(
                nextMonth
            );

        };


    // =========================================================
    // ⭐ 오늘로 이동
    // =========================================================

    const moveToday = () => {

        const now =
            new Date();


        const todayDate =
            `${now.getFullYear()}-${String(
                now.getMonth() + 1
            ).padStart(2, "0")}-${String(
                now.getDate()
            ).padStart(2, "0")}`;


        setViewYear(
            now.getFullYear()
        );


        setViewMonth(
            now.getMonth() + 1
        );


        onSelectDate(
            todayDate
        );

    };


    const weekdayLabels = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
    ];


    return (

        <div className="main-home-calendar">

            {/* ⭐ 달력 헤더 */}

            <div className="main-home-calendar-header">

                <button
                    type="button"
                    onClick={() =>
                        moveMonth(-1)
                    }
                    aria-label="이전 달"
                >
                    ‹
                </button>


                <strong>
                    {viewYear}년{" "}
                    {viewMonth}월
                </strong>


                <button
                    type="button"
                    onClick={
                        moveToday
                    }
                    className="main-home-today-button"
                >
                    오늘
                </button>

            </div>


            {/* ⭐ 요일 */}

            <div className="main-home-weekdays">

                {weekdayLabels.map(
                    (
                        label,
                        index
                    ) => (

                        <span
                            key={label}
                            className={
                                index === 0
                                    ? "sunday"
                                    : index === 6
                                        ? "saturday"
                                        : ""
                            }
                        >
                            {label}
                        </span>

                    )
                )}

            </div>


            {/* ⭐ 날짜 */}

            <div className="main-home-calendar-grid">

                {calendarCells.map(
                    (
                        day,
                        index
                    ) => {

                        if (!day) {

                            return (

                                <div
                                    key={
                                        `empty-${index}`
                                    }
                                    className="main-home-empty-day"
                                />

                            );

                        }


                        const dateString =
                            `${viewYear}-${String(
                                viewMonth
                            ).padStart(
                                2,
                                "0"
                            )}-${String(
                                day
                            ).padStart(
                                2,
                                "0"
                            )}`;


                        const isSelected =
                            dateString ===
                            selectedDate;


                        const hasSchedule =
                            scheduleDateSet.has(
                                dateString
                            );


                        return (

                            <button
                                key={
                                    dateString
                                }
                                type="button"
                                className={
                                    isSelected
                                        ? "main-home-calendar-day selected"
                                        : "main-home-calendar-day"
                                }
                                onClick={() =>
                                    onSelectDate(
                                        dateString
                                    )
                                }
                            >

                                <span>
                                    {day}
                                </span>


                                {hasSchedule && (

                                    <div className="main-home-calendar-dots">

                                        <i />

                                    </div>

                                )}

                            </button>

                        );

                    }
                )}

            </div>

        </div>

    );
}


export default MainHome;
