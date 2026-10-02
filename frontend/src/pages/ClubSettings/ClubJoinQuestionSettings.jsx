import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import {
    FiPlus,
    FiSave,
    FiTrash2
} from "react-icons/fi";

import {
    BackButtonIcon
} from "../../components/BackButton/BackButton";

import {
    getClubJoinQuestionSettings,
    replaceClubJoinQuestions
} from "../../api/clubApi";

import "./ClubSettings.css";


const MAX_QUESTIONS = 5;
const MAX_QUESTION_LENGTH = 50;


const createQuestionItem = (question = {}) => ({
    localId:
        question.question_id
        ?? `new-${Date.now()}-${Math.random()}`,

    question:
        question.question_text
        ?? "",

    required:
        Boolean(question.required)
});


function ClubJoinQuestionSettings() {
    const { clubId } = useParams();
    const navigate = useNavigate();

    const [questions, setQuestions] =
        useState([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {
        let isActive = true;

        getClubJoinQuestionSettings(clubId)
            .then((result) => {
                if (!isActive) {
                    return;
                }

                setQuestions(
                    (result.questions ?? []).map(
                        createQuestionItem
                    )
                );
            })
            .catch((error) => {
                if (!isActive) {
                    return;
                }

                setErrorMessage(
                    error.message ||
                    "가입 질문을 불러오지 못했습니다."
                );
            })
            .finally(() => {
                if (isActive) {
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [clubId]);

    const addQuestion = () => {
        if (questions.length >= MAX_QUESTIONS) {
            alert(
                `가입 질문은 최대 ${MAX_QUESTIONS}개까지 `
                + "등록할 수 있습니다."
            );
            return;
        }

        setQuestions((previous) => [
            ...previous,
            createQuestionItem()
        ]);
    };

    const updateQuestionText = (
        localId,
        value
    ) => {
        setQuestions((previous) =>
            previous.map((question) =>
                question.localId === localId
                    ? {
                        ...question,
                        question: value
                    }
                    : question
            )
        );
    };

    const updateQuestionRequired = (
        localId,
        required
    ) => {
        setQuestions((previous) =>
            previous.map((question) =>
                question.localId === localId
                    ? {
                        ...question,
                        required
                    }
                    : question
            )
        );
    };

    const removeQuestion = (localId) => {
        setQuestions((previous) =>
            previous.filter(
                (question) =>
                    question.localId !== localId
            )
        );
    };

    const handleSave = async () => {
        const normalizedQuestions = questions.map(
            (question) => ({
                ...question,
                question: question.question.trim()
            })
        );

        const emptyQuestion = normalizedQuestions.some(
            (question) => !question.question
        );

        if (emptyQuestion) {
            alert(
                "내용이 비어 있는 가입 질문이 있습니다."
            );
            return;
        }

        const normalizedTexts =
            normalizedQuestions.map(
                (question) =>
                    question.question.toLocaleLowerCase(
                        "ko-KR"
                    )
            );

        if (
            normalizedTexts.length
            !== new Set(normalizedTexts).size
        ) {
            alert(
                "동일한 가입 질문을 중복해서 "
                + "등록할 수 없습니다."
            );
            return;
        }

        const requestQuestions =
            normalizedQuestions.map(
                (question) => ({
                    question:
                        question.question,
                    question_type: "text",
                    required:
                        question.required
                })
            );

        setIsSaving(true);
        setErrorMessage("");

        try {
            const result =
                await replaceClubJoinQuestions(
                    clubId,
                    requestQuestions
                );

            setQuestions(
                (result.questions ?? []).map(
                    createQuestionItem
                )
            );

            alert(
                result.message ||
                "가입 질문이 수정되었습니다."
            );

            navigate(
                `/clubs/${clubId}/manage/settings`
            );
        } catch (error) {
            setErrorMessage(
                error.message ||
                "가입 질문 수정에 실패했습니다."
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <main className="club-settings-state">
                가입 질문을 불러오는 중입니다.
            </main>
        );
    }

    return (
        <main className="club-settings-page">
            <header className="club-settings-header">
                <button
                    type="button"
                    className="club-settings-back-button"
                    aria-label="동호회 설정으로 돌아가기"
                    onClick={() =>
                        navigate(
                            `/clubs/${clubId}/manage/settings`
                        )
                    }
                >
                    <BackButtonIcon />
                </button>

                <h1>가입 질문 관리</h1>

                <span
                    className="club-settings-header-space"
                    aria-hidden="true"
                />
            </header>

            <section className="club-settings-form-content">
                {errorMessage && (
                    <p className="club-settings-error">
                        {errorMessage}
                    </p>
                )}

                <div className="club-settings-question-guide">
                    <strong>
                        가입 신청자에게 확인할 질문을
                        설정해주세요.
                    </strong>

                    <p>
                        기존 신청서의 질문과 답변은
                        질문을 변경한 뒤에도 보존됩니다.
                    </p>
                </div>

                <div className="club-settings-question-heading">
                    <span>
                        가입 질문
                    </span>

                    <strong>
                        {questions.length}/{MAX_QUESTIONS}
                    </strong>
                </div>

                {questions.length === 0 ? (
                    <div className="club-settings-question-empty">
                        등록된 가입 질문이 없습니다.
                    </div>
                ) : (
                    <div className="club-settings-question-list">
                        {questions.map(
                            (question, index) => (
                                <div
                                    key={question.localId}
                                    className="club-settings-question-card"
                                >
                                    <div className="club-settings-question-top">
                                        <span className="club-settings-question-number">
                                            {index + 1}
                                        </span>

                                        <label className="club-settings-required-check">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    question.required
                                                }
                                                onChange={(event) =>
                                                    updateQuestionRequired(
                                                        question.localId,
                                                        event.target.checked
                                                    )
                                                }
                                            />

                                            <span>
                                                필수 답변
                                            </span>
                                        </label>

                                        <button
                                            type="button"
                                            className="club-settings-question-delete"
                                            aria-label={`${index + 1}번째 질문 삭제`}
                                            onClick={() =>
                                                removeQuestion(
                                                    question.localId
                                                )
                                            }
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>

                                    <textarea
                                        className="club-settings-question-input"
                                        maxLength={
                                            MAX_QUESTION_LENGTH
                                        }
                                        value={
                                            question.question
                                        }
                                        placeholder={
                                            "예) 가입 목적을 알려주세요."
                                        }
                                        onChange={(event) =>
                                            updateQuestionText(
                                                question.localId,
                                                event.target.value
                                            )
                                        }
                                    />

                                    <span className="club-settings-question-length">
                                        {question.question.length}
                                        /{MAX_QUESTION_LENGTH}
                                    </span>
                                </div>
                            )
                        )}
                    </div>
                )}

                <button
                    type="button"
                    className="club-settings-question-add"
                    onClick={addQuestion}
                    disabled={
                        questions.length >= MAX_QUESTIONS
                    }
                >
                    <FiPlus />
                    질문 추가하기
                </button>

                <button
                    type="button"
                    className="club-settings-save-button"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <FiSave />

                    {isSaving
                        ? "저장 중..."
                        : "변경사항 저장"}
                </button>
            </section>
        </main>
    );
}


export default ClubJoinQuestionSettings;