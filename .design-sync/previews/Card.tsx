import { Card } from 'initial-counseling-helper'

const grid = { display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' } as const

export function Default() {
  return (
    <div style={grid}>
      <Card>
        <strong>기본 카드</strong>
        <p style={{ marginTop: 8 }}>흰 배경, 1px 테두리, 그림자 없음.</p>
      </Card>
      <Card variant="inset">
        <strong>안쪽 카드</strong>
        <p style={{ marginTop: 8 }}>영역 A 안의 직업 카드처럼 연회색 배경을 씁니다.</p>
      </Card>
    </div>
  )
}

export function AreaAandB() {
  return (
    <div style={grid}>
      <Card variant="areaA">
        <h3 style={{ fontSize: 24, fontWeight: 700 }}>취업 가능성이 높은 추천 직업 3개</h3>
        <p style={{ marginTop: 8 }}>위쪽 틸 선과 A 칩으로 구분합니다.</p>
      </Card>
      <Card variant="areaB">
        <h3 style={{ fontSize: 24, fontWeight: 700 }}>자기소개서 키워드 3개</h3>
        <p style={{ marginTop: 8 }}>청회색 배경, 위쪽 네이비 선, B 칩으로 구분합니다.</p>
      </Card>
    </div>
  )
}
