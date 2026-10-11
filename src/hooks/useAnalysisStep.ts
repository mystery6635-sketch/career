import { useEffect, useState } from 'react'
import { ANALYSIS_STEPS } from '@shared/messages'

const reduced = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

/** 분석 중 단계 표시. 일반 1초, 움직임 감소 설정 0.7초 간격(design §23). 표시용 문구이며 실제 진행률이 아니다. */
export function useAnalysisStep(active: boolean): number {
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), reduced() ? 700 : 1000)
    return () => {
      clearInterval(id)
      setStep(0)
    }
  }, [active])
  return step
}
