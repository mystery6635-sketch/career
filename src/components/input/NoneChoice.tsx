import { useId, type ReactNode } from 'react'
import { Checkbox } from '../ui/Checkbox'
import { FieldMessage } from '../ui/Field'
import { noneSelectedReason } from '@shared/messages'

interface NoneChoiceProps {
  /** 예: "경력 없음" */
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** 포커스 이동용 data-field와, 아무것도 고르거나 입력하지 않았을 때의 오류 문구 */
  fieldKey?: string
  error?: string
  /** 연결된 반복 입력. 선택하면 비활성이 되고 이유가 글자로 보인다. */
  children: (state: { disabled: boolean; disabledReason?: string }) => ReactNode
}

// "없음"은 다른 선택지와 같은 크기의 테두리 박스이며 시각적으로 따로 두드러지지 않는다.
export function NoneChoice({ label, checked, onChange, fieldKey, error, children }: NoneChoiceProps) {
  const errorId = `${useId()}-error`
  return (
    <div>
      <Checkbox
        label={label}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-field={fieldKey}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <FieldMessage kind="error" id={errorId}>
          {error}
        </FieldMessage>
      ) : null}
      {children({ disabled: checked, disabledReason: checked ? noneSelectedReason(label) : undefined })}
    </div>
  )
}
