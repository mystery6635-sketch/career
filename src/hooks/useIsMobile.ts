import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '../styles/breakpoints'

const QUERY = `(max-width: ${BREAKPOINTS.mobile}px)`

/** 모바일 여부(BREAKPOINTS.mobile 이하). 입력 섹션을 접이식으로 바꿀 때 쓴다(design §21). */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia?.(QUERY).matches ?? false))
  useEffect(() => {
    const mq = window.matchMedia?.(QUERY)
    if (!mq) return
    const onChange = () => setMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return mobile
}
