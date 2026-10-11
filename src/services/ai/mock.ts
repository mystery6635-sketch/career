import { PERSONAS, type PersonaId } from '../../mock/personas'
import { MAX_LENGTH_RESULT, MOCK_RESULTS } from '../../mock/results'
import type { ApiError, GenerateRequest, ResultPayload } from '@shared/types'
import type { AiService, GenerateOptions, GenerateOutcome, MockScenario } from './types'

export const SLOW_DELAY_MS = 31_000
export const SCENARIOS: MockScenario[] = ['ok', 'slow', 'timeout', 'fail', 'fail-once', 'format', 'limit']

const ERRORS: Record<'fail' | 'format' | 'limit', ApiError> = {
  fail: { code: 'UPSTREAM_FAILED', message: '연결이 원활하지 않았어요.' },
  format: { code: 'OUTPUT_INVALID', message: '결과 형식이 맞지 않아요.' },
  limit: { code: 'RATE_LIMITED', message: '짧은 시간에 요청이 너무 많았어요.', retryAfterSeconds: 60 },
}

const isPersonaId = (v: string | undefined): v is PersonaId => !!v && v in PERSONAS

/** 결과 선택 규칙: ?persona= → 첫 번째 강점이 일치하는 페르소나 → P1. */
export function pickResult(request: GenerateRequest, persona?: string): ResultPayload {
  // 최대 길이 결과(A4 한 장 확인용)는 ?persona=MAX로 불러온다.
  if (persona === 'MAX') return MAX_LENGTH_RESULT
  if (isPersonaId(persona)) return MOCK_RESULTS[persona]
  const first = request.strengths?.[0]?.trim()
  const matched = (Object.keys(PERSONAS) as PersonaId[]).find((id) => PERSONAS[id].strengths[0] === first)
  return MOCK_RESULTS[matched ?? 'P1']
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

/** 응답이 오지 않는 상태. 중단 신호가 올 때만 끝난다. */
function never(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'))
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  })
}

export function createMockService(scenario: MockScenario = 'ok', persona?: string): AiService {
  let calls = 0
  return {
    async generate(request: GenerateRequest, { signal }: GenerateOptions): Promise<GenerateOutcome> {
      calls += 1
      switch (scenario) {
        case 'slow':
          await wait(SLOW_DELAY_MS, signal)
          return { ok: true, result: pickResult(request, persona) }
        case 'timeout':
          return never(signal)
        case 'fail':
        case 'format':
        case 'limit':
          await wait(400, signal)
          return { ok: false, error: ERRORS[scenario] }
        case 'fail-once':
          await wait(400, signal)
          return calls === 1
            ? { ok: false, error: ERRORS.fail }
            : { ok: true, result: pickResult(request, persona) }
        default:
          await wait(1200, signal)
          return { ok: true, result: pickResult(request, persona) }
      }
    },
  }
}
