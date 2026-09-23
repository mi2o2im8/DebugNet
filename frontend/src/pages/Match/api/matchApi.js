// ========================================
// 팀매칭 API
// ========================================

import {
  authenticatedRequest,
} from "../../../api/apiClient";


// ========================================
// 팀매칭 등록 옵션 조회
//
// 반환:
// - 내가 운영 가능한 동호회
// - 활성화된 종목 목록
// ========================================
export const getMatchOptions = () => {
  return authenticatedRequest(
    "/api/matches/options",
    {
      method: "GET",
    }
  );
};


// ========================================
// 내가 등록한 경기 가능일 목록 조회
// ========================================
export const getMyMatchAvailabilities = () => {
  return authenticatedRequest(
    "/api/matches/availabilities/my",
    {
      method: "GET",
    }
  );
};


// ========================================
// 상대팀 경기 가능일 목록 조회
//
// 선택 조건:
// - 날짜
// - 종목
// - 지역
// ========================================
export const getMatchAvailabilities = ({
  matchDate,
  sportId,
  region,
} = {}) => {
  const params = new URLSearchParams();

  // 날짜 조건
  if (matchDate) {
    params.set(
      "match_date",
      matchDate
    );
  }

  // 종목 조건
  if (sportId) {
    params.set(
      "sport_id",
      String(sportId)
    );
  }

  // 전체 지역이면 region을 보내지 않음
  if (
    region &&
    region !== "전체"
  ) {
    params.set(
      "region",
      region
    );
  }

  const queryString =
    params.toString();

  const url = queryString
    ? `/api/matches/availabilities?${queryString}`
    : "/api/matches/availabilities";

  return authenticatedRequest(
    url,
    {
      method: "GET",
    }
  );
};


// ========================================
// 경기 가능일 상세 조회
//
// 내 경기 상세 / 상대팀 상세에서 공통 사용
// ========================================
export const getMatchAvailabilityDetail = (
  availabilityId
) => {
  return authenticatedRequest(
    `/api/matches/availabilities/${availabilityId}`,
    {
      method: "GET",
    }
  );
};


// ========================================
// 경기 가능일 등록
// ========================================
export const createMatchAvailability = (
  requestData
) => {
  return authenticatedRequest(
    "/api/matches/availabilities",
    {
      method: "POST",
      body: requestData,
    }
  );
};


// ========================================
// 경기 가능일 수정
// ========================================
export const updateMatchAvailability = (
  availabilityId,
  requestData
) => {
  return authenticatedRequest(
    `/api/matches/availabilities/${availabilityId}`,
    {
      method: "PATCH",
      body: requestData,
    }
  );
};


// ========================================
// 경기 가능일 삭제
//
// confirm=false
// → 일반 삭제 시도
//
// confirm=true
// → 매칭 신청이 있어도 최종 삭제
// ========================================
export const deleteMatchAvailability = (
  availabilityId,
  confirm = false
) => {
  const queryString = confirm
    ? "?confirm=true"
    : "";

  return authenticatedRequest(
    `/api/matches/availabilities/${availabilityId}${queryString}`,
    {
      method: "DELETE",
    }
  );
};


// ========================================
// 특정 상대팀에게 매칭 신청 가능한
// 내 동호회 목록 조회
// ========================================
export const getRequestableClubs = (
  availabilityId
) => {
  const params = new URLSearchParams({
    availability_id:
      String(availabilityId),
  });

  return authenticatedRequest(
    `/api/matches/requestable-clubs?${params.toString()}`,
    {
      method: "GET",
    }
  );
};


// ========================================
// 상대팀에게 매칭 신청
//
// Backend가 availability_id로
// target_club_id를 직접 찾기 때문에
// target_club_id는 보내지 않는다.
// ========================================
export const createMatchRequest = ({
  availabilityId,
  requesterClubId,
}) => {
  return authenticatedRequest(
    "/api/matches/requests",
    {
      method: "POST",

      body: {
        availability_id:
          Number(availabilityId),

        requester_club_id:
          Number(requesterClubId),
      },
    }
  );
};

