import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { supabase } from "../../../supabaseClient";
import { getClubMemberStatus } from "../../api/clubApi";

import "./ClubApplication.css";

function ClubApplication() {
  const { clubId } = useParams();
  const navigate = useNavigate();

  // =========================================================
  // ⭐ 동호회 정보
  // =========================================================

  const [club, setClub] = useState(null);

  // =========================================================
  // ⭐ 운영자가 설정한 가입 질문
  // =========================================================

  const [questions, setQuestions] = useState([]);

  // =========================================================
  // ⭐ 가입 신청 내용
  // =========================================================

  const [introduction, setIntroduction] = useState("");
  const [joinReason, setJoinReason] = useState("");

  // =========================================================
  // ⭐ 운영자 질문 답변
  // =========================================================

  const [answers, setAnswers] = useState({});

  // =========================================================
  // ⭐ 운영 안내 동의
  // =========================================================

  const [agree, setAgree] = useState(false);

  // =========================================================
  // ⭐ 현재 로그인 사용자
  // =========================================================

  const [currentUserId, setCurrentUserId] = useState(null);

  // =========================================================
  // ⭐ 승인 대기 상태
  // =========================================================

  const [waitingApproval, setWaitingApproval] = useState(false);

  // =========================================================
  // ⭐ 동호회 정보 + 가입 질문 조회
  // =========================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ---------------------------------------------
        // 1. 현재 로그인 사용자 확인
        // ---------------------------------------------

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
        }

        // ---------------------------------------------
        // 2. 동호회 정보 조회
        // ---------------------------------------------

        const clubResponse = await fetch(
          `http://localhost:8000/api/clubs/${clubId}`
        );

        if (!clubResponse.ok) {
          throw new Error(
            "동호회 정보를 불러오지 못했습니다."
          );
        }

        const clubData = await clubResponse.json();

        setClub(clubData);

        // ---------------------------------------------
        // 3. 가입 질문 조회
        // ---------------------------------------------

        const questionResponse = await fetch(
          `http://localhost:8000/api/clubs/${clubId}/join-questions`
        );

        if (!questionResponse.ok) {
          throw new Error(
            "가입 질문을 불러오지 못했습니다."
          );
        }

        const questionData =
          await questionResponse.json();

        setQuestions(questionData);

      } catch (error) {
        console.error(
          "가입 신청서 조회 오류:",
          error
        );
      }
    };

    fetchData();
  }, [clubId]);

  // =========================================================
  // ⭐ 운영자 질문 답변 변경
  // =========================================================

  const handleAnswerChange = (
    questionId,
    value
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // =========================================================
  // ⭐ 운영자 승인 여부 확인
  //
  // pending
  //   → 계속 대기
  //
  // active
  //   → 운영자 승인 완료
  //   → MainHome 이동
  //
  // rejected
  //   → 신청 화면으로 돌아감
  // =========================================================

  useEffect(() => {
    if (
      !waitingApproval ||
      !currentUserId
    ) {
      return;
    }

    let isChecking = true;

    const checkApproval = async () => {
      try {
        const result =
          await getClubMemberStatus(
            clubId,
            currentUserId
          );

        const status =
          result?.status;

        console.log(
          "현재 가입 상태:",
          status
        );

        // ---------------------------------------------
        // ⭐ 운영자 승인 완료
        // ---------------------------------------------

        if (
          status === "active" &&
          isChecking
        ) {
          alert(
            "운영자의 승인이 완료되었습니다.\n가입 후 메인 홈으로 이동합니다."
          );

          navigate(
            "/mainhome",
            {
              replace: true,
            }
          );

          return;
        }

        // ---------------------------------------------
        // ⭐ 가입 거절
        // ---------------------------------------------

        if (
          status === "rejected" &&
          isChecking
        ) {
          alert(
            "가입 신청이 거절되었습니다."
          );

          setWaitingApproval(false);

          return;
        }

      } catch (error) {
        console.error(
          "가입 승인 상태 확인 오류:",
          error
        );
      }
    };

    // 처음 한 번 바로 확인
    checkApproval();

    // ⭐ 3초마다 승인 여부 확인
    const intervalId =
      setInterval(
        checkApproval,
        3000
      );

    return () => {
      isChecking = false;
      clearInterval(intervalId);
    };

  }, [
    waitingApproval,
    currentUserId,
    clubId,
    navigate,
  ]);

  // =========================================================
  // ⭐ 가입 신청 제출
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ---------------------------------------------
    // 1. 자기소개 확인
    // ---------------------------------------------

    if (!introduction.trim()) {
      alert(
        "자기소개를 입력해주세요."
      );
      return;
    }

    // ---------------------------------------------
    // 2. 가입 이유 확인
    // ---------------------------------------------

    if (!joinReason.trim()) {
      alert(
        "가입하고 싶은 이유를 입력해주세요."
      );
      return;
    }

    // ---------------------------------------------
    // 3. 필수 질문 확인
    // ---------------------------------------------

    for (const question of questions) {
      if (
        question.required &&
        !answers[
          question.question_id
        ]?.trim()
      ) {
        alert(
          `"${question.question_text}"에 답변해주세요.`
        );
        return;
      }
    }

    // ---------------------------------------------
    // 4. 운영 안내 동의 확인
    // ---------------------------------------------

    if (!agree) {
      alert(
        "운영 안내에 동의해주세요."
      );
      return;
    }

    try {
      // ---------------------------------------------
      // 5. 로그인 사용자 확인
      // ---------------------------------------------

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert(
          "로그인이 필요합니다."
        );
        return;
      }

      setCurrentUserId(user.id);

      // ---------------------------------------------
      // 6. 신청 메시지 구성
      // ---------------------------------------------

      const applicationMessage =
        `자기소개:\n${introduction.trim()}\n\n` +
        `가입 이유:\n${joinReason.trim()}`;

      // ---------------------------------------------
      // 7. 질문 답변 구성
      // ---------------------------------------------

      const applicationAnswers =
        questions
          .filter(
            (question) =>
              answers[
                question.question_id
              ]?.trim()
          )
          .map((question) => ({
            question_id:
              question.question_id,

            answer_text:
              answers[
                question.question_id
              ].trim(),
          }));

      // ---------------------------------------------
      // 8. 가입 신청 API
      // ---------------------------------------------

      const response = await fetch(
        `http://localhost:8000/api/clubs/${clubId}/application`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_id: user.id,

            application_message:
              applicationMessage,

            answers:
              applicationAnswers,
          }),
        }
      );

      const data =
        await response.json();

      // ---------------------------------------------
      // 9. API 오류
      // ---------------------------------------------

      if (!response.ok) {
        console.error(
          "가입 신청 실패:",
          data
        );

        alert(
          data.detail ||
            "가입 신청에 실패했습니다."
        );

        return;
      }

      // ---------------------------------------------
      // 10. 가입 신청 완료
      // ---------------------------------------------

      console.log(
        "가입 신청 성공:",
        data
      );

      alert(
        "가입 신청이 완료되었습니다.\n운영자의 승인을 기다려주세요."
      );

      // ⭐ 여기서 바로 MainHome으로 이동하지 않는다.
      // ⭐ 운영자가 승인해서 active가 될 때 이동한다.

      setWaitingApproval(true);

    } catch (error) {
      console.error(
        "가입 신청 오류:",
        error
      );

      alert(
        "가입 신청 중 오류가 발생했습니다."
      );
    }
  };

  // =========================================================
  // ⭐ 동호회 정보 로딩
  // =========================================================

  if (!club) {
    return (
      <div>
        불러오는 중...
      </div>
    );
  }

  // =========================================================
  // ⭐ 승인 대기 화면
  // =========================================================

  if (waitingApproval) {
    return (
      <div className="club-application-page">

        <header className="club-application-header">

          <button
            type="button"
            onClick={() =>
              navigate(
                `/clubs/${clubId}`
              )
            }
          >
            <FiArrowLeft />
          </button>

          <h1>
            가입 승인 대기
          </h1>

        </header>

        <div className="club-application-waiting">

          <h2>
            가입 신청이 완료되었습니다.
          </h2>

          <p>
            운영자의 승인을 기다리고 있습니다.
            <br />
            승인되면 자동으로
            가입 후 메인 홈으로 이동합니다.
          </p>

          <p>
            현재 승인 상태를 확인하는 중입니다...
          </p>

        </div>

      </div>
    );
  }

  // =========================================================
  // ⭐ 가입 신청 화면
  // =========================================================

  return (
    <div className="club-application-page">

      {/* 상단 */}

      <header className="club-application-header">

        <button
          type="button"
          onClick={() =>
            navigate(-1)
          }
        >
          <FiArrowLeft />
        </button>

        <h1>
          동호회 가입 신청
        </h1>

      </header>

      <form
        onSubmit={handleSubmit}
      >

        {/* 동호회 정보 */}

        <section className="club-application-club-info">

          <h2>
            {club.club_name}
          </h2>

          <p>
            {club.sports?.join(", ")}
            {" · "}
            {club.regions?.join(", ")}
          </p>

        </section>

        {/* 자기소개 */}

        <section className="club-application-section">

          <label>
            간단한 자기소개를 입력해주세요.
          </label>

          <textarea
            value={introduction}
            onChange={(e) =>
              setIntroduction(
                e.target.value
              )
            }
            placeholder="자기소개를 입력해주세요."
            maxLength={300}
          />

          <div className="club-application-count">
            {introduction.length}/300
          </div>

        </section>

        {/* 가입 이유 */}

        <section className="club-application-section">

          <label>
            이 동호회에 가입하고 싶은 이유는?
          </label>

          <textarea
            value={joinReason}
            onChange={(e) =>
              setJoinReason(
                e.target.value
              )
            }
            placeholder="가입하고 싶은 이유를 입력해주세요."
            maxLength={300}
          />

          <div className="club-application-count">
            {joinReason.length}/300
          </div>

        </section>

        {/* 추가 질문 */}

        {questions.length > 0 && (

          <section className="club-application-section">

            <h2>
              추가 질문
            </h2>

            {questions.map(
              (question) => (

                <div
                  className="club-application-question"
                  key={
                    question.question_id
                  }
                >

                  <label>

                    {question.question_text}

                    {question.required && (
                      <span>
                        {" "}*
                      </span>
                    )}

                  </label>

                  <textarea
                    value={
                      answers[
                        question.question_id
                      ] || ""
                    }
                    onChange={(e) =>
                      handleAnswerChange(
                        question.question_id,
                        e.target.value
                      )
                    }
                    placeholder="답변을 입력해주세요."
                  />

                </div>

              )
            )}

          </section>

        )}

        {/* 운영 안내 */}

        <section className="club-application-agreement">

          <label>

            <input
              type="checkbox"
              checked={agree}
              onChange={(e) =>
                setAgree(
                  e.target.checked
                )
              }
            />

            <span>
              운영 가이드를 동의합니다.
              <br />
              (예의, 인신 공격 금지, 운영 방침 등)
            </span>

          </label>

        </section>

        {/* 가입 신청 버튼 */}

        <button
          type="submit"
          className="club-application-submit-btn"
        >
          가입 신청하기
        </button>

      </form>

    </div>
  );
}

export default ClubApplication;