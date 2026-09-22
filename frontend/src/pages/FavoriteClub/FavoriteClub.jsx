// 찜한 동호회 페이지

import { useNavigate } from "react-router-dom";

import BackButton from "../../components/BackButton/BackButton";
import BottomNav from "../../components/BottomNav";

import {
    FiHeart,
    FiChevronRight,
    FiMapPin,
    FiCalendar,
    FiUsers,
} from "react-icons/fi";

import "./FavoriteClub.css";

// ⭐ 나중에 DB 연결할 때 이 부분을 실제 데이터로 교체
const favoriteClubs = [
    {
        id: 1,
        name: "주말 풋살 모임",
        sport: "축구ㆍ풋살",
        location: "서울 마포구",
        schedule: "매주 토요일",
        memberCount: 18,
        image: null,
    },
    {
        id: 2,
        name: "강남 농구 같이해요",
        sport: "농구",
        location: "서울 강남구",
        schedule: "매주 일요일",
        memberCount: 12,
        image: null,
    },
    {
        id: 3,
        name: "퇴근 후 배드민턴",
        sport: "배드민턴",
        location: "서울 송파구",
        schedule: "매주 수요일",
        memberCount: 10,
        image: null,
    },
];

function FavoriteClub() {
    const navigate = useNavigate();

    // ⭐ 동호회 상세 페이지 이동
    const handleClubClick = (clubId) => {
        navigate(`/clubs/${clubId}`);
    };

    return (
        <div className="favorite-club-page">

            {/* ⭐ 뒤로가기 */}
            <BackButton />

            <main className="favorite-club-container">

                {/* ⭐ 헤더 */}
                <header className="favorite-club-header">
                    <h1>찜한 동호회</h1>
                    <p>
                        관심 있는 동호회를 한눈에 확인해보세요.
                    </p>
                </header>

                {/* ⭐ 찜한 동호회 개수 */}
                <div className="favorite-club-count">
                    <FiHeart />
                    <span>
                        찜한 동호회{" "}
                        <strong>{favoriteClubs.length}</strong>개
                    </span>
                </div>

                {/* ⭐ 동호회 목록 */}
                <section className="favorite-club-list">

                    {favoriteClubs.length > 0 ? (
                        favoriteClubs.map((club) => (
                            <button
                                type="button"
                                className="favorite-club-card"
                                key={club.id}
                                onClick={() => handleClubClick(club.id)}
                            >
                                {/* ⭐ 이미지 */}
                                <div className="favorite-club-image">
                                    {club.image ? (
                                        <img
                                            src={club.image}
                                            alt={club.name}
                                        />
                                    ) : (
                                        <FiHeart />
                                    )}
                                </div>

                                {/* ⭐ 동호회 정보 */}
                                <div className="favorite-club-info">

                                    <span className="favorite-club-sport">
                                        {club.sport}
                                    </span>

                                    <h2>{club.name}</h2>

                                    <div className="favorite-club-detail">
                                        <FiMapPin />
                                        <span>{club.location}</span>
                                    </div>

                                    <div className="favorite-club-detail">
                                        <FiCalendar />
                                        <span>{club.schedule}</span>
                                    </div>

                                    <div className="favorite-club-detail">
                                        <FiUsers />
                                        <span>
                                            {club.memberCount}명
                                        </span>
                                    </div>

                                </div>

                                {/* ⭐ 오른쪽 화살표 */}
                                <span className="favorite-club-arrow">
                                    <FiChevronRight />
                                </span>
                            </button>
                        ))
                    ) : (
                        /* ⭐ 찜한 동호회가 없을 때 */
                        <div className="favorite-club-empty">

                            <FiHeart />

                            <h2>
                                찜한 동호회가 없어요
                            </h2>

                            <p>
                                마음에 드는 동호회를 찜하면
                                <br />
                                이곳에서 확인할 수 있어요.
                            </p>

                            <button
                                type="button"
                                onClick={() => navigate("/clubs")}
                            >
                                동호회 둘러보기
                            </button>

                        </div>
                    )}

                </section>

            </main>

            {/* ⭐ 공통 하단 네비게이션 */}
            <BottomNav />

        </div>
    );
}

export default FavoriteClub;