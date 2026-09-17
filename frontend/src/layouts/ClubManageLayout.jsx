import { Outlet } from "react-router-dom";

import BottomNav from "../components/BottomNav";

import "./ClubManageLayout.css";


function ClubManageLayout() {
    return (
        <div className="club-manage-layout">
            <div className="club-manage-layout-content">
                <Outlet />
            </div>

            <BottomNav />
        </div>
    );
}

export default ClubManageLayout;