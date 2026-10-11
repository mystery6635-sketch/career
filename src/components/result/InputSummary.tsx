import { INPUT_PAGE, RESULT_PAGE } from '@shared/messages'
import type { InputDraft } from '../../state/draft'

const filled = (v: string) => v.trim().length > 0

export function summarize(d: InputDraft): { label: string; value: string }[] {
  const s = RESULT_PAGE.summary
  const levelLabel = INPUT_PAGE.levelOptions.find((o) => o.value === d.level)?.label
  const statusLabel = INPUT_PAGE.statusOptions.find((o) => o.value === d.status)?.label
  const careers = d.noCareer
    ? s.none
    : d.careers
        .filter((c) => filled(c.jobTitle) || filled(c.industry) || filled(c.period))
        .map((c) => `${c.jobTitle} · ${c.industry} · ${c.period}`)
        .join(' / ')
  const trainings = d.noTrainings
    ? s.none
    : d.trainings
        .filter((t) => filled(t.courseName) || filled(t.period))
        .map((t) => `${t.courseName} · ${t.period}`)
        .join(' / ')
  const certifications = d.noCertifications ? s.none : d.certifications.filter(filled).join(', ')
  const intern =
    d.internHas === null ? '' : d.internHas ? `있음 · ${d.internContent} (${d.internPeriod})` : '없음'
  return [
    { label: s.age, value: d.age },
    { label: s.education, value: [levelLabel, statusLabel].filter(Boolean).join(' ') },
    { label: s.majors, value: d.majors.filter(filled).join(', ') },
    { label: s.careers, value: careers },
    { label: s.intern, value: intern },
    { label: s.certifications, value: certifications },
    { label: s.trainings, value: trainings },
    ...d.strengths.map((v, i) => ({ label: `${s.strengths} ${i + 1}`, value: v })),
  ].map((row) => ({ ...row, value: row.value || s.empty }))
}

// 접었다 펼칠 수 있는 입력 정보 요약(기본 접힘). 인쇄에는 포함하지 않는다.
export function InputSummary({ input }: { input: InputDraft }) {
  return (
    <details className="input-summary no-print">
      <summary className="input-summary__toggle">{RESULT_PAGE.summary.title}</summary>
      <dl className="input-summary__list">
        {summarize(input).map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
