import { AI_TRANSMISSION_NOTICE, MAIN, NOTICE_LINES, PRIVACY_NOTICE } from '@shared/messages'
import { ButtonLink } from '../ui/Button'

export function NoticeSection() {
  return (
    <section className="section" aria-labelledby="notice-title">
      <div className="section__inner">
        <h2 className="section__title" id="notice-title">
          {MAIN.noticeTitle}
        </h2>
        <div className="notice-box">
          {NOTICE_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <p className="notice-privacy">{PRIVACY_NOTICE}</p>
        <p className="notice-privacy">{AI_TRANSMISSION_NOTICE}</p>
        <div className="notice-cta">
          <ButtonLink to="/input" variant="teal" icon="→">
            {MAIN.startCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
