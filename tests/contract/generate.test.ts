// T101 계약 테스트(contracts/generate-api.md 6절 11개 행 + 잘못된 JSON·스키마 위반 본문). LLM은 모의다.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiErrorSchema, GenerateResponseSchema } from '../../shared/schema/api'
import { NOTICE_LINES } from '../../shared/messages'
import { UpstreamError, type LlmFn } from '../../server/ai/client'
import type { ServerConfig } from '../../server/config'
import { createHandler } from '../../server/handler'
import { setLogSink } from '../../server/log'
import { createRateLimiter } from '../../server/rate-limit'
import { post, validModelOutput, validRequest } from './fixtures'

const API_KEY = 'test-key-not-real-0123456789abcdef'
const config = (patch: Partial<ServerConfig> = {}): ServerConfig => ({
  provider: 'anthropic',
  model: 'model-id-for-test',
  apiKey: API_KEY,
  mockMode: 'ok',
  rateLimitMax: 20,
  rateLimitWindowSeconds: 600,
  ...patch,
})

let logs: string[]
let consoleSpies: ReturnType<typeof vi.spyOn>[]

beforeEach(() => {
  logs = []
  setLogSink((l) => logs.push(l))
  consoleSpies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => undefined))
})
afterEach(() => {
  setLogSink()
  vi.restoreAllMocks()
})

function setup(steps: (string | Error)[] = [JSON.stringify(validModelOutput())], cfg: Partial<ServerConfig> = {}) {
  let calls = 0
  const llm: LlmFn = async () => {
    const step = steps[Math.min(calls, steps.length - 1)]
    calls++
    if (step instanceof Error) throw step
    return step
  }
  const full = config(cfg)
  const handler = createHandler({
    getConfig: () => full,
    createLlm: () => llm,
    limiter: (c) => createRateLimiter({ max: c.rateLimitMax, windowSeconds: c.rateLimitWindowSeconds }),
  })
  return { handler, calls: () => calls }
}

async function readError(res: Response) {
  const body = await res.json()
  expect(body.ok).toBe(false)
  expect(ApiErrorSchema.safeParse(body.error).success).toBe(true)
  return body.error as { code: string; details?: { path: (string | number)[]; rule: string }[]; message: string; requestId: string; retryAfterSeconds?: number }
}

