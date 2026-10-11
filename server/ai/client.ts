// LLM 클라이언트(T098, 원칙 IX). 모든 LLM 호출 코드는 이 파일에만 있다. 공급자는 Anthropic(기본)과 테스트·개발용 mock이다.
// Anthropic은 SDK 대신 Messages API를 fetch로 직접 호출한다(새 의존성을 추가하지 않기 위해, 원칙 XV).
// 키는 서버 환경 변수에서 온 config로만 받는다. 오류에는 상태 분류만 담고 응답 본문·메시지는 담지 않는다.
import { ConfigError, isProduction, type MockMode, type ServerConfig } from '../config.js'

export interface LlmRequest {
  system: string
  user: string
}

/** 시도 한 번의 호출. timeoutMs를 넘기면 UpstreamError('timeout')으로 끝난다. */
export type LlmFn = (request: LlmRequest, options: { timeoutMs: number }) => Promise<string>

export type UpstreamKind = 'timeout' | 'rate_limit' | 'error'

/** 공급자 호출 실패. generate 흐름이 UPSTREAM_FAILED(또는 TIMEOUT)로 바꾼다. */
export class UpstreamError extends Error {
  kind: UpstreamKind
  constructor(kind: UpstreamKind) {
    super(kind)
    this.name = 'UpstreamError'
    this.kind = kind
  }
}

/** 시도당 제한 시간(contracts/generate-api.md 1절). */
export const ATTEMPT_TIMEOUT_MS = 55_000

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const MAX_OUTPUT_TOKENS = 2_000

export interface LlmDeps {
  fetch?: typeof fetch
}

export function createLlm(config: ServerConfig, deps: LlmDeps = {}): LlmFn {
  if (config.provider === 'mock') {
    if (isProduction()) throw new ConfigError('LLM_PROVIDER=mock is not allowed in production')
    return (request, options) => withTimeout(options.timeoutMs, (signal) => callMock(config.mockMode, request, signal))
  }
  const doFetch = deps.fetch ?? fetch
  return (request, options) =>
    withTimeout(options.timeoutMs, (signal) => callAnthropic(config, request, signal, doFetch))
}

/** 제한 시간 안에 끝나지 않으면 중단하고, 모든 실패를 UpstreamError로 통일한다. */
async function withTimeout(timeoutMs: number, run: (signal: AbortSignal) => Promise<string>): Promise<string> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  try {
    return await run(controller.signal)
  } catch (error) {
    if (timedOut) throw new UpstreamError('timeout')
    if (error instanceof UpstreamError) throw error
    throw new UpstreamError('error')
  } finally {
    clearTimeout(timer)
  }
}

async function callAnthropic(
  config: ServerConfig,
  request: LlmRequest,
  signal: AbortSignal,
  doFetch: typeof fetch,
): Promise<string> {
  const response = await doFetch(ANTHROPIC_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
    }),
  })
  // 공급자의 속도 제한(429)도 우리 쪽 요청 제한과 원인이 다르므로 UPSTREAM_FAILED로 취급한다.
  if (response.status === 429) throw new UpstreamError('rate_limit')
  if (!response.ok) throw new UpstreamError('error')
  const data = (await response.json()) as { content?: { type?: string; text?: string }[] }
  const text = (data.content ?? [])
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
  if (!text) throw new UpstreamError('error')
  return text
}

// ---------- mock 공급자(테스트·개발 전용, 프로덕션 거부) ----------

/** slow 모드의 지연. 시도당 제한(55초)보다 길다. */
const MOCK_SLOW_MS = 120_000

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new UpstreamError('timeout'))
      },
      { once: true },
    )
  })
}

async function callMock(mode: MockMode | undefined, request: LlmRequest, signal: AbortSignal): Promise<string> {
  switch (mode ?? 'ok') {
    case 'fail':
      throw new UpstreamError('error')
    case 'format-error':
      return '결과는 다음과 같습니다. (JSON이 아닌 응답)'
    case 'slow':
      await sleep(MOCK_SLOW_MS, signal)
      return mockOutput(request.user)
    default:
      return mockOutput(request.user)
  }
}

interface MockApplicant {
  noCareer?: boolean
  majors?: unknown[]
  careers?: unknown[]
  intern?: { has?: boolean }
  certifications?: unknown[]
  trainings?: unknown[]
}

type MockRef = { field: string; index?: number }

/** 사용자 메시지의 <applicant_data>를 읽어, 검증을 통과하는 가상 결과 JSON을 만든다. */
function mockOutput(userMessage: string): string {
  let applicant: MockApplicant = {}
  const match = /<applicant_data>\n([\s\S]*?)\n<\/applicant_data>/.exec(userMessage)
  if (match) {
    try {
      applicant = JSON.parse(match[1].replace(/<\\\/applicant_data/gi, '</applicant_data')) as MockApplicant
    } catch {
      applicant = {}
    }
  }
  const objective: MockRef[] = []
  if (applicant.majors?.length) objective.push({ field: 'major', index: 0 })
  if (!applicant.noCareer && applicant.careers?.length) objective.push({ field: 'career', index: 0 })
  if (applicant.intern?.has) objective.push({ field: 'intern' })
  if (applicant.certifications?.length) objective.push({ field: 'certification', index: 0 })
  if (applicant.trainings?.length) objective.push({ field: 'training', index: 0 })
  const career = objective.find((r) => r.field === 'career')

  const titles = ['사무 행정원', '고객 상담원', '교육 운영 담당자']
  const subtitles = ['문서와 일정 관리', '문의 응대와 안내', '교육 과정 운영 지원']
  const jobs = titles.map((title, i) => {
    const links: MockRef[] = [{ field: 'education' }]
    const extra = i === 0 && career ? career : objective.length ? objective[i % objective.length] : undefined
    if (extra) links.push(extra)
    links.push({ field: 'strength', index: i })
    return {
      title,
      subtitle: subtitles[i],
      isStandardName: true,
      rationale: [
        { text: '입력하신 학력과 이력을 바탕으로 살펴본 방향이에요.', needsConfirmation: false },
        { text: '실제 업무 범위는 상담에서 직접 확인이 필요해요.', needsConfirmation: true },
      ],
      linkedInputs: links,
      checkPoint: { text: '이 직업의 업무 범위는 상담에서 함께 확인해 보면 좋아요.', needsConfirmation: false },
    }
  })

  const names = ['꼼꼼함', '소통', '책임감']
  const keywords = names.map((keyword, i) => ({
    keyword,
    strengthIndex: i,
    linkedJobIndex: i,
    description: [
      { text: '자기소개서에서 이 강점을 구체적인 업무 장면과 함께 쓰면 좋아요.', needsConfirmation: false },
      { text: '입력한 이력과 연결해 한두 문장으로 풀어 보세요.', needsConfirmation: false },
    ],
    linkedInputs: [{ field: 'strength', index: i }, { field: 'education' }],
    mismatchNote: null,
  }))

  return JSON.stringify({ jobs, keywords })
}
