import type { ApiError, GenerateRequest, ResultPayload } from '@shared/types'

export type GenerateOutcome = { ok: true; result: ResultPayload } | { ok: false; error: ApiError }

export interface GenerateOptions {
  signal: AbortSignal
}

/** 화면은 이 인터페이스만 안다. Mock과 실제 서버 호출이 같은 모양이다. */
export interface AiService {
  generate(request: GenerateRequest, options: GenerateOptions): Promise<GenerateOutcome>
}

export type MockScenario = 'ok' | 'slow' | 'timeout' | 'fail' | 'fail-once' | 'format' | 'limit'
