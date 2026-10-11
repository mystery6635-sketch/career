import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AI_TRANSMISSION_NOTICE, NOTICE_LINES, PRIVACY_NOTICE } from '@shared/messages'
import { applicantToDraft, draftToRequest, emptyDraft } from '../../src/state/draft'
import { initialState, sessionReducer } from '../../src/state/session'
import { requiredDoneCount, sectionInfos } from '../../src/state/sectionStatus'
import { PERSONAS } from '../../src/mock/personas'
import { errorToVariant } from '../../src/state/errorVariant'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

const design = readFileSync('specs/001-job-recommendation-keywords/design.md', 'utf8')

describe('문구 단일 원천 (T038)', () => {
  it('안내문 두 줄이 design §2 확정 문구와 같다', () => {
    expect(design).toContain(NOTICE_LINES[0])
    expect(design).toContain(NOTICE_LINES[1])
  })

  it('개인정보 안내와 외부 AI 전송 안내가 design §2와 같다', () => {
    expect(design).toContain(PRIVACY_NOTICE)
    expect(design).toContain(AI_TRANSMISSION_NOTICE)
  })

  it.each([NOTICE_LINES[0], NOTICE_LINES[1], PRIVACY_NOTICE, AI_TRANSMISSION_NOTICE])(
    '"%s"의 정의는 shared/messages.ts 한 곳뿐이다(복사 금지)',
    (text) => {
      const files = [...sourceFiles('src'), ...sourceFiles('shared'), ...sourceFiles('server')].filter(
        (f) => readFileSync(f, 'utf8').includes(text),
      )
      expect(files.map((f) => f.replaceAll('\\', '/'))).toEqual(['shared/messages.ts'])
    },
  )
})

describe('브라우저 저장소 미사용 (T036, FR-025)', () => {
  it('src, shared에 localStorage·sessionStorage·document.cookie·indexedDB 사용이 없다', () => {
    const offenders = [...sourceFiles('src'), ...sourceFiles('shared')].filter((f) =>
      /localStorage|sessionStorage|document\.cookie|indexedDB/.test(readFileSync(f, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})

describe('세션 리듀서 (T036)', () => {
  const result = { jobs: [], keywords: [], notice: ['a', 'b'], generatedAt: '' } as never

  it('기본 상태는 idle이고 입력은 비어 있다', () => {
    const s = initialState()
    expect(s.status).toBe('idle')
    expect(s.result).toBeNull()
  })

  it('이전 요청의 늦은 응답은 무시한다', () => {
    let s = sessionReducer(initialState(), { type: 'start', requestId: 'req-2' })
    s = sessionReducer(s, { type: 'success', requestId: 'req-1', result })
    expect(s.status).toBe('loading')
    s = sessionReducer(s, { type: 'slow', requestId: 'req-1' })
    expect(s.status).toBe('loading')
  })

  it('재생성이 성공하면 regenerated, 실패하면 이전 결과가 사라진다(FR-024)', () => {
    let s = sessionReducer(initialState(), { type: 'start', requestId: 'req-1' })
    s = sessionReducer(s, { type: 'success', requestId: 'req-1', result })
    expect(s.regenerated).toBe(false)
    s = sessionReducer(s, { type: 'start', requestId: 'req-2' })
    const failed = sessionReducer(s, { type: 'fail', requestId: 'req-2', error: { code: 'INTERNAL', message: 'x', requestId: 'c_1' } })
    expect(failed.result).toBeNull()
    expect(failed.status).toBe('error')
    const ok = sessionReducer(s, { type: 'success', requestId: 'req-2', result })
    expect(ok.regenerated).toBe(true)
  })

  it('화면을 떠나면(discard) 입력은 유지되고 결과는 폐기된다', () => {
    const input = { ...emptyDraft(), age: '30' }
    let s = sessionReducer(initialState(), { type: 'setInput', input })
    s = sessionReducer(s, { type: 'start', requestId: 'req-1' })
    s = sessionReducer(s, { type: 'discard' })
    expect(s.status).toBe('idle')
    expect(s.input.age).toBe('30')
  })
})

describe('입력 초안과 요청 (T046, FR-004)', () => {
  it('생성 요청에는 나이가 들어가지 않는다', () => {
    const request = draftToRequest(applicantToDraft(PERSONAS.P3))
    expect(request).not.toHaveProperty('age')
    expect(JSON.stringify(request)).not.toContain('56')
  })

  it('"없음"을 선택하면 입력해 둔 행은 요청에서 제외된다', () => {
    const draft = { ...applicantToDraft(PERSONAS.P2), noCareer: true, noCertifications: true }
    const request = draftToRequest(draft)
    expect(request.careers).toEqual([])
    expect(request.certifications).toEqual([])
  })

  it('신규 진입자 페르소나는 noCareer=true이다', () => {
    expect(PERSONAS.P1.noCareer).toBe(true)
  })
})

describe('섹션 상태 (T045)', () => {
  it('빈 입력은 필수 0/4이다', () => {
    expect(requiredDoneCount(emptyDraft())).toEqual({ done: 0, total: 4 })
    expect(sectionInfos(emptyDraft())[3].status).toBe('optional')
  })

  it('P4 페르소나는 필수 4/4이다', () => {
    expect(requiredDoneCount(applicantToDraft(PERSONAS.P4))).toEqual({ done: 4, total: 4 })
  })
})

describe('오류 코드 → 상태 화면 (T058)', () => {
  it.each([
    ['RATE_LIMITED', 'rate-limited'],
    ['OUTPUT_INVALID', 'invalid-output'],
    ['TIMEOUT', 'timeout'],
    ['UPSTREAM_FAILED', 'failed'],
    ['INTERNAL', 'failed'],
    [undefined, 'failed'],
  ] as const)('%s → %s', (code, variant) => {
    expect(errorToVariant(code)).toBe(variant)
  })
})
