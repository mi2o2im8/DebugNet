import BottomNav from "../../components/BottomNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdHome,
  MdGroups,
  MdCalendarMonth,
  MdForum,
  MdPerson,
} from "react-icons/md";
import "./ClubHome.css";

function ClubHome() {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/clubs/search"
        );

        if (!response.ok) {
          throw new Error("동호회 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();

        setClubs(data);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  if (loading) {
    return (
      <div className="ClubHome-container">
        <p className="ClubHome-message">동호회 정보를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ClubHome-container">
        <p className="ClubHome-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="ClubHome-container">

      {/* 상단 영역 */}
      <header className="ClubHome-header">

        {/* 활동 지역 */}
        <button className="ClubHome-region">
          대방동
          <span className="ClubHome-arrow">⌄</span>
        </button>

        {/* 오른쪽 아이콘 */}
        <div className="ClubHome-actions">

          <button className="ClubHome-icon-button">
            🔍
          </button>

          <button className="ClubHome-icon-button">
            🔔
          </button>

          <button className="ClubHome-icon-button">
            ⚙
          </button>

        </div>
      </header>


      {/* 운동 종목 */}
      <nav className="ClubHome-sports">

        <button className="ClubHome-sport">
          <span>⚽</span>
          <p>축구/풋살</p>
        </button>

        <button className="ClubHome-sport">
          <span>🏸</span>
          <p>배드민턴</p>
        </button>

        <button className="ClubHome-sport">
          <span>🏓</span>
          <p>탁구</p>
        </button>

        <button className="ClubHome-sport">
          <span>🎾</span>
          <p>테니스</p>
        </button>

        <button className="ClubHome-sport">
          <span>🏐</span>
          <p>배구</p>
        </button>

      </nav>
    
      {/* AI 맞춤 동호회 추천 */}
        <section className="ClubHome-ai">
        <div className="ClubHome-ai-content">

            <div className="ClubHome-ai-title">
            <span className="ClubHome-ai-badge">AI</span>
            <h2>나의 맞춤 동호회 추천</h2>
            </div>

            <p className="ClubHome-ai-description">
            나의 정보를 바탕으로
            <br />
            딱 맞는 동호회를 추천해 드려요!
            </p>

            <button className="ClubHome-ai-button">
            맞춤 동호회 보러가기 →
            </button>

        </div>

        <div className="ClubHome-ai-character">
            🤖
        </div>
        </section>

      {/* 회원 모집중 */}
        <section className="ClubHome-recruit">

        <div className="ClubHome-section-header">
            <h2>회원 모집중</h2>

            <button className="ClubHome-more-button">
            더보기 →
            </button>
        </div>

        <div className="Club-list">

            {clubs.map((club) => (
            <div
                className="Club-card"
                key={club.club_id}
                onClick={() => navigate(`/clubs/${club.club_id}`)}
            >
                <div className="Club-card-image">
                {club.image_url ? (
                    <img
                    src={club.image_url}
                    alt={club.club_name}
                    />
                ) : (
                    <div className="Club-card-no-image">
                    이미지 없음
                    </div>
                )}
                </div>

                <h3 className="Club-card-name">
                {club.club_name}
                </h3>

                <p className="Club-card-intro">
                {club.club_intro}
                </p>
            </div>
            ))}

        </div>

        </section>

        {/* 게스트 모집중 */}
        <section className="ClubHome-guest">

        <div className="ClubHome-section-header">
            <h2>게스트 모집중</h2>

            <button className="ClubHome-more-button">
            더보기 →
            </button>
        </div>

        <div className="Guest-list">

            <div className="Guest-card">
            <div className="Guest-card-image">
                이미지
            </div>

            <h3 className="Guest-card-title">
                주말 풋살 게스트
            </h3>

            <p className="Guest-card-info">
                토요일 14:00 · 강서구
            </p>
            </div>


            <div className="Guest-card">
            <div className="Guest-card-image">
                이미지
            </div>

            <h3 className="Guest-card-title">
                배드민턴 게스트 모집
            </h3>

            <p className="Guest-card-info">
                일요일 10:00 · 마포구
            </p>
            </div>


            <div className="Guest-card">
            <div className="Guest-card-image">
                이미지
            </div>

            <h3 className="Guest-card-title">
                테니스 게스트 모집
            </h3>

            <p className="Guest-card-info">
                토요일 13:00 · 영등포구
            </p>
            </div>

        </div>

        </section>

        {/* 이용 도우미 챗봇 버튼 */}
        <button className="ClubHome-chatbot-button">
        <span className="ClubHome-chatbot-icon">🤖</span>
        <span className="ClubHome-chatbot-text">이용 도우미</span>
        </button>
        
        {/* 하단 네비게이션 바 */}
        <BottomNav />

    </div>
  );
}

export default ClubHome;