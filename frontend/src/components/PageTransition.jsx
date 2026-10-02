// =========================================================
// ⭐ 모든 페이지 전환 효과
//
// 주소(pathname)가 바뀔 때마다 감싼 영역을 새로 그려서
// index.css의 .page-transition 애니메이션이 매번 재생되게 한다.
//
// ⭐ 페이지 이동 시 스크롤 맨 위로 초기화
// SPA는 페이지가 바뀌어도 window 스크롤 위치가 그대로 남아서,
// 이전 페이지를 내려둔 상태로 이동하면 새 페이지가
// 이미 내려간 상태(고정 헤더와 겹친 상태)로 보인다.
// → 화면이 그려지기 전에(useLayoutEffect) 맨 위로 올린다.
//
// ⭐ BrowserRouter 안쪽에서 사용해야 한다 (useLocation 때문)
// =========================================================

import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// 브라우저가 뒤로가기 때 예전 스크롤 위치를 멋대로 복원하지 않게
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}

function PageTransition({ children }) {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname]);

    return (
        <div key={pathname} className="page-transition">
            {children}
        </div>
    );
}

export default PageTransition;
