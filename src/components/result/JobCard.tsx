import { RESULT_PAGE } from '@shared/messages'
import type { ResultJob } from '@shared/types'
import { StandardNameBadge } from '../ui/Badge'
import { Tag } from '../ui/Tag'
import { ConfirmNeeded, Sentences } from './ConfirmNeeded'
import { Label } from './Label'

export function JobCard({ job, index }: { job: ResultJob; index: number }) {
  const t = RESULT_PAGE
  return (
    <article className="item-card job-card print-box" aria-label={`${t.job.label} ${index + 1}: ${job.title}`}>
      <p className="item-card__no">
        {t.job.label} {index + 1}
      </p>
      <h3 className="item-card__title">
        {job.title} <span className="item-card__sub">{job.subtitle}</span>
      </h3>
      {job.isStandardName ? null : (
        <p className="item-card__badge">
          <StandardNameBadge />
        </p>
      )}
      <div className="field-block">
        <Label screen={t.job.rationale} print={t.print.rationale} />
        <Sentences list={job.rationale} />
      </div>
      <div className="field-block">
        <Label screen={t.job.linked} print={t.print.linked} />
        <ul className="tag-list">
          {job.linkedInputs.map((l, i) => (
            <li key={i}>
              <Tag name={l.label} value={l.value} />
            </li>
          ))}
        </ul>
      </div>
      <div className="check-point">
        <Label screen={t.job.checkPoint} print={t.print.checkPoint} />
        <p className="sentences">
          <ConfirmNeeded sentence={job.checkPoint} />
        </p>
      </div>
    </article>
  )
}
