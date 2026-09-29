import "./Signup.css";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSignup } from "./SignupContext";
import basicProfileImg from "../../assets/img/basic_profile_img.png";
import { supabase } from "../../../supabaseClient";
import backIcon from "../../assets/img/back.png";

function SignupReview() {
    const navigate = useNavigate();

    const {
        signupData,
        profileImageFile
    } = useSignup();

    // 프로필 이미지 미리보기
    const profilePreview = useMemo(() => {
        if (profileImageFile) {
            return URL.createObjectURL(profileImageFile);
        }

        return basicProfileImg;
    }, [profileImageFile]);

    // 회비 표시
    const formatFee = (fee) => {
        if (fee === 0) {
            return "상관없음";
        }

        if (fee === null || fee === undefined) {
            return "선택하지 않음";
        }

        return `${fee.toLocaleString()}원 이하`;
    };

    // 거리 표시
    const formatDistance = (distance) => {
        if (distance === null) {
            return "거리 상관없음";
        }

        return `${distance}km`;
    };

    // 회원가입 오류 메시지 처리
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

        // Backend에서 직접 보내준 오류 메시지
        if (typeof data.detail === "string") {
            return data.detail;
        }

        if (typeof data.message === "string") {
            return data.message;
        }

        // HTTP 상태코드별 기본 메시지
        switch (status) {
            case 400:
                return "입력한 정보를 확인해주세요.";

            case 401:
                return "인증 정보가 올바르지 않습니다.";

            case 403:
                return "요청할 권한이 없습니다.";

            case 404:
                return "요청한 정보를 찾을 수 없습니다.";

            case 409:
                return "이미 등록된 정보가 있습니다.";

            case 500:
                return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

            default:
                return `회원가입 중 오류가 발생했습니다. (${status})`;
        }
    };


    // 최종 회원가입
    const handleSignupComplete = async () => {
        try {
            // 종목명 → DB sport_id
            const sportIdMap = {
                "축구ㆍ풋살": 1,
                "배구": 2,
                "농구": 3,
                "테니스": 4,
                "탁구": 5
            };

            const formattedSports = signupData.sports.map((sportName) => {
                const sportId = sportIdMap[sportName];

                if (!sportId) {
                    throw new Error(
                        `등록되지 않은 운동 종목입니다: ${sportName}`
                    );
                }

                return {
                    sport_id: sportId,
                    sport_level: signupData.levels[sportName]
                };
            });

            // 24:00은 Backend의 TIME 타입에 넣을 수 없으므로 00:00으로 변환
            const formattedAvailableTimes =
                signupData.availableTimes.map((time) => ({
                    ...time,
                    endTime:
                        time.endTime === "24:00"
                            ? "00:00"
                            : time.endTime
                }));

            // Backend에 보낼 최종 회원가입 데이터
            const requestData = {
                email: signupData.email,
                password: signupData.password,

                name: signupData.name,
                nickname: signupData.nickname,
                gender: signupData.gender,
                birth_date: signupData.birth_date,

                travel_distance_km:
                    signupData.travel_distance_km,

                max_monthly_fee:
                    signupData.max_monthly_fee,

                sports: formattedSports,

                regions: signupData.regions,

                available_times:
                    formattedAvailableTimes,

                frequency:
                    signupData.frequency,

                club_preferences:
                    signupData.clubPreferences
            };

            console.log(
                "백엔드 전송 데이터:",
                JSON.stringify(requestData, null, 2)
            );

            // 회원가입 API 요청
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

            const data = await response.json();

            console.log(
                "백엔드 응답:",
                JSON.stringify(data, null, 2)
            );

            // 회원가입 실패
            if (!response.ok) {
                const errorMessage = getSignupErrorMessage(
                    response.status,
                    data
                );

                throw new Error(errorMessage);
            }

            // 프로필 이미지를 선택한 경우
            if (profileImageFile) {
                if (!data.refresh_token) {
                    throw new Error(
                        "회원가입 세션 정보를 확인할 수 없습니다."
                    );
                }

                // Supabase 로그인 세션 설정
                const { error: sessionError } =
                    await supabase.auth.setSession({
                        access_token: data.access_token,
                        refresh_token: data.refresh_token
                    });

                if (sessionError) {
                    throw new Error(
                        `세션 설정에 실패했습니다: ${sessionError.message}`
                    );
                }

                // 이미지 확장자
                const fileExtension =
                    profileImageFile.name
                        .split(".")
                        .pop()
                        .toLowerCase();

                // Storage 저장 경로
                const filePath =
                    `${data.user_id}/profile.${fileExtension}`;

                // Supabase Storage 업로드
                const { error: uploadError } =
                    await supabase.storage
                        .from("user_images")
                        .upload(
                            filePath,
                            profileImageFile,
                            {
                                upsert: true
                            }
                        );

                if (uploadError) {
                    throw new Error(
                        `프로필 이미지 업로드에 실패했습니다: ${uploadError.message}`
                    );
                }

                // Public URL 생성
                const { data: publicUrlData } =
                    supabase.storage
                        .from("user_images")
                        .getPublicUrl(filePath);

                const profileImageUrl =
                    publicUrlData.publicUrl;

                console.log(
                    "프로필 이미지 URL:",
                    profileImageUrl
                );

                // users.profile_image에 URL 저장
                const profileResponse = await fetch(
                    "http://127.0.0.1:8000/api/users/me/profile-image",
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization:
                                `Bearer ${data.access_token}`
                        },
                        body: JSON.stringify({
                            profile_image:
                                profileImageUrl
                        })
                    }
                );

                const profileResult =
                    await profileResponse.json();

                if (!profileResponse.ok) {
                    throw new Error(
                        profileResult.detail ||
                        "프로필 이미지 정보 저장에 실패했습니다."
                    );
                }
            }

            // 모든 회원가입 과정 완료
            alert("회원가입이 완료되었습니다.");

            // 로그인 화면으로 이동
            navigate("/Login", {
                replace: true
            });

        } catch (error) {
            console.error(
                "회원가입 오류:",
                error
            );

            alert(
                error.message ||
                "회원가입 중 알 수 없는 오류가 발생했습니다."
            );
        }
    };


    return (
        <div className="signup-container">
            {/* 뒤로가기 */}
            <button
                type="button"
                className="Back-btn"
                onClick={() => navigate("/signup/basic/SignupFee")}
            >
                <img src={backIcon} alt="뒤로가기" /> 
            </button>

            {/* 제목 */}
            <div className="signup-header07">
            <h2>입력한 정보를</h2>
            <h2>확인해주세요</h2>
            </div>

            {/* 프로필 이미지 */}
            <div className="review-profile">
                <img
                    src={profilePreview}
                    alt="프로필 미리보기"
                    width="100"
                    height="100"
                    style={{
                        borderRadius: "50%",
                        objectFit: "cover"
                    }}
                />
            </div>

            {/* =========================
                정보 카드 전체 영역
            ========================= */}
            <div className="review-grid">

                {/* 계정 정보 */}
                <div className="review-card">
                    <h3>계정 정보</h3>

                    <p>
                        이메일: {signupData.email}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/signup")}
                    >
                        수정
                    </button>
                </div>

                {/* 기본 정보 */}
                <div className="review-card">
                    <h3>기본 정보</h3>

                    <p>
                        이름: {signupData.name}
                    </p>

                    <p>
                        닉네임: {signupData.nickname}
                    </p>

                    <p>
                        생년월일: {signupData.birth_date}
                    </p>

                    <p>
                        성별: {signupData.gender}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/signup/basic")}
                    >
                        수정
                    </button>
                </div>

                {/* 운동 정보 */}
                <div className="review-card">
                    <h3>운동 정보</h3>

                    {signupData.sports?.map((sport) => (
                        <p key={sport}>
                            {sport} - {signupData.levels?.[sport]}
                        </p>
                    ))}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/signup/basic/sport")
                        }
                    >
                        수정
                    </button>
                </div>

                {/* 활동 지역 */}
                <div className="review-card">
                    <h3>활동 지역</h3>

                    <p>
                        지역: {signupData.regions?.join(", ")}
                    </p>

                    <p>
                        이동 가능 거리:{" "}
                        {formatDistance(
                            signupData.travel_distance_km
                        )}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/signup/basic/SignupLocation")
                        }
                    >
                        수정
                    </button>
                </div>

                {/* 활동 가능 시간 */}
                <div className="review-card">
                    <h3>활동 가능 시간</h3>

                    {signupData.availableTimes?.map(
                        (time, index) => (
                            <p key={index}>
                                {time.day}요일{" "}
                                {time.startTime} ~ {time.endTime}
                            </p>
                        )
                    )}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/signup/basic/SignupTime")
                        }
                    >
                        수정
                    </button>
                </div>

                {/* 활동 빈도 */}
                <div className="review-card">
                    <h3>활동 빈도</h3>

                    <p>
                        {signupData.frequency}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/signup/basic/SignupFrequency")
                        }
                    >
                        수정
                    </button>
                </div>

                {/* 동호회 선호 */}
                <div className="review-card">
                    <h3>동호회 선호</h3>

                    <p>
                        {signupData.clubPreferences?.join(", ")}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/signup/basic/SignupClubPreference"
                            )
                        }
                    >
                        수정
                    </button>
                </div>

                {/* 최대 가능 회비 */}
                <div className="review-card">
                    <h3>최대 가능 회비</h3>

                    <p>
                        {formatFee(
                            signupData.max_monthly_fee
                        )}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/signup/basic/SignupFee")
                        }
                    >
                        수정
                    </button>
                </div>

            </div>

            {/* 최종 회원가입 버튼 */}
            <button
                type="button"
                className="Next-btn"
                onClick={handleSignupComplete}
            >
                회원가입 완료
            </button>
        </div>
    );
}

export default SignupReview;