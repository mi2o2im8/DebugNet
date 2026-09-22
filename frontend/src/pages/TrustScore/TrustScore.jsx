// 신뢰점수 스코어 페이지

import BackButton from "../../components/BackButton/BackButton";

import "./TrustScore.css";

function TrustScore() {

    // ⭐ 임시 더미 데이터
    // 나중에 DB/API 연결 시 이 데이터만 교체
    const trustData = {
        trust_score: 92,
        score_message: "매우 좋은 신뢰도",

        attendance_rate: 92,
        recent_normal_count: 9,
        no_show_count: 1,
        same_day_cancel_count: 2,
        time_compliance_rate: 96,

        rank: 12
    };

    return (
        <div className="trust-score-page">

            <div className="trust-score-container">

                {/* ⭐ 헤더 */}
                <div className="trust-score-header">

                    {/* ⭐ 뒤로가기 */}
                    <BackButton
                        className="trust-score-back-btn"
                    />

                    {/* ⭐ 헤더 중앙 제목 */}
                    <h2>신뢰점수</h2>

                </div>


                {/* ⭐ 신뢰점수 박스 */}
                <div className="trust-score-box">

                    <div className="trust-score-number">
                        {trustData.trust_score}
                    </div>

                    <div className="trust-score-message">
                        {trustData.score_message}
                    </div>

                    {/* ⭐ 게이지 */}
                    <div className="trust-score-gauge">
                        <div
                            className="trust-score-gauge-fill"
                            style={{
                                width: `${trustData.trust_score}%`
                            }}
                        />
                    </div>

                </div>


                {/* ⭐ 신뢰 데이터 */}
                <h3 className="trust-data-title">
                    신뢰 데이터
                </h3>


                <div className="trust-data-box">

                    <div className="trust-data-row">
                        <span>전체 참석률</span>
                        <strong>
                            {trustData.attendance_rate}%
                        </strong>
                    </div>

                    <div className="trust-data-row">
                        <span>최근 10회 정상 참여</span>
                        <strong>
                            {trustData.recent_normal_count}회
                        </strong>
                    </div>

                    <div className="trust-data-row">
                        <span>노쇼</span>
                        <strong>
                            {trustData.no_show_count}회
                        </strong>
                    </div>

                    <div className="trust-data-row">
                        <span>당일 취소</span>
                        <strong>
                            {trustData.same_day_cancel_count}회
                        </strong>
                    </div>

                    <div className="trust-data-row">
                        <span>시간 준수율</span>
                        <strong>
                            {trustData.time_compliance_rate}%
                        </strong>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default TrustScore;