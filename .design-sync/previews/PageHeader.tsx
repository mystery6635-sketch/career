import { PageHeader } from 'initial-counseling-helper'

export function Input() {
  return <PageHeader kicker="STEP 01 · 입력" title="구직자 정보 입력" />
}

export function ResultWithSubtitle() {
  return (
    <PageHeader
      kicker="STEP 03 · 결과 확인"
      title="상담 참고 결과"
      subtitle="입력하신 이력과의 적합도를 기준으로 정리한 결과입니다."
    />
  )
}
