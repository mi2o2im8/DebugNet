// FAQ 페이지
//
// 설정 > 도움말 > FAQ
// 질문을 누르면 답변이 펼쳐진다.
// 백엔드 없이 아래 FAQ_SECTIONS 데이터만 수정하면 된다.

import { useState } from "react";

import BackButton from "../../components/BackButton/BackButton";

import "./Settings.css";
import "./AccountSettings.css";
import "./Faq.css";


// =========================================================
// ⭐ FAQ 데이터
//
// 질문 추가: 해당 섹션 items에 { question, answer } 추가
// 섹션 추가: FAQ_SECTIONS에 { title, items } 추가
// =========================================================

const FAQ_SECTIONS = [
    {
        title: "동호회",
        items: [
            {
                question: "동호회는 어떻게 가입하나요?",
                answer:
                    "하단 메뉴의 '동호회찾기'에서 원하는 동호회를 고른 뒤 가입 신청을 보내면 돼요. 동호회장이나 운영진이 승인하면 가입이 완료돼요.",
            },
            {
                question: "동호회를 직접 만들 수 있나요?",
                answer:
                    "네, 가능해요. '동호회 만들기'에서 기본 정보, 운영 방식, 가입 조건 등을 입력하면 동호회가 만들어지고, 만든 사람이 동호회장이 돼요.",
            },
            {
                question: "가입 신청을 했는데 아직 승인이 안 됐어요.",
                answer:
                    "가입 승인은 각 동호회의 운영진이 직접 처리해요. 시간이 조금 걸릴 수 있으니 기다려주세요. 처리 결과는 알림으로 알려드려요.",
            },
        ],
    },
    {
        title: "일정 · 게스트",
        items: [
            {
                question: "동호회 일정에 참석하려면 어떻게 하나요?",
                answer:
                    "소속 동호회의 일정에서 참석 여부를 선택하면 돼요. 내가 속한 모든 동호회의 일정은 '내 일정'에서 한 번에 볼 수 있어요.",
            },
            {
                question: "게스트 신청이 뭔가요?",
                answer:
                    "가입하지 않은 동호회의 일정에 한 번 참여해보는 기능이에요. 게스트 모집 중인 일정에서 신청하고, 운영진이 승인하면 참여가 확정돼요.",
            },
            {
                question: "게스트 신청을 취소할 수 있나요?",
                answer:
                    "승인 대기 중일 때는 일정 상세 화면에서 직접 취소할 수 있어요. 이미 참여가 확정된 뒤라면 동호회 운영진에게 문의해주세요.",
            },
            {
                question: "게스트 신청 버튼이 눌리지 않아요.",
                answer:
                    "신청 마감일이 지났거나, 게스트 정원이 다 찼거나, 이미 지난 일정이면 신청할 수 없어요. 화면에 표시된 안내 문구를 확인해주세요.",
            },
        ],
    },
    {
        title: "팀 매칭",
        items: [
            {
                question: "팀 매칭은 어떻게 이용하나요?",
                answer:
                    "하단 메뉴의 '팀 매칭'에서 다른 동호회와 경기를 잡을 수 있어요. 경기가 끝나면 경기 기록과 후기를 남길 수 있어요.",
            },
        ],
    },
    {
        title: "커뮤니티 · 차단",
        items: [
            {
                question: "불편한 회원을 차단하고 싶어요.",
                answer:
                    "게시글이나 댓글의 메뉴에서 '차단하기'를 누르면 돼요. 차단한 회원의 게시글과 댓글은 더 이상 보이지 않아요.",
            },
            {
                question: "차단을 해제하고 싶어요.",
                answer:
                    "설정 > 계정 및 안전 > 차단회원 관리에서 해제할 수 있어요. 해제하면 그 회원의 글과 댓글이 다시 보여요.",
            },
        ],
    },
    {
        title: "계정 · 설정",
        items: [
            {
                question: "신뢰점수는 어떻게 정해지나요?",
                answer:
                    "일정 참여율, 투표 참여율 등 동호회 활동 기록을 바탕으로 계산돼요. 기록이 일정 수 이상 쌓여야 점수가 표시되고, 자세한 내용은 내 정보 > 신뢰점수에서 볼 수 있어요.",
            },
            {
                question: "알림을 끄고 싶어요.",
                answer:
                    "설정 > 알림 설정에서 받고 싶은 알림만 골라서 켜고 끌 수 있어요.",
            },
            {
                question: "비밀번호를 바꾸고 싶어요.",
                answer:
                    "설정 > 개인정보 관리 > 비밀번호 변경에서 바꿀 수 있어요.",
            },
            {
                question: "다크모드는 어디서 바꾸나요?",
                answer:
                    "설정 맨 위 '화면'에서 라이트 / 다크모드를 바꿀 수 있어요.",
            },
        ],
    },
];


function Faq() {

    // ⭐ 펼쳐진 질문 ("섹션번호-질문번호"), 한 번에 하나만 열림
    const [openKey, setOpenKey] = useState(null);

    const handleToggle = (key) => {
        setOpenKey((prev) => (prev === key ? null : key));
    };


    return (

        <div className="settings-page account-settings-page">

            {/* =================================================
                상단
            ================================================= */}

            <header className="settings-header">
                <BackButton />
                <h2>FAQ</h2>
            </header>


            <main className="settings-content">

                {FAQ_SECTIONS.map((section, sectionIndex) => (

                    <section
                        key={section.title}
                        className="settings-section"
                    >

                        <h3>{section.title}</h3>

                        <div className="settings-card">

                            {section.items.map((item, itemIndex) => {

                                const key = `${sectionIndex}-${itemIndex}`;
                                const isOpen = openKey === key;
                                const answerId = `faq-answer-${key}`;

                                return (

                                    <div key={key}>

                                        {itemIndex > 0 && (
                                            <div className="settings-divider"></div>
                                        )}

                                        <button
                                            type="button"
                                            className="settings-row settings-button faq-question"
                                            aria-expanded={isOpen}
                                            aria-controls={answerId}
                                            onClick={() => handleToggle(key)}
                                        >
                                            <span>{item.question}</span>

                                            <span
                                                className={`row-arrow faq-arrow${isOpen ? " is-open" : ""}`}
                                                aria-hidden="true"
                                            >
                                                ›
                                            </span>
                                        </button>

                                        {isOpen && (
                                            <p
                                                id={answerId}
                                                className="faq-answer"
                                            >
                                                {item.answer}
                                            </p>
                                        )}

                                    </div>

                                );

                            })}

                        </div>

                    </section>

                ))}

                <p className="faq-guide">
                    원하는 답을 찾지 못했다면 챗봇에게 물어보세요.
                </p>

            </main>

        </div>

    );

}

export default Faq;
