import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Home from './pages/LoginPage/Home'
import Login from './pages/LoginPage/Login';
import Signup from './pages/Signup/SignupAccount';
import SignupProfile from './pages/Signup/SignupProfile'

// 회원가입 전체 데이터 공용 저장공간
import { SignupProvider } from './pages/Signup/SignupContext';
import SignupSport from './pages/Signup/SignupSport';
import SignupSportLevel from './pages/Signup/SignupSportLevel'
import SignupLocation from './pages/Signup/SignupLocation'
import SignupTime from './pages/Signup/SignupTime'
import SignupFrequency from './pages/Signup/SignupFrequency'
import SignupClubPreference from './pages/Signup/SignupClubPreference'
import SignupFee from './pages/Signup/SignupFee'
import SignupReview from './pages/Signup/SignupReview'

import ClubDashboard from "./pages/ClubDashboard/ClubDashboard";
import ClubSettingsHome from "./pages/ClubSettings/ClubSettingsHome";
import ClubBasicSettings from "./pages/ClubSettings/ClubBasicSettings";
import ClubJoinSettings from "./pages/ClubSettings/ClubJoinSettings";
import ClubDeleteSettings from "./pages/ClubSettings/ClubDeleteSettings";

import ClubHome from './pages/ClubHome/ClubHome';
import ClubDetail from "./pages/ClubDetail/ClubDetail";
import ClubApplication from "./pages/ClubApplication/ClubApplication";
import ClubEventList from "./pages/ClubEvents/ClubEventList";
import ClubUserEventsList from "./pages/ClubUserEventsList/ClubUserEventsList";
import ClubEventForm from "./pages/ClubEvents/ClubEventForm";
import ClubEventAttendance from "./pages/ClubEvents/ClubEventAttendance";

// 동호회 가입 전 후 메인페이지들
// import Home from "./pages/Home/Home";
import Main from "./pages/Main/Main";
import MainHome from "./pages/MainHome/MainHome";

// 동호회
import ClubCreate from './pages/ClubCreate/ClubCreate';
import AllClub from "./pages/AllClub/AllClub";
import ClubRecruit from "./pages/ClubRecruit/ClubRecruit";
import GuestRecruit from "./pages/GuestRecruit/GuestRecruit";
import GuestRecruitDetail from "./pages/GuestRecruitDetail/GuestRecruitDetail";
import ClubUserDashboard from "./pages/ClubUserDashboard/ClubUserDashboard";

import Community from "./pages/Community/Community";
import PostDetail from './pages/Community/PostDetail';
import PostWrite from './pages/Community/PostWrite';

import MatchHome from "./pages/Match/MatchHome";
import MatchAvailabilityForm from "./pages/Match/MatchAvailabilityForm";
import MatchAvailabilityDetail from "./pages/Match/MatchAvailabilityDetail";
import MatchTeamList from "./pages/Match/MatchTeamList";
import MatchTeamDetail from "./pages/Match/MatchTeamDetail";
import MatchAIRecommend from "./pages/Match/MatchAIRecommend";
import MatchAIRecommendResult from "./pages/Match/MatchAIRecommendResult";

import ClubManageLayout from "./layouts/ClubManageLayout";

import ClubEventParticipants from "./pages/ClubEvents/ClubEventParticipants";
import ClubEventDetail from "./pages/ClubEvents/ClubEventDetail";

// 동호회 멤버 관리
import ClubMemberManagement from "./pages/ClubMembers/ClubMemberManagement";
import ClubMemberDetail from "./pages/ClubMembers/ClubMemberDetail";

import MatchManagement from "./pages/Match/MatchManagement";
import MatchManagementList from "./pages/Match/MatchManagementList";
import MatchManagementDetail from "./pages/Match/MatchManagementDetail";
import MatchRecordWrite from "./pages/Match/MatchRecordWrite";
import MatchReviewWrite from "./pages/Match/MatchReviewWrite";
import MatchReviewDetail from "./pages/Match/MatchReviewDetail";

// 내 정보
import Mypage from "./pages/Mypage/Mypage";

// 내정보 수정
import MyInfoEdit from './pages/Mypage/MyInfoEdit';

// 설정 페이지
import Settings from './pages/Settings/Settings';

// 내 동호회 일정 전체보기
import MySchedule from "./pages/MySchedule/MySchedule";

// 내 활동
import MyActivity from "./pages/MyActivity/MyActivity";

// 신뢰점수
import TrustScore from './pages/TrustScore/TrustScore';

// 내가 쓴 글/댓글
import MyPostComment from './pages/MyPostComment/MyPostComment';

