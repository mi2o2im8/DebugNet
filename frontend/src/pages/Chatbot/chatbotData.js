// =========================================================
// ⭐ 이용 도우미(챗봇) 질문·답변 데이터
//
// - 화면의 "자주 묻는 질문" 버튼과 직접 입력 답변에 같이 쓴다.
// - 나중에 AI를 연결할 때도 이 내용을 AI에게 알려줄 기준 자료로 쓴다.
//
// 항목 구조
//   id        : 고유 값 (related에서 참조)
//   label     : 버튼에 보이는 질문
//   keywords  : 직접 입력했을 때 이 답변을 찾는 단어
//   answer    : 답변 첫 문장
//   steps     : "이렇게 진행해보세요" 단계 (없으면 [])
//   actions   : 관련 화면 바로가기 버튼 { label, path }
//   related   : 답변 뒤에 추천할 다른 질문 id
// =========================================================

export const FAQ_ITEMS = [
    {
        id: "find-club",
        label: "🔎 동호회 찾는 방법",
        keywords: ["동호회 찾", "동호회 검색", "동호회 추천", "찾기", "검색", "가입 방법", "가입하려"],
        answer: "원하는 종목과 지역으로 나에게 맞는 동호회를 찾아볼 수 있어요.",
        steps: [
            "하단 메뉴에서 '동호회찾기'를 눌러요.",
            "종목, 지역 등 원하는 조건을 골라요.",
            "마음에 드는 동호회에 들어가 가입 신청을 보내요.",
        ],
        actions: [
            { label: "동호회 찾으러 가기", path: "/clubs/all" },
        ],
        related: ["guest", "create-club"],
    },
    {
        id: "create-club",
        label: "🏠 동호회 만드는 방법",
        keywords: ["동호회 만들", "동호회 생성", "개설", "만들기"],
        answer: "직접 동호회를 만들고 동호회장으로 운영할 수 있어요.",
        steps: [
            "동호회 만들기를 눌러요.",
            "동호회 이름, 종목, 활동 지역 등 기본 정보를 입력해요.",
            "운영 방식과 가입 조건을 정하면 완성돼요.",
        ],
        actions: [
            { label: "동호회 만들기", path: "/clubs/create" },
        ],
        related: ["schedule", "find-club"],
    },
    {
        id: "match",
        label: "🔄 팀 매칭 방법",
        keywords: ["팀 매칭", "매칭", "경기", "상대팀", "시합"],
        answer: "경기 가능일을 등록하면 조건에 맞는 다른 동호회와 경기를 잡을 수 있어요.",
        steps: [
            "경기 가능일을 등록해요. 날짜, 시간, 장소를 입력해요.",
            "조건에 맞는 상대 팀을 확인해요.",
            "매칭 요청을 보내고, 수락되면 경기가 확정돼요.",
        ],
        actions: [
            { label: "경기 가능일 등록하기", path: "/matches/availability/new" },
            { label: "팀 매칭 바로가기", path: "/matches" },
        ],
        related: ["schedule", "community"],
    },
    {
        id: "schedule",
        label: "🗓 일정 등록 방법",
        keywords: ["일정 등록", "일정 만들", "일정 관리", "정모", "모임 등록"],
        answer: "동호회장과 운영진은 동호회 관리에서 일정을 만들 수 있어요.",
        steps: [
            "내 동호회의 관리 화면으로 들어가요.",
            "일정 관리에서 새 일정을 눌러요.",
            "날짜, 시간, 장소를 입력하고 등록해요.",
        ],
        actions: [
            { label: "내 일정 보기", path: "/myschedule" },
        ],
        related: ["op-participants", "guest"],
    },
    {
        id: "guest",
        label: "🙋 게스트 참여 방법",
        keywords: ["게스트", "용병", "체험", "한 번만", "비회원"],
        answer: "가입하지 않은 동호회의 일정에도 게스트로 한 번 참여해볼 수 있어요.",
        steps: [
            "게스트 모집 중인 일정을 골라요.",
            "게스트 신청을 눌러요.",
            "운영진이 승인하면 참여가 확정돼요.",
        ],
        actions: [],
        related: ["find-club", "schedule"],
    },
    {
        id: "community",
        label: "💬 커뮤니티 이용 방법",
        keywords: ["커뮤니티", "게시글", "게시판", "글쓰기", "댓글", "소통"],
        answer: "소통하기에서 게시글과 댓글로 다른 회원들과 이야기할 수 있어요.",
        steps: [
            "하단 메뉴에서 '소통하기'를 눌러요.",
            "자유게시판, 종목별게시판 등 원하는 게시판을 골라요.",
            "새 게시글 버튼으로 글을 써요.",
        ],
        actions: [
            { label: "소통하기 바로가기", path: "/community" },
        ],
        related: ["block", "find-club"],
    },
    {
        id: "op-applications",
        label: "📥 가입 신청 확인·승인",
        keywords: ["가입 신청 확인", "가입신청 확인", "가입 신청 승인", "가입신청 승인", "가입신청은 어디", "가입 신청은 어디", "받은 신청", "신청자", "가입 승인", "가입 거절"],
        answer: "들어온 가입 신청은 운영 홈 > '회원 관리'의 '가입 신청' 탭에서 확인하고 승인·거절할 수 있어요.",
        steps: [
            "'활동' 탭에서 '운영' 배지가 있는 동호회를 눌러요.",
            "'회원 관리' > '가입 신청'을 눌러요.",
            "'승인 대기'에서 신청서를 보고 승인 또는 승인 거절을 눌러요.",
        ],
        actions: [
            { label: "받은 신청 모아보기", path: "/my-applications" },
        ],
        related: ["op-manager", "op-participants"],
    },
    {
        id: "op-manager",
        label: "🛡 운영진 지정 방법",
        keywords: ["운영진 지정", "운영진 임명", "운영진 추가", "운영진 해제", "운영진 권한", "부회장"],
        answer: "운영진 지정·해제는 동호회장만 할 수 있어요. 회원 관리에서 회원을 누르고 '운영진으로 지정'을 눌러요.",
        steps: [
            "운영 홈 > '회원 관리' > '현재 회원'을 열어요.",
            "지정할 회원을 눌러 회원 상세로 가요.",
            "'운영진으로 지정'을 눌러요.",
        ],
        actions: [
            { label: "활동 홈", path: "/mainhome" },
        ],
        related: ["op-applications", "schedule"],
    },
    {
        id: "op-participants",
        label: "✅ 참가자·게스트 승인",
        keywords: ["참가자 승인", "참가자 관리", "게스트 승인", "참석자 확인", "참여 승인"],
        answer: "일정 상세의 '참가자 관리'에서 승인 대기 중인 참가자(게스트 포함)를 승인·거절할 수 있어요.",
        steps: [
            "운영 홈 > '일정 관리'에서 일정을 눌러요.",
            "'참가자 관리'를 눌러요.",
            "'승인 대기'에서 승인 또는 거절을 눌러요.",
        ],
        actions: [
            { label: "활동 홈", path: "/mainhome" },
        ],
        related: ["schedule", "op-applications"],
    },
    {
        id: "my-applications",
        label: "📄 내 신청 현황",
        keywords: ["신청 결과", "신청 현황", "신청 내역", "신청 취소", "승인 언제", "내 신청"],
        answer: "내가 보낸 가입·게스트 신청은 내 정보 > '가입 / 게스트 신청 현황'에서 확인하고, 승인 대기 중이면 취소할 수 있어요.",
        steps: [],
        actions: [
            { label: "내 신청 현황", path: "/my-applications" },
        ],
        related: ["find-club", "guest"],
    },
    {
        id: "block",
        label: "🚫 차단 / 차단 해제",
        keywords: ["차단", "신고", "해제", "불편"],
        answer: "불편한 회원을 차단하면 그 회원의 게시글과 댓글이 보이지 않아요.",
        steps: [
            "게시글이나 댓글의 메뉴에서 차단하기를 눌러요.",
            "해제는 설정 > 차단회원 관리에서 할 수 있어요.",
        ],
        actions: [
            { label: "차단회원 관리", path: "/blocked-users" },
        ],
        related: ["community", "settings"],
    },
    {
        id: "settings",
        label: "⚙ 내 정보 / 설정",
        keywords: ["내 정보", "설정", "프로필", "알림", "비밀번호", "다크모드", "탈퇴"],
        answer: "내 정보에서 프로필, 활동 기록, 알림과 계정 설정을 바꿀 수 있어요.",
        steps: [],
        actions: [
            { label: "내 정보로 가기", path: "/mypage" },
            { label: "설정으로 가기", path: "/mypage/settings" },
        ],
        related: ["block", "community"],
    },
];


// ⭐ 처음 화면에 보여줄 질문 (순서대로)
export const WELCOME_QUESTION_IDS = [
    "find-club",
    "op-applications",
    "schedule",
    "match",
    "community",
    "settings",
];


export const getFaqById = (id) =>
    FAQ_ITEMS.find((item) => item.id === id) || null;


// =========================================================
// ⭐ 직접 입력한 문장에 맞는 질문 찾기
//
// keywords 중 문장에 들어 있는 단어가 가장 많고 긴 항목을 고른다.
// 맞는 항목이 없으면 null
// =========================================================
export const findFaqByText = (text) => {

    const normalized = text.replace(/\s+/g, " ").trim();

    if (!normalized) {
        return null;
    }

    let bestItem = null;
    let bestScore = 0;

    FAQ_ITEMS.forEach((item) => {

        const score = item.keywords.reduce(
            (sum, keyword) =>
                normalized.includes(keyword)
                    ? sum + keyword.length
                    : sum,
            0
        );

        if (score > bestScore) {
            bestScore = score;
            bestItem = item;
        }

    });

    return bestItem;
};
