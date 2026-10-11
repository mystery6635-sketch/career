// 요청 횟수 제한(T094, FR-038). 서버 메모리 슬라이딩 윈도우, 키는 IP의 해시값이다. 원본 IP는 저장하지도 기록하지도 않는다.
// 한계: 서버리스 인스턴스마다 메모리가 따로이므로 인스턴스별 최선 노력이다. 인스턴스가 여러 개이거나 새로 뜨면 횟수가 초기화된다.
// 최종 방어선은 공급자 콘솔의 월 사용 한도다(quickstart.md 참고).
import { createHmac, randomBytes } from 'node:crypto'

export interface RateLimiter {
  check(ip: string): { allowed: true } | { allowed: false; retryAfterSeconds: number }
}

const MAX_KEYS = 10_000

export function createRateLimiter(options: {
  max: number
  windowSeconds: number
  now?: () => number
}): RateLimiter {
  const now = options.now ?? Date.now
  const windowMs = options.windowSeconds * 1000
  // 프로세스마다 다른 소금값: 해시를 되돌려 IP를 찾는 일을 어렵게 한다.
  const salt = randomBytes(16)
  const hits = new Map<string, number[]>()

  const keyOf = (ip: string) => createHmac('sha256', salt).update(ip).digest('hex')

  function prune(t: number) {
    for (const [key, times] of hits) {
      if (times.length === 0 || t - times[times.length - 1] >= windowMs) hits.delete(key)
    }
    if (hits.size > MAX_KEYS) hits.clear()
  }

  return {
    check(ip) {
      const t = now()
      if (hits.size >= MAX_KEYS) prune(t)
      const key = keyOf(ip)
      const times = (hits.get(key) ?? []).filter((x) => t - x < windowMs)
      if (times.length >= options.max) {
        hits.set(key, times)
        const retryAfterSeconds = Math.max(1, Math.ceil((times[0] + windowMs - t) / 1000))
        return { allowed: false, retryAfterSeconds }
      }
      times.push(t)
      hits.set(key, times)
      return { allowed: true }
    },
  }
}
