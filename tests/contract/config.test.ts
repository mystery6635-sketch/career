// T092 서버 설정: 누락, 프로덕션 mock 거부, 키가 오류에 노출되지 않음.
import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from '../../server/config'

const KEY = 'test-key-not-real-abcdef123456'

describe('loadConfig', () => {
  it('anthropic 기본값과 요청 제한 초기값(10분 20회)', () => {
    const c = loadConfig({ LLM_MODEL: 'm', LLM_API_KEY: KEY })
    expect(c).toMatchObject({ provider: 'anthropic', model: 'm', apiKey: KEY, rateLimitMax: 20, rateLimitWindowSeconds: 600 })
  })

  it('환경 변수로 요청 제한을 조정한다', () => {
    const c = loadConfig({ LLM_PROVIDER: 'mock', RATE_LIMIT_MAX: '2', RATE_LIMIT_WINDOW_SECONDS: '30' })
    expect(c).toMatchObject({ rateLimitMax: 2, rateLimitWindowSeconds: 30 })
  })

  it.each([
    [{ LLM_API_KEY: KEY }, '모델 누락'],
    [{ LLM_MODEL: 'm' }, '키 누락'],
    [{}, '모두 누락'],
    [{ LLM_PROVIDER: 'other', LLM_MODEL: 'm', LLM_API_KEY: KEY }, '지원하지 않는 공급자'],
    [{ LLM_PROVIDER: 'mock', RATE_LIMIT_MAX: '0' }, '잘못된 제한 값'],
    [{ LLM_PROVIDER: 'mock', LLM_MOCK_MODE: 'weird' }, '잘못된 mock 모드'],
  ])('%j -> ConfigError (%s)', (env, _label) => {
    void _label
    expect(() => loadConfig(env as Record<string, string>)).toThrow(ConfigError)
  })

  it('프로덕션에서 mock 공급자를 거부한다', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', LLM_PROVIDER: 'mock' })).toThrow(ConfigError)
    expect(() => loadConfig({ VERCEL_ENV: 'production', LLM_PROVIDER: 'mock' })).toThrow(ConfigError)
    expect(loadConfig({ NODE_ENV: 'production', LLM_MODEL: 'm', LLM_API_KEY: KEY }).provider).toBe('anthropic')
  })

  it('오류 메시지에 키 값이 없다', () => {
    for (const env of [{ LLM_API_KEY: KEY }, { LLM_PROVIDER: 'bad', LLM_API_KEY: KEY }]) {
      try {
        loadConfig(env)
        expect.unreachable()
      } catch (e) {
        expect((e as Error).message).not.toContain(KEY)
      }
    }
  })
})
