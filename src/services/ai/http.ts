import type { ApiError } from '@shared/types'
import type { AiService, GenerateOutcome } from './types'

// 실제 서버(/api/generate) 호출. 응답 검증은 Phase 5·7에서 Zod로 붙인다.
export function createHttpService(): AiService {
  return {
    async generate(request, { signal }): Promise<GenerateOutcome> {
      let response: Response
      try {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal,
        })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        return { ok: false, error: { code: 'INTERNAL', message: '연결이 원활하지 않았어요.' } }
      }
      try {
        const body = (await response.json()) as { ok: boolean; result?: unknown; error?: ApiError }
        if (body.ok && body.result) return { ok: true, result: body.result as never }
        return { ok: false, error: body.error ?? { code: 'INTERNAL', message: '결과를 만들지 못했어요.' } }
      } catch {
        return { ok: false, error: { code: 'INTERNAL', message: '결과를 만들지 못했어요.' } }
      }
    },
  }
}
