import { BrowserRouter, Routes, Route} from 'react-router-dom';

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


import ClubHome from './pages/ClubHome/ClubHome';
import ClubDetail from "./pages/ClubDetail/ClubDetail";
import ClubApplication from "./pages/ClubApplication/ClubApplication";
import ClubEventList from "./pages/ClubEvents/ClubEventList";
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

import Community from "./pages/Community/Community";
import PostDetail from './pages/Community/PostDetail';
import PostWrite from './pages/Community/PostWrite';

import MatchHome from "./pages/Match/MatchHome";
import MatchAvailabilityForm from "./pages/Match/MatchAvailabilityForm";
import MatchAvailabilityDetail from "./pages/Match/MatchAvailabilityDetail";
import MatchTeamList from "./pages/Match/MatchTeamList";
import MatchTeamDetail from "./pages/Match/MatchTeamDetail";

import ClubManageLayout from "./layouts/ClubManageLayout";

import ClubEventParticipants from "./pages/ClubEvents/ClubEventParticipants";
import ClubMemberManagement from "./pages/ClubMembers/ClubMemberManagement";



// 내 정보
import Mypage from "./pages/Mypage/Mypage";
// 내정보 수정
import MyInfoEdit from './pages/Mypage/MyInfoEdit';
// 성정 페이지
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

// 알림 페이지
import Notification from './pages/Notification/Notification';

// 챗봇 페이지
import Chatbot from './pages/Chatbot/Chatbot';


import './App.css'

function App() {
  return (
    <BrowserRouter>
      <SignupProvider>
        <Routes>

          {/* 시작 페이지 */}
          <Route path='/' element={<Home/>}/>

          {/* 로그인 페이지 */}
          <Route path='/Login' element={<Login/>}/>

          {/* 동호회 가입 전 메인 페이지 */}
          <Route path="/main" element={<Main/>} />

          {/* 가입 후 메인 홈 */}
          <Route path="/mainhome" element={<MainHome />} />
          
          {/* 회원가입 버튼 연동 */}
          <Route path='/signup' element={<Signup/>}/>

          {/* 기본 정보 입력 페이지 */}
          <Route path='/signup/basic' element={<SignupProfile/>}/>

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
          <Route
            path='/clubs'
            element={<ClubHome />}
          />

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

          {/* 동호회 상세 페이지 */}
          <Route
            path="/clubs/:clubId"
            element={<ClubDetail />}
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


          {/* =====================================================
              ⭐ 커뮤니티
          ===================================================== */}

          {/* 커뮤니티 페이지 */}
          <Route
            path="/community"
            element={<Community/>}
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

          {/* 동호회 운영 기능: BottomNav 공통 적용 */}
          <Route element={<ClubManageLayout />}>

            {/* 이후 아래 위치에 동호회 운영 기능 관련 화면들을 추가 */}

            <Route
              path="/clubs/:clubId/manage"
              element={<ClubDashboard />}
            />

            <Route
              path="/clubs/:clubId/manage/members"
              element={<ClubMemberManagement />}
            />

            <Route
              path="/clubs/:clubId/manage/events"
              element={<ClubEventList />}
            />

            <Route
              path="/clubs/:clubId/manage/events/new"
              element={<ClubEventForm />}
            />

            <Route
              path="/clubs/:clubId/manage/events/:eventId/edit"
              element={<ClubEventForm />}
            />

            <Route
              path="/clubs/:clubId/manage/events/:eventId/participants"
              element={<ClubEventParticipants />}
            />


            {/* =================================================
                ⭐ 팀 매칭
            ================================================= */}

            {/* 팀 매칭 홈 */}
            <Route
              path="/matches"
              element={<MatchHome />}
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


          {/* =====================================================
              ⭐ 내 정보
          ===================================================== */}

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


          {/* =====================================================
              ⭐ 내 동호회 일정 전체보기
          ===================================================== */}

          {/* 기존 주소 */}
          <Route
            path="/myschedule"
            element={<MySchedule />}
          />

          {/* ⭐ Main의 '전체 일정 보기' 버튼용 */}
          <Route
            path="/schedule"
            element={<MySchedule />}
          />


          {/* =====================================================
              ⭐ 내 활동
          ===================================================== */}

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


          {/* =====================================================
              ⭐ 알림
          ===================================================== */}

          <Route
            path="/notification"
            element={<Notification />}
          />


          {/* =====================================================
              ⭐ 챗봇
          ===================================================== */}

          <Route
            path="/chatbot"
            element={<Chatbot />}
          />

        </Routes>
      </SignupProvider>
    </BrowserRouter>
  )
}

export default App;