// T084 Mock Data가 스키마를 통과하는지 검증한다. 정상 페르소나는 통과하고 비정상 변형은 기대한 이유로 거부된다.
import { describe, expect, it } from 'vitest'
import { ApplicantInputSchema, GenerateRequestSchema, ResultPayloadSchema } from '@shared/schema'
import { findDuplicateStrengths } from '@shared/guard/duplicate-strength'
import { findInjection } from '@shared/guard/injection'
import { findPii } from '@shared/guard/pii'
import { PERSONAS, PERSONA_VARIANTS, type PersonaId } from '../../src/mock/personas'
import { MAX_LENGTH_RESULT, MOCK_RESULTS } from '../../src/mock/results'
import { applicantToDraft, draftToRequest } from '../../src/state/draft'

const ids = Object.keys(PERSONAS) as PersonaId[]
const variant = (id: string) => PERSONA_VARIANTS.find((v) => v.id === id)!.input
const rules = (input: unknown) => {
  const r = ApplicantInputSchema.safeParse(input)
  return r.success ? [] : r.error.issues.map((i) => ({ path: i.path.join('.'), rule: (i as { params?: { rule?: string } }).params?.rule }))
}

describe('페르소나 입력 (T084)', () => {
  it.each(ids)('%s는 ApplicantInput을 통과한다', (id) => {
    expect(ApplicantInputSchema.safeParse(PERSONAS[id]).success).toBe(true)
  })

  it.each(ids)('%s를 폼 상태로 바꿨다가 요청으로 되돌려도 GenerateRequest를 통과한다', (id) => {
    const request = draftToRequest(applicantToDraft(PERSONAS[id]))
    expect(GenerateRequestSchema.safeParse(request).success).toBe(true)
    expect(request).not.toHaveProperty('age')
  })

  it('P4-b: 스키마는 통과하고 강점 중복만 경고 대상이다', () => {
    const input = variant('P4-b') as { strengths: string[] }
    expect(ApplicantInputSchema.safeParse(input).success).toBe(true)
    expect(findDuplicateStrengths(input.strengths)).toEqual([{ index: 1, sameAs: 0 }])
  })

  it('P5-a: 스키마는 통과하고 지시문 형태는 경고 대상이다', () => {
    const input = variant('P5-a') as Parameters<typeof findInjection>[0]
    expect(ApplicantInputSchema.safeParse(input).success).toBe(true)
    expect(findInjection(input).map((h) => h.path.join('.'))).toEqual(
      expect.arrayContaining(['majors.1', 'intern.content', 'strengths.1']),
    )
  })

  it('P5-b: 스키마는 통과하지만 식별 정보 형식이 차단 대상으로 감지된다', () => {
    const input = variant('P5-b') as Parameters<typeof findPii>[0]
    expect(findPii(input).map((h) => `${h.path.join('.')}:${h.kind}`)).toEqual(['majors.0:resident_id', 'strengths.0:phone'])
  })

  it('P5-c: 전공 7개·경력 21개·강점 4개 초과로 거부된다', () => {
    const failed = rules(variant('P5-c')).map((r) => r.path.split('.')[0])
    expect(failed).toEqual(expect.arrayContaining(['majors', 'careers', 'strengths']))
    expect(rules(variant('P5-c')).find((r) => r.path === 'strengths')?.rule).toBe('count')
  })

  it('정상 페르소나의 비정상 변형은 기대한 이유로 거부된다', () => {
    expect(rules({ ...PERSONAS.P1, age: 14 }).map((r) => r.path)).toEqual(['age'])
    expect(rules({ ...PERSONAS.P1, strengths: ['가', '나다', '라마'] })).toEqual([{ path: 'strengths.0', rule: 'too_short' }])
    expect(rules({ ...PERSONAS.P1, careers: [{ jobTitle: '가', industry: '나', period: '다' }] })).toEqual([
      { path: 'careers', rule: 'exclusive' },
    ])
    expect(rules({ ...PERSONAS.P2, intern: { has: true } }).map((r) => r.path)).toEqual(['intern.content', 'intern.period'])
  })
})

describe('Mock 결과 (T084)', () => {
  const all: [string, unknown][] = [...Object.entries(MOCK_RESULTS), ['MAX', MAX_LENGTH_RESULT]]

  it.each(all)('%s는 ResultPayload를 통과한다', (_id, result) => {
    const parsed = ResultPayloadSchema.safeParse(result)
    expect(parsed.error?.issues ?? []).toEqual([])
  })

  it('개수가 2개·4개이면 거부된다', () => {
    const base = MOCK_RESULTS.P1
    expect(ResultPayloadSchema.safeParse({ ...base, jobs: base.jobs.slice(0, 2) }).success).toBe(false)
    expect(ResultPayloadSchema.safeParse({ ...base, keywords: [...base.keywords, base.keywords[0]] }).success).toBe(false)
  })
})
