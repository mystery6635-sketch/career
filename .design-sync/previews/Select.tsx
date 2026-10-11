import * as React from 'react'
import { Select } from 'initial-counseling-helper'

const stack = { display: 'grid', gap: 22, maxWidth: 520 } as const
const levels = [
  { value: 'highschool_or_below', label: '고졸 이하' },
  { value: 'college', label: '전문대' },
  { value: 'bachelor', label: '대졸' },
  { value: 'master', label: '석사' },
  { value: 'doctor', label: '박사' },
]

export function Empty() {
  return (
    <div style={stack}>
      <Select label="최종학력" required placeholder="선택해 주세요" options={levels} value="" onChange={() => {}} />
    </div>
  )
}

export function Selected() {
  const [value, setValue] = React.useState('bachelor')
  return (
    <div style={stack}>
      <Select label="최종학력" required placeholder="선택해 주세요" options={levels} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  )
}

export function ErrorState() {
  return (
    <div style={stack}>
      <Select label="학력 상태" required placeholder="선택해 주세요" options={[{ value: 'graduated', label: '졸업' }, { value: 'enrolled', label: '재학' }]} value="" onChange={() => {}} error="학력 상태를 선택해 주세요." />
    </div>
  )
}
