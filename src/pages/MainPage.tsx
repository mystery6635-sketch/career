import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MAIN } from '@shared/messages'
import { useRouteFocus } from '../hooks/useRouteFocus'
import { Header } from '../components/ui/Header'
import { Hero } from '../components/main/Hero'
import { FlowSteps } from '../components/main/FlowSteps'
import { NoticeSection } from '../components/main/NoticeSection'
import { Footer } from '../components/main/Footer'

export default function MainPage() {
  const { hash } = useLocation()
  const h1 = useRouteFocus(MAIN.title)

  // "이용 방법" 링크(#flow): 이용 흐름 섹션으로 이동한다(움직임 감소 설정에서는 즉시 이동).
  useEffect(() => {
    if (hash === '#flow') document.getElementById('flow')?.scrollIntoView()
  }, [hash])

  return (
    <>
      <Header variant="overlay" />
      <main id="main">
        <Hero headingRef={h1} />
        <FlowSteps />
        <NoticeSection />
      </main>
      <Footer />
    </>
  )
}
