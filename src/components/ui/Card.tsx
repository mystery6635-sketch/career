import type { ReactNode } from 'react'
import { COMMON } from '@shared/messages'

interface CardProps {
  variant?: 'default' | 'inset' | 'areaA' | 'areaB'
  as?: 'div' | 'section' | 'article'
  children: ReactNode
}

// 그림자 없음. 영역 A/B는 윗선 색과 함께 칩 글자(A/B)로도 구분한다.
export function Card({ variant = 'default', as: Tag = 'div', children }: CardProps) {
  const chip = variant === 'areaA' ? COMMON.chipA : variant === 'areaB' ? COMMON.chipB : null
  return (
    <Tag className="card" data-variant={variant}>
      {chip ? (
        <span className="card__chip" aria-hidden="true">
          {chip}
        </span>
      ) : null}
      {children}
    </Tag>
  )
}
