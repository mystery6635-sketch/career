import { StandardNameBadge } from 'initial-counseling-helper'

export function Default() {
  return <StandardNameBadge />
}

export function UnderJobTitle() {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ fontSize: 24, fontWeight: 700 }}>
        급식 · 식단 관리 담당 <span style={{ display: 'block', fontSize: 15.5, fontWeight: 400, color: 'var(--muted)' }}>식단 구성 · 급식 운영 지원</span>
      </div>
      <div>
        <StandardNameBadge />
      </div>
    </div>
  )
}
