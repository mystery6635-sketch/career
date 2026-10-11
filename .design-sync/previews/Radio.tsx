import * as React from 'react'
import { Radio } from 'initial-counseling-helper'

export function InternChoice() {
  const [has, setHas] = React.useState(true)
  return (
    <div role="radiogroup" aria-label="인턴 경험" style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <Radio name="intern-preview" label="인턴 경험 있음" checked={has} onChange={() => setHas(true)} />
      <Radio name="intern-preview" label="인턴 경험 없음" checked={!has} onChange={() => setHas(false)} />
    </div>
  )
}

export function Disabled() {
  return (
    <div style={{ maxWidth: 420 }}>
      <Radio name="disabled-preview" label="선택할 수 없는 항목" disabled />
    </div>
  )
}
