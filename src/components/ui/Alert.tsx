import type { AriaRole, HTMLAttributes, ReactNode } from 'react'

export type AlertVariant = 'info' | 'warning' | 'error' | 'success'

const ICON: Record<AlertVariant, string> = { info: 'i', warning: '!', error: '✕', success: '✓' }

interface AlertProps {
  variant: AlertVariant
  title?: string
  children: ReactNode
  /**
   * 낭독기에 스스로 알릴지. 기본값 true: 오류는 role=alert(즉시), 나머지는 role=status(차분히)(design §22).
   * 이미 aria-live 영역 안에 놓이는 경우(예: 복사 알림)에는 false로 두어 이중 낭독을 막는다.
   */
  announce?: boolean
}

export function Alert({ variant, title, children, announce = true }: AlertProps) {
  const isError = variant === 'error'
  const live: { role?: AriaRole; 'aria-live'?: HTMLAttributes<HTMLDivElement>['aria-live'] } = announce
    ? { role: isError ? 'alert' : 'status', 'aria-live': isError ? 'assertive' : 'polite' }
    : {}
  return (
    <div className="alert" data-variant={variant} {...live}>
      <span className="alert__icon" aria-hidden="true">
        {ICON[variant]}
      </span>
      <div>
        {title ? <p className="alert__title">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  )
}
