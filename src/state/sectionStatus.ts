import type { InputDraft } from './draft'

export type SectionStatus = 'empty' | 'done' | 'check' | 'optional'

export interface SectionInfo {
  required: boolean
  status: SectionStatus
}

const has = (v: string) => v.trim().length > 0

/** 입력 섹션 5개의 상태(design §11). 'check'(! 확인 필요)는 Phase 5의 검증 결과에서 정한다. */
export function sectionInfos(d: InputDraft): SectionInfo[] {
  const basic = has(d.age) && d.level !== '' && d.status !== ''
  const career = d.noCareer || d.careers.some((c) => has(c.jobTitle) && has(c.industry) && has(c.period))
  const intern = d.internHas === false || (d.internHas === true && has(d.internContent) && has(d.internPeriod))
  const strengths = d.strengths.every(has)
  const certTrainingDone =
    d.noCertifications ||
    d.noTrainings ||
    d.certifications.some(has) ||
    d.trainings.some((t) => has(t.courseName) || has(t.period))

  const done = (ok: boolean): SectionStatus => (ok ? 'done' : 'empty')
  return [
    { required: true, status: done(basic) },
    { required: true, status: done(career) },
    { required: true, status: done(intern) },
    { required: false, status: certTrainingDone ? 'done' : 'optional' },
    { required: true, status: done(strengths) },
  ]
}

export function requiredDoneCount(d: InputDraft): { done: number; total: number } {
  const required = sectionInfos(d).filter((s) => s.required)
  return { done: required.filter((s) => s.status === 'done').length, total: required.length }
}
