// T079 생성 요청, T080 출력, T081 API 오류 스키마 단위 테스트.
import { describe, expect, it } from 'vitest'
import {
  API_ERROR_CODES,
  ApiErrorSchema,
  GenerateRequestSchema,
  GenerateResponseSchema,
  ModelOutputSchema,
  ResultPayloadSchema,
} from '../../shared/schema'
import { validModelOutput, validRequest } from '../contract/fixtures'

describe('GenerateRequest (T079)', () => {
  it('정상 요청을 통과시킨다', () => {
    expect(GenerateRequestSchema.safeParse(validRequest()).success).toBe(true)
  })

  it.each([['age', 34], ['name', '가상'], ['phone', '010'], ['noCertifications', false], ['noTrainings', true]])(
    '%s 필드가 있으면 거부한다',
    (key, value) => {
      expect(GenerateRequestSchema.safeParse({ ...validRequest(), [key]: value }).success).toBe(false)
    },
  )

  it('중첩 객체의 모르는 필드도 거부한다', () => {
    const r = validRequest()
    expect(GenerateRequestSchema.safeParse({ ...r, education: { ...r.education, extra: 1 } }).success).toBe(false)
  })
})

const sentence = { text: '문장이에요.', needsConfirmation: false }

describe('ModelOutput (T080)', () => {
  it('정상 출력을 통과시킨다', () => {
    expect(ModelOutputSchema.safeParse(validModelOutput()).success).toBe(true)
  })

  it.each([2, 4])('직업이 %i개이면 거부한다', (n) => {
    const out = validModelOutput()
    const jobs = Array.from({ length: n }, (_, i) => out.jobs[i % 3])
    expect(ModelOutputSchema.safeParse({ ...out, jobs }).success).toBe(false)
  })

  it.each([2, 4])('키워드가 %i개이면 거부한다', (n) => {
    const out = validModelOutput()
    const keywords = Array.from({ length: n }, (_, i) => out.keywords[i % 3])
    expect(ModelOutputSchema.safeParse({ ...out, keywords }).success).toBe(false)
  })

  const withJob = (patch: Record<string, unknown>) => {
    const out = validModelOutput()
    out.jobs[0] = { ...out.jobs[0], ...patch } as (typeof out.jobs)[0]
    return ModelOutputSchema.safeParse(out).success
  }
  const withKeyword = (patch: Record<string, unknown>) => {
    const out = validModelOutput()
    out.keywords[0] = { ...out.keywords[0], ...patch } as (typeof out.keywords)[0]
    return ModelOutputSchema.safeParse(out).success
  }

  it('길이와 개수 한도', () => {
    expect(withJob({ title: '가'.repeat(30) })).toBe(true)
    expect(withJob({ title: '가'.repeat(31) })).toBe(false)
    expect(withJob({ subtitle: '가'.repeat(41) })).toBe(false)
    expect(withJob({ rationale: [] })).toBe(false)
    expect(withJob({ rationale: [sentence, sentence, sentence] })).toBe(true)
    expect(withJob({ rationale: [sentence, sentence, sentence, sentence] })).toBe(false)
    expect(withJob({ rationale: [{ text: '가'.repeat(120), needsConfirmation: false }] })).toBe(true)
    expect(withJob({ rationale: [{ text: '가'.repeat(121), needsConfirmation: false }] })).toBe(false)
    expect(withJob({ linkedInputs: [] })).toBe(false)
    expect(withJob({ linkedInputs: Array.from({ length: 7 }, () => ({ field: 'education' })) })).toBe(false)
    expect(withKeyword({ keyword: '가'.repeat(21) })).toBe(false)
    expect(withKeyword({ description: [sentence] })).toBe(false)
    expect(withKeyword({ description: [sentence, sentence, sentence, sentence] })).toBe(false)
    expect(withKeyword({ strengthIndex: 3 })).toBe(false)
    expect(withKeyword({ linkedJobIndex: 3 })).toBe(false)
    expect(withKeyword({ mismatchNote: undefined })).toBe(false)
    expect(withKeyword({ linkedInputs: [{ field: 'unknown', index: 0 }] })).toBe(false)
  })
})

describe('ResultPayload (T080)', () => {
  it('표시용 값이 붙은 결과를 통과시키고 notice 두 줄이 필수다', () => {
    const out = validModelOutput()
    const link = { field: 'major', index: 0, label: '전공', value: '사회복지학' }
    const payload = {
      jobs: out.jobs.map((j) => ({ ...j, linkedInputs: [link] })),
      keywords: out.keywords.map((k) => ({ ...k, linkedInputs: [link], strengthText: '강점', linkedJobTitle: '직업' })),
      notice: ['1', '2'],
      generatedAt: new Date().toISOString(),
    }
    expect(ResultPayloadSchema.safeParse(payload).success).toBe(true)
    expect(ResultPayloadSchema.safeParse({ ...payload, notice: ['1'] }).success).toBe(false)
  })
})

describe('ApiError (T081)', () => {
  it('오류 코드는 API 3절의 7개다', () => {
    expect([...API_ERROR_CODES].sort()).toEqual(
      ['INTERNAL', 'OUTPUT_INVALID', 'PII_DETECTED', 'RATE_LIMITED', 'TIMEOUT', 'UPSTREAM_FAILED', 'VALIDATION_FAILED'].sort(),
    )
  })

  it('형식 검증', () => {
    const error = { code: 'RATE_LIMITED', message: '문구', retryAfterSeconds: 60, details: [{ path: ['strengths', 1], rule: 'required' }], requestId: 'r_1' }
    expect(ApiErrorSchema.safeParse(error).success).toBe(true)
    expect(ApiErrorSchema.safeParse({ ...error, code: 'NOPE' }).success).toBe(false)
    expect(ApiErrorSchema.safeParse({ ...error, requestId: undefined }).success).toBe(false)
  })

  it('성공·실패 응답 유니온', () => {
    expect(GenerateResponseSchema.safeParse({ ok: false, error: { code: 'INTERNAL', message: 'm', requestId: 'r' } }).success).toBe(true)
    expect(GenerateResponseSchema.safeParse({ ok: true }).success).toBe(false)
    expect(GenerateResponseSchema.safeParse({ ok: 'x' }).success).toBe(false)
  })
})
