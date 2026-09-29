// 가입 후 메인 홈

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BottomNav from "../../components/BottomNav";
import { attachClubInfoToEvents } from "../../utils/attachClubInfo";
import { buildRecommendedClubs, safeImageUrl } from "../../utils/recommendClubs";
import "./MainHome.css";

import { supabase } from "../../../supabaseClient";

// ⭐ API
import {
    getClubEvents,
    getGuestRecruitingEvents,
} from "../../api/clubApi";
import { getMyClubShared as getMyClub } from "../../api/myClubCache";
import { authenticatedRequest } from "../../api/apiClient";

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
import { useNotifications } from "../../context/NotificationContext";
import Chatbot from "../Chatbot/Chatbot";


// =========================================================
// ⭐ 내 게스트 일정 조회 (이 페이지 전용)
//
// GET /api/users/me/guest-events?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
// (기간은 선택, 안 보내면 전체)
//
// 다른 담당 영역 파일(api/userApi.js 등)을 수정하지 않도록
// 페이지 안에 따로 둔다. apiClient 는 가져다 쓰기만 한다.
// =========================================================
const getMyGuestEvents = async ({ fromDate, toDate } = {}) => {

    const params = new URLSearchParams();

    if (fromDate) params.set("from_date", fromDate);
    if (toDate) params.set("to_date", toDate);

    const query = params.toString();

    return authenticatedRequest(
        `/api/users/me/guest-events${query ? `?${query}` : ""}`,
        { method: "GET" }
    );
};


// ⭐ 게스트 신청 상태 → 화면 표시 문구
const GUEST_STATUS_LABEL = {
    pending: "승인 대기",
    joined: "참여 확정",
};


// =========================================================
// ⭐ 게스트 일정 이미지
//
// 우선순위: 일정 이미지 → 동호회 대표 이미지 → 종목 기본 이미지 → 달력 아이콘
// 이미지 주소가 깨지면 다음 순서로 넘어감
// =========================================================