describe('API 6절 계약 테스트', () => {
  it('1. 요청에 age가 있음 -> 400 VALIDATION_FAILED, LLM 호출 0회', async () => {
    const { handler, calls } = setup()
    const res = await handler(post({ ...validRequest(), age: 34 }))
    expect(res.status).toBe(400)
    const error = await readError(res)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details).toEqual([{ path: ['age'], rule: 'forbidden' }])
    expect(calls()).toBe(0)
  })

  it.each([2, 4])('2. 강점 %i개 -> 400, details.path = ["strengths"]', async (n) => {
    const { handler, calls } = setup()
    const strengths = Array.from({ length: n }, (_, i) => `강점 문장 ${i}번`)
    const res = await handler(post({ ...validRequest(), strengths }))
    expect(res.status).toBe(400)
    const error = await readError(res)
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.details?.[0].path).toEqual(['strengths'])
    expect(calls()).toBe(0)
  })

  it('3. 강점에 주민번호 형식 -> 400 PII_DETECTED, LLM 호출 0회, 값은 응답에 없음', async () => {
    const { handler, calls } = setup()
    const req = validRequest()
    req.strengths[1] = '주민번호 900101-1234567 입니다'
    const res = await handler(post(req))
    expect(res.status).toBe(400)
    const text = await res.clone().text()
    const error = await readError(res)
    expect(error.code).toBe('PII_DETECTED')
    expect(error.details).toEqual([{ path: ['strengths', 1], rule: 'resident_id' }])
    expect(text).not.toContain('900101')
    expect(calls()).toBe(0)
    expect(logs.join('\n')).not.toContain('900101')
  })

  it('4. 모의 LLM이 직업 2개 반환 -> 재요청 1회 후 OUTPUT_INVALID, 부분 결과 없음', async () => {
    const two = { ...validModelOutput(), jobs: validModelOutput().jobs.slice(0, 2) }
    const { handler, calls } = setup([JSON.stringify(two)])
    const res = await handler(post(validRequest()))
    expect(res.status).toBe(502)
    const body = await res.json()
    expect(body.error.code).toBe('OUTPUT_INVALID')
    expect(body.result).toBeUndefined()
    expect(calls()).toBe(2)
  })

  it('5. 첫 응답 실패, 두 번째 성공 -> 200, LLM 호출 정확히 2회', async () => {
    const { handler, calls } = setup(['형식이 아닌 응답', JSON.stringify(validModelOutput())])
    const res = await handler(post(validRequest()))
    expect(res.status).toBe(200)
    expect(GenerateResponseSchema.safeParse(await res.json()).success).toBe(true)
    expect(calls()).toBe(2)
  })

  it('6. 존재하지 않는 항목 번호 지목 -> 거부(V3), 재요청', async () => {
    const fake = validModelOutput()
    fake.keywords[0].linkedInputs.push({ field: 'training', index: 3 })
    const { handler, calls } = setup([JSON.stringify(fake), JSON.stringify(validModelOutput())])
    expect((await handler(post(validRequest()))).status).toBe(200)
    expect(calls()).toBe(2)
    const stuck = setup([JSON.stringify(fake)])
    const res = await stuck.handler(post(validRequest()))
    expect((await readError(res)).code).toBe('OUTPUT_INVALID')
    expect(stuck.calls()).toBe(2)
  })

  it.each(['합격률이 80%예요.', '연봉이 높은 편이에요.'])('7. 출력에 수치("%s") -> 거부(V8)', async (text) => {
    const bad = validModelOutput()
    bad.jobs[0].rationale[0].text = text
    const { handler, calls } = setup([JSON.stringify(bad)])
    const res = await handler(post(validRequest()))
    expect(res.status).toBe(502)
    expect((await readError(res)).code).toBe('OUTPUT_INVALID')
    expect(calls()).toBe(2)
  })

  it('8. 성공해도 notice는 항상 두 줄(모델 출력과 무관)', async () => {
    const withFake = { ...validModelOutput(), notice: ['모델 안내문'] }
    const { handler } = setup([JSON.stringify(withFake)])
    const res = await handler(post(validRequest()))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.result.notice).toEqual([NOTICE_LINES[0], NOTICE_LINES[1]])
  })

  it('9. 제한 초과(21번째 요청) -> 429 RATE_LIMITED, Retry-After, LLM 호출 0회', async () => {
    const { handler, calls } = setup()
    for (let i = 0; i < 20; i++) expect((await handler(post(validRequest()))).status).toBe(200)
    expect(calls()).toBe(20)
    const res = await handler(post(validRequest()))
    expect(res.status).toBe(429)
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0)
    const error = await readError(res)
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.retryAfterSeconds).toBeGreaterThan(0)
    expect(calls()).toBe(20)
    // 다른 사용 환경은 영향을 받지 않는다.
    expect((await handler(post(validRequest(), { 'x-forwarded-for': '198.51.100.9' }))).status).toBe(200)
  })

  it('10. 로그 캡처: 어떤 입력 값도 로그 출력에 없다', async () => {
    const req = validRequest()
    const { handler } = setup(['형식 오류', JSON.stringify(validModelOutput())])
    await handler(post(req))
    await handler(post({ ...req, age: 30 }))
    const values = [req.majors[0], req.careers[0].jobTitle, req.careers[0].industry, req.certifications[0], ...req.strengths]
    const out = logs.join('\n')
    expect(out.length).toBeGreaterThan(0)
    for (const v of values) expect(out).not.toContain(v)
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled()
  })

  it('11. API 키가 응답과 로그에 없다(성공·실패 모두)', async () => {
    const responses: string[] = []
    const ok = setup()
    responses.push(await (await ok.handler(post(validRequest()))).text())
    const fail = setup([new UpstreamError('error')])
    responses.push(await (await fail.handler(post(validRequest()))).text())
    const bad = setup()
    responses.push(await (await bad.handler(post({ ...validRequest(), age: 1 }))).text())
    for (const text of [...responses, logs.join('\n')]) {
      expect(text).not.toContain(API_KEY)
      expect(text).not.toContain('model-id-for-test')
    }
  })
})

