// 서버 설정(T092). 환경 변수만 읽는다. 오류 메시지에는 변수 이름만 쓰고 값(특히 키)은 쓰지 않는다.

export type LlmProvider = 'anthropic' | 'mock'
export type MockMode = 'ok' | 'format-error' | 'fail' | 'slow'
export const MOCK_MODES: readonly MockMode[] = ['ok', 'format-error', 'fail', 'slow']

export interface ServerConfig {
  provider: LlmProvider
  model: string
  apiKey: string
  /** mock 공급자의 동작 방식(LLM_MOCK_MODE). anthropic에서는 쓰지 않는다. */
  mockMode: MockMode
  rateLimitMax: number
  rateLimitWindowSeconds: number
}

/** 설정 누락·오류. 핸들러는 이를 INTERNAL로 바꾸고 원인은 응답에 싣지 않는다. */
export class ConfigError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'ConfigError'
  }
}

type Env = Record<string, string | undefined>

export function isProduction(env: Env = process.env): boolean {
  return env.NODE_ENV === 'production' || env.VERCEL_ENV === 'production'
}

function positiveInt(env: Env, name: string, fallback: number): number {
  const raw = env[name]?.trim()
  if (!raw) return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) throw new ConfigError(`${name} must be a positive integer`)
  return value
}

export function loadConfig(env: Env = process.env): ServerConfig {
  const provider = (env.LLM_PROVIDER?.trim() || 'anthropic') as string
  if (provider !== 'anthropic' && provider !== 'mock') throw new ConfigError('LLM_PROVIDER is not supported')
  if (provider === 'mock' && isProduction(env)) throw new ConfigError('LLM_PROVIDER=mock is not allowed in production')

  const model = env.LLM_MODEL?.trim() ?? ''
  const apiKey = env.LLM_API_KEY?.trim() ?? ''
  if (provider === 'anthropic') {
    if (!model) throw new ConfigError('LLM_MODEL is required')
    if (!apiKey) throw new ConfigError('LLM_API_KEY is required')
  }

  const mockMode = (env.LLM_MOCK_MODE?.trim() || 'ok') as MockMode
  if (!MOCK_MODES.includes(mockMode)) throw new ConfigError('LLM_MOCK_MODE is not supported')

  return {
    provider,
    model,
    apiKey,
    mockMode,
    rateLimitMax: positiveInt(env, 'RATE_LIMIT_MAX', 20),
    rateLimitWindowSeconds: positiveInt(env, 'RATE_LIMIT_WINDOW_SECONDS', 600),
  }
}
