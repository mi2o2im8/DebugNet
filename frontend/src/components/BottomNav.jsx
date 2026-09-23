import "./css/BottomNav.css";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  FiHome,
  FiUsers,
  FiRepeat,
  FiMessageCircle,
  FiUser
} from "react-icons/fi";

import { getMyClub } from "../api/clubApi";


function BottomNav() {
  const navigate = useNavigate();

  const [hasClub, setHasClub] = useState(null);
  const [checkingClub, setCheckingClub] = useState(true);


  // ⭐ 동호회 여부 확인
  useEffect(() => {
    let isActive = true;

    const checkMyClub = async () => {
      try {
        const myClub = await getMyClub();

        console.log("⭐ BottomNav 내 동호회:", myClub);

        const clubExists =
          Boolean(myClub?.operating_club) ||
          Boolean(myClub?.joined_club);

        if (isActive) {
          setHasClub(clubExists);
          setCheckingClub(false);
        }

      } catch (error) {
        console.error("⭐ BottomNav 동호회 조회 오류:", error);

        if (isActive) {
          setHasClub(false);
          setCheckingClub(false);
        }
      }
    };

    checkMyClub();

    return () => {
      isActive = false;
    };
  }, []);


  // ⭐ 활동 클릭
  const handleActivityClick = async (e) => {
    e.preventDefault();

    // ⭐ 조회 중이면 이동하지 않음
    if (checkingClub) {
      console.log("⭐ 아직 동호회 확인 중...");
      return;
    }

    try {
      // ⭐ 클릭하는 순간 최신 동호회 정보 다시 확인
      const myClub = await getMyClub();

      console.log("⭐ 활동 클릭 시 동호회:", myClub);

      const clubExists =
        Boolean(myClub?.operating_club) ||
        Boolean(myClub?.joined_club);

      // ⭐ 상태도 최신값으로 업데이트
      setHasClub(clubExists);

      if (clubExists) {
        console.log("⭐ 가입자/운영자 → MainHome");
        navigate("/mainhome");
      } else {
        console.log("⭐ 미가입자 → Main");
        navigate("/main");
      }

    } catch (error) {
      console.error("⭐ 활동 클릭 동호회 확인 오류:", error);
    }
  };


  return (
    <nav className="bottom-nav">

      {/* 활동 */}
      <NavLink
        to={hasClub ? "/mainhome" : "/main"}
        onClick={handleActivityClick}
        className={({ isActive }) =>
          isActive
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <FiHome className="bottom-nav-icon" />
        <span>활동</span>
      </NavLink>


      {/* 동호회찾기 */}
      <NavLink
        to="/clubs"
        className={({ isActive }) =>
          isActive
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <FiUsers className="bottom-nav-icon" />
        <span>동호회찾기</span>
      </NavLink>


      {/* 팀 매칭 */}
      <NavLink
        to="/matches"
        className={({ isActive }) =>
          isActive
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <FiRepeat className="bottom-nav-icon" />
        <span>팀 매칭</span>
      </NavLink>


      {/* 소통하기 */}
      <NavLink
        to="/community"
        className={({ isActive }) =>
          isActive
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <FiMessageCircle className="bottom-nav-icon" />
        <span>소통하기</span>
      </NavLink>


      {/* 내 정보 */}
      <NavLink
        to="/mypage"
        className={({ isActive }) =>
          isActive
            ? "bottom-nav-item active"
            : "bottom-nav-item"
        }
      >
        <FiUser className="bottom-nav-icon" />
        <span>내 정보</span>
      </NavLink>

    </nav>
  );
}

export default BottomNav;