// =========================================================
// 마이페이지 "내 활동" 메뉴 아이콘
//
// 동그란 연한 배경 + 진한 선 / 연한 채움 2톤 아이콘
// 색은 메뉴마다 다르게 (통계 초록 / 글 주황 / 신청 파랑 / 찜 분홍)
//
// 사용: <ActivityIcon type="stats" />
// =========================================================

const COLORS = {
    // bg: 동그라미 배경 / main: 선·진한 부분 / soft: 안쪽 연한 채움
    stats: { bg: "#e3f6f0", main: "#01a17f", soft: "#8fd6bf" },
    posts: { bg: "#fff1e3", main: "#ef8a2e", soft: "#ffcf9f" },
    applications: { bg: "#e8effd", main: "#4f7fe8", soft: "#b3c8f6" },
    favorites: { bg: "#fdebef", main: "#e5577a", soft: "#f5b3c3" },
};


// ⭐ 아이콘 모양 (24 x 24 기준)
const GLYPHS = {

    // 최근 참여경기 / 통계: 막대 3개
    stats: ({ main, soft }) => (
        <>
            <rect x="4.5" y="13.5" width="3.6" height="6" rx="1.2" fill={soft} />
            <rect x="10.2" y="9.5" width="3.6" height="10" rx="1.2" fill={main} />
            <rect x="15.9" y="5" width="3.6" height="14.5" rx="1.2" fill={main} />
        </>
    ),

    // 내가 쓴 글 / 댓글: 말풍선
    posts: ({ main, soft }) => (
        <>
            <path
                d="M12 4.5c4.4 0 7.8 2.9 7.8 6.6s-3.4 6.6-7.8 6.6c-.9 0-1.8-.1-2.6-.4L5.6 19l.9-3.4C5 14.4 4.2 12.8 4.2 11.1 4.2 7.4 7.6 4.5 12 4.5z"
                fill={soft}
                stroke={main}
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <circle cx="8.6" cy="11.1" r="1.15" fill={main} />
            <circle cx="12" cy="11.1" r="1.15" fill={main} />
            <circle cx="15.4" cy="11.1" r="1.15" fill={main} />
        </>
    ),

    // 가입 / 게스트 신청 현황: 클립보드 + 사람
    applications: ({ main, soft, bg }) => (
        <>
            <rect
                x="4.8" y="5.2" width="12.4" height="15" rx="2.2"
                fill={soft}
                stroke={main}
                strokeWidth="1.7"
            />
            <rect x="8.2" y="3.6" width="5.6" height="3.2" rx="1.1" fill={main} />
            <path
                d="M8 10.3h6M8 13.3h3.4"
                stroke={main}
                strokeWidth="1.7"
                strokeLinecap="round"
            />

            {/* 사람: 배경색 테두리로 클립보드와 분리 */}
            <g
                stroke={bg}
                strokeWidth="1.6"
                paintOrder="stroke"
                strokeLinejoin="round"
            >
                <circle cx="17.2" cy="14.4" r="2.2" fill={main} />
                <path
                    d="M13.3 20.6c.3-2.1 1.9-3.5 3.9-3.5s3.6 1.4 3.9 3.5z"
                    fill={main}
                />
            </g>
        </>
    ),

    // 찜한 동호회: 하트
    favorites: ({ main, soft }) => (
        <path
            d="M12 19.3s-7-4.2-7-9.2c0-2.4 1.8-4.2 4-4.2 1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.8 4 4.2 0 5-7 9.2-7 9.2z"
            fill={soft}
            stroke={main}
            strokeWidth="1.7"
            strokeLinejoin="round"
        />
    ),
};


function ActivityIcon({ type, className = "activity-icon" }) {

    const colors = COLORS[type] ?? COLORS.stats;
    const Glyph = GLYPHS[type] ?? GLYPHS.stats;

    return (
        <svg
            className={className}
            viewBox="0 0 52 52"
            aria-hidden="true"
            focusable="false"
        >
            <circle cx="26" cy="26" r="26" fill={colors.bg} />

            <g transform="translate(9 9) scale(1.4)">
                <Glyph {...colors} />
            </g>
        </svg>
    );
}


export default ActivityIcon;
