// T094 요청 횟수 제한: 20회 통과, 21회째 차단, 창 만료 후 복구, 원본 IP 미저장.
import { describe, expect, it } from 'vitest'
import { createRateLimiter } from '../../server/rate-limit'

describe('createRateLimiter', () => {
  const make = () => {
    let t = 1_000_000
    const limiter = createRateLimiter({ max: 20, windowSeconds: 600, now: () => t })
    return { limiter, advance: (ms: number) => (t += ms) }
  }

  it('20회는 통과하고 21회째는 Retry-After와 함께 차단한다', () => {
    const { limiter } = make()
    for (let i = 0; i < 20; i++) expect(limiter.check('203.0.113.7').allowed).toBe(true)
    const blocked = limiter.check('203.0.113.7')
    expect(blocked.allowed).toBe(false)
    if (!blocked.allowed) expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('다른 IP는 영향을 받지 않는다', () => {
    const { limiter } = make()
    for (let i = 0; i < 21; i++) limiter.check('203.0.113.7')
    expect(limiter.check('198.51.100.1').allowed).toBe(true)
  })

  it('창이 지나면 복구된다(슬라이딩 윈도우)', () => {
    const { limiter, advance } = make()
    for (let i = 0; i < 20; i++) limiter.check('203.0.113.7')
    expect(limiter.check('203.0.113.7').allowed).toBe(false)
    advance(599_000)
    expect(limiter.check('203.0.113.7').allowed).toBe(false)
    advance(2_000)
    expect(limiter.check('203.0.113.7').allowed).toBe(true)
  })

  it('차단된 요청은 횟수를 늘리지 않는다', () => {
    const { limiter, advance } = make()
    for (let i = 0; i < 20; i++) limiter.check('203.0.113.7')
    for (let i = 0; i < 50; i++) limiter.check('203.0.113.7')
    advance(601_000)
    for (let i = 0; i < 20; i++) expect(limiter.check('203.0.113.7').allowed).toBe(true)
  })

  it('원본 IP를 저장하지 않는다(Map 키는 해시값)', () => {
    const keys: unknown[] = []
    const original = Map.prototype.set
    Map.prototype.set = function (this: Map<unknown, unknown>, key: unknown, value: unknown) {
      keys.push(key)
      return original.call(this, key, value)
    }
    try {
      const { limiter } = make()
      limiter.check('203.0.113.7')
    } finally {
      Map.prototype.set = original
    }
    expect(keys.length).toBeGreaterThan(0)
    for (const key of keys) {
      expect(String(key)).not.toContain('203.0.113.7')
      expect(String(key)).toMatch(/^[0-9a-f]{64}$/)
    }
  })
})
