import type { ApiError, GenerateRequest, ResultPayload } from '@shared/schema'

export type GenerateOutcome = { ok: true; result: ResultPayload } | { ok: false; error: ApiError }

export interface GenerateOptions {
  signal: AbortSignal
}

/** 화면은 이 인터페이스만 안다. Mock과 실제 서버 호출이 같은 모양이다. */
export interface AiService {
  generate(request: GenerateRequest, options: GenerateOptions): Promise<GenerateOutcome>
}

export type MockScenario = 'ok' | 'slow' | 'timeout' | 'fail' | 'fail-once' | 'format' | 'limit'

/** 클라이언트에서 만든 오류에도 requestId를 붙인다(서버 응답이 아니라는 뜻으로 `c_` 접두). */
export function clientError(code: ApiError['code'], message: string, extra: Partial<ApiError> = {}): ApiError {
  return { code, message, requestId: `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, ...extra }
}
