import type { InputHTMLAttributes } from 'react'

export type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }

/**
 * 높이 48px 박스형 선택지. Radio와 Checkbox가 type만 다르므로 한 곳에서 만든다.
 * 선택 상태는 색 외에 체크 표지(✓)로도 보인다(원칙 XIII).
 */
export function Choice({ type, label, ...rest }: ChoiceProps & { type: 'radio' | 'checkbox' }) {
  return (
    <label className="choice">
      <input {...rest} type={type} className="choice__input" />
      <span>{label}</span>
      <span className="choice__mark" aria-hidden="true">
        ✓
      </span>
    </label>
  )
}
