// 찜한 동호회 페이지

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import PageHeader from "../../components/PageHeader/PageHeader";
import BottomNav from "../../components/BottomNav";

// import {
//     authenticatedRequest,
// } from "../../api/apiClient";

import {
    FiHeart,
    FiMapPin,
    FiUsers,
    FiClock,
    FiChevronRight,
} from "react-icons/fi";

// ⭐ 이미지 없는 동호회용 종목 아이콘
import soccerImage from "../../assets/img/playbridge_16_assets/soccer.png";
import basketballImage from "../../assets/img/playbridge_16_assets/basketball.png";
import badmintonImage from "../../assets/img/playbridge_16_assets/badminton.png";
import tabletennisImage from "../../assets/img/playbridge_16_assets/tabletennis.png";
import climbingImage from "../../assets/img/playbridge_16_assets/climbing.png";
import runningImage from "../../assets/img/playbridge_16_assets/running.png";
import yogaImage from "../../assets/img/playbridge_16_assets/16_yoga.png";

import "./FavoriteClub.css";


// =========================================================
// ⭐ 연결 설정
//
// IS_FAVORITE_CONNECTED
//   false → 상단에 "연결 예정" 안내 표시, API 호출 안 함
//   true  → 안내 숨기고 fetchFavoriteClubs 실행
//
// USE_PREVIEW_DATA
//   카드 디자인 확인용. true로 바꾸면 샘플 카드가 보임
//   (배포 전에 꼭 false로!)
// =========================================================

const IS_FAVORITE_CONNECTED = false;

const USE_PREVIEW_DATA = false;


// =========================================================
// ⭐ 샘플 데이터 (백엔드 clubs 필드명과 동일하게 맞춰둠)
// =========================================================

const PREVIEW_CLUBS = [
    {
        club_id: 1,
        club_name: "주말 풋살 모임",
        club_intro: "토요일 아침마다 가볍게 공 차요. 초보 환영!",
        sports: ["축구ㆍ풋살"],
        regions: ["서울 마포구"],
        current_members: 18,
        max_members: 25,
        image_url: null,
    },
    {
        club_id: 2,
        club_name: "강남 농구 같이해요",
        club_intro: "퇴근 후 3:3 하프코트 위주로 뛰어요.",
        sports: ["농구"],
        regions: ["서울 강남구"],
        current_members: 12,
        max_members: 15,
        image_url: null,
    },
    {
        club_id: 3,
        club_name: "퇴근 후 배드민턴",
        club_intro: "수요일 저녁 송파 체육관에서 만나요.",
        sports: ["배드민턴"],
        regions: ["서울 송파구"],
        current_members: 10,
        max_members: 10,
        image_url: null,
    },
];


// =========================================================
// ⭐ 종목 → 아이콘 매핑
// =========================================================

const SPORT_IMAGES = [
    { keyword: "축구", image: soccerImage },
    { keyword: "풋살", image: soccerImage },
    { keyword: "농구", image: basketballImage },
    { keyword: "배드민턴", image: badmintonImage },
    { keyword: "탁구", image: tabletennisImage },
    { keyword: "클라이밍", image: climbingImage },
    { keyword: "러닝", image: runningImage },
    { keyword: "요가", image: yogaImage },
];

const getSportImage = (sports = []) => {

    const firstSport = sports[0] || "";

    const matched = SPORT_IMAGES.find(({ keyword }) =>
        firstSport.includes(keyword)
    );

    return matched ? matched.image : null;

};


// =========================================================
// ⭐ 찜한 동호회 카드
// =========================================================

function FavoriteClubCard({ club, onOpen, onRemove }) {

    const [imageError, setImageError] = useState(false);

    const sportImage = getSportImage(club.sports);

    const isFull =
        club.max_members &&
        club.current_members >= club.max_members;


    return (

        <article className="fav-card">

            {/* -------------------------------------------------
                카드 본문 (클릭 → 동호회 상세)
            ------------------------------------------------- */}

            <button
                type="button"
                className="fav-card-main"
                onClick={() => onOpen(club.club_id)}
            >

                {/* 이미지 */}
                <div className="fav-card-thumb">

                    {club.image_url && !imageError ? (

                        <img
                            src={club.image_url}
                            alt=""
                            onError={() => setImageError(true)}
                        />

                    ) : sportImage ? (

                        <img
                            src={sportImage}
                            alt=""
                            className="fav-card-thumb-icon"
                        />

                    ) : (

                        <FiHeart className="fav-card-thumb-fallback" />

                    )}

                </div>


                {/* 정보 */}
                <div className="fav-card-info">

                    <span className="fav-card-sport">
                        {club.sports?.join(", ") || "종목 미정"}
                    </span>

                    <h3>
                        {club.club_name || "이름 없는 동호회"}
                    </h3>

                    {club.club_intro && (
                        <p className="fav-card-intro">
                            {club.club_intro}
                        </p>
                    )}

                    <div className="fav-card-meta">

                        <span>
                            <FiMapPin aria-hidden="true" />
                            {club.regions?.[0] || "지역 미정"}
                        </span>

                        <span>
                            <FiUsers aria-hidden="true" />
                            {club.current_members ?? 0}
                            {club.max_members ? `/${club.max_members}명` : "명"}
                            {isFull && (
                                <em className="fav-card-full">마감</em>
                            )}
                        </span>

                    </div>

                </div>


                <FiChevronRight
                    className="fav-card-arrow"
                    aria-hidden="true"
                />

            </button>


            {/* -------------------------------------------------
                찜 해제 버튼
            ------------------------------------------------- */}

            <button
                type="button"
                className="fav-card-heart"
                onClick={() => onRemove(club.club_id)}
                aria-label={`${club.club_name} 찜 해제`}
            >
                <FiHeart aria-hidden="true" />
            </button>

        </article>

    );

}


