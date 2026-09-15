// 회원가입 전체 데이터 공용 저장공간

import { createContext, useContext, useState } from "react";

const SignupContext = createContext();

export function SignupProvider({ children }) {
    const [signupData, setSignupData] = useState({
        // 1. 계정
        email: "",
        password: "",
        passwordConfirm: "",

        // 2. 기본정보
        name: "",
        nickname: "",
        gender: "",
        birth_date: "",

        // 3. 운동 종목
        sports: [],
        levels: {},

        // 4. 활동 지역 / 이동 가능 거리
        // location: [],
        regions: [],
        travel_distance_km: null,

        // 5. 활동 빈도
        frequency: "",

        // 6. 동호회 선호
        clubPreferences: [],

        // 7. 활동 가능 지역
        // regions: [], 2개
        // distance: "", //----별도로 필요 없다면 뺀다.

        // 8. 활동 가능 시간
        availableTimes: [],

        // 9. 최대 가능 회비
        max_monthly_fee: null
        
    });

    // 회원가입 중 선택한 프로필 이미지 파일
    // 실제 Storage 업로드 전까지 임시로 보관
    const [profileImageFile, setProfileImageFile] = useState(null);

    return (
        <SignupContext.Provider
            value={{ signupData, setSignupData, profileImageFile, setProfileImageFile }}
        >
            {children}
        </SignupContext.Provider>
    );
}

export function useSignup() {
    return useContext(SignupContext);
}

// 아직 백엔드에서 정확한 API 요청 데이터 형식을 받은 건 아니니까,

// frequency: "",
// clubPreferences: [],
// location: [],
// distance: "",

// 이것들은 지금 삭제하지 말고 그대로 놔둬도 돼.

// 나중에 백엔드 친구한테

// "이 4개 필드도 DB에 저장하는 거야?"

// 라고 확인해서 필요 없다고 하면 그때 삭제하면 돼.

// day > day_of_week
