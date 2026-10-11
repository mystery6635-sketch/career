import { ButtonLink } from 'initial-counseling-helper'

export function OnDark() {
  return (
    <div data-surface="dark" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16, background: 'var(--navy-950)' }}>
      <ButtonLink to="/input" variant="mint" icon="→">상담 시작하기</ButtonLink>
      <ButtonLink to="/#flow" variant="ghost">이용 방법 보기</ButtonLink>
    </div>
  )
}

export function OnLight() {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <ButtonLink to="/input" variant="teal" icon="→">상담 시작하기</ButtonLink>
      <ButtonLink to="/result" variant="outline" size="sm">결과 보기</ButtonLink>
    </div>
  )
}
