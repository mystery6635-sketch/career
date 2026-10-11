// T098 LLM 클라이언트: mock 공급자 4개 모드, 프로덕션 mock 거부, Anthropic 호출 형식과 오류 변환, 시도 제한 시간(가짜 타이머).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLlm, UpstreamError } from '../../server/ai/client'
import { buildModelInput, buildUserMessage, SYSTEM_PROMPT } from '../../server/ai/prompt'
import { parseModelText, validateOutput } from '../../server/ai/validate-output'
import { ConfigError, loadConfig, type MockMode, type ServerConfig } from '../../server/config'
import { validRequest } from '../contract/fixtures'

const config = (patch: Partial<ServerConfig> = {}): ServerConfig => ({
  provider: 'mock',
  model: '',
  apiKey: '',
  mockMode: 'ok',
  rateLimitMax: 20,
  rateLimitWindowSeconds: 600,
  ...patch,
})
const request = { system: SYSTEM_PROMPT, user: buildUserMessage(buildModelInput(validRequest())) }

describe('mock 공급자', () => {
  afterEach(() => vi.useRealTimers())

  it('ok: 검증을 통과하는 JSON을 돌려준다', async () => {
    const text = await createLlm(config())(request, { timeoutMs: 55_000 })
    const parsed = parseModelText(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(validateOutput(parsed.value, validRequest()).ok).toBe(true)
  })

  it('ok: 경력이 없는 입력과 인턴이 있는 입력도 통과한다', async () => {
    const r = { ...validRequest(), noCareer: true, careers: [], intern: { has: true as const, content: '사무 보조', period: '3개월' } }
    const llm = createLlm(config())
    const text = await llm({ system: SYSTEM_PROMPT, user: buildUserMessage(buildModelInput(r)) }, { timeoutMs: 1000 })
    const parsed = parseModelText(text)
    expect(parsed.ok && validateOutput(parsed.value, r).ok).toBe(true)
  })

  it('format-error: JSON이 아닌 응답', async () => {
    const text = await createLlm(config({ mockMode: 'format-error' }))(request, { timeoutMs: 1000 })
    expect(parseModelText(text).ok).toBe(false)
  })

  it('fail: UpstreamError', async () => {
    await expect(createLlm(config({ mockMode: 'fail' }))(request, { timeoutMs: 1000 })).rejects.toBeInstanceOf(UpstreamError)
  })

  it('slow: 시도 제한 시간에 중단되고 timeout으로 끝난다(가짜 타이머)', async () => {
    vi.useFakeTimers()
    const promise = createLlm(config({ mockMode: 'slow' }))(request, { timeoutMs: 55_000 })
    const assertion = expect(promise).rejects.toMatchObject({ name: 'UpstreamError', kind: 'timeout' })
    await vi.advanceTimersByTimeAsync(54_999)
    let settled = false
    promise.catch(() => (settled = true))
    await Promise.resolve()
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(2)
    await assertion
  })
})

describe('프로덕션에서 mock 거부', () => {
  beforeEach(() => vi.unstubAllEnvs())
  afterEach(() => vi.unstubAllEnvs())

  it('설정 단계에서 거부', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', LLM_PROVIDER: 'mock' })).toThrow(ConfigError)
    expect(() => loadConfig({ VERCEL_ENV: 'production', LLM_PROVIDER: 'mock' })).toThrow(ConfigError)
  })

  it('클라이언트 생성 단계에서도 거부', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => createLlm(config())).toThrow(ConfigError)
  })

  it('개발·테스트에서는 허용', () => {
    expect(loadConfig({ NODE_ENV: 'development', LLM_PROVIDER: 'mock' }).provider).toBe('mock')
  })

  it.each(['ok', 'format-error', 'fail', 'slow'] as MockMode[])('LLM_MOCK_MODE=%s', (mode) => {
    expect(loadConfig({ LLM_PROVIDER: 'mock', LLM_MOCK_MODE: mode }).mockMode).toBe(mode)
  })
})

describe('Anthropic 공급자', () => {
  const anthropic = config({ provider: 'anthropic', model: 'model-id-for-test', apiKey: 'test-key-not-real-0123456789' })
  const okBody = { content: [{ type: 'text', text: '{"jobs":[],"keywords":[]}' }] }

  it('Messages API 형식으로 호출하고 키는 헤더로만 보낸다', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(okBody), { status: 200 }))
    const text = await createLlm(anthropic, { fetch: fetchMock as unknown as typeof fetch })(request, { timeoutMs: 1000 })
    expect(text).toBe('{"jobs":[],"keywords":[]}')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    const headers = init.headers as Record<string, string>
    expect(headers['x-api-key']).toBe(anthropic.apiKey)
    expect(headers['anthropic-version']).toBeTruthy()
    const body = JSON.parse(init.body as string)
    expect(body.model).toBe('model-id-for-test')
    expect(body.system).toBe(SYSTEM_PROMPT)
    expect(body.messages).toEqual([{ role: 'user', content: request.user }])
    expect(init.body as string).not.toContain(anthropic.apiKey)
  })

  it.each([
    [429, 'rate_limit'],
    [500, 'error'],
    [401, 'error'],
  ])('HTTP %i는 UpstreamError(%s)로 바뀐다', async (status, kind) => {
    const fetchMock = vi.fn(async () => new Response('상세 오류 본문', { status }))
    const promise = createLlm(anthropic, { fetch: fetchMock as unknown as typeof fetch })(request, { timeoutMs: 1000 })
    await expect(promise).rejects.toMatchObject({ name: 'UpstreamError', kind })
  })

  it('네트워크 오류와 빈 응답도 UpstreamError', async () => {
    const boom = vi.fn(async () => {
      throw new TypeError(`연결 실패 ${request.user.slice(0, 5)}`)
    })
    await expect(createLlm(anthropic, { fetch: boom as unknown as typeof fetch })(request, { timeoutMs: 1000 })).rejects.toMatchObject({ kind: 'error' })
    const empty = vi.fn(async () => new Response(JSON.stringify({ content: [] }), { status: 200 }))
    await expect(createLlm(anthropic, { fetch: empty as unknown as typeof fetch })(request, { timeoutMs: 1000 })).rejects.toMatchObject({ kind: 'error' })
  })

  it('시도 제한 시간(55초)을 넘기면 중단한다(가짜 타이머)', async () => {
    vi.useFakeTimers()
    try {
      const hanging = vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
          }),
      )
      const promise = createLlm(anthropic, { fetch: hanging as unknown as typeof fetch })(request, { timeoutMs: 55_000 })
      const assertion = expect(promise).rejects.toMatchObject({ kind: 'timeout' })
      await vi.advanceTimersByTimeAsync(55_000)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })

  it('설정: 키·모델이 없으면 ConfigError, 오류 메시지에 값이 없다', () => {
    expect(() => loadConfig({ LLM_PROVIDER: 'anthropic', LLM_API_KEY: 'secret-value-123' })).toThrow(ConfigError)
    try {
      loadConfig({ LLM_PROVIDER: 'anthropic', LLM_API_KEY: 'secret-value-123' })
    } catch (e) {
      expect((e as Error).message).not.toContain('secret-value-123')
    }
  })
})
