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