import * as React from 'react'
import { Textarea } from 'initial-counseling-helper'

const stack = { display: 'grid', gap: 22, maxWidth: 520 } as const

export function Default() {
  const [value, setValue] = React.useState('주 3일 병원 원무과에서 접수와 수납 업무를 보조했습니다.')
  return (
    <div style={stack}>
      <Textarea label="인턴 내용" required maxLength={400} value={value} onChange={(e) => setValue(e.target.value)} />
    </div>
  )
}

export function Empty() {
  return (
    <div style={stack}>
      <Textarea label="인턴 내용" required maxLength={400} value="" onChange={() => {}} />
    </div>
  )
}

export function ErrorState() {
  return (
    <div style={stack}>
      <Textarea label="인턴 내용" required maxLength={400} value="" onChange={() => {}} error="인턴 내용을 입력해 주세요." />
    </div>
  )
}
