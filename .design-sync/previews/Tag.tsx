import { Tag } from 'initial-counseling-helper'

export function LinkedInputs() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      <Tag name="전공" value="식품영양학" />
      <Tag name="자격증" value="위생사" />
      <Tag name="경력" value="매장 직원 · 카페 · 1년 6개월" />
    </div>
  )
}

export function Single() {
  return <Tag name="강점" value="사람들과 잘 지낸다" />
}
