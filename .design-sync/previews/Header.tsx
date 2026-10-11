import { Header } from 'initial-counseling-helper'

export function Solid() {
  return <Header variant="solid" />
}

export function OverlayOnHero() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: 160,
        overflow: 'hidden',
        background: 'linear-gradient(160deg, var(--navy-950), var(--navy-900) 55%, var(--hero-bg-end))',
      }}
    >
      <Header variant="overlay" />
    </div>
  )
}
