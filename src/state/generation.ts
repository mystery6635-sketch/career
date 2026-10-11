import type { AiService } from '../services/ai/types'

export const SLOW_AFTER_MS = 30_000
export const TIMEOUT_AFTER_MS = 120_000

export interface RequestToken {
  requestId: string
  signal: AbortSignal
  /** 이 요청이 아직 현재 요청인가(이미 떠났거나 새 요청이 시작되지 않았는가) */
  isCurrent: () => boolean
}

/** 요청 하나의 수명(중단 신호, 30초·120초 타이머, 중복 방지)을 관리한다. 화면 상태가 아니라 부수 효과 쪽 객체이다. */
export class GenerationController {
  private abortController: AbortController | null = null
  private slowTimer: ReturnType<typeof setTimeout> | null = null
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null
  private timedOutFlag = false
  private counter = 0
  private servicePromise: Promise<AiService> | null

  constructor(service?: AiService) {
    this.servicePromise = service ? Promise.resolve(service) : null
  }

  /** Mock 시나리오(fail-once 등)가 호출 횟수를 기억하도록 서비스는 한 번만 만든다. */
  service(factory: () => Promise<AiService>): Promise<AiService> {
    this.servicePromise ??= factory()
    return this.servicePromise
  }

  get running(): boolean {
    return this.abortController !== null
  }

  get timedOut(): boolean {
    return this.timedOutFlag
  }

  /** 새 요청을 시작한다. 이미 진행 중이면 null(중복 제출 불가). */
  begin(onSlow: (requestId: string) => void): RequestToken | null {
    if (this.abortController) return null
    this.counter += 1
    const requestId = `req-${this.counter}`
    const controller = new AbortController()
    this.abortController = controller
    this.timedOutFlag = false
    this.slowTimer = setTimeout(() => onSlow(requestId), SLOW_AFTER_MS)
    this.timeoutTimer = setTimeout(() => {
      this.timedOutFlag = true
      controller.abort()
    }, TIMEOUT_AFTER_MS)
    return { requestId, signal: controller.signal, isCurrent: () => this.abortController === controller }
  }

  /** 응답이 도착한 현재 요청을 끝낸다. */
  finish(token: RequestToken): void {
    if (!token.isCurrent()) return
    this.clearTimers()
    this.abortController = null
  }

  /** 분석 중 화면을 떠날 때: 요청을 중단한다. */
  cancel(): void {
    this.clearTimers()
    this.abortController?.abort()
    this.abortController = null
  }

  private clearTimers(): void {
    if (this.slowTimer) clearTimeout(this.slowTimer)
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer)
    this.slowTimer = null
    this.timeoutTimer = null
  }
}
