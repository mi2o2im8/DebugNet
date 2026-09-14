import "./Home.css";
import { Link } from "react-router-dom";
import { useState } from "react";

// 타이틀 이미지 4개
import titleImg01 from "../../assets/img/title_img01.png";
import titleImg02 from "../../assets/img/title_img02.png";
import titleImg03 from "../../assets/img/title_img03.png";
import titleImg04 from "../../assets/img/title_img04.png";

function Home() {

  // 현재 보여주는 이미지
  const [currentPage, setCurrentPage] = useState(0);

  // 타이틀 이미지 목록
  const images = [
    titleImg01,
    titleImg02,
    titleImg03,
    titleImg04
  ];

  // 다음 이미지
  const handleNext = () => {
    if (currentPage < images.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="Home-container">

      {/* 기존 제목 / 글자 */}
      <h1>PlayBridge</h1>

      <p className="Home-subtitle">
        나에게 딱 맞는 운동 모임을 찾아보세요!
      </p>


      {/* 타이틀 이미지 */}
      <img
        src={images[currentPage]}
        alt={`PlayBridge 소개 ${currentPage + 1}`}
        className="Home-image"
        onClick={handleNext}
      />


      {/* 기존 설명 글자 */}
      <div className="Home-text">
        <h2>
          {currentPage === 0 && "함께 운동할 사람을 찾아보세요"}
          {currentPage === 1 && "나에게 맞는 운동을 찾아보세요"}
          {currentPage === 2 && "가까운 운동 모임을 찾아보세요"}
          {currentPage === 3 && "새로운 사람들과 함께 시작해보세요"}
        </h2>

        <p>
          {currentPage === 0 && "혼자 하기 어려운 운동도 함께라면 즐거워요."}
          {currentPage === 1 && "운동 종목과 수준에 맞는 모임을 추천해드려요."}
          {currentPage === 2 && "내 주변의 가까운 운동 모임을 확인해보세요."}
          {currentPage === 3 && "PlayBridge와 함께 즐거운 운동을 시작해보세요!"}
        </p>
      </div>


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


      {/* 시작하기 버튼은 항상 표시 */}
      <Link to="/login" className="Home-start-btn">
        시작하기
      </Link>

    </div>
  );
}

export default Home;