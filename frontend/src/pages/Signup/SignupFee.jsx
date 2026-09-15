// 9. 최대 가능 회비

import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
import { supabase } from "../../../supabaseClient";

function SignupFee() {
    const navigate = useNavigate();

    const { 
        signupData,
        setSignupData,
        profileImageFile 
    } = useSignup();

    //에러시 발생이유 알림
    const getSignupErrorMessage = (status, data) => {
        // FastAPI 422 입력값 검증 오류
        if (status === 422 && Array.isArray(data.detail)) {
            const fieldNameMap = {
                email: "이메일",
                password: "비밀번호",
                name: "이름",
                nickname: "닉네임",
                gender: "성별",
                birth_date: "생년월일",
                travel_distance_km: "희망 이동거리",
                max_monthly_fee: "최대 회비",
                activity_frequency: "활동 빈도",
                frequency: "활동 빈도",
                sports: "운동 종목",
                regions: "활동 지역",
                available_times: "운동 희망 시간",
                club_preferences: "동호회 선호 조건"
            };

            const firstError = data.detail[0];

            const field =
                firstError.loc?.[firstError.loc.length - 1];

            const koreanField =
                fieldNameMap[field] || field || "입력값";

            return `${koreanField} 입력값을 확인해주세요.\n${firstError.msg}`;
        }

        // Backend가 직접 보낸 오류 메시지
        if (typeof data.detail === "string") {
            return data.detail;
        }

        if (typeof data.message === "string") {
            return data.message;
        }

        switch (status) {
            case 400:
                return "입력한 정보를 확인해주세요.";

            case 401:
                return "인증 정보가 올바르지 않습니다.";

            case 403:
                return "요청할 권한이 없습니다.";

            case 409:
                return "이미 등록된 정보가 있습니다.";

            case 500:
                return "서버 오류가 발생했습니다.";

            default:
                return `회원가입 중 오류가 발생했습니다. (${status})`;
        }
    };


    // ⭐ 회원가입 완료
    const handleNext = async () => {

        // 최대 가능 회비 선택 확인
        if (signupData.max_monthly_fee === null) {
            alert("최대 가능 회비를 선택해주세요.");
            return;
        }

        try {
            // ⭐ sports와 levels 실제 데이터 확인
            console.log("최종 signupData:", signupData);
            console.log("signupData.sports:", signupData.sports);
            console.log("signupData.levels:", signupData.levels);

            // ⭐ 운동 이름 → 백엔드 sport_id 변환
            const sportIdMap = {
                "축구ㆍ풋살": 1,
                "배구": 2,
                "농구": 3,
                "테니스": 4,
                "탁구": 5
            };

            // ⭐ 백엔드가 요구하는 형식으로 변환
            const formattedSports = signupData.sports.map((sportName) => {

                const sportId = sportIdMap[sportName];

                if (!sportId) {
                    throw new Error(`등록되지 않은 운동 종목입니다: ${sportName}`);
                }

                return {
                    sport_id: sportId,
                    sport_level: signupData.levels[sportName]
                };
            });

            console.log("formattedSports:", formattedSports);

            // ⭐ 백엔드에 보낼 최종 데이터
            //백엔드로 보낼때 24:00을 00:00으로 변환
            const formattedAvailableTimes = signupData.availableTimes.map((time) => ({
                ...time,
                endTime: time.endTime === "24:00"
                    ? "00:00"
                    : time.endTime
            }));

            const requestData = {
                email: signupData.email,
                password: signupData.password,

                name: signupData.name,
                nickname: signupData.nickname,
                gender: signupData.gender,

                birth_date: signupData.birth_date,

                travel_distance_km: signupData.travel_distance_km,
                max_monthly_fee: signupData.max_monthly_fee,

                sports: formattedSports,

                regions: signupData.regions,

                available_times: formattedAvailableTimes,

                frequency: signupData.frequency,
                club_preferences: signupData.clubPreferences
            };
            console.log(
                "백엔드 전송 데이터:",
                JSON.stringify(requestData, null, 2)
            );

            // ⭐ 백엔드 회원가입 API 호출
            const response = await fetch(
                "http://127.0.0.1:8000/api/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestData)
                }
            );

            // ⭐ 백엔드 응답
            const data = await response.json();

            console.log(
                "백엔드 응답 상세:",
                JSON.stringify(data, null, 2)
            );

            // ⭐ 회원가입 실패
            if (!response.ok) {
                const errorMessage = getSignupErrorMessage(
                    response.status,
                    data
                );

                alert(errorMessage);
                return;
            }

            // 프로필 이미지가 선택되어 있다면 Storage에 업로드
            if (profileImageFile) {
                // Backend가 반환한 Supabase 세션 적용
                if (!data.refresh_token) {
                    throw new Error("회원가입 세션 정보를 확인할 수 없습니다.");
                }

                const { error: sessionError } = await supabase.auth.setSession({
                    access_token: data.access_token,
                    refresh_token: data.refresh_token
                });

                if (sessionError) {
                    throw sessionError;
                }
                // 선택한 이미지의 확장자
                const fileExtension = profileImageFile.name
                .split(".")
                .pop()
                .toLowerCase();
                // 사용자 UUID별 Storage 경로
                const filePath = `${data.user_id}/profile.${fileExtension}`;
                // Supabase Storage 업로드
                const { error: uploadError } = await supabase.storage
                    .from("user_images")
                    .upload(
                        filePath,
                        profileImageFile,
                        {
                            upsert: true
                        }
                    );

                if (uploadError) {
                    throw uploadError;
                }
                // Public URL 가져오기
                const { data: publicUrlData } = supabase.storage
                    .from("user_images")
                    .getPublicUrl(filePath);

                const profileImageUrl = publicUrlData.publicUrl;

                console.log("프로필 이미지 URL:", profileImageUrl);

                // 프로필 이미지 URL을 users.profile_image에 저장 요청
                const profileResponse = await fetch(
                    "http://127.0.0.1:8000/api/users/me/profile-image",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${data.access_token}`
                        },
                        body: JSON.stringify({
                            profile_image: profileImageUrl
                        })
                    }
                );

                const profileResult = await profileResponse.json();

                if (!profileResponse.ok) {
                    throw new Error(
                        profileResult.detail ||
                        "프로필 이미지 정보 저장에 실패했습니다."
                    );
                }
            }

            // ⭐ 회원가입 성공
            alert("회원가입이 완료되었습니다.");

        } catch (error) {
            console.error("회원가입 오류:", error);

            alert(
                error.message ||
                "회원가입 중 알 수 없는 오류가 발생했습니다."
            );
        }
    };

    return (
        <div>
            {/* 뒤로가기 버튼 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupClubPreference")}
            >
                뒤로가기
            </button>

            <h1 className="signup-level-title">월 회비는 최대</h1>
            <h1 className="signup-level-title">얼마까지 낼 수 있나요?</h1>

            <div className="frequency-options">

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="10000"
                        checked={signupData.max_monthly_fee === 10000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    1만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="20000"
                        checked={signupData.max_monthly_fee === 20000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    2만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="30000"
                        checked={signupData.max_monthly_fee === 30000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    3만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="50000"
                        checked={signupData.max_monthly_fee === 50000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    5만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="100000"
                        checked={signupData.max_monthly_fee === 100000}
                        onChange={(e) =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: Number(e.target.value)
                            })
                        }
                    />
                    10만원 이하
                </label>

                <label className="frequency-option">
                    <input
                        type="radio"
                        name="fee"
                        value="0"
                        checked={signupData.max_monthly_fee === 0}
                        onChange={() =>
                            setSignupData({
                                ...signupData,
                                max_monthly_fee: 0
                            })
                        }
                    />
                    상관없음
                </label>

            </div>

            <button
                className="Next-btn"
                onClick={handleNext}
            >
                회원가입 완료
            </button>
        </div>
    );
}

export default SignupFee;