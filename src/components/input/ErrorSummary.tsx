import { useEffect, useRef } from 'react'
import { errorSummaryTitle } from '@shared/messages'
import type { SummaryItem } from '../../state/validation'

interface ErrorSummaryProps {
  items: SummaryItem[]
  /** 값이 바뀔 때마다(제출할 때마다) 요약이 포커스를 받는다. */
  focusTick: number
  onJump: (item: SummaryItem) => void
}

/** 오류 요약(design §12): role=alert, 제출 시 포커스, 항목은 "라벨: 메시지" 링크. 항목이 없으면 그리지 않는다. */
export function ErrorSummary({ items, focusTick, onJump }: ErrorSummaryProps) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (focusTick > 0) box.current?.focus()
  }, [focusTick])

  if (items.length === 0) return null
  return (
    <div className="error-summary" role="alert" tabIndex={-1} ref={box}>
      <h2 className="error-summary__title">{errorSummaryTitle(items.length)}</h2>
      <ul className="error-summary__list">
        {items.map((item) => (
          <li key={item.key}>
            <a
              className="error-summary__link"
              href={`#${item.key}`}
              onClick={(e) => {
                e.preventDefault()
                onJump(item)
              }}
            >
              <span>
                <strong>{item.label}</strong>: {item.message}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
