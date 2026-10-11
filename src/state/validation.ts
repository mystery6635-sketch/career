// 입력 화면 검증(T085~T087). 폼 상태를 shared 스키마와 입력 보호 함수에 통과시켜 항목별 오류·경고로 바꾼다.
// 규칙과 문구는 shared/에만 있고 여기서는 위치(키)와 라벨만 정한다.
import { INPUT_ERRORS, INPUT_PAGE, strengthDuplicate } from '@shared/messages'
import { ApplicantInputSchema, checkCrossFields, type ApiError } from '@shared/schema'
import { findDuplicateStrengths } from '@shared/guard/duplicate-strength'
import { findInjection } from '@shared/guard/injection'
import { findPii } from '@shared/guard/pii'
import type { z } from 'zod'
import type { InputDraft } from './draft'

/** 항목 위치. 예: `age`, `majors.0`, `careers.1.jobTitle`, `intern.has`, `strengths.2`. 입력창의 data-field와 같다. */
export type FieldKey = string

export interface Feedback {
  errors: Record<FieldKey, string>
  warnings: Record<FieldKey, string>
}

export interface SummaryItem {
  key: FieldKey
  label: string
  message: string
  /** 입력 섹션 번호(0~4) */
  section: number
}

export interface ValidationResult extends Feedback {
  items: SummaryItem[]
}

export const NO_FEEDBACK: Feedback = { errors: {}, warnings: {} }

const filled = (v: string) => v.trim().length > 0
const blankRow = (...values: string[]) => values.every((v) => !filled(v))

type ListHead = 'majors' | 'careers' | 'certifications' | 'trainings'

/** 빈 행을 버리면 번호가 밀리므로, 후보 목록의 번호 → 화면 행 번호를 함께 돌려준다. */
function keepFilled<T>(rows: T[], isBlank: (row: T) => boolean) {
  const kept: T[] = []
  const index: number[] = []
  rows.forEach((row, i) => {
    if (!isBlank(row)) {
      kept.push(row)
      index.push(i)
    }
  })
  return { kept, index }
}

/** 폼 상태를 스키마가 받는 모양으로 바꾼다. 빈 행은 버리고, 없음을 고른 반복 입력은 제외한다. */
function toCandidate(d: InputDraft) {
  const age = d.age.trim()
  const majors = keepFilled(d.majors, (v) => !filled(v))
  const careers = d.noCareer ? { kept: [], index: [] } : keepFilled(d.careers, (c) => blankRow(c.jobTitle, c.industry, c.period))
  const certs = d.noCertifications ? { kept: [], index: [] } : keepFilled(d.certifications, (v) => !filled(v))
  const trainings = d.noTrainings ? { kept: [], index: [] } : keepFilled(d.trainings, (t) => blankRow(t.courseName, t.period))
  return {
    value: {
      age: age === '' ? undefined : /^\d+(\.\d+)?$/.test(age) ? Number(age) : Number.NaN,
      education: { level: d.level === '' ? undefined : d.level, status: d.status === '' ? undefined : d.status },
      majors: majors.kept,
      noCareer: d.noCareer,
      careers: careers.kept,
      intern:
        d.internHas === null
          ? { has: undefined }
          : d.internHas
            ? { has: true, content: d.internContent, period: d.internPeriod }
            : { has: false },
      noCertifications: d.noCertifications,
      certifications: certs.kept,
      noTrainings: d.noTrainings,
      trainings: trainings.kept,
      strengths: d.strengths,
    },
    rows: { majors: majors.index, careers: careers.index, certifications: certs.index, trainings: trainings.index } as Record<ListHead, number[]>,
  }
}

const SECTION_OF: Record<string, number> = {
  age: 0, level: 0, status: 0, majors: 0, careers: 1, intern: 2, certifications: 3, trainings: 3, strengths: 4,
}
const ORDER = Object.keys(SECTION_OF)

function sectionOf(key: FieldKey): number {
  return SECTION_OF[key.split('.')[0]] ?? 0
}

function labelOf(key: FieldKey): string {
  const [head, index] = key.split('.')
  const n = Number(index) + 1
  switch (head) {
    case 'age': return INPUT_PAGE.ageLabel
    case 'level': return INPUT_PAGE.levelLabel
    case 'status': return INPUT_PAGE.statusLabel
    case 'majors': return `${INPUT_PAGE.majorLabel} ${n}`
    case 'careers': return index === undefined ? INPUT_PAGE.careerRow : `${INPUT_PAGE.careerRow} ${n}`
    case 'intern': return index === 'content' ? INPUT_PAGE.internContent : index === 'period' ? INPUT_PAGE.internPeriod : INPUT_PAGE.internGroup
    case 'certifications': return `${INPUT_PAGE.certLabel} ${n}`
    case 'trainings': return `${INPUT_PAGE.trainingRow} ${n}`
    case 'strengths': return index === undefined ? INPUT_PAGE.strengthsTitle : `강점 ${n}`
    default: return key
  }
}

