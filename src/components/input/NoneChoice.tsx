import type { ReactNode } from 'react'
import { Checkbox } from '../ui/Checkbox'
import { noneSelectedReason } from '@shared/messages'

interface NoneChoiceProps {
  /** 예: "경력 없음" */
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** 연결된 반복 입력. 선택하면 비활성이 되고 이유가 글자로 보인다. */
  children: (state: { disabled: boolean; disabledReason?: string }) => ReactNode
}

// "없음"은 다른 선택지와 같은 크기의 테두리 박스이며 시각적으로 따로 두드러지지 않는다.
export function NoneChoice({ label, checked, onChange, children }: NoneChoiceProps) {
  return (
    <div>
      <Checkbox label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children({ disabled: checked, disabledReason: checked ? noneSelectedReason(label) : undefined })}
    </div>
  )
}
