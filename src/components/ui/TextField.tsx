import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Field, type FieldProps } from './Field'

type Shared = Pick<FieldProps, 'label' | 'required' | 'hint' | 'error' | 'warning' | 'hideLabel'> & {
  value: string
  maxLength?: number
}

type InputVariant = Shared & { as?: 'input' } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'maxLength' | 'children'>
type TextareaVariant = Shared & { as: 'textarea' } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'maxLength' | 'children'>

export type TextFieldProps = InputVariant | TextareaVariant

/** Input과 Textarea의 공통 구현: 라벨·힌트·글자 수·오류·경고 연결은 Field가, 입력 요소 선택만 여기서 한다. */
export function TextField(props: TextFieldProps) {
  const { as = 'input', label, required, hint, error, warning, hideLabel, maxLength, value, ...rest } = props
  return (
    <Field
      label={label}
      required={required}
      hint={hint}
      error={error}
      warning={warning}
      hideLabel={hideLabel}
      count={maxLength ? { current: [...value].length, max: maxLength } : undefined}
    >
      {(p) =>
        as === 'textarea' ? (
          <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} {...p} className="control" value={value} maxLength={maxLength} />
        ) : (
          <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} {...p} className="control" value={value} maxLength={maxLength} />
        )
      }
    </Field>
  )
}
