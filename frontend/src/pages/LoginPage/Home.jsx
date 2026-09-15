import "./Home.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../../assets/img/logo.png";

// 타이틀 이미지 4개
import titleImg01 from "../../assets/img/title_img01.png";
import titleImg02 from "../../assets/img/title_img02.png";
import titleImg03 from "../../assets/img/title_img03.png";
import titleImg04 from "../../assets/img/title_img04.png";

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  const [currentPage, setCurrentPage] = useState(0);

  // ⭐ 타이틀 이미지 목록
  const images = [
    titleImg01,
    titleImg02,
    titleImg03,
    titleImg04,
  ];

  // ⭐ 다음 이미지
  const handleNext = () => {
    if (currentPage < images.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="Home-container">

      {/* =========================
          ⭐ 상단 영역
      ========================= */}
      <div className="Home-top">

        <div className="Home-title">
          <img
            src={logo}
            alt="PlayBridge 로고"
            className="Home-logo"
          />

          <h1>PlayBridge</h1>
        </div>

        <p className="Home-subtitle">
          나에게 딱 맞는 운동 모임을 찾아보세요!
        </p>

      </div>


      {/* =========================
          ⭐ 중단 영역
      ========================= */}
      <div className="Home-middle">

        {/* 타이틀 이미지 */}
        <img
          src={images[currentPage]}
          alt={`PlayBridge 소개 ${currentPage + 1}`}
          className="Home-image"
          onClick={handleNext}
        />

        {/* 설명 글자 */}
        <div className="Home-text">
          <h2>
            {currentPage === 0 && "좋은 운동이"}
            <br />
            {currentPage === 0 && "좋은 사람을 만듭니다."}

            {currentPage === 1 && "나에게 맞는 운동을 찾아보세요"}
            {currentPage === 2 && "가까운 운동 모임을 찾아보세요"}
            {currentPage === 3 && "새로운 사람들과 함께 시작해보세요"}
          </h2>
        </div>

      </div>


      {/* =========================
          ⭐ 하단 영역
      ========================= */}
      <div className="Home-bottom">

        {/* 페이지 점 */}
        <div className="Home-dots">
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              className={currentPage === index ? "active" : ""}
              onClick={() => setCurrentPage(index)}
            />
          ))}
        </div>

        {/* 하단 문구 */}
        <div className="home-foot">
          <p className="Home-subtitle">
            운동으로 더 건강한 일상을 만들어보세요.
          </p>
        </div>

      </div>

    </div>
  );
}

export default Home;