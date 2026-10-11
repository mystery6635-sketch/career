// T107·T108: HTTP AI 서비스의 응답 검증과 서버 입력 거부 오류의 화면 항목 변환.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MOCK_RESULTS } from '../../src/mock/results'
import { createHttpService } from '../../src/services/ai/http'
import { errorToVariant } from '../../src/state/errorVariant'
import { emptyDraft, draftToRequest } from '../../src/state/draft'
import { serverErrorItems } from '../../src/state/validation'

const request = draftToRequest(emptyDraft())
const signal = new AbortController().signal
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.unstubAllGlobals())

const run = async (response: Response | Error | DOMException) => {
  vi.stubGlobal('fetch', vi.fn(async () => { if (!(response instanceof Response)) throw response; return response }))
  return createHttpService().generate(request, { signal })
}

describe('HTTP AI 서비스 (T107)', () => {
  it('요청 본문에 나이가 없고 /api/generate로 POST한다', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true, result: MOCK_RESULTS.P1 }))
    vi.stubGlobal('fetch', fetchMock)
    await createHttpService().generate(request, { signal })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/generate')
    expect(init.method).toBe('POST')
    expect(String(init.body)).not.toContain('age')
  })

  it('스키마에 맞는 성공 응답은 결과로 돌려준다', async () => {
    const out = await run(json({ ok: true, result: MOCK_RESULTS.P1 }))
    expect(out).toEqual({ ok: true, result: MOCK_RESULTS.P1 })
  })

  it('서버 오류 응답은 ApiError를 그대로 돌려준다', async () => {
    const error = { code: 'RATE_LIMITED', message: 'x', retryAfterSeconds: 60, requestId: 'r_1' }
    const out = await run(json({ ok: false, error }, 429))
    expect(out).toEqual({ ok: false, error })
  })

  it.each([
    ['직업이 2개뿐인 결과', { ok: true, result: { ...MOCK_RESULTS.P1, jobs: MOCK_RESULTS.P1.jobs.slice(0, 2) } }],
    ['알 수 없는 오류 코드', { ok: false, error: { code: 'WHAT', message: 'x', requestId: 'r' } }],
    ['{ok} 형식이 아닌 본문', { hello: 'world' }],
  ])('형식이 맞지 않는 응답(%s)은 생성 실패(INTERNAL)로 처리한다', async (_name, body) => {
    const out = await run(json(body))
    expect(out.ok).toBe(false)
    if (!out.ok) expect(out.error.code).toBe('INTERNAL')
  })

  it('JSON이 아닌 응답과 네트워크 오류도 생성 실패(INTERNAL)다', async () => {
    const html = await run(new Response('<html>502</html>', { status: 502 }))
    expect(html.ok === false && html.error.code).toBe('INTERNAL')
    const net = await run(new TypeError('Failed to fetch'))
    expect(net.ok === false && net.error.code).toBe('INTERNAL')
  })

  it('중단 신호는 오류 결과가 아니라 AbortError로 전달한다', async () => {
    await expect(run(new DOMException('Aborted', 'AbortError'))).rejects.toThrow('Aborted')
  })
})

describe('오류 코드별 화면 상태 (T108)', () => {
  it.each([
    ['UPSTREAM_FAILED', 'failed'],
    ['INTERNAL', 'failed'],
    [undefined, 'failed'],
    ['OUTPUT_INVALID', 'invalid-output'],
    ['TIMEOUT', 'timeout'],
    ['RATE_LIMITED', 'rate-limited'],
  ] as const)('%s -> %s', (code, variant) => {
    expect(errorToVariant(code)).toBe(variant)
  })

  it('VALIDATION_FAILED·PII_DETECTED는 details 경로를 입력 항목 오류로 바꾼다', () => {
    const v = serverErrorItems({
      code: 'VALIDATION_FAILED',
      message: 'x',
      requestId: 'r',
      details: [{ path: ['strengths', 1], rule: 'required' }, { path: ['education', 'level'], rule: 'enum' }],
    })
    expect(v.map((i) => [i.key, i.section])).toEqual([['strengths.1', 4], ['level', 0]])
    const p = serverErrorItems({ code: 'PII_DETECTED', message: 'x', requestId: 'r', details: [{ path: ['careers', 0, 'jobTitle'], rule: 'pii' }] })
    expect(p[0].key).toBe('careers.0.jobTitle')
    expect(p[0].message).toContain('개인 식별 정보')
  })

  it('details가 없어도 오류 항목이 하나 이상 생긴다', () => {
    expect(serverErrorItems({ code: 'VALIDATION_FAILED', message: 'x', requestId: 'r' })).toHaveLength(1)
  })
})
