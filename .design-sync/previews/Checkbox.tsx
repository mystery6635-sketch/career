import * as React from 'react'
import { Checkbox } from 'initial-counseling-helper'

export function NoneChoices() {
  const [none, setNone] = React.useState(true)
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <Checkbox label="자격증 없음" checked={none} onChange={(e) => setNone(e.target.checked)} />
      <Checkbox label="교육이수 없음" checked={false} onChange={() => {}} />
    </div>
  )
}

export function Disabled() {
  return (
    <div style={{ maxWidth: 420 }}>
      <Checkbox label="경력 없음" disabled />
    </div>
  )
}
