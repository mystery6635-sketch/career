import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SkipLink } from './components/ui/SkipLink'
import { SessionProvider } from './state/session'
import MainPage from './pages/MainPage'
import InputPage from './pages/InputPage'
import ResultPage from './pages/ResultPage'

// 개발 전용 갤러리는 DEV에서만 불러오며 프로덕션 빌드에서는 코드째 제거된다.
const UiGallery = import.meta.env.DEV ? lazy(() => import('./dev/UiGallery')) : null

// 경로: /(메인), /input(입력), /result(결과와 모든 상태 화면)
export default function App() {
  return (
    <SessionProvider>
      <SkipLink />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/input" element={<InputPage />} />
        <Route path="/result" element={<ResultPage />} />
        {UiGallery ? (
          <Route
            path="/dev/ui"
            element={
              <Suspense fallback={null}>
                <UiGallery />
              </Suspense>
            }
          />
        ) : null}
        <Route path="*" element={<MainPage />} />
      </Routes>
    </SessionProvider>
  )
}
