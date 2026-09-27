// 차단회원 관리 페이지
//
// 설정 > 계정 및 안전 > 차단회원 관리
// 내가 차단한 사용자 목록을 보고 차단을 해제한다.

import {
    useEffect,
    useState,
} from "react";

import BackButton from "../../components/BackButton/BackButton";

import {
    getMyBlockedUsers,
    unblockUser,
} from "../../api/blockApi";

import basicProfileImg from "../../assets/img/basic_profile_img.png";

import "./Settings.css";
import "./AccountSettings.css";
import "./BlockedUsers.css";


// =========================================================
// ⭐ 차단 날짜 표시 (2026.09.27)
// =========================================================

const formatBlockedDate = (dateString) => {

    if (!dateString) {
        return "";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}`;

};


function BlockedUsers() {

    // ⭐ 차단한 사용자 목록
    const [blockedUsers, setBlockedUsers] = useState([]);

    const [isLoading, setIsLoading] = useState(true);

    const [errorMessage, setErrorMessage] = useState("");

    // ⭐ 해제 확인 모달에 띄울 사용자
    const [targetUser, setTargetUser] = useState(null);

    // ⭐ 해제 요청 중 (버튼 중복 클릭 방지)
    const [isUnblocking, setIsUnblocking] = useState(false);


    // =========================================================
    // ⭐ 차단 목록 불러오기
    // =========================================================

    const fetchBlockedUsers = async () => {

        setIsLoading(true);
        setErrorMessage("");

        try {

            const data = await getMyBlockedUsers();

            setBlockedUsers(data?.blocked_users || []);

        } catch (error) {

            setErrorMessage(
                error.message ||
                "차단 목록을 불러오지 못했어요."
            );

        } finally {

            setIsLoading(false);

        }

    };

    useEffect(() => {

        fetchBlockedUsers();

    }, []);


    // =========================================================
    // ⭐ 차단 해제
    // =========================================================

    const handleUnblock = async () => {

        if (!targetUser || isUnblocking) {
            return;
        }

        setIsUnblocking(true);

        try {

            await unblockUser(targetUser.user_id);

            // 서버에서 삭제 성공하면 목록에서 바로 제거
            setBlockedUsers((prev) =>
                prev.filter(
                    (user) => user.user_id !== targetUser.user_id
                )
            );

            setTargetUser(null);

        } catch (error) {

            // 이미 해제된 경우(404)는 목록만 정리
            if (error.status === 404) {

                setBlockedUsers((prev) =>
                    prev.filter(
                        (user) => user.user_id !== targetUser.user_id
                    )
                );

                setTargetUser(null);

                return;
            }

            alert(
                error.message ||
                "차단 해제에 실패했어요. 다시 시도해주세요."
            );

        } finally {

            setIsUnblocking(false);

        }

    };


    // =========================================================
    // ⭐ 본문 (로딩 / 에러 / 빈 목록 / 목록)
    // =========================================================

    const renderContent = () => {

        if (isLoading) {
            return (
                <p className="blocked-message">
                    불러오는 중...
                </p>
            );
        }

        if (errorMessage) {
            return (
                <div className="blocked-message">
                    <p>{errorMessage}</p>

                    <button
                        type="button"
                        className="blocked-retry-button"
                        onClick={fetchBlockedUsers}
                    >
                        다시 시도
                    </button>
                </div>
            );
        }

        if (blockedUsers.length === 0) {
            return (
                <div className="blocked-message">
                    <p>차단한 회원이 없어요.</p>
                    <span>
                        커뮤니티에서 차단한 회원이 여기에 표시돼요.
                    </span>
                </div>
            );
        }

        return (
            <>
                <p className="blocked-count">
                    차단한 회원 {blockedUsers.length}명
                </p>

                <div className="settings-card">

                    {blockedUsers.map((user, index) => (

                        <div key={user.user_id}>

                            {index > 0 && (
                                <div className="settings-divider"></div>
                            )}

                            <div className="blocked-user-row">

                                <img
                                    className="blocked-user-image"
                                    src={user.profile_image || basicProfileImg}
                                    alt=""
                                    onError={(e) => {
                                        e.currentTarget.src = basicProfileImg;
                                    }}
                                />

                                <div className="blocked-user-info">

                                    <strong>{user.nickname}</strong>

                                    <span>
                                        {formatBlockedDate(user.blocked_at)} 차단
                                    </span>

                                </div>

                                <button
                                    type="button"
                                    className="blocked-unblock-button"
                                    onClick={() => setTargetUser(user)}
                                >
                                    해제
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

                <p className="blocked-guide">
                    차단한 회원의 게시글과 댓글은 보이지 않아요.
                </p>
            </>
        );

    };


    return (

        <div className="settings-page account-settings-page">

            {/* =================================================
                상단
            ================================================= */}

            <header className="settings-header">
                <BackButton />
                <h2>차단회원 관리</h2>
            </header>


            <main className="settings-content">
                {renderContent()}
            </main>


            {/* =================================================
                차단 해제 확인 모달 (Settings.css 모달 재사용)
            ================================================= */}

            {targetUser && (
                <div className="logout-modal-overlay">
                    <div className="logout-modal">

                        <h3>차단을 해제할까요?</h3>

                        <p>
                            {targetUser.nickname}님의 게시글과 댓글이
                            다시 보이게 돼요.
                        </p>

                        <div className="logout-modal-buttons">
                            <button
                                type="button"
                                className="logout-cancel"
                                onClick={() => setTargetUser(null)}
                                disabled={isUnblocking}
                            >
                                취소
                            </button>

                            <button
                                type="button"
                                className="logout-confirm"
                                onClick={handleUnblock}
                                disabled={isUnblocking}
                            >
                                {isUnblocking ? "해제 중..." : "해제"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>

    );

}

export default BlockedUsers;
