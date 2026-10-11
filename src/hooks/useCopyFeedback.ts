import { useCallback, useEffect, useRef, useState } from 'react'
import type { CopyStatus } from '../components/result/CopyNotice'

const BUTTON_RESET_MS = 2500

// 복사 결과를 알림 상태로 보관하고, 버튼의 "✓ 복사했어요"는 2.5초 후 원래 글자로 돌린다.
export function useCopyFeedback(write: () => Promise<void>) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const [buttonDone, setButtonDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    clearTimeout(timer.current)
    try {
      await write()
      setStatus('success')
      setButtonDone(true)
      timer.current = setTimeout(() => setButtonDone(false), BUTTON_RESET_MS)
    } catch {
      setStatus('error')
      setButtonDone(false)
    }
  }, [write])

  return { status, buttonDone, copy }
}
