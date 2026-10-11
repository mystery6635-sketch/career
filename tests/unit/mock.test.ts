import { describe, expect, it, vi } from 'vitest'
import { MAX_LENGTH_RESULT, MOCK_RESULTS } from '../../src/mock/results'
import { PERSONAS, PERSONA_VARIANTS } from '../../src/mock/personas'
import { createMockService, pickResult, SLOW_DELAY_MS } from '../../src/services/ai/mock'
import { draftToRequest, applicantToDraft } from '../../src/state/draft'
import type { ResultPayload } from '@shared/schema'

const request = draftToRequest(applicantToDraft(PERSONAS.P2))
const signal = () => new AbortController().signal

const allResults: [string, ResultPayload][] = [
  ...Object.entries(MOCK_RESULTS),
  ['MAX', MAX_LENGTH_RESULT],
]

describe('Mock 페르소나 (T039)', () => {
  it('페르소나 5개와 변형 4개가 있다', () => {
    expect(Object.keys(PERSONAS)).toHaveLength(5)
    expect(PERSONA_VARIANTS.map((v) => v.id)).toEqual(['P4-b', 'P5-a', 'P5-b', 'P5-c'])
  })

  it('P4-b는 중복 강점, P5-b는 식별 정보 형식, P5-c는 한도 초과이다', () => {
    const [p4b, , p5b, p5c] = PERSONA_VARIANTS
    const s = p4b.input.strengths as string[]
    expect(s[0]).toBe(s[1])
    expect(JSON.stringify(p5b.input)).toMatch(/\d{6}-\d{7}/)
    expect((p5c.input.strengths as string[]).length).toBe(4)
    expect((p5c.input.majors as string[]).length).toBe(7)
    expect((p5c.input.careers as unknown[]).length).toBe(21)
  })
})

describe('Mock 결과 (T040)', () => {
  it.each(allResults)('%s: 직업 3개, 키워드 3개, 안내문 두 줄', (_id, r) => {
    expect(r.jobs).toHaveLength(3)
    expect(r.keywords).toHaveLength(3)
    expect(r.notice).toHaveLength(2)
  })

  it.each(allResults)('%s: 키워드의 strengthIndex는 0,1,2를 한 번씩', (_id, r) => {
    expect(r.keywords.map((k) => k.strengthIndex).sort()).toEqual([0, 1, 2])
  })

  it.each(allResults)('%s: 모든 직업의 연결 입력이 1개 이상이고 키워드는 strength를 포함', (_id, r) => {
    for (const j of r.jobs) expect(j.linkedInputs.length).toBeGreaterThanOrEqual(1)
    for (const k of r.keywords) expect(k.linkedInputs.some((l) => l.field === 'strength')).toBe(true)
  })

  it('경력이 있는 페르소나는 직업 1개 이상이 career를 참조한다(V14)', () => {
    for (const id of ['P2', 'P3', 'P4', 'P5'] as const) {
      const refs = MOCK_RESULTS[id].jobs.flatMap((j) => j.linkedInputs).filter((l) => l.field === 'career')
      expect(refs.length, id).toBeGreaterThan(0)
    }
  })

  it('신규 진입자(P1) 결과에는 career·intern 참조가 없다(V3)', () => {
    const fields = MOCK_RESULTS.P1.jobs.flatMap((j) => j.linkedInputs).map((l) => l.field)
    expect(fields).not.toContain('career')
    expect(fields).not.toContain('intern')
  })

  it('needsConfirmation 문장, 통용 직업명(isStandardName=false), 불일치 안내 키워드가 있다', () => {
    const all = Object.values(MOCK_RESULTS)
    expect(all.every((r) => r.jobs.some((j) => !j.isStandardName))).toBe(true)
    expect(all.every((r) => r.jobs.some((j) => j.checkPoint.needsConfirmation))).toBe(true)
    expect(MOCK_RESULTS.P4.keywords.some((k) => k.mismatchNote)).toBe(true)
    // 객관 항목과 연결된 키워드와 strength만 연결된 키워드가 모두 있다.
    const kinds = MOCK_RESULTS.P4.keywords.map((k) => k.linkedInputs.some((l) => l.field !== 'strength'))
    expect(kinds).toContain(true)
    expect(kinds).toContain(false)
  })

  it.each(allResults.filter(([id]) => id !== 'MAX'))('%s: 수치·부정 표현·연령 표현이 없다', (_id, r) => {
    const text = JSON.stringify({ jobs: r.jobs, keywords: r.keywords.map((k) => ({ ...k, strengthText: '' })) })
    // 입력 값(linkedInputs.value)은 입력 그대로이므로 제외하고 AI 문장만 본다.
    const sentences = [
      ...r.jobs.flatMap((j) => [j.title, j.subtitle, ...j.rationale.map((s) => s.text), j.checkPoint.text]),
      ...r.keywords.flatMap((k) => [k.keyword, ...k.description.map((s) => s.text), k.mismatchNote ?? '']),
    ].join(' ')
    expect(text.length).toBeGreaterThan(0)
    expect(sentences).not.toMatch(/\d+\s*%|\d+\s*만\s*원|취업률|연봉|공고\s*\d+/)
    expect(sentences).not.toMatch(/나이가|중장년|젊|공백|단절|경험이 부족|경력이 없어/)
  })

  it('최대 길이 결과는 문장 120자, 직업명 30자, 연결 항목 6개이다', () => {
    const j = MAX_LENGTH_RESULT.jobs[0]
    expect([...j.title].length).toBe(30)
    expect([...j.subtitle].length).toBe(40)
    expect(j.rationale.every((s) => [...s.text].length === 120)).toBe(true)
    expect(j.linkedInputs).toHaveLength(6)
    expect(MAX_LENGTH_RESULT.keywords[0].description.length).toBe(3)
  })
})

