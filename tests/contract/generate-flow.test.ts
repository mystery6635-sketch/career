// T099 생성 흐름: 재요청은 정확히 1회, 실패 코드 변환, 가짜 번호 거부, notice는 모델 출력과 무관하게 항상 붙는다.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NOTICE_LINES } from '../../shared/messages'
import { UpstreamError, type LlmFn } from '../../server/ai/client'
import { generateResult, TOTAL_TIMEOUT_MS } from '../../server/ai/generate'
import { setLogSink } from '../../server/log'
import { validModelOutput, validRequest } from './fixtures'

const good = () => JSON.stringify(validModelOutput())
const request = validRequest()

function scripted(...steps: (string | Error)[]) {
  const calls: { system: string; user: string; timeoutMs: number }[] = []
  const llm: LlmFn = async (req, opts) => {
    calls.push({ ...req, timeoutMs: opts.timeoutMs })
    const step = steps[Math.min(calls.length - 1, steps.length - 1)]
    if (step instanceof Error) throw step
    return step
  }
  return { llm, calls }
}

beforeEach(() => setLogSink(() => undefined))
afterEach(() => setLogSink())

describe('generateResult', () => {
  it('첫 응답이 성공하면 호출은 1회', async () => {
    const { llm, calls } = scripted(good())
    const out = await generateResult(request, { llm, requestId: 'r_t' })
    expect(out.ok).toBe(true)
    expect(calls).toHaveLength(1)
  })

  it('첫 응답 실패 -> 두 번째 성공 -> 호출 정확히 2회, 재요청에는 규칙 번호만 담긴다', async () => {
    const bad = JSON.stringify({ ...validModelOutput(), jobs: validModelOutput().jobs.slice(0, 2) })
    const { llm, calls } = scripted(bad, good())
    const out = await generateResult(request, { llm, requestId: 'r_t' })
    expect(out.ok).toBe(true)
    expect(calls).toHaveLength(2)
    expect(calls[1].user).toContain('V1')
    expect(calls[1].user.startsWith(calls[0].user)).toBe(true)
    expect(calls[1].user).not.toContain('상담 지원 담당자') // 실패한 응답 본문은 넣지 않는다
    expect(calls[1].system).toBe(calls[0].system)
  })

  it('JSON이 아닌 응답은 V13으로 재요청한다', async () => {
    const { llm, calls } = scripted('죄송합니다. 결과는 다음과 같습니다.', good())
    expect((await generateResult(request, { llm, requestId: 'r_t' })).ok).toBe(true)
    expect(calls[1].user).toContain('V13')
  })

  it('두 번 모두 실패 -> OUTPUT_INVALID, 호출은 2회뿐', async () => {
    const { llm, calls } = scripted('형식 오류')
    expect(await generateResult(request, { llm, requestId: 'r_t' })).toEqual({ ok: false, code: 'OUTPUT_INVALID' })
    expect(calls).toHaveLength(2)
  })

  it('가짜 항목 번호 지목 -> 거부(V3)하고 재요청', async () => {
    const fake = validModelOutput()
    fake.jobs[0].linkedInputs.push({ field: 'certification', index: 9 })
    const { llm, calls } = scripted(JSON.stringify(fake), good())
    expect((await generateResult(request, { llm, requestId: 'r_t' })).ok).toBe(true)
    expect(calls).toHaveLength(2)
    expect(calls[1].user).toContain('V3')
    const { llm: llm2 } = scripted(JSON.stringify(fake))
    expect(await generateResult(request, { llm: llm2, requestId: 'r_t' })).toEqual({ ok: false, code: 'OUTPUT_INVALID' })
  })

  it('notice는 모델 출력과 무관하게 항상 서버 고정 문구 두 줄이다', async () => {
    const withFakeNotice = { ...validModelOutput(), notice: ['모델이 만든 안내문', '취업을 보장합니다'] }
    for (const text of [good(), JSON.stringify(withFakeNotice)]) {
      const out = await generateResult(request, { llm: scripted(text).llm, requestId: 'r_t' })
      expect(out.ok).toBe(true)
      if (out.ok) {
        expect(out.result.notice).toEqual([NOTICE_LINES[0], NOTICE_LINES[1]])
        expect(typeof out.result.generatedAt).toBe('string')
      }
    }
  })

  it('표시용 값은 서버가 실제 입력에서 만든다', async () => {
    const out = await generateResult(request, { llm: scripted(good()).llm, requestId: 'r_t' })
    expect(out.ok).toBe(true)
    if (!out.ok) return
    const { jobs, keywords } = out.result
    expect(jobs[0].linkedInputs[0]).toEqual({ field: 'major', index: 0, label: '전공', value: '사회복지학' })
    expect(jobs[0].linkedInputs[1]).toMatchObject({ field: 'career', label: '경력', value: '생활지도 교사 · 지역아동센터 · 2년' })
    expect(keywords[1].strengthText).toBe(request.strengths[1])
    expect(keywords[2].linkedJobTitle).toBe(jobs[2].title)
  })

  it('호출 실패 후 재요청이 성공하면 성공, 두 번 실패하면 UPSTREAM_FAILED', async () => {
    const retry = scripted(new UpstreamError('error'), good())
    expect((await generateResult(request, { llm: retry.llm, requestId: 'r_t' })).ok).toBe(true)
    expect(retry.calls).toHaveLength(2)
    expect(retry.calls[1].user).toBe(retry.calls[0].user)

    const down = scripted(new UpstreamError('rate_limit'))
    expect(await generateResult(request, { llm: down.llm, requestId: 'r_t' })).toEqual({ ok: false, code: 'UPSTREAM_FAILED' })
    expect(down.calls).toHaveLength(2)
  })

  it('시도 제한 시간 초과가 반복되면 TIMEOUT', async () => {
    const { llm } = scripted(new UpstreamError('timeout'))
    expect(await generateResult(request, { llm, requestId: 'r_t' })).toEqual({ ok: false, code: 'TIMEOUT' })
  })

  it('합계 110초를 넘기면 재요청 없이 TIMEOUT, 시도 제한은 남은 시간을 넘지 않는다', async () => {
    let t = 0
    const calls: number[] = []
    const llm: LlmFn = async (_r, o) => {
      calls.push(o.timeoutMs)
      t += 120_000
      return '형식 오류'
    }
    const out = await generateResult(request, { llm, requestId: 'r_t', now: () => t })
    expect(out).toEqual({ ok: false, code: 'TIMEOUT' })
    expect(calls).toEqual([55_000])
    expect(TOTAL_TIMEOUT_MS).toBe(110_000)

    let t2 = 0
    const calls2: number[] = []
    const llm2: LlmFn = async (_r, o) => {
      calls2.push(o.timeoutMs)
      t2 += 70_000
      return '형식 오류'
    }
    await generateResult(request, { llm: llm2, requestId: 'r_t', now: () => t2 })
    expect(calls2).toEqual([55_000, 40_000])
  })

  it('프롬프트에 나이가 없다', async () => {
    const { llm, calls } = scripted(good())
    await generateResult(request, { llm, requestId: 'r_t' })
    expect(calls[0].user).not.toMatch(/age|나이/)
    vi.restoreAllMocks()
  })
})