// ========================================
// 백엔드 시간 표시용 변환
//
// 19:00:00 → 19:00
// ========================================
const formatManagementTime = (time) => {

  if (!time) {
    return null;
  }

  return String(time).slice(0, 5);
};


// ========================================
// 매칭관리 목록 상태 문구
// ========================================
const getManagementStatusLabel = (
  matchType,
  status
) => {

  if (matchType === "received") {
    return "승인 대기";
  }

  if (matchType === "sent") {
    return "응답 대기";
  }

  if (matchType === "upcoming") {
    return "경기 예정";
  }

  if (matchType === "writtenReviews") {
    return "작성 완료";
  }

  if (matchType === "receivedReviews") {
    return "후기 도착";
  }

  return status || "";
};


// ========================================
// 매칭관리 메인 요약 조회
//
// 받은 신청
// 보낸 신청
// 예정 경기
// 지난 경기
// 작성한 후기
// 받은 후기
// ========================================
export const getMatchManagementSummary = async (
  clubId
) => {

  const response =
    await authenticatedRequest(
      `/api/matches/management/${clubId}/summary`,
      {
        method: "GET",
      }
    );


  // Backend snake_case
  // → 현재 Frontend camelCase로 변환
  return {
    received:
      response.received || 0,

    sent:
      response.sent || 0,

    upcoming:
      response.upcoming || 0,

    history:
      response.history || 0,

    writtenReviews:
      response.written_reviews || 0,

    receivedReviews:
      response.received_reviews || 0,
  };
};


// ========================================
// 매칭관리 목록 조회
//
// matchType:
// received
// sent
// upcoming
// history
// writtenReviews
// receivedReviews
// ========================================
export const getMatchManagementMatches = async (
  clubId,
  matchType
) => {

  const params =
    new URLSearchParams({
      type: matchType,
    });


  const response =
    await authenticatedRequest(
      `/api/matches/management/${clubId}/matches?${params.toString()}`,
      {
        method: "GET",
      }
    );


  return {
    items: (
      response.items || []
    ).map((item) => ({

      clubMatchId:
        item.club_match_id,

      opponentClubId:
        item.opponent_club_id,

      opponentClubName:
        item.opponent_club_name,

      opponentClubProfileImage:
        item.opponent_club_profile_image,

      sportName:
        item.sport_name,

      matchDate:
        item.match_date,

      startTime:
        formatManagementTime(
          item.start_time
        ),

      endTime:
        formatManagementTime(
          item.end_time
        ),

      region:
        item.region,

      locationName:
        item.location_name,

      status:
        item.status,

      statusLabel:
        getManagementStatusLabel(
          matchType,
          item.status
        ),

      recordStatus:
        item.record_status,

      hasWrittenReview:
        item.has_written_review,

      hasReceivedReview:
        item.has_received_review,
    })),

    totalCount:
      response.total_count || 0,
  };
};


// ========================================
// 매칭관리 상세 조회
// ========================================
export const getMatchManagementDetail = async (
  clubId,
  clubMatchId
) => {

  const response =
    await authenticatedRequest(
      `/api/matches/management/${clubId}/matches/${clubMatchId}`,
      {
        method: "GET",
      }
    );


  return {

    clubMatchId:
      response.club_match_id,

    type:
      response.type,


    // 상대 동호회
    opponentClubId:
      response.opponent_club_id,

    opponentClubName:
      response.opponent_club_name,

    opponentClubProfileImage:
      response.opponent_club_profile_image,


    // 경기 정보
    sportName:
      response.sport_name,

    matchDate:
      response.match_date,

    startTime:
      formatManagementTime(
        response.start_time
      ),

    endTime:
      formatManagementTime(
        response.end_time
      ),


    // 장소
    region:
      response.region,

    locationName:
      response.location_name,

    address:
      response.address,


    // 경기 조건
    skillLevel:
      response.skill_level,

    requiredPlayers:
      response.required_players,

    venueType:
      response.venue_type,

    parkingAvailable:
      response.parking_available,

    intro:
      response.intro,


    // 상태
    status:
      response.status,

    statusLabel:
      response.status_label,

    recordStatus:
      response.record_status,


    // 경기 결과
    myScore:
      response.my_score,

    opponentScore:
      response.opponent_score,


    // 후기
    hasWrittenReview:
      response.has_written_review,

    hasReceivedReview:
      response.has_received_review,


    // 경기 취소 요청
    isCancelRequestSent:
      response.is_cancel_request_sent,

    isCancelRequestReceived:
      response.is_cancel_request_received,
  };
};


