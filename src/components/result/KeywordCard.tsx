import { RESULT_PAGE } from '@shared/messages'
import type { ResultKeyword } from '@shared/schema'
import { Tag } from '../ui/Tag'
import { Sentences } from './ConfirmNeeded'
import { Label } from './Label'
import { MismatchNote } from './MismatchNote'

export function KeywordCard({ keyword, index }: { keyword: ResultKeyword; index: number }) {
  const t = RESULT_PAGE.keyword
  // 연결된 입력 항목 Tag는 강점을 뺀 객관 항목만 보인다. 없으면 영역을 만들지 않는다(design §13.4, T069 승인 전제).
  const objective = keyword.linkedInputs.filter((l) => l.field !== 'strength')
  return (
    <article className="item-card keyword-card print-box" aria-label={`${t.label} ${index + 1}: ${keyword.keyword}`}>
      <p className="item-card__no">
        {t.label} {index + 1}
        {keyword.mismatchNote ? <span className="reinforce-tag">{t.reinforceTag}</span> : null}
      </p>
      <h3 className="item-card__title">{keyword.keyword}</h3>
      <dl className="def-list">
        <div>
          <dt>{t.strength}</dt>
          <dd>{keyword.strengthText}</dd>
        </div>
        <div>
          <dt>{t.job}</dt>
          <dd>{keyword.linkedJobTitle}</dd>
        </div>
      </dl>
      {objective.length > 0 ? (
        <div className="field-block">
          <Label screen={t.linked} print={RESULT_PAGE.print.linked} />
          <ul className="tag-list">
            {objective.map((l, i) => (
              <li key={i}>
                <Tag name={l.label} value={l.value} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="field-block">
        <Label screen={t.description} print={t.description} />
        <Sentences list={keyword.description} />
      </div>
      {keyword.mismatchNote ? <MismatchNote note={keyword.mismatchNote} /> : null}
    </article>
  )
}
