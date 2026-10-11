import { useEffect, useRef } from 'react'
import { SERVICE_NAME } from '@shared/messages'

// 처음 페이지를 열었을 때는 H1로 포커스를 옮기지 않는다. 그래야 첫 Tab이 "본문 바로가기"에 닿는다.
// 화면 전환(링크·버튼으로 이동)부터 H1로 옮긴다.
let initialLoad = true

/** 테스트에서 첫 로드 상태로 되돌린다. */
export function resetInitialLoad(value = true) {
  initialLoad = value
}

/** 화면 전환 규칙(design §22): 문서 제목 갱신, 맨 위로 이동, H1로 포커스. 반환한 ref를 H1에 붙인다. */
export function useRouteFocus(title: string, options: { focus?: boolean } = {}) {
  const { focus = true } = options
  const h1 = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    document.title = title === SERVICE_NAME ? SERVICE_NAME : `${title} · ${SERVICE_NAME}`
  }, [title])

  useEffect(() => {
    window.scrollTo(0, 0)
    if (initialLoad) {
      // 개발 모드의 StrictMode는 효과를 두 번 돌리므로, 첫 로드 표시는 한 틱 뒤에 내린다.
      setTimeout(() => {
        initialLoad = false
      }, 0)
      return
    }
    if (focus) h1.current?.focus({ preventScroll: true })
  }, [focus])

  return h1
}
