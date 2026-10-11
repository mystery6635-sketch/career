import { COMMON, INPUT_PAGE } from '@shared/messages'
import type { SectionInfo, SectionStatus } from '../../state/sectionStatus'

const ICON: Record<SectionStatus, string> = { empty: '○', done: '✓', check: '!', optional: '○' }
const TEXT: Record<SectionStatus, string> = {
  empty: INPUT_PAGE.sectionState.empty,
  done: '입력됨',
  check: '확인 필요',
  optional: INPUT_PAGE.sectionState.optional,
}

// 데스크톱의 왼쪽 목차. 상태는 아이콘과 글자를 함께 쓴다(원칙 XIII).
export function SectionNav({ infos, ids, activeId }: { infos: SectionInfo[]; ids: string[]; activeId?: string }) {
  return (
    <nav className="section-nav" aria-label={INPUT_PAGE.tocLabel}>
      <ol>
        {INPUT_PAGE.sections.map((title, i) => (
          <li key={ids[i]}>
            <a className="section-nav__link" href={`#${ids[i]}`} aria-current={activeId === ids[i] ? 'location' : undefined}>
              <span className="section-nav__icon" data-status={infos[i].status} aria-hidden="true">
                {ICON[infos[i].status]}
              </span>
              <span>
                <span className="section-nav__title">{title}</span>
                <span className="section-nav__meta">
                  {infos[i].required ? COMMON.required : COMMON.optional} · {TEXT[infos[i].status]}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
