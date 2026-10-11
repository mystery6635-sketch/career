// T093 안전한 로거: 허용된 필드만 기록하고, 입력 문자열·오류 메시지가 출력에 없다.
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { errorName, log, setLogSink } from '../../server/log'

let lines: string[] = []
beforeEach(() => {
  lines = []
  setLogSink((l) => lines.push(l))
})
afterEach(() => setLogSink())

describe('log', () => {
  it('요청 식별자, 단계, 결과, 소요 시간, 재요청 여부, 오류 이름만 기록한다', () => {
    log({ requestId: 'r_1', step: 'llm_call', result: 'UPSTREAM_FAILED', ms: 12.7, retried: true, errorName: 'UpstreamError', rules: ['V8', 'SCHEMA'] })
    expect(JSON.parse(lines[0])).toEqual({
      requestId: 'r_1',
      step: 'llm_call',
      result: 'UPSTREAM_FAILED',
      ms: 13,
      retried: true,
      errorName: 'UpstreamError',
      rules: ['V8', 'SCHEMA'],
    })
  })

  it('규칙 번호가 아닌 문자열은 버린다(입력 조각이 섞여도 기록되지 않는다)', () => {
    log({ requestId: 'r_1', step: 'validate', result: 'OUTPUT_INVALID', rules: ['V8', '가상 입력 문자열'] })
    expect(lines.join('')).not.toContain('가상 입력 문자열')
  })

  it('errorName은 클래스 이름만 꺼내고 message·stack은 읽지 않는다', () => {
    class SecretError extends Error {
      constructor() {
        super('비밀 입력 조각')
        this.name = 'SecretError'
      }
    }
    expect(errorName(new SecretError())).toBe('SecretError')
    expect(errorName(new SyntaxError('Unexpected token 가상 입력 in JSON'))).toBe('SyntaxError')
    expect(errorName('문자열 예외')).toBe('UnknownError')
    const odd = new Error('x')
    odd.name = '입력 조각이 이름에'
    expect(errorName(odd)).toBe('Error')
  })

  it('기본 출력은 표준 출력이다', () => {
    setLogSink()
    const original = process.stdout.write.bind(process.stdout)
    const written: string[] = []
    process.stdout.write = ((chunk: string) => (written.push(String(chunk)), true)) as typeof process.stdout.write
    try {
      log({ requestId: 'r_2', step: 'request', result: 'ok' })
    } finally {
      process.stdout.write = original
    }
    expect(written.join('')).toContain('"requestId":"r_2"')
  })
})
