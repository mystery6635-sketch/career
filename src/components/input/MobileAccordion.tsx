import { useId, type ReactNode } from 'react'
import { INPUT_PAGE } from '@shared/messages'
import type { SectionStatus } from '../../state/sectionStatus'

interface FormSectionProps {
  id: string
  title: string
  /** "(필수)", "(선택)" 같은 제목 옆 표시 */
  badge: string
  status: SectionStatus
  /** 모바일에서 접이식으로 보일지 */
  accordion: boolean
  open: boolean
  onToggle: () => void
  children: ReactNode
}

const STATE_TEXT: Record<SectionStatus, string> = {
  empty: INPUT_PAGE.sectionState.empty,
  done: INPUT_PAGE.sectionState.done,
  check: INPUT_PAGE.sectionState.check,
  optional: INPUT_PAGE.sectionState.optional,
}

/** 입력 섹션 카드. 모바일에서는 제목이 버튼인 접이식(아코디언)이 된다(design §11). */
export function FormSection({ id, title, badge, status, accordion, open, onToggle, children }: FormSectionProps) {
  const bodyId = useId()
  return (
    <section className="form-section" id={id} aria-labelledby={`${id}-title`}>
      {accordion ? (
        <h2 className="form-section__title" id={`${id}-title`}>
          <button
            type="button"
            className="form-section__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={onToggle}
          >
            <span>
              {title} <span className="form-section__badge">{badge}</span>
            </span>
            <span className="form-section__state" data-status={status}>
              {STATE_TEXT[status]}
            </span>
            <span aria-hidden="true" className="form-section__arrow" data-open={open}>
              ▾
            </span>
          </button>
        </h2>
      ) : (
        <h2 className="form-section__title" id={`${id}-title`}>
          {title} <span className="form-section__badge">{badge}</span>
        </h2>
      )}
      <div className="form-section__body" id={bodyId} hidden={accordion && !open}>
        {children}
      </div>
    </section>
  )
}
