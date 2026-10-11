import { FOOTER_NOTICE } from '@shared/messages'

export function Footer() {
  return (
    <footer className="footer">
      <div className="section__inner">
        <p>{FOOTER_NOTICE}</p>
      </div>
    </footer>
  )
}
