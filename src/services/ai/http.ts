import { GenerateResponseSchema } from '@shared/schema'
import { clientError, type AiService, type GenerateOutcome } from './types'

// 실제 서버(/api/generate) 호출. 응답은 공유 스키마로 검증하고, 맞지 않으면 "생성 실패"로 처리한다(contracts 3절).
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
        return { ok: false, error: clientError('INTERNAL', '연결이 원활하지 않았어요.') }
      }
      try {
        const parsed = GenerateResponseSchema.safeParse(await response.json())
        if (parsed.success) {
          return parsed.data.ok ? { ok: true, result: parsed.data.result } : { ok: false, error: parsed.data.error }
        }
      } catch (e) {
        // 본문을 읽는 도중 중단되면 중단으로 전달한다. 그 밖(JSON 아님)은 형식 오류다.
        if (e instanceof DOMException && e.name === 'AbortError') throw e
      }
      return { ok: false, error: clientError('INTERNAL', '결과를 만들지 못했어요.') }
    },
  }
}
