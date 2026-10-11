import * as React from 'react'
import { Input } from 'initial-counseling-helper'

const stack = { display: 'grid', gap: 22, maxWidth: 520 } as const

export function Default() {
  const [value, setValue] = React.useState('식품영양학')
  return (
    <div style={stack}>
      <Input
        label="전공"
        required={false}
        hint="고졸 이하는 비워 두어도 됩니다"
        maxLength={100}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  )
}

export function Required() {
  return (
    <div style={stack}>
      <Input
        label="나이"
        required
        hint="숫자만 입력해 주세요. 15~99 사이의 숫자를 입력할 수 있어요. 나이는 추천 결과를 만드는 데 사용되지 않아요."
        inputMode="numeric"
        maxLength={3}
        value="29"
        onChange={() => {}}
      />
    </div>
  )
}

export function ErrorState() {
  return (
    <div style={stack}>
      <Input label="나이" required maxLength={3} value="서른" onChange={() => {}} error="나이를 숫자로 입력해 주세요." />
    </div>
  )
}

export function WarningState() {
  return (
    <div style={stack}>
      <Input
        label="강점 2"
        required
        maxLength={100}
        value="성실함"
        onChange={() => {}}
        warning="강점 2가 강점 1과 같아요. 서로 다른 강점을 적어 주세요."
      />
    </div>
  )
}

export function AtMaxLength() {
  return (
    <div style={stack}>
      <Input label="기간" required maxLength={6} value="1년 6개월" onChange={() => {}} />
    </div>
  )
}
