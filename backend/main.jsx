import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ⭐ 다크모드 유지
// 설정에서 켠 다크모드를 새로고침 / 재접속해도 바로 적용
// (원래는 설정 페이지에 들어가야만 html.dark-mode 가 붙었음)
try {
  document.documentElement.classList.toggle(
    'dark-mode',
    localStorage.getItem('darkMode') === 'true'
  )
} catch {
  // localStorage 를 못 쓰는 환경이면 기본(라이트)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
