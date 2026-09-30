// =========================================================
// ⭐ 내 정보 영역 공용 상단 제목
//
// 뒤로가기 + 제목(왼쪽 정렬) + 오른쪽 버튼(선택)
// 위치는 "내 정보" 페이지, 글씨는 "내 활동" 페이지 기준으로 통일
//
// 사용:
//   <PageHeader title="내 활동" />
//   <PageHeader title="내 정보" right={<button>...</button>} />
//   <PageHeader title="정보 수정" backTo="/mypage" />
//
// 스크롤해도 위에 붙어 있다 (sticky)
// 다크모드(html.dark-mode)도 지원
// =========================================================

import BackButton from "../BackButton/BackButton";

import "./PageHeader.css";


function PageHeader({
    title,
    right = null,
    backTo,
    onBack,
    showBack = true,
    className = "",
}) {
    return (
        <header className={`page-header ${className}`.trim()}>

            {showBack && (
                <BackButton
                    className="page-header-back"
                    to={backTo}
                    onClick={onBack}
                />
            )}

            <h2 className="page-header-title">
                {title}
            </h2>

            {right && (
                <div className="page-header-right">
                    {right}
                </div>
            )}

        </header>
    );
}


export default PageHeader;
