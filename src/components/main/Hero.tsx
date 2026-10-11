import type { Ref } from 'react'
import { AI_TRANSMISSION_NOTICE, MAIN, NOTICE_LINES, PRIVACY_NOTICE } from '@shared/messages'
import { ButtonLink } from '../ui/Button'
import { ResumeFragments } from './ResumeFragments'

// 어두운 배경 위의 첫 화면. 배경은 정적 그라데이션 + 정적 격자이다(design §10).
export function Hero({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  return (
    <section className="hero" data-surface="dark" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__copy">
          <p className="hero__label motion-float-in">{MAIN.kicker}</p>
          <h1 className="hero__title motion-float-in" id="hero-title" tabIndex={-1} ref={headingRef}>
            {MAIN.h1.map((seg, i) =>
              'em' in seg ? (
                <em key={i} className="hero__em">
                  {seg.t}
                </em>
              ) : (
                <span key={i}>{seg.t}</span>
              ),
            )}
          </h1>
          <p className="hero__sub motion-float-in">{MAIN.subtitle}</p>
          <div className="hero__cta motion-float-in">
            <ButtonLink to="/input" variant="mint" icon="→">
              {MAIN.startCta}
            </ButtonLink>
            <ButtonLink to="/#flow" variant="ghost">
              {MAIN.howCta}
            </ButtonLink>
          </div>
          <div className="hero__notice">
            {NOTICE_LINES.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="hero__privacy">
            <span aria-hidden="true">▣</span> {PRIVACY_NOTICE}
          </p>
          <p className="hero__privacy">
            <span aria-hidden="true">▣</span> {AI_TRANSMISSION_NOTICE}
          </p>
        </div>
        <ResumeFragments />
      </div>
    </section>
  )
}
