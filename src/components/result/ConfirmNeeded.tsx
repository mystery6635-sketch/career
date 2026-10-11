import { Fragment } from 'react'
import { RESULT_PAGE } from '@shared/messages'
import type { Sentence } from '@shared/types'
import { NeedsConfirmBadge } from '../ui/Badge'

// needsConfirmation 문장은 노란 점선 상자 + "? 확인 필요" 배지로 감싼다(design §13.5).
// 인쇄에서는 배지 대신 "[확인 필요]" 글자 + 왼쪽 이중선 + 이탤릭으로 보인다(print.css).
export function ConfirmNeeded({ sentence }: { sentence: Sentence }) {
  if (!sentence.needsConfirmation) return <span className="sentence">{sentence.text}</span>
  return (
    <span className="confirm sentence">
      <span className="confirm__badge">
        <NeedsConfirmBadge />
      </span>
      <span className="confirm__print">{RESULT_PAGE.print.confirmTag} </span>
      <span className="confirm__text">{sentence.text}</span>
    </span>
  )
}

export function Sentences({ list }: { list: Sentence[] }) {
  return (
    <p className="sentences">
      {list.map((s, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          <ConfirmNeeded sentence={s} />
        </Fragment>
      ))}
    </p>
  )
}