function GuestEventImage({ event }) {

    // ⭐ 깨진 주소(더미 데이터)는 미리 빼서 요청 자체를 안 보냄
    const candidates = [
        safeImageUrl(event.event_image_url),
        safeImageUrl(event.club_image_url),
        sportImages[event.club_sport],
    ].filter(Boolean);

    const [index, setIndex] = useState(0);

    const src = candidates[index];

    if (!src) {
        return (
            <img
                src={calendarIcon}
                alt=""
                className="guest-image-fallback"
            />
        );
    }

    return (
        <img
            src={src}
            alt={event.club_name || event.title || "게스트 모집 일정"}
            onError={() => setIndex((prev) => prev + 1)}
        />
    );

}


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

    // ⭐ 첫 번째 동호회가 운영 중인 동호회인지
    // (전체 일정 보기: 운영자 → 일정 관리 / 회원 → 내 일정)
    const [isClubOperator, setIsClubOperator] = useState(false);

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

    // ⭐ 안 읽은 알림 개수는 NotificationContext 한 곳에서 관리
    //    (실시간 구독도 Context 한 곳에서만 함)
    const { unreadCount: unreadNotificationCount } = useNotifications();


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
    //
    // ⭐ 게스트 일정:
    // 다른 동호회에 게스트로 신청(승인 대기) / 참여(확정)한 일정도
    // GET /api/users/me/guest-events 로 가져와서 같은 달력에 합친다.
    // (같은 일정이 양쪽에 있으면 내 동호회 일정을 우선)
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

                // =================================================
                // ⭐ 게스트 일정 (동호회가 없어도 조회)
                //    실패해도 동호회 일정은 보여줄 수 있게 따로 처리
                // =================================================

                const guestEventsPromise =
                    getMyGuestEvents()
                        .then((result) => result?.events || [])
                        .catch((error) => {

                            console.error(
                                "⭐ MainHome 게스트 일정 조회 실패:",
                                error
                            );

                            return [];
                        });

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

                const guestEvents = await guestEventsPromise;

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
                                safeImageUrl(event?.event_image_url) ||
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

                            isGuest: false,
                        };
                    });

                // =================================================
                // ⭐ 게스트 일정 → MainHome 일정 형태로 변환
                // =================================================

                const mappedGuestSchedules =
                    guestEvents.map((event) => ({
                        eventId:
                            event?.event_id,
                        clubId:
                            event?.club_id,

                        date:
                            event?.event_date
                                ? String(event.event_date).slice(0, 10)
                                : "",

                        time:
                            event?.start_time
                                ? String(event.start_time).slice(0, 5)
                                : "",

                        endTime:
                            event?.end_time
                                ? String(event.end_time).slice(0, 5)
                                : "",

                        image:
                            safeImageUrl(event?.event_image_url) ||
                            badmintonImage,

                        alt:
                            event?.title ||
                            "게스트 일정",

                        title:
                            event?.title ||
                            "게스트 일정",

                        place:
                            [event?.club_name, event?.location]
                                .filter(Boolean)
                                .join(" · ") ||
                            "장소 미정",

                        status:
                            event?.status,

                        // ⭐ 게스트 일정 표시용
                        isGuest: true,
                        guestStatus:
                            event?.guest_status,

                        // ⭐ 게스트 모집 상세로 넘길 원본 데이터
                        //    (모집이 마감돼도 상세 화면이 바로 표시되도록)
                        raw: event,
                    }));

                // ⭐ 같은 event_id 중복 제거
                //    (동호회 일정이 앞에 있으므로 동호회 일정이 우선)
                const uniqueSchedules =
                    [
                        ...mappedSchedules,
                        ...mappedGuestSchedules,
                    ].filter(
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

    // ⭐ 백엔드 GET /api/clubs/guest-recruiting
    //    (게스트 허용 + 모집 중 + 마감 전 일정만 내려옴)
    // ⭐ 내가 운영/가입한 동호회 일정은 제외 → "다른 동호회"만 표시
    const [guestEvents, setGuestEvents] = useState([]);

    const [isGuestLoading, setIsGuestLoading] = useState(true);


    useEffect(() => {

        let isActive = true;

        const loadGuestEvents = async () => {

            try {

                setIsGuestLoading(true);

                const data = await getGuestRecruitingEvents();

                const eventList =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.items)
                            ? data.items
                            : [];

                // ⭐ 내 동호회 ID
                const myClubIds = new Set(
                    myClubs
                        .map(
                            (club) =>
                                club?.club_id ||
                                club?.id ||
                                club?.clubId
                        )
                        .filter(Boolean)
                        .map(String)
                );

                const otherClubEvents = eventList
                    .filter(
                        (event) =>
                            !myClubIds.has(String(event?.club_id))
                    )
                    .slice(0, 4);

                // ⭐ 동호회 이미지 / 이름 붙이기
                const eventsWithClub =
                    await attachClubInfoToEvents(
                        otherClubEvents
                    );

                if (isActive) {
                    setGuestEvents(eventsWithClub);
                }

            } catch (error) {

                console.error(
                    "⭐ MainHome 게스트 모집 조회 오류:",
                    error
                );

                if (isActive) {
                    setGuestEvents([]);
                }

            } finally {

                if (isActive) {
                    setIsGuestLoading(false);
                }

            }

        };

        loadGuestEvents();

        return () => {
            isActive = false;
        };

    }, [myClubs]);


    // ⭐ 게스트 일정 날짜/시간 표시 (예: 10.3(토) 19:00)
    const formatGuestSchedule = (eventDate, startTime) => {

        if (!eventDate) {
            return "일정 미정";
        }

        const [year, month, day] =
            String(eventDate).split("-").map(Number);

        const date = new Date(year, month - 1, day);

        const weekday =
            ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

        const time =
            startTime
                ? String(startTime).slice(0, 5)
                : "";

        return `${month}.${day}(${weekday}) ${time}`.trim();

    };


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
                        // ⭐ 첫 번째 동호회가 운영 중인 동호회인지
                        setIsClubOperator(operatingClubList.length > 0);
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


                } catch (error) {

                    console.error(
                        "가입 후 홈 사용자 정보 조회 오류:",
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

                // ⭐ 내 동호회를 제외하고 랜덤 4개
                //    + 실제 이미지/종목/지역 + 추천·신규·HOT 뱃지
                const recommendedClubs =
                    await buildRecommendedClubs({
                        clubs: clubList,
                        excludeIds: [...myClubIds],
                        count: 4,
                    });

                if (!isActive) {
                    return;
                }

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

        // ⭐ 내 동호회 정보가 들어온 뒤에 한 번만 뽑기
        //    (처음 빈 목록일 때 뽑으면 내 동호회가 섞였다가 바뀌며 깜빡임)
        if (myClubs.length > 0) {
            loadActivityClubs();
        }

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


                    {/* ⭐ 왼쪽: 내 동호회 슬라이드 / 오른쪽: 동호회 만들기 고정 */}
                    <div className="my-club-row">

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
                                safeImageUrl(club?.representative_image_url) ||
                                safeImageUrl(club?.club_image) ||
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
                                    // ⭐ 운영자 → 운영 대시보드
                                    // ⭐ 가입자 → 동호회 이용자 대시보드
                                    to={
                                        !clubIdValue
                                            ? "/clubs"
                                            : isOperating
                                                ? `/clubs/${clubIdValue}/manage`
                                                : `/clubs/${clubIdValue}/home`
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
                                            {isOperating ? "운영 중" : "활동 중"}
                                        </span>

                                        <span className="my-club-member-count">
                                            {Number(memberCount) || 0}명
                                        </span>

                                    </div>

                                    <div className="my-club-action">

                                        <span>
                                            {isOperating ? "운영 관리" : "동호회 보기"}
                                        </span>

                                        <span>
                                            →
                                        </span>

                                    </div>

                                </Link>

                            );

                        })}

                        </div>

                    </div>


                    {/* ⭐ 동호회 만들기 - 오른쪽에 고정 (슬라이드되지 않음) */}

                    <Link
                        to="/clubs/create"
                        className="my-club-create-card my-club-create-fixed"
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
                            to={
                            clubId && isClubOperator
                                ? `/clubs/${clubId}/manage/events`
                                : "/myschedule"
                        }
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
                                            className={
                                                schedule.isGuest
                                                    ? "schedule-item guest"
                                                    : "schedule-item"
                                            }
                                            key={
                                                `${schedule.isGuest ? "guest" : "club"}-${schedule.eventId ?? schedule.title}`
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
                                                    {schedule.isGuest && (
                                                        <span className="schedule-guest-tag">
                                                            게스트
                                                        </span>
                                                    )}
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


                                            {schedule.isGuest ? (

                                                // ⭐ 게스트 일정 → 신청 상태 표시 + 상세로 이동
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/guest-recruit/${schedule.eventId}`,
                                                            {
                                                                state: {
                                                                    event:
                                                                        schedule.raw,
                                                                    guestStatus:
                                                                        schedule.guestStatus,
                                                                },
                                                            }
                                                        )
                                                    }
                                                    className={
                                                        schedule.guestStatus === "joined"
                                                            ? "guest-status joined"
                                                            : "guest-status"
                                                    }
                                                >
                                                    {GUEST_STATUS_LABEL[
                                                        schedule.guestStatus
                                                    ] || "승인 대기"}
                                                </button>

                                            ) : (

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

                                            )}

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
                        to={
                            clubId && isClubOperator
                                ? `/clubs/${clubId}/manage/events`
                                : "/myschedule"
                        }
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
                            to="/guest-recruit"
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

                        {isGuestLoading ? (

                            <p className="guest-empty">
                                게스트 모집 일정을 불러오는 중이에요.
                            </p>

                        ) : guestEvents.length === 0 ? (

                            <p className="guest-empty">
                                지금 게스트를 모집 중인 일정이 없어요.
                            </p>

                        ) : (

                            guestEvents.map((event) => (

                                // ⭐ 게스트 모집 상세 페이지로 이동
                                //    (event를 같이 넘겨서 상세 페이지가 다시 불러오지 않게)
                                <Link
                                    key={event.event_id}
                                    to={`/guest-recruit/${event.event_id}`}
                                    state={{ event }}
                                    className="guest-card"
                                >

                                    <div className="guest-image">

                                        <GuestEventImage event={event} />

                                        {/* ⭐ 게스트 모집 팝업 글씨 */}
                                        <span className="guest-badge">
                                            게스트 모집
                                        </span>

                                    </div>

                                    <h4>
                                        {event.title || "게스트 모집"}
                                    </h4>

                                    <p>
                                        {formatGuestSchedule(
                                            event.event_date,
                                            event.start_time
                                        )}
                                    </p>

                                    <p>
                                        {event.location || "장소 미정"}
                                    </p>

                                    <span>
                                        자세히 보기
                                    </span>

                                </Link>

                            ))

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


                        <Link
                            to="/clubs/all"
                            className="section-more"
                        >

                            더보기

                            <img
                                src={backIcon}
                                alt="이동"
                            />

                        </Link>

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

                        {activityClubs.map((club) => {

                            // ⭐ recommendClubs.js에서 정리된 실제 동호회 데이터
                            const fallbackImage =
                                sportImages[club.sports[0]] ||
                                badmintonImage;

                            return (

                                <Link
                                    key={club.id}
                                    to={`/clubs/${club.id}`}
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

                                        {/* ⭐ 추천 / 신규 / HOT (해당 없으면 표시 안 함) */}
                                        {club.badge && (
                                            <span
                                                className="main-home-activity-category"
                                                style={{
                                                    position: "absolute",
                                                    top: "4px",
                                                    left: "4px",
                                                    zIndex: 2,
                                                    padding: "2px 5px",
                                                    borderRadius: "4px",
                                                    background: club.badge.color,
                                                    color: "#fff",
                                                    fontSize: "7px",
                                                    lineHeight: 1.2,
                                                }}
                                            >
                                                {club.badge.label}
                                            </span>
                                        )}

                                        <img
                                            src={club.image || fallbackImage}
                                            alt={club.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                display: "block",
                                                objectFit: "cover",
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    fallbackImage;
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
                                        {club.name}
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
                                        {club.subText}
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

                        })}

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
            schedules
                .filter((schedule) => !schedule.isGuest)
                .map(
                    (schedule) =>
                        schedule.date
                )
        );

    // ⭐ 게스트 일정이 있는 날짜 (다른 색 점)
    const guestScheduleDateSet =
        new Set(
            schedules
                .filter((schedule) => schedule.isGuest)
                .map((schedule) => schedule.date)
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

                        const hasGuestSchedule =
                            guestScheduleDateSet.has(
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


                                {(hasSchedule || hasGuestSchedule) && (

                                    <div className="main-home-calendar-dots">

                                        {hasSchedule && <i />}

                                        {/* ⭐ 게스트 일정 점 */}
                                        {hasGuestSchedule && (
                                            <i className="guest" />
                                        )}

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
