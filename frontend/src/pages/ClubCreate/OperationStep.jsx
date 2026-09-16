import {
    FiCheck,
    FiPlus,
    FiShield,
    FiTrash2,
    FiUserPlus
} from "react-icons/fi";

import CustomSelect from "../../components/common/CustomSelect";

const JOIN_METHOD_OPTIONS = [
    {
        value: "instant",
        title: "누구나 바로 가입",
        description: "신청 즉시 동호회에 가입할 수 있어요.",
        icon: FiUserPlus
    },
    {
        value: "approval",
        title: "가입 신청 후 승인",
        description: "운영자의 승인을 받은 후 가입할 수 있어요.",
        icon: FiShield
    }
];

const MAX_MEMBER_OPTIONS = [
    { value: "10", label: "10명" },
    { value: "20", label: "20명" },
    { value: "30", label: "30명" },
    { value: "50", label: "50명" },
    { value: "100", label: "100명" },
    { value: "200", label: "200명" },
    { value: "unlimited", label: "인원 제한 없음" }
];

function OperationStep({ formData, onChange }) {
    const joinQuestions = formData.joinQuestions ?? [];

    const addQuestion = () => {
        if (joinQuestions.length >= 5) {
            alert("가입 질문은 최대 5개까지 추가할 수 있습니다.");
            return;
        }

        const newQuestion = {
            id: Date.now(),
            question: ""
        };

        onChange("joinQuestions", [
            ...joinQuestions,
            newQuestion
        ]);
    };

    const updateQuestion = (questionId, value) => {
        const updatedQuestions = joinQuestions.map((question) =>
            question.id === questionId
                ? {
                      ...question,
                      question: value
                  }
                : question
        );

        onChange("joinQuestions", updatedQuestions);
    };

    const removeQuestion = (questionId) => {
        const updatedQuestions = joinQuestions.filter(
            (question) => question.id !== questionId
        );

        onChange("joinQuestions", updatedQuestions);
    };

    return (
        <div className="club-operation-step">
            <div className="club-operation-heading">
                <h2>어떻게 운영할까요?</h2>

                <p>
                    우리 동호회에 맞는 가입 방식과
                    운영 조건을 설정해주세요.
                </p>
            </div>

            {/* 가입 방식 */}
            <div className="club-create-field">
                <label>
                    가입 방식 <em>*</em>
                </label>

                <div
                    className="club-join-method-list"
                    role="radiogroup"
                    aria-label="가입 방식 선택"
                >
                    {JOIN_METHOD_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isSelected =
                            formData.joinMethod === option.value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                className={
                                    isSelected
                                        ? "club-join-method selected"
                                        : "club-join-method"
                                }
                                onClick={() =>
                                    onChange(
                                        "joinMethod",
                                        option.value
                                    )
                                }
                            >
                                <span className="club-join-method-icon">
                                    <Icon />
                                </span>

                                <span className="club-join-method-text">
                                    <strong>{option.title}</strong>
                                    <small>{option.description}</small>
                                </span>

                                <span className="club-join-method-radio">
                                    {isSelected && <FiCheck />}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 최대 회원 수 */}
            <div className="club-create-field">
                <label>
                    최대 회원 수 <em>*</em>
                </label>

                <CustomSelect
                    value={formData.maxMembers}
                    options={MAX_MEMBER_OPTIONS}
                    placeholder="최대 회원 수를 선택해주세요"
                    ariaLabel="최대 회원 수 선택"
                    onChange={(value) =>
                        onChange("maxMembers", value)
                    }
                />
            </div>

            {/* 가입 질문 */}
            <div className="club-create-field">
                <div className="club-question-heading">
                    <label>
                        가입 질문 설정 <span>(선택)</span>
                    </label>

                    <p>
                        가입 신청 시 회원에게 확인할 질문을
                        추가할 수 있어요.
                    </p>
                </div>

                {joinQuestions.length > 0 && (
                    <div className="club-question-list">
                        {joinQuestions.map((question, index) => (
                            <div
                                key={question.id}
                                className="club-question-card"
                            >
                                <span className="club-question-number">
                                    {index + 1}
                                </span>

                                <div className="club-question-input-wrapper">
                                    <input
                                        type="text"
                                        className="club-create-input"
                                        placeholder={
                                            index === 0
                                                ? "예) 가입 목적을 알려주세요."
                                                : "질문을 입력해주세요."
                                        }
                                        maxLength={50}
                                        value={question.question}
                                        onChange={(event) =>
                                            updateQuestion(
                                                question.id,
                                                event.target.value
                                            )
                                        }
                                    />

                                    <span className="club-question-length">
                                        {question.question.length}/50
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="club-question-delete"
                                    onClick={() =>
                                        removeQuestion(question.id)
                                    }
                                    aria-label={`${index + 1}번째 질문 삭제`}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="club-question-count-row">
                    <span>{joinQuestions.length}/5</span>
                </div>

                <button
                    type="button"
                    className="club-question-add"
                    onClick={addQuestion}
                    disabled={joinQuestions.length >= 5}
                >
                    <FiPlus />
                    질문 추가하기
                </button>
            </div>
        </div>
    );
}

export default OperationStep;