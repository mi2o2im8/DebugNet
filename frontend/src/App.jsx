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
import Main from "./pages/Main/Main";

// // 동호회
// import BasicInfoStep from './pages/ClubCreate/BasicInfoStep'
import ClubCreate from './pages/ClubCreate/ClubCreate'
// import ScheduleStep from './pages/ClubCreate/ScheduleStep';
// // components
// import CustomSelect from './components/common/CustomSelect';
// import BottomNav from './components/BottomNav';

import Community from "./pages/Community/Community";
import PostDetail from './pages/Community/PostDetail';
import PostWrite from './pages/Community/PostWrite';
import ClubManageLayout from "./layouts/ClubManageLayout";


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
          {/* 로그인 후 메인 페이지 */}
          <Route path="/main" element={<Main/>} />
          {/* 회원가입 버튼 연동 */}
          <Route path='/signup' element={<Signup/>}/>
          {/* 기본 정보 입력 페이지 */}
          <Route path='/signup/basic' element={<SignupProfile/>}/>
          {/* 운동 종목 선택 페이지 */}
          <Route path='/signup/basic/sport' element={<SignupSport />} />
          {/* 운동 레벨 페이지 */}
          <Route path='/signup/basic/SignupSportLevel' element={<SignupSportLevel />} />
          {/* 활동 가능 지역 및 거리 선택 */}
          <Route path='/signup/basic/SignupLocation' element={<SignupLocation />} />
          {/* 활동 가능 시간 선택 */}
          <Route path='/signup/basic/SignupTime' element={<SignupTime />} />
          {/* 활동 가능 시간 선택 */}
          <Route path='/signup/basic/SignupFrequency' element={<SignupFrequency />} />
          {/* 동호회 선호 선택 */}
          <Route path='/signup/basic/SignupClubPreference' element={<SignupClubPreference />} />
          {/* 월 회비 - 가입완료 마지막 페이지 */}
          <Route path='/signup/basic/SignupFee' element={<SignupFee />} />
          <Route path='/signup/basic/review' element={<SignupReview />} />

          {/* 동호회 만들기 페이지 */}
          <Route path="/clubs/create" element={<ClubCreate />} />


          {/* 커뮤니티 페이지 */}
          <Route path="/community" element={<Community/>} />
          {/* 커뮤니티 상세보기 */}
          <Route path="/community/post/:postId" element={<PostDetail />} />
          {/* 커뮤니티 게시글 작성하기 */}
          <Route path="/community/write" element={<PostWrite />} />

          {/* 동호회 운영 기능: BottomNav 공통 적용 */}
          <Route element={<ClubManageLayout />}>
              <Route path="/clubs/:clubId/manage" element={<ClubDashboard />}/> 
              
              {/* 이후 아래 위치에 동호회 운영 기능 관련 화면들을 추가 */}
              
          </Route>

        </Routes>
      </SignupProvider>
    </BrowserRouter>
  )
}

export default App;