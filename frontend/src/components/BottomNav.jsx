import "./css/BottomNav.css";
import { NavLink } from "react-router-dom";

import {
  FiHome,
  FiUsers,
  FiRepeat,
  FiMessageCircle,
  FiUser
} from "react-icons/fi";


function BottomNav() {
  return (
    <nav className="bottom-nav">

      {/* 활동 */}
      <NavLink
        to="/main"
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
        to="/my"
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