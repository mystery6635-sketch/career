// 생성 흐름(T099). ModelInput 구성 → 프롬프트 → 호출 → 파싱 → Zod + validate-output.
// 실패하면 같은 입력으로 정확히 1회 재요청한다(규칙 번호만 전달). 합계 110초를 넘으면 TIMEOUT.
import type { ApiErrorCode } from '../../shared/schema/api.js'
import type { ResultPayload } from '../../shared/schema/output.js'
import type { GenerateRequest } from '../../shared/schema/request.js'
import { ATTEMPT_TIMEOUT_MS, UpstreamError, type LlmFn } from './client.js'
import { errorName, log } from '../log.js'
import { buildModelInput, buildRetryMessage, buildUserMessage, SYSTEM_PROMPT } from './prompt.js'
import { toResult } from './to-result.js'
import { parseModelText, RULE_DESCRIPTIONS, validateOutput, type RuleId } from './validate-output.js'

/** 재요청 포함 합계 제한(contracts/generate-api.md 1절). */
export const TOTAL_TIMEOUT_MS = 110_000

export type GenerateOutcome =
  | { ok: true; result: ResultPayload }
  | { ok: false; code: Extract<ApiErrorCode, 'OUTPUT_INVALID' | 'UPSTREAM_FAILED' | 'TIMEOUT'> }

export interface GenerateDeps {
  llm: LlmFn
  requestId: string
  now?: () => number
}

type Failure = { type: 'upstream'; timeout: boolean } | { type: 'invalid' }

export async function generateResult(request: GenerateRequest, deps: GenerateDeps): Promise<GenerateOutcome> {
  const now = deps.now ?? Date.now
  const startedAt = now()
  const baseUser = buildUserMessage(buildModelInput(request))
  let user = baseUser
  let last: Failure = { type: 'upstream', timeout: false }

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = TOTAL_TIMEOUT_MS - (now() - startedAt)
    if (remaining <= 0) return { ok: false, code: 'TIMEOUT' }
    const callStart = now()
    const retried = attempt > 0

    let text: string
    try {
      text = await deps.llm({ system: SYSTEM_PROMPT, user }, { timeoutMs: Math.min(ATTEMPT_TIMEOUT_MS, remaining) })
    } catch (error) {
      const timeout = error instanceof UpstreamError && error.kind === 'timeout'
      log({
        requestId: deps.requestId,
        step: 'llm_call',
        result: 'UPSTREAM_FAILED',
        ms: now() - callStart,
        retried,
        errorName: errorName(error),
      })
      last = { type: 'upstream', timeout }
      user = baseUser
      continue
    }

    const parsed = parseModelText(text)
    const validation = parsed.ok
      ? validateOutput(parsed.value, request)
      : ({ ok: false, rules: ['V13'] } as { ok: false; rules: RuleId[] })

    if (validation.ok) {
      log({ requestId: deps.requestId, step: 'validate', result: 'ok', ms: now() - callStart, retried })
      return { ok: true, result: toResult(validation.output, request, new Date(now())) }
    }

    log({
      requestId: deps.requestId,
      step: 'validate',
      result: 'OUTPUT_INVALID',
      ms: now() - callStart,
      retried,
      rules: validation.rules,
    })
    last = { type: 'invalid' }
    user = `${baseUser}\n\n${buildRetryMessage(
      validation.rules.map((rule) => ({ rule, description: RULE_DESCRIPTIONS[rule] ?? '' })),
    )}`
  }

  if (last.type === 'invalid') return { ok: false, code: 'OUTPUT_INVALID' }
  // 두 번 모두 시도당 제한에 걸렸다면 합계 제한과 같은 상황이다.
  return { ok: false, code: last.timeout ? 'TIMEOUT' : 'UPSTREAM_FAILED' }
}
