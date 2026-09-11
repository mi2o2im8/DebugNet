import { BrowserRouter, Routes, Route} from 'react-router-dom';

import Login from './pages/LoginPage/Login';
import Signup from './pages/Signup/SignupAccount';

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path='/' element={<Login/>}/>
        {/* 회원가입 버튼 연동 */}
        <Route path='/signup' element={<Signup/>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App;