// 출력 의미 검증(T097, data-model 5절). Zod 구조 검증 뒤 V1~V15를 검사한다.
// 실패하면 규칙 번호만 돌려준다. 모델 응답 본문과 입력 값은 반환하지도 기록하지도 않는다.
import { ModelOutputSchema, type ModelOutput } from '../../shared/schema/output.js'
import type { GenerateRequest } from '../../shared/schema/request.js'
import { findBannedRules } from './banned-phrases.js'

export type RuleId = `V${number}` | 'SCHEMA'

export const RULE_DESCRIPTIONS: Record<string, string> = {
  V1: '추천 직업과 키워드는 각각 정확히 3개',
  V2: '추천 직업명은 서로 달라야 함',
  V3: '근거로 지목한 입력 항목과 번호는 실제 입력에 있어야 함',
  V4: '모든 항목은 입력 항목 1개 이상과 연결하고 키워드는 강점을 포함',
  V5: '키워드의 강점 번호는 0, 1, 2를 한 번씩',
  V6: '연결 직업 번호는 0~2',
  V7: '강점만 연결되면 mismatchNote 필수, 객관 항목이 있으면 null',
  V8: '수치·금액·비율 표현 금지',
  V9: '부정·배제 표현 금지',
  V10: '단정 표현 금지',
  V11: '연령·세대 표현 금지',
  V12: '필드 길이 한도',
  V13: 'JSON 객체 하나만 출력',
  V14: '경력이 있으면 직업 1개 이상 경력과 연결',
  V15: '문장 수와 문장 길이 한도',
  SCHEMA: 'JSON 구조와 필드 형식',
}

export type ValidationResult = { ok: true; output: ModelOutput } | { ok: false; rules: RuleId[] }

/** V13: 코드 블록 표시만 벗기고 JSON으로 파싱한다. 그 밖의 텍스트가 있으면 실패. */
export function parseModelText(text: string): { ok: true; value: unknown } | { ok: false } {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```$/, '')
    .trim()
  if (!stripped.startsWith('{') || !stripped.endsWith('}')) return { ok: false }
  try {
    return { ok: true, value: JSON.parse(stripped) as unknown }
  } catch {
    return { ok: false }
  }
}

function ruleFromIssue(path: PropertyKey[], code: string): RuleId {
  const last = path[path.length - 1]
  const root = path[0]
  if (last === 'strengthIndex') return 'V5'
  if (last === 'linkedJobIndex') return 'V6'
  if (last === 'linkedInputs') return 'V4'
  if (last === 'rationale' || last === 'description') return 'V15'
  if (last === 'text') return 'V15'
  if ((root === 'jobs' || root === 'keywords') && path.length === 1) return 'V1'
  if (code === 'too_big' || code === 'too_small') return 'V12'
  return 'SCHEMA'
}

const normTitle = (s: string) => s.replace(/\s+/g, '').toLowerCase()

/** 입력에서 그대로 인용된 부분을 숫자 검사에서 빼기 위한 입력 문자열 조각들. */
export function collectQuotes(request: GenerateRequest): string[] {
  return [
    ...request.majors,
    ...request.careers.flatMap((c) => [c.jobTitle, c.industry, c.period]),
    ...(request.intern.has ? [request.intern.content ?? '', request.intern.period ?? ''] : []),
    ...request.certifications,
    ...request.trainings.flatMap((t) => [t.courseName, t.period]),
    ...request.strengths,
  ].filter((s) => s.length > 0)
}

function refExists(request: GenerateRequest, ref: { field: string; index?: number }): boolean {
  const inRange = (n: number) => ref.index !== undefined && ref.index < n
  switch (ref.field) {
    case 'education':
      return true
    case 'major':
      return inRange(request.majors.length)
    case 'career':
      return !request.noCareer && inRange(request.careers.length)
    case 'intern':
      return request.intern.has
    case 'certification':
      return inRange(request.certifications.length)
    case 'training':
      return inRange(request.trainings.length)
    case 'strength':
      return inRange(request.strengths.length)
    default:
      return false
  }
}

function sentencesOf(output: ModelOutput): string[] {
  const texts: string[] = []
  for (const job of output.jobs) {
    texts.push(job.title, job.subtitle, job.checkPoint.text, ...job.rationale.map((s) => s.text))
  }
  for (const kw of output.keywords) {
    texts.push(kw.keyword, ...kw.description.map((s) => s.text))
    if (kw.mismatchNote) texts.push(kw.mismatchNote)
  }
  return texts
}

function sortRules(rules: Set<RuleId>): RuleId[] {
  const num = (r: RuleId) => (r === 'SCHEMA' ? 99 : Number(r.slice(1)))
  return [...rules].sort((a, b) => num(a) - num(b))
}

/** 모델이 낸 JSON 값을 검증한다. request는 서버가 검증한 실제 입력이다. */
export function validateOutput(raw: unknown, request: GenerateRequest): ValidationResult {
  const rules = new Set<RuleId>()

  // V1은 구조 검증보다 먼저 센다(개수 오류를 규칙 번호로 알리기 위해).
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as { jobs?: unknown; keywords?: unknown }
  if (!Array.isArray(obj.jobs) || obj.jobs.length !== 3 || !Array.isArray(obj.keywords) || obj.keywords.length !== 3) {
    return { ok: false, rules: ['V1'] }
  }

  const parsed = ModelOutputSchema.safeParse(raw)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) rules.add(ruleFromIssue(issue.path, issue.code))
    return { ok: false, rules: sortRules(rules) }
  }
  const output = parsed.data

  // V2
  const titles = output.jobs.map((j) => normTitle(j.title))
  if (new Set(titles).size !== titles.length) rules.add('V2')

  // V3
  const allRefs = [...output.jobs.flatMap((j) => j.linkedInputs), ...output.keywords.flatMap((k) => k.linkedInputs)]
  if (allRefs.some((r) => !refExists(request, r))) rules.add('V3')

  // V4
  if (output.keywords.some((k) => !k.linkedInputs.some((r) => r.field === 'strength'))) rules.add('V4')

  // V5
  if (new Set(output.keywords.map((k) => k.strengthIndex)).size !== 3) rules.add('V5')

  // V7
  for (const k of output.keywords) {
    const hasObjective = k.linkedInputs.some((r) => r.field !== 'strength')
    if (!hasObjective && !k.mismatchNote) rules.add('V7')
    if (hasObjective && k.mismatchNote !== null) rules.add('V7')
  }

  // V8~V11
  const quotes = collectQuotes(request)
  for (const text of sentencesOf(output)) {
    for (const rule of findBannedRules(text, quotes)) rules.add(rule)
  }

  // V14
  if (!request.noCareer && !output.jobs.some((j) => j.linkedInputs.some((r) => r.field === 'career'))) {
    rules.add('V14')
  }

  return rules.size === 0 ? { ok: true, output } : { ok: false, rules: sortRules(rules) }
}
