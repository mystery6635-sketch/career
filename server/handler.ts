// 웹 표준 Request → Response 핸들러(T100). Vercel 함수와 Vite 개발 서버가 같은 함수를 쓴다.
// 처리 순서는 contracts/generate-api.md 2절을 따른다. 전체를 try/catch로 감싸 예외를 던지거나 출력하지 않는다
// (호스팅 런타임이 잡히지 않은 예외를 메시지째 로그에 남기기 때문). 응답에는 내부 원인을 싣지 않는다.
import { INPUT_ERRORS, STATUS_SCREENS } from '../shared/messages.js'
import { findPii } from '../shared/guard/pii.js'
import type { ApiError, ApiErrorCode } from '../shared/schema/api.js'
import { GenerateRequestSchema } from '../shared/schema/request.js'
import { createLlm, type LlmFn } from './ai/client.js'
import { generateResult } from './ai/generate.js'
import { loadConfig, type ServerConfig } from './config.js'
import { errorName, log } from './log.js'
import { createRateLimiter, type RateLimiter } from './rate-limit.js'

const MAX_BODY_BYTES = 32 * 1024

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_FAILED: 400,
  PII_DETECTED: 400,
  RATE_LIMITED: 429,
  UPSTREAM_FAILED: 502,
  OUTPUT_INVALID: 502,
  TIMEOUT: 504,
  INTERNAL: 500,
}

const MESSAGES: Record<ApiErrorCode, string> = {
  VALIDATION_FAILED: INPUT_ERRORS.bodyInvalid,
  PII_DETECTED: INPUT_ERRORS.pii,
  RATE_LIMITED: STATUS_SCREENS['rate-limited'].body,
  UPSTREAM_FAILED: STATUS_SCREENS.failed.body,
  OUTPUT_INVALID: STATUS_SCREENS['invalid-output'].body,
  TIMEOUT: STATUS_SCREENS.timeout.body,
  INTERNAL: STATUS_SCREENS.failed.body,
}

export interface HandlerDeps {
  /** 요청마다 설정을 읽는다. 누락이면 던진다(핸들러가 INTERNAL로 바꾼다). */
  getConfig: () => ServerConfig
  createLlm: (config: ServerConfig) => LlmFn
  limiter: RateLimiter | ((config: ServerConfig) => RateLimiter)
  now?: () => number
}

function newRequestId(): string {
  return `r_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
}

function respond(status: number, body: unknown, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
  })
}

function fail(
  code: ApiErrorCode,
  requestId: string,
  extra: { details?: ApiError['details']; retryAfterSeconds?: number; status?: number; headers?: Record<string, string> } = {},
): Response {
  const error: ApiError = { code, message: MESSAGES[code], requestId }
  if (extra.details) error.details = extra.details
  if (extra.retryAfterSeconds !== undefined) error.retryAfterSeconds = extra.retryAfterSeconds
  return respond(extra.status ?? STATUS[code], { ok: false, error }, extra.headers)
}

/** 본문을 32KB까지만 읽는다. 넘으면 null. */
async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (declared > MAX_BODY_BYTES) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY_BYTES) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(merged)
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
}

export function createHandler(deps: HandlerDeps): (request: Request) => Promise<Response> {
  const now = deps.now ?? Date.now
  let limiter: RateLimiter | undefined

  return async function handleGenerate(request: Request): Promise<Response> {
    const requestId = newRequestId()
    const startedAt = now()
    const done = (code: string, response: Response, error?: unknown): Response => {
      log({ requestId, step: 'request', result: code, ms: now() - startedAt, errorName: error ? errorName(error) : undefined })
      return response
    }

    try {
      if (request.method !== 'POST') {
        return done('METHOD', fail('VALIDATION_FAILED', requestId, { status: 405, headers: { Allow: 'POST' } }))
      }

      // 1. 본문 크기
      const body = await readBody(request)
      if (body === null) {
        return done('VALIDATION_FAILED', fail('VALIDATION_FAILED', requestId, { details: [{ path: [], rule: 'too_large' }] }))
      }

      // 2. 요청 제한: 비싼 작업(검증·LLM) 전에 확인한다.
      const config = deps.getConfig()
      limiter ??= typeof deps.limiter === 'function' ? deps.limiter(config) : deps.limiter
      const limit = limiter.check(clientIp(request))
      if (!limit.allowed) {
        return done(
          'RATE_LIMITED',
          fail('RATE_LIMITED', requestId, {
            retryAfterSeconds: limit.retryAfterSeconds,
            headers: { 'Retry-After': String(limit.retryAfterSeconds) },
          }),
        )
      }

      // 3. JSON 파싱과 엄격 검증. 파싱 오류 객체는 읽지 않는다(메시지에 본문 조각이 들어 있다).
      let parsed: unknown
      try {
        parsed = JSON.parse(body)
      } catch {
        return done('VALIDATION_FAILED', fail('VALIDATION_FAILED', requestId, { details: [{ path: [], rule: 'invalid_json' }] }))
      }
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return done('VALIDATION_FAILED', fail('VALIDATION_FAILED', requestId, { details: [{ path: [], rule: 'invalid_body' }] }))
      }
      if ('age' in parsed) {
        // 나이는 서버로 보내지 않는다(FR-004). 무시하지 않고 거부한다.
        return done('VALIDATION_FAILED', fail('VALIDATION_FAILED', requestId, { details: [{ path: ['age'], rule: 'forbidden' }] }))
      }
      const validated = GenerateRequestSchema.safeParse(parsed)
      if (!validated.success) {
        // 경로와 규칙 이름만 반환한다. 입력 값과 Zod 메시지는 싣지 않는다.
        const details = validated.error.issues.map((issue) => ({
          path: issue.path.filter((p): p is string | number => typeof p !== 'symbol'),
          rule: issue.code === 'custom' ? String((issue.params as { rule?: unknown } | undefined)?.rule ?? 'custom') : issue.code,
        }))
        return done('VALIDATION_FAILED', fail('VALIDATION_FAILED', requestId, { details }))
      }
      const input = validated.data

      // 4. 입력 보호: 식별 정보는 차단한다(값은 반환하지 않고 위치와 종류만).
      const pii = findPii(input)
      if (pii.length > 0) {
        return done(
          'PII_DETECTED',
          fail('PII_DETECTED', requestId, { details: pii.map((hit) => ({ path: hit.path, rule: hit.kind })) }),
        )
      }

      // 5~10. 생성 흐름
      const llm = deps.createLlm(config)
      const outcome = await generateResult(input, { llm, requestId, now })
      if (!outcome.ok) return done(outcome.code, fail(outcome.code, requestId))
      return done('ok', respond(200, { ok: true, result: outcome.result }))
    } catch (error) {
      // 설정 누락·예상 밖 오류. 원인은 응답에 싣지 않고 오류 이름만 기록한다.
      return done('INTERNAL', fail('INTERNAL', requestId), error)
    }
  }
}

// 기본 핸들러: 환경 변수 설정과 실제 공급자를 쓴다. 제한기는 설정값으로 한 번 만든다(인스턴스별 메모리).
export const handleGenerate = createHandler({
  getConfig: () => loadConfig(),
  createLlm: (config) => createLlm(config),
  limiter: (config) => createRateLimiter({ max: config.rateLimitMax, windowSeconds: config.rateLimitWindowSeconds }),
})
