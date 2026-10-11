import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { COMMON, maxItemsReached } from '@shared/messages'

interface RepeatableRowsProps<T> {
  /** 행 번호 라벨의 앞부분. 예: "경력" → "경력 1" */
  rowLabel: string
  addLabel: string
  items: T[]
  onChange: (items: T[]) => void
  createEmpty: () => T
  max: number
  renderRow: (item: T, index: number, update: (next: T) => void) => ReactNode
  /** 외부(없음 선택)에서 비활성화할 때 이유를 글자로 보인다. */
  disabled?: boolean
  disabledReason?: string
}

// 값은 부모가 관리하는 제어 컴포넌트이다.
export function RepeatableRows<T>({
  rowLabel,
  addLabel,
  items,
  onChange,
  createEmpty,
  max,
  renderRow,
  disabled = false,
  disabledReason,
}: RepeatableRowsProps<T>) {
  const atMax = items.length >= max
  const only = items.length <= 1

  const update = (index: number, next: T) => onChange(items.map((it, i) => (i === index ? next : it)))
  const remove = (index: number) =>
    onChange(only ? [createEmpty()] : items.filter((_, i) => i !== index))

  return (
    <fieldset className="reset" disabled={disabled}>
      <div className="rows" data-disabled={disabled}>
        {disabled && disabledReason ? <p className="rows__reason">{disabledReason}</p> : null}
        {items.map((item, index) => (
          <div className="rows__row" key={index}>
            <div className="rows__head">
              <span className="rows__label">
                {rowLabel} {index + 1}
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => remove(index)}
                aria-label={`${rowLabel} ${index + 1} ${only ? COMMON.clear : COMMON.remove}`}
              >
                {only ? COMMON.clear : COMMON.remove}
              </Button>
            </div>
            {renderRow(item, index, (next) => update(index, next))}
          </div>
        ))}
        <Button
          variant="add"
          onClick={() => onChange([...items, createEmpty()])}
          disabled={atMax}
          icon="+"
        >
          {atMax ? maxItemsReached(max) : addLabel}
        </Button>
      </div>
    </fieldset>
  )
}
