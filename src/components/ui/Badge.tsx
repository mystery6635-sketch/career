import { needsConfirmLabel, standardNameConfirmLabel } from '@shared/messages'

export type BadgeVariant = 'progress' | 'error' | 'warning' | 'info'

const ICON: Record<BadgeVariant, string> = { progress: '↻', error: '✕', warning: '!', info: 'i' }

// 상태는 색 + 아이콘 칩 + 텍스트를 함께 쓴다(원칙 XIII).
export function Badge({ variant, children }: { variant: BadgeVariant; children: string }) {
  return (
    <span className="badge" data-variant={variant}>
      <span className="badge__chip" aria-hidden="true">
        {ICON[variant]}
      </span>
      <span>{children}</span>
    </span>
  )
}

function ConfirmBadge({ label }: { label: string }) {
  return (
    <span className="badge" data-variant="confirm">
      <span className="badge__chip" aria-hidden="true">
        ?
      </span>
      <span>{label}</span>
    </span>
  )
}

export function NeedsConfirmBadge() {
  return <ConfirmBadge label={needsConfirmLabel} />
}

export function StandardNameBadge() {
  return <ConfirmBadge label={standardNameConfirmLabel} />
}
