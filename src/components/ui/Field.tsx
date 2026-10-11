import { useId, type ReactNode } from 'react'
import { COMMON, charCount } from '@shared/messages'

export interface FieldControlProps {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

export interface FieldProps {
  label: string
  /** true=(필수), false=(선택), 생략하면 표시하지 않는다. */
  required?: boolean
  hint?: string
  count?: { current: number; max: number }
  error?: string
  /** 경고(노랑). 오류 요약 개수에 포함하지 않는다(design §12). */
  warning?: string
  /** 라벨을 시각적으로 숨긴다(낭독기에는 남는다). 행 번호 라벨이 따로 있는 반복 입력용. */
  hideLabel?: boolean
  children: (props: FieldControlProps) => ReactNode
}

// 읽는 순서: 라벨 → (필수/선택) → 힌트 → 글자 수 → 오류 (design §22)
export function Field({ label, required, hint, count, error, warning, hideLabel, children }: FieldProps) {
  const uid = useId()
  const id = `${uid}-control`
  const hintId = `${uid}-hint`
  const countId = `${uid}-count`
  const errorId = `${uid}-error`
  const warningId = `${uid}-warning`
  const describedBy =
    [hint && hintId, count && countId, error && errorId, warning && warningId].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className="field">
      <label className={hideLabel ? 'field__label sr-only' : 'field__label'} htmlFor={id}>
        {label}
        {required === undefined ? null : (
          <span className="field__req" data-kind={required ? 'required' : 'optional'}>
            {required ? COMMON.required : COMMON.optional}
          </span>
        )}
      </label>
      {hint ? (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {count ? (
        <p className="field__count" id={countId}>
          {charCount(count.current, count.max)}
        </p>
      ) : null}
      {error ? (
        <p className="field__error" id={errorId}>
          <span className="field__msg-icon" aria-hidden="true">
            <span>✕</span>
          </span>
          <span>{error}</span>
        </p>
      ) : null}
      {warning ? (
        <p className="field__warning" id={warningId}>
          <span className="field__msg-icon" aria-hidden="true">
            <span>!</span>
          </span>
          <span>{warning}</span>
        </p>
      ) : null}
    </div>
  )
}