/** 오류 요약 한 항목은 입력 행(경력 1, 교육이수 1) 단위다. */
const rowOf = (key: FieldKey) => (/^(careers|trainings)\.\d+\./.test(key) ? key.replace(/^((?:careers|trainings)\.\d+)\..*$/, '$1') : key)

function keyOf(path: PropertyKey[], rows: Record<ListHead, number[]>): FieldKey {
  const [head, second, ...rest] = path
  if (head === 'education') return String(second)
  if (typeof head === 'string' && head in rows && typeof second === 'number') return [head, rows[head as ListHead][second], ...rest].join('.')
  return path.join('.')
}

type Cross = Parameters<typeof checkCrossFields>[0]

export function validateDraft(draft: InputDraft): ValidationResult {
  const { value: candidate, rows } = toCandidate(draft)
  const raw: { key: FieldKey; message: string }[] = []

  const parsed = ApplicantInputSchema.safeParse(candidate)
  if (!parsed.success) raw.push(...parsed.error.issues.map((i) => ({ key: keyOf(i.path, rows), message: i.message })))

  // 스키마는 형식 오류가 있으면 필드 사이 규칙(경력 필수, 인턴 내용·기간)을 건너뛴다. 한 번에 모두 보이도록 직접 돌린다.
  checkCrossFields(candidate as unknown as Cross, {
    addIssue: (issue: { path?: PropertyKey[]; message?: string }) => raw.push({ key: keyOf(issue.path ?? [], rows), message: issue.message ?? '' }),
  } as unknown as z.RefinementCtx)

  for (const hit of findPii(candidate)) {
    raw.push({ key: keyOf(hit.path, rows), message: INPUT_ERRORS.pii })
  }

  const errors: Record<FieldKey, string> = {}
  const seenRows = new Set<string>()
  const ordered = raw
    .filter((r) => r.message !== '')
    .sort((a, b) => ORDER.indexOf(a.key.split('.')[0]) - ORDER.indexOf(b.key.split('.')[0]))
  for (const { key, message } of ordered) {
    const row = `${rowOf(key)}|${message}`
    if (seenRows.has(row) || key in errors) continue
    seenRows.add(row)
    errors[key] = message
  }

  const warnings: Record<FieldKey, string> = {}
  for (const hit of findInjection(candidate)) {
    const key = keyOf(hit.path, rows)
    if (!(key in errors)) warnings[key] = INPUT_ERRORS.injection
  }
  for (const dup of findDuplicateStrengths(draft.strengths)) {
    const key = `strengths.${dup.index}`
    if (!(key in errors)) warnings[key] = strengthDuplicate(dup.index + 1, dup.sameAs + 1)
  }

  const items = Object.entries(errors).map(([key, message]) => ({ key, label: labelOf(key), message, section: sectionOf(key) }))
  return { errors, warnings, items }
}


/**
 * 서버가 돌려준 VALIDATION_FAILED·PII_DETECTED 오류를 입력 화면 오류 항목으로 바꾼다(T108).
 * details가 없으면 첫 입력 항목으로 연결한다. 입력 값은 오류에 들어 있지 않다.
 */
export function serverErrorItems(error: ApiError): SummaryItem[] {
  const message = error.code === 'PII_DETECTED' ? INPUT_ERRORS.pii : INPUT_ERRORS.serverRecheck
  const paths = error.details && error.details.length > 0 ? error.details.map((d) => d.path) : [['age']]
  const seen = new Set<string>()
  const items: SummaryItem[] = []
  for (const path of paths) {
    const [head, second, ...rest] = path
    const key = head === 'education' && second !== undefined ? String(second) : [head, second, ...rest].filter((p) => p !== undefined).join('.')
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ key, label: labelOf(key), message, section: sectionOf(key) })
  }
  return items
}

/** 입력창에 붙이는 공통 속성: 오류·경고 문구와 포커스 이동용 data-field. */
export function fieldProps(feedback: Feedback, key: FieldKey) {
  return { error: feedback.errors[key], warning: feedback.warnings[key], 'data-field': key }
}