describe('잘못된 본문 처리(추가)', () => {
  const FRAGMENT = '가상의입력조각ZQX'

  it('잘못된 JSON 본문(입력 문자열 조각 포함) -> 400, 로그·응답에 조각이 없다', async () => {
    const { handler, calls } = setup()
    const res = await handler(post(`{"strengths": ["${FRAGMENT}", 깨진`))
    expect(res.status).toBe(400)
    const text = await res.clone().text()
    expect((await readError(res)).code).toBe('VALIDATION_FAILED')
    expect(text).not.toContain(FRAGMENT)
    expect(logs.join('\n')).not.toContain(FRAGMENT)
    expect(calls()).toBe(0)
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled()
  })

  it('스키마 위반 본문(모르는 필드·잘못된 값) -> 400, 로그·응답에 문자열이 없다', async () => {
    const { handler } = setup()
    const bodies = [
      { ...validRequest(), [FRAGMENT]: FRAGMENT },
      { ...validRequest(), education: { level: FRAGMENT, status: 'graduated' } },
      { ...validRequest(), majors: [FRAGMENT.repeat(20)] },
      { ...validRequest(), strengths: [FRAGMENT, FRAGMENT, 12345] },
      [FRAGMENT],
    ]
    for (const body of bodies) {
      const res = await handler(post(body))
      expect(res.status).toBe(400)
      expect(await res.text()).not.toContain(FRAGMENT)
    }
    expect(logs.join('\n')).not.toContain(FRAGMENT)
  })

  it('본문 32KB 초과 -> 400 VALIDATION_FAILED, LLM 호출 0회', async () => {
    const { handler, calls } = setup()
    const big = { ...validRequest(), majors: ['가'.repeat(40_000)] }
    const res = await handler(post(big))
    expect(res.status).toBe(400)
    expect((await readError(res)).code).toBe('VALIDATION_FAILED')
    expect(calls()).toBe(0)
  })

  it('한도 초과(P5-c): 전공 7개, 경력 21개, 강점 101자', async () => {
    const { handler, calls } = setup()
    const r = validRequest()
    const cases = [
      { ...r, majors: Array.from({ length: 7 }, () => '경영학') },
      { ...r, careers: Array.from({ length: 21 }, () => r.careers[0]) },
      { ...r, strengths: ['가'.repeat(101), '나다', '라마'] },
    ]
    for (const c of cases) {
      const res = await handler(post(c))
      expect(res.status).toBe(400)
      expect((await readError(res)).code).toBe('VALIDATION_FAILED')
    }
    expect(calls()).toBe(0)
  })
})

describe('HTTP 규칙과 오류 코드', () => {
  it('POST 외 메서드는 405', async () => {
    const { handler } = setup()
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const res = await handler(new Request('http://localhost/api/generate', { method }))
      expect(res.status).toBe(405)
      expect(res.headers.get('Allow')).toBe('POST')
    }
  })

  it('모든 응답에 Cache-Control: no-store', async () => {
    const { handler } = setup()
    for (const res of [await handler(post(validRequest())), await handler(post('{')), await handler(new Request('http://localhost/api/generate'))]) {
      expect(res.headers.get('Cache-Control')).toBe('no-store')
      expect(res.headers.get('Content-Type')).toContain('application/json')
    }
  })

  it('UPSTREAM_FAILED 502, TIMEOUT 504', async () => {
    const down = setup([new UpstreamError('error')])
    const r1 = await down.handler(post(validRequest()))
    expect(r1.status).toBe(502)
    expect((await readError(r1)).code).toBe('UPSTREAM_FAILED')
    const slow = setup([new UpstreamError('timeout')])
    const r2 = await slow.handler(post(validRequest()))
    expect(r2.status).toBe(504)
    expect((await readError(r2)).code).toBe('TIMEOUT')
  })

  it('설정 누락·예상 밖 예외 -> 500 INTERNAL, 원인은 응답에 없고 예외는 던져지지 않는다', async () => {
    const secret = '내부원인-공급자명-스택'
    const missing = createHandler({
      getConfig: () => {
        throw new Error(secret)
      },
      createLlm: () => async () => '',
      limiter: () => createRateLimiter({ max: 1, windowSeconds: 1 }),
    })
    const res = await missing(post(validRequest()))
    expect(res.status).toBe(500)
    const text = await res.clone().text()
    expect((await readError(res)).code).toBe('INTERNAL')
    expect(text).not.toContain(secret)
    expect(logs.join('\n')).not.toContain(secret)

    const boom = createHandler({
      getConfig: () => config(),
      createLlm: () => async () => {
        throw new Error(secret)
      },
      limiter: () => createRateLimiter({ max: 5, windowSeconds: 60 }),
    })
    const res2 = await boom(post(validRequest()))
    expect(res2.status).toBe(502)
    expect(await res2.text()).not.toContain(secret)
    expect(logs.join('\n')).not.toContain(secret)
  })

  it('프로덕션에서 mock 공급자 설정이면 INTERNAL', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    try {
      const { handler, calls } = setup(undefined, { provider: 'mock', apiKey: '' })
      const { createLlm } = await import('../../server/ai/client')
      const prod = createHandler({
        getConfig: () => config({ provider: 'mock', apiKey: '' }),
        createLlm: (c) => createLlm(c),
        limiter: () => createRateLimiter({ max: 5, windowSeconds: 60 }),
      })
      const res = await prod(post(validRequest()))
      expect(res.status).toBe(500)
      expect(calls()).toBe(0)
      void handler
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('mock 공급자(개발)로 끝까지 계약 형태로 응답한다', async () => {
    const { createLlm } = await import('../../server/ai/client')
    const dev = createHandler({
      getConfig: () => config({ provider: 'mock', apiKey: '', model: '' }),
      createLlm: (c) => createLlm(c),
      limiter: () => createRateLimiter({ max: 5, windowSeconds: 60 }),
    })
    const res = await dev(post(validRequest()))
    expect(res.status).toBe(200)
    expect(GenerateResponseSchema.safeParse(await res.json()).success).toBe(true)
  })
})
