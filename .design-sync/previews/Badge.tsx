import { Badge } from 'initial-counseling-helper'

const row = { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' } as const

export function StatusVariants() {
  return (
    <div style={row}>
      <Badge variant="progress">분석 중</Badge>
      <Badge variant="error">생성 실패</Badge>
      <Badge variant="warning">요청 제한</Badge>
      <Badge variant="info">입력 필요</Badge>
    </div>
  )
}

export function TimeoutState() {
  return (
    <div style={row}>
      <Badge variant="error">시간 초과 · 생성 중단</Badge>
    </div>
  )
}
