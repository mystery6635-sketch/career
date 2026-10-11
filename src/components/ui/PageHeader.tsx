import type { Ref } from 'react'

interface PageHeaderProps {
  kicker: string
  title: string
  subtitle?: string
  /** 화면 전환 시 H1이 포커스를 받도록 useRouteFocus가 돌려준 ref를 넘긴다(design §22). */
  headingRef?: Ref<HTMLHeadingElement>
}

export function PageHeader({ kicker, title, subtitle, headingRef }: PageHeaderProps) {
  return (
    <div className="page-header">
      <p className="page-header__kicker">{kicker}</p>
      <h1 className="page-header__title" tabIndex={-1} ref={headingRef}>
        {title}
      </h1>
      {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
    </div>
  )
}