// =========================================================
// ⭐ 찜한 동호회 페이지
// =========================================================

function FavoriteClub() {

    const navigate = useNavigate();


    // =========================================================
    // ⭐ 상태
    // =========================================================

    const [favoriteClubs, setFavoriteClubs] = useState(
        USE_PREVIEW_DATA ? PREVIEW_CLUBS : []
    );

    const [loading, setLoading] = useState(IS_FAVORITE_CONNECTED);

    const [error, setError] = useState("");


    // =========================================================
    // ⭐ 찜한 동호회 조회
    //
    // TODO: 백엔드 API 만들어지면 경로 확정 후 주석 해제
    //   예) GET /api/clubs/favorites
    // =========================================================

    useEffect(() => {

        if (!IS_FAVORITE_CONNECTED) return;


        const fetchFavoriteClubs = async () => {

            try {

                setLoading(true);

                setError("");


                // const data = await authenticatedRequest(
                //     "/api/clubs/favorites"
                // );
                //
                // setFavoriteClubs(data.items || []);


            } catch (error) {

                console.error(
                    "찜한 동호회 조회 실패:",
                    error
                );

                setError(
                    error.message ||
                    "찜한 동호회를 불러오지 못했습니다."
                );

            } finally {

                setLoading(false);

            }

        };


        fetchFavoriteClubs();

    }, []);


    // =========================================================
    // ⭐ 동호회 상세 이동
    // =========================================================

    const handleOpenClub = (clubId) => {

        navigate(`/clubs/${clubId}`);

    };

    // =========================================================
    // ⭐ 동호회 둘러보기
    //
    // 연결 전: 안내 alert 띄운 뒤 이동
    // 연결 후: 바로 이동
    // =========================================================

    const handleBrowseClubs = () => {

        if (!IS_FAVORITE_CONNECTED) {
            alert("찜하기 기능은 연결 예정이에요!");
        }

        navigate("/clubs");

    };


    // =========================================================
    // ⭐ 찜 해제
    //
    // 화면에서 먼저 지우고, 연결 후에는 실패 시 되돌림
    // TODO: 예) DELETE /api/clubs/{clubId}/favorite
    // =========================================================

    const handleRemoveFavorite = async (clubId) => {

        const previousClubs = favoriteClubs;

        setFavoriteClubs((clubs) =>
            clubs.filter((club) => club.club_id !== clubId)
        );


        if (!IS_FAVORITE_CONNECTED) return;


        try {

            // await authenticatedRequest(
            //     `/api/clubs/${clubId}/favorite`,
            //     { method: "DELETE" }
            // );

        } catch (error) {

            console.error("찜 해제 실패:", error);

            setFavoriteClubs(previousClubs);

            alert("찜 해제에 실패했어요. 잠시 후 다시 시도해주세요.");

        }

    };


    // =========================================================
    // ⭐ 목록 영역 렌더링
    // =========================================================

    const renderList = () => {

        if (loading) {
            return (
                <div className="fav-message">
                    찜한 동호회를 불러오는 중입니다.
                </div>
            );
        }

        if (error) {
            return (
                <div className="fav-message">
                    {error}
                </div>
            );
        }

        if (favoriteClubs.length === 0) {
            return (
                <div className="fav-empty">

                    <div className="fav-empty-icon">
                        <FiHeart aria-hidden="true" />
                    </div>

                    <h3>
                        아직 찜한 동호회가 없어요
                    </h3>

                    <p>
                        마음에 드는 동호회를 찜해두면
                        <br />
                        여기서 한 번에 모아볼 수 있어요.
                    </p>

                    <button
                        type="button"
                        onClick={handleBrowseClubs}
                    >
                        동호회 둘러보기
                    </button>

                </div>
            );
        }

        return (
            <div className="fav-list">
                {favoriteClubs.map((club) => (
                    <FavoriteClubCard
                        key={club.club_id}
                        club={club}
                        onOpen={handleOpenClub}
                        onRemove={handleRemoveFavorite}
                    />
                ))}
            </div>
        );

    };


    return (

        <div className="favorite-club-page">


            {/* =================================================
                뒤로가기
            ================================================= */}

            {/* =================================================
                상단 제목 (공용)
            ================================================= */}

            <PageHeader title="찜한 동호회" />


            {/* =================================================
                연결 예정 안내
            ================================================= */}

            {!IS_FAVORITE_CONNECTED && (

                <div
                    className="fav-notice"
                    role="status"
                >

                    <FiClock
                        className="fav-notice-icon"
                        aria-hidden="true"
                    />

                    <div>

                        <strong>
                            찜하기 기능은 곧 연결될 예정이에요
                        </strong>

                        <p>
                            동호회 상세 페이지에서 하트를 누르면
                            이곳에 차곡차곡 모아둘게요.
                        </p>

                    </div>

                </div>

            )}


            {/* =================================================
                개수
            ================================================= */}

            {!loading && !error && favoriteClubs.length > 0 && (

                <div className="fav-count">
                    찜한 동호회 <strong>{favoriteClubs.length}</strong>
                </div>

            )}


            {/* =================================================
                목록
            ================================================= */}

            <section>
                {renderList()}
            </section>


            {/* =================================================
                하단 네비게이션
            ================================================= */}

            <BottomNav />

        </div>

    );

}

export default FavoriteClub;
