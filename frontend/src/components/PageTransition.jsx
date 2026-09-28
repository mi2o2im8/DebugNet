// =========================================================
// ⭐ 모든 페이지 전환 효과
//
// 주소(pathname)가 바뀔 때마다 감싼 영역을 새로 그려서
// index.css의 .page-transition 애니메이션이 매번 재생되게 한다.
//
// ⭐ BrowserRouter 안쪽에서 사용해야 한다 (useLocation 때문)
// =========================================================

import { useLocation } from "react-router-dom";

function PageTransition({ children }) {
    const { pathname } = useLocation();

    return (
        <div key={pathname} className="page-transition">
            {children}
        </div>
    );
}

export default PageTransition;
