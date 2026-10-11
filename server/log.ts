// 안전한 로거(T093, 원칙 VI). 기록하는 것은 requestId, 단계, 결과 코드, 소요 시간, 재요청 여부, 오류 이름뿐이다.
// 요청·응답 본문, 입력 값, 프롬프트, 모델 응답, Error.message·스택, Zod 오류의 received 값은 받지도 기록하지도 않는다.

export interface LogEntry {
  requestId: string
  step: string
  /** 결과 코드(ApiErrorCode 또는 'ok'). 자유 문자열을 넣지 않는다. */
  result: string
  ms?: number
  retried?: boolean
  /** 오류 클래스 이름만. */
  errorName?: string
  /** 의미 검증에서 실패한 규칙 번호(V1~V15, SCHEMA)만. */
  rules?: string[]
}

type Sink = (line: string) => void

let sink: Sink = (line) => {
  process.stdout.write(`${line}\n`)
}

/** 테스트에서 출력을 가로챌 때 쓴다. 인자를 생략하면 표준 출력으로 되돌린다. */
export function setLogSink(next?: Sink): void {
  sink =
    next ??
    ((line) => {
      process.stdout.write(`${line}\n`)
    })
}

/** 오류 객체에서 클래스 이름만 꺼낸다. message와 stack은 읽지 않는다. */
export function errorName(error: unknown): string {
  const name = error instanceof Error ? error.name : 'UnknownError'
  return /^[A-Za-z0-9_]{1,40}$/.test(name) ? name : 'Error'
}

const SAFE_RULE = /^(V\d{1,2}|SCHEMA)$/

export function log(entry: LogEntry): void {
  const safe: LogEntry = {
    requestId: entry.requestId.slice(0, 40),
    step: entry.step.slice(0, 40),
    result: entry.result.slice(0, 40),
  }
  if (entry.ms !== undefined) safe.ms = Math.round(entry.ms)
  if (entry.retried !== undefined) safe.retried = entry.retried
  if (entry.errorName) safe.errorName = entry.errorName.slice(0, 40)
  if (entry.rules) safe.rules = entry.rules.filter((r) => SAFE_RULE.test(r))
  try {
    sink(JSON.stringify(safe))
  } catch {
    // 로그 실패가 요청 처리를 막지 않는다.
  }
}