// ========================================
// 받은 매칭 신청 승인
// ========================================
export const approveMatchRequest = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/approve`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 받은 매칭 신청 거절
// ========================================
export const rejectMatchRequest = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/reject`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 보낸 매칭 신청 취소
// ========================================
export const cancelSentMatchRequest = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/cancel`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 확정 경기 취소 요청
// ========================================
export const requestMatchCancellation = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/cancel-request`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 상대팀이 보낸 경기 취소 요청 승인
// ========================================
export const approveMatchCancellation = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/cancel-request/approve`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 상대팀이 보낸 경기 취소 요청 거절
// ========================================
export const rejectMatchCancellation = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/cancel-request/reject`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 경기 결과 작성 / 수정 / 재제출
// ========================================
export const submitMatchResult = (
  clubId,
  clubMatchId,
  {
    myScore,
    opponentScore,
  }
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/result`,
    {
      method: "PUT",

      body: {
        my_score:
          Number(myScore),

        opponent_score:
          Number(opponentScore),
      },
    }
  );
};


// ========================================
// 상대팀이 제출한 경기 결과 승인
// ========================================
export const approveMatchResult = (
  clubId,
  clubMatchId
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/result/approve`,
    {
      method: "PATCH",
    }
  );
};


// ========================================
// 경기 후기 작성
// ========================================
export const createMatchReview = (
  clubId,
  clubMatchId,
  review
) => {

  return authenticatedRequest(
    `/api/matches/management/${clubId}/matches/${clubMatchId}/review`,
    {
      method: "POST",

      body: {
        manner_score:
          review.mannerScore,

        punctuality_score:
          review.punctualityScore,

        roster_accuracy_score:
          review.rosterAccuracyScore,

        safety_score:
          review.safetyScore,

        game_flow_score:
          review.gameFlowScore,

        rematch_score:
          review.rematchScore,

        content:
          review.content?.trim() ||
          null,
      },
    }
  );
};


// ========================================
// 경기 후기 상세 조회
//
// reviewType:
// written
// received
// ========================================
export const getMatchReviewDetail = async (
  clubId,
  clubMatchId,
  reviewType
) => {

  const params =
    new URLSearchParams({
      type: reviewType,
    });


  const response =
    await authenticatedRequest(
      `/api/matches/management/${clubId}/matches/${clubMatchId}/review?${params.toString()}`,
      {
        method: "GET",
      }
    );


  return {

    matchReviewId:
      response.match_review_id,

    clubMatchId:
      response.club_match_id,

    type:
      response.type,


    // 상대 동호회
    opponentClubId:
      response.opponent_club_id,

    opponentClubName:
      response.opponent_club_name,

    opponentClubProfileImage:
      response.opponent_club_profile_image,


    // 경기 정보
    matchDate:
      response.match_date,

    startTime:
      formatManagementTime(
        response.start_time
      ),

    endTime:
      formatManagementTime(
        response.end_time
      ),

    locationName:
      response.location_name,


    // 경기 결과
    myScore:
      response.my_score,

    opponentScore:
      response.opponent_score,


    // 후기
    mannerScore:
      response.manner_score,

    punctualityScore:
      response.punctuality_score,

    rosterAccuracyScore:
      response.roster_accuracy_score,

    safetyScore:
      response.safety_score,

    gameFlowScore:
      response.game_flow_score,

    rematchScore:
      response.rematch_score,

    content:
      response.content,
  };
};