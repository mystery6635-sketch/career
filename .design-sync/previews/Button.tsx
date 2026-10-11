import { Button } from 'initial-counseling-helper'

const row = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' } as const

export function LightBackground() {
  return (
    <div style={row}>
      <Button variant="teal" icon="⧉">결과 복사하기</Button>
      <Button variant="outline" icon="⎙">인쇄하기</Button>
      <Button variant="danger">삭제</Button>
      <Button variant="add" icon="+">경력 추가</Button>
    </div>
  )
}

export function DarkBackground() {
  return (
    <div data-surface="dark" style={{ ...row, padding: 16, background: 'var(--navy-950)' }}>
      <Button variant="mint" icon="→">상담 시작하기</Button>
      <Button variant="ghost">이용 방법 보기</Button>
    </div>
  )
}

export function Sizes() {
  return (
    <div style={row}>
      <Button variant="teal" icon="→">결과 생성하기</Button>
      <Button variant="teal" size="sm">작은 버튼</Button>
    </div>
  )
}

export function DisabledWithReason() {
  return (
    <div style={row}>
      <Button variant="outline" size="sm" icon="▤" disabled disabledReason="상담 이력 저장은 아직 준비 중이에요">
        상담 이력으로 저장
      </Button>
      <Button variant="add" icon="+" disabled>
        최대 6개까지 입력할 수 있어요
      </Button>
    </div>
  )
}