describe('Mock 결과 선택 규칙 (T041)', () => {
  it('?persona=가 있으면 해당 결과', () => {
    expect(pickResult(request, 'P3')).toBe(MOCK_RESULTS.P3)
  })

  it('없으면 첫 번째 강점이 페르소나와 일치하는 결과', () => {
    expect(pickResult(request)).toBe(MOCK_RESULTS.P2)
  })

  it('어느 것도 아니면 P1 결과(임의 입력에도 항상 유효한 결과)', () => {
    expect(pickResult({ ...request, strengths: ['임의', '임의2', '임의3'] })).toBe(MOCK_RESULTS.P1)
  })
})

describe('Mock AI Service 시나리오 (T041)', () => {
  it('ok: 성공 결과', async () => {
    vi.useFakeTimers()
    const p = createMockService('ok').generate(request, { signal: signal() })
    await vi.advanceTimersByTimeAsync(2000)
    expect(await p).toEqual({ ok: true, result: MOCK_RESULTS.P2 })
    vi.useRealTimers()
  })

  it.each([
    ['fail', 'UPSTREAM_FAILED'],
    ['format', 'OUTPUT_INVALID'],
    ['limit', 'RATE_LIMITED'],
  ] as const)('%s → %s', async (scenario, code) => {
    vi.useFakeTimers()
    const p = createMockService(scenario).generate(request, { signal: signal() })
    await vi.advanceTimersByTimeAsync(1000)
    const outcome = await p
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.error.code).toBe(code)
    vi.useRealTimers()
  })

  it('slow: 31초 이상 지연 후 성공', async () => {
    vi.useFakeTimers()
    const p = createMockService('slow').generate(request, { signal: signal() })
    let done = false
    void p.then(() => (done = true))
    await vi.advanceTimersByTimeAsync(SLOW_DELAY_MS - 1)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect((await p).ok).toBe(true)
    vi.useRealTimers()
  })

  it('fail-once: 첫 호출만 실패', async () => {
    vi.useFakeTimers()
    const svc = createMockService('fail-once')
    const first = svc.generate(request, { signal: signal() })
    await vi.advanceTimersByTimeAsync(1000)
    expect((await first).ok).toBe(false)
    const second = svc.generate(request, { signal: signal() })
    await vi.advanceTimersByTimeAsync(2000)
    expect((await second).ok).toBe(true)
    vi.useRealTimers()
  })

  it('timeout: 응답이 없다가 AbortSignal로 중단된다', async () => {
    const controller = new AbortController()
    const p = createMockService('timeout').generate(request, { signal: controller.signal })
    controller.abort()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('지연 중에도 AbortSignal로 중단된다', async () => {
    vi.useFakeTimers()
    const controller = new AbortController()
    const p = createMockService('slow').generate(request, { signal: controller.signal })
    const assertion = expect(p).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
    vi.useRealTimers()
  })
})
