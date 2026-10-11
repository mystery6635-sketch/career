import { NeedsConfirmBadge } from 'initial-counseling-helper'

export function Default() {
  return <NeedsConfirmBadge />
}

export function BesideSentence() {
  return (
    <div
      style={{
        display: 'inline-block',
        maxWidth: 480,
        padding: '6px 10px',
        background: 'var(--need-bg)',
        border: '1.5px dashed var(--need-bd)',
        borderRadius: 4,
        color: 'var(--need-ink)',
      }}
    >
      <span style={{ marginRight: 6 }}>
        <NeedsConfirmBadge />
      </span>
      실제 담당 업무의 범위와 필요한 자격은 확인이 필요해요.
    </div>
  )
}