// 찜한 동호회
import FavoriteClub from './pages/FavoriteClub/FavoriteClub';

// 개인정보 관리
import PrivacySettings from './pages/Settings/PrivacySettings';

// 비밀번호 변경
import ChangePassword from './pages/Settings/ChangePassword';

// 차단 인물 설정
import BlockedUsers from './pages/Settings/BlockedUsers';

// 알림 페이지
import Notification from './pages/Notification/Notification';

// ⭐ 알림 Context (Provider) - 페이지가 아니라 앱 전체를 감싸는 용도로 사용
import { NotificationProvider } from './context/NotificationContext';

// 나의 동호회 리뷰들 모아보기
import MyReviews from './pages/MyReviews/MyReviews';

// FAQ 화면
import Faq from './pages/Settings/Faq';

// 알림 설정
import NotificationSettings from './pages/Settings/NotificationSettings';

// 챗봇 페이지
import Chatbot from './pages/Chatbot/Chatbot';

// 모든 페이지 화면이동시 애니메이션 적용
import PageTransition from "./components/PageTransition";

import './App.css'

function App() {
  return (
    <BrowserRouter>

      {/* ⭐ 알림 데이터를 앱 전체에서 공유하기 위해 최상단에서 감싸줌 */}
      <NotificationProvider>

        <SignupProvider>
          <PageTransition>
            <Routes>

              {/* 시작 페이지 */}
              <Route path='/' element={<Home />} />

              {/* 로그인 페이지 */}
              <Route path='/Login' element={<Login />} />

              {/* 동호회 가입 전 메인 페이지 */}
              <Route path="/main" element={<Main />} />

              {/* 가입 후 메인 홈 */}
              <Route path="/mainhome" element={<MainHome />} />

              {/* 회원가입 버튼 연동 */}
              <Route path='/signup' element={<Signup />} />

              {/* 기본 정보 입력 페이지 */}
              <Route
                path='/signup/basic'
                element={<SignupProfile />}
              />

              {/* 운동 종목 선택 페이지 */}
              <Route
                path='/signup/basic/sport'
                element={<SignupSport />}
              />

              {/* 운동 레벨 페이지 */}
              <Route
                path='/signup/basic/SignupSportLevel'
                element={<SignupSportLevel />}
              />

              {/* 활동 가능 지역 및 거리 선택 */}
              <Route
                path='/signup/basic/SignupLocation'
                element={<SignupLocation />}
              />

              {/* 활동 가능 시간 선택 */}
              <Route
                path='/signup/basic/SignupTime'
                element={<SignupTime />}
              />

              {/* 활동 가능 시간 선택 */}
              <Route
                path='/signup/basic/SignupFrequency'
                element={<SignupFrequency />}
              />

              {/* 동호회 선호 선택 */}
              <Route
                path='/signup/basic/SignupClubPreference'
                element={<SignupClubPreference />}
              />

              {/* 월 회비 - 가입완료 마지막 페이지 */}
              <Route
                path='/signup/basic/SignupFee'
                element={<SignupFee />}
              />

              <Route
                path='/signup/basic/review'
                element={<SignupReview />}
              />

              {/* =====================================================
                  ⭐ 동호회 찾기
              ===================================================== */}

              {/* 동호회 찾기 홈 화면 페이지 */}
              <Route path='/clubs' element={<ClubHome />} />

              {/* 전체 동호회 페이지 */}
              <Route
                path="/clubs/all"
                element={<AllClub />}
              />

              {/* 회원 모집 중 페이지 */}
              <Route
                path="/clubs/recruit"
                element={<ClubRecruit />}
              />

              {/* 게스트 모집 중 페이지 */}
              <Route
                path="/guest-recruit"
                element={<GuestRecruit />}
              />

              {/* 게스트 모집 상세 페이지 */}
              <Route
                path="/guest-recruit/:eventId"
                element={<GuestRecruitDetail />}
              />

              {/* 동호회 상세 페이지 */}
              <Route
                path="/clubs/:clubId"
                element={<ClubDetail />}
              />

              {/* 동호회 이용자용 대시보드 */}
              <Route
                path="/clubs/:clubId/home"
                element={<ClubUserDashboard />}
              />

              {/* 동호회 가입 페이지 */}
              <Route
                path="/clubs/:clubId/application"
                element={<ClubApplication />}
              />

              {/* 동호회 참석 응답 */}
              <Route
                path="/clubs/:clubId/events/:eventId/attendance"
                element={<ClubEventAttendance />}
              />

              {/* 동호회 만들기 페이지 */}
              <Route
                path="/clubs/create"
                element={<ClubCreate />}
              />

              {/* 동호회 삭제 */}
              <Route
                path="/clubs/:clubId/manage/settings/delete"
                element={<ClubDeleteSettings />}
              />

              {/* =====================================================
                  ⭐ 커뮤니티
              ===================================================== */}

              {/* 커뮤니티 페이지 */}
              <Route
                path="/community"
                element={<Community />}
              />

              {/* 커뮤니티 상세보기 */}
              <Route
                path="/community/post/:postId"
                element={<PostDetail />}
              />

              {/* 커뮤니티 게시글 작성하기 */}
              <Route
                path="/community/write"
                element={<PostWrite />}
              />

              {/* =====================================================
                  ⭐ 동호회 운영 기능
              ===================================================== */}

              {/* 동호회 운영 화면에 BottomNav 공통 적용 */}
              <Route element={<ClubManageLayout />}>

                {/* 동호회 운영 관리 홈 */}
                <Route
                  path="/clubs/:clubId/manage"
                  element={<ClubDashboard />}
                />

                {/* 동호회 설정 홈 */}
                <Route
                  path="/clubs/:clubId/manage/settings"
                  element={<ClubSettingsHome />}
                />

                {/* 동호회 기본 정보 수정 */}
                <Route
                  path="/clubs/:clubId/manage/settings/basic"
                  element={<ClubBasicSettings />}
                />

                {/* 동호회 가입 방식 설정 */}
                <Route
                  path="/clubs/:clubId/manage/settings/join"
                  element={<ClubJoinSettings />}
                />

                {/* 동호회 회원 관리 */}
                <Route
                  path="/clubs/:clubId/manage/members"
                  element={<ClubMemberManagement />}
                />

                {/* 동호회 전체 일정 목록 */}
                <Route
                  path="/clubs/:clubId/manage/events"
                  element={<ClubEventList />}
                />

                {/* 이용자용 동호회 전체 일정 목록 */}
                <Route
                    path="/clubs/:clubId/events"
                    element={<ClubUserEventsList />}
                />

                {/* 동호회 새 일정 만들기 */}
                <Route
                  path="/clubs/:clubId/manage/events/new"
                  element={<ClubEventForm />}
                />

                {/* 동호회 일정 상세 */}
                <Route
                  path="/clubs/:clubId/manage/events/:eventId"
                  element={<ClubEventDetail />}
                />

                {/* 동호회 일정 수정 */}
                <Route
                  path="/clubs/:clubId/manage/events/:eventId/edit"
                  element={<ClubEventForm />}
                />

                {/* 동호회 일정 참가자 관리 */}
                <Route
                  path="/clubs/:clubId/manage/events/:eventId/participants"
                  element={<ClubEventParticipants />}
                />

                {/* 동호회 회원 상세 */}
                <Route
                  path="/clubs/:clubId/manage/members/:clubMemberId"
                  element={<ClubMemberDetail />}
                />

                {/* 동호회 팀 매칭 관리 홈 */}
                <Route
                  path="/clubs/:clubId/matches"
                  element={<MatchManagement />}
                />

                {/* 동호회 팀 매칭 목록 */}
                <Route
                  path="/clubs/:clubId/matches/list"
                  element={<MatchManagementList />}
                />

                {/* 동호회 팀 매칭 상세 */}
                <Route
                  path="/clubs/:clubId/matches/:clubMatchId"
                  element={<MatchManagementDetail />}
                />

                {/* 동호회 경기 결과 기록 */}
                <Route
                  path="/clubs/:clubId/matches/:clubMatchId/record"
                  element={<MatchRecordWrite />}
                />

                {/* 동호회 경기 후기 작성 */}
                <Route
                  path="/clubs/:clubId/matches/:clubMatchId/review"
                  element={<MatchReviewWrite />}
                />

                {/* 동호회 경기 후기 상세 */}
                <Route
                  path="/clubs/:clubId/matches/:clubMatchId/review-detail"
                  element={<MatchReviewDetail />}
                />

                {/* 동호회 전용 커뮤니티 게시글 목록 */}
                <Route
                  path="/clubs/:clubId/manage/community"
                  element={<Community />}
                />

                {/* 동호회 전용 커뮤니티 게시글 작성 */}
                <Route
                  path="/clubs/:clubId/manage/community/write"
                  element={<PostWrite />}
                />

                {/* 동호회 전용 커뮤니티 게시글 상세 */}
                <Route
                  path="/clubs/:clubId/manage/community/post/:postId"
                  element={<PostDetail />}
                />

                {/* =====================================================
                    동호회 이용자용 커뮤니티
                ===================================================== */}

                {/* 동호회 이용자용 커뮤니티 게시글 목록 */}
                <Route
                  path="/clubs/:clubId/community"
                  element={<Community />}
                />

                {/* 동호회 이용자용 커뮤니티 게시글 작성 */}
                <Route
                  path="/clubs/:clubId/community/write"
                  element={<PostWrite />}
                />

                {/* 동호회 이용자용 커뮤니티 게시글 상세 */}
                <Route
                  path="/clubs/:clubId/community/post/:postId"
                  element={<PostDetail />}
                />

                {/* =================================================
                    ⭐ 팀 매칭
                ================================================= */}

                {/* 팀 매칭 홈 */}
                <Route
                  path="/matches"
                  element={<MatchHome />}
                />

                {/* AI 상대팀 추천 조건 입력 */}
                <Route
                  path="/matches/recommend"
                  element={<MatchAIRecommend />}
                />

                {/* AI 상대팀 추천 결과 */}
                <Route
                  path="/matches/recommend/result"
                  element={<MatchAIRecommendResult />}
                />

                {/* 경기 가능일 등록 */}
                <Route
                  path="/matches/availability/new"
                  element={<MatchAvailabilityForm />}
                />

                {/* 경기 가능일 상세 */}
                <Route
                  path="/matches/availability/:availabilityId"
                  element={<MatchAvailabilityDetail />}
                />

                {/* 경기 가능일 수정 */}
                <Route
                  path="/matches/availability/:availabilityId/edit"
                  element={<MatchAvailabilityForm />}
                />

                {/* 해당 조건으로 상대팀 찾기 */}
                <Route
                  path="/matches/availability/:availabilityId/teams"
                  element={<MatchTeamList />}
                />

                {/* 경기 등록 여부와 관계없이 상대팀 검색 */}
                <Route
                  path="/matches/teams"
                  element={<MatchTeamList />}
                />

                {/* 상대팀 경기 가능일 상세 */}
                <Route
                  path="/matches/team/:availabilityId"
                  element={<MatchTeamDetail />}
                />

              </Route>

              {/* 내 정보 */}

              {/* 내 정보 */}
              <Route
                path="/mypage"
                element={<Mypage />}
              />

              {/* 내 정보 수정 */}
              <Route
                path="/myinfoedit"
                element={<MyInfoEdit />}
              />

              {/* 설정 페이지 */}
              <Route
                path="/mypage/settings"
                element={<Settings />}
              />

              {/* 내 동호회 일정 전체보기 */}

              {/* 기존 주소 */}
              <Route
                path="/myschedule"
                element={<MySchedule />}
              />

              {/* ⭐ 경기 후기 모아보기 */}
              <Route
                path="/my-reviews"
                element={<MyReviews />}
              />

              {/* ⭐ Main의 '내 동호회 전체 일정 보기' 버튼용 */}
              <Route
                path="/schedule"
                element={<MySchedule />}
              />

              {/* 내 활동 */}
              <Route
                path="/myactivity"
                element={<MyActivity />}
              />

              {/* 신뢰점수 */}
              <Route
                path="/trustscore"
                element={<TrustScore />}
              />

              {/* 내가 쓴 글/댓글 목록 */}
              <Route
                path="/mypostcomment"
                element={<MyPostComment />}
              />

              {/* 찜한 동호회 */}
              <Route
                path="/favoriteClub"
                element={<FavoriteClub />}
              />

              {/* 챗봇 */}
              <Route
                path="/chatbot"
                element={<Chatbot />}
              />

              {/* 알림 */}
              <Route
                path="/notification"
                element={<Notification />}
              />

              {/* 알림 설정 */}
              <Route
                path="/notification-settings"
                element={<NotificationSettings />}
              />

              {/* 개인정보 관리 */}
              <Route
                path="/privacy"
                element={<PrivacySettings />}
              />

              {/* 차단회원 관리 */}
              <Route
                path="/blocked-users"
                element={<BlockedUsers />}
              />

              {/* 비밀번호 변경 */}
              <Route
                path="/change-password"
                element={<ChangePassword />}
              />

              {/* FAQ */}
              <Route
                path="/faq"
                element={<Faq />}
              />

            </Routes>
            
          </PageTransition>

        </SignupProvider>

      </NotificationProvider>

    </BrowserRouter>
  )
}

export default App;

// http://localhost:5173/clubs/12/manage/members