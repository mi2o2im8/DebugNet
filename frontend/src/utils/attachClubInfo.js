// 게스트 모집 일정에 동호회 정보(이름 / 대표 이미지 / 종목) 붙이기
//
// ⭐ /api/clubs/guest-recruiting 응답에는 club_id 만 있고
//    동호회 이미지가 없어서, 동호회 상세 API로 한 번 더 조회
// ⭐ 같은 동호회는 한 번만 조회 (일정 4개면 최대 4번)
// ⭐ 로그인 없이 호출 가능한 API라 게스트 화면에서도 사용 가능


const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000";


export const attachClubInfoToEvents = async (events = []) => {

    const clubIds = [
        ...new Set(
            events
                .map((event) => event?.club_id)
                .filter(Boolean)
                .map(String)
        ),
    ];


    // ⭐ 동호회 상세 동시에 조회 (하나 실패해도 나머지는 표시)
    const results = await Promise.allSettled(

        clubIds.map(async (clubId) => {

            const response = await fetch(
                `${API_BASE_URL}/api/clubs/${clubId}`
            );

            if (!response.ok) {
                throw new Error(`동호회 ${clubId} 조회 실패`);
            }

            const club = await response.json();

            return [
                clubId,
                {
                    club_name: club?.club_name || "",
                    club_image_url:
                        club?.images?.[0]?.image_url ||
                        club?.representative_image_url ||
                        club?.image_url ||
                        null,
                    club_sport: club?.sports?.[0] || "",
                },
            ];

        })

    );


    const clubInfoMap = new Map(
        results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value)
    );


    return events.map((event) => ({
        ...event,
        ...(clubInfoMap.get(String(event?.club_id)) || {}),
    }));

};