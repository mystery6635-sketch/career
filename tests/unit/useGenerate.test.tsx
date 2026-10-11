import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useGenerate } from '../../src/hooks/useGenerate'
import { MOCK_RESULTS } from '../../src/mock/results'
import { SessionProvider, useSession } from '../../src/state/session'
import type { AiService } from '../../src/services/ai/types'

function setup(service: AiService) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider service={service}>{children}</SessionProvider>
  )
  return renderHook(() => ({ gen: useGenerate(), session: useSession() }), { wrapper })
}

/** 중단 신호가 오기 전에는 끝나지 않는 서비스 */
const hanging = (): AiService => ({
  generate: (_req, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }),
})

describe('useGenerate (T053)', () => {
  it('30초에 slow, 120초에 시간 초과(TIMEOUT)로 바뀐다', async () => {
    vi.useFakeTimers()
    const { result } = setup(hanging())
    act(() => void result.current.gen.start())
    expect(result.current.session.state.status).toBe('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_999)
    })
    expect(result.current.session.state.status).toBe('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(result.current.session.state.status).toBe('slow')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000)
    })
    expect(result.current.session.state.status).toBe('error')
    expect(result.current.session.state.error?.code).toBe('TIMEOUT')
    vi.useRealTimers()
  })

  it('실패 후 다시 시도하면 0초부터 다시 센다', async () => {
    vi.useFakeTimers()
    const { result } = setup(hanging())
    act(() => void result.current.gen.start())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000)
    })
    expect(result.current.session.state.error?.code).toBe('TIMEOUT')
    act(() => void result.current.gen.start())
    expect(result.current.session.state.status).toBe('loading')
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_999)
    })
    expect(result.current.session.state.status).toBe('loading')
    vi.useRealTimers()
  })

  it('진행 중 중복 제출은 차단된다', async () => {
    const generate = vi.fn(hanging().generate)
    const { result } = setup({ generate })
    act(() => void result.current.gen.start())
    act(() => void result.current.gen.start())
    await act(async () => {})
    expect(generate).toHaveBeenCalledTimes(1)
    expect(result.current.gen.busy).toBe(true)
  })

  it('분석 중 이탈(abort)하면 요청이 중단되고 입력은 유지, 결과는 없다', async () => {
    let aborted = false
    const service: AiService = {
      generate: (_req, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }),
    }
    const { result } = setup(service)
    act(() => result.current.session.setInput({ ...result.current.session.state.input, age: '41' }))
    act(() => void result.current.gen.start())
    await act(async () => {})
    act(() => result.current.gen.abort())
    await act(async () => {})
    expect(aborted).toBe(true)
    const s = result.current.session.state
    expect(s.status).toBe('idle')
    expect(s.result).toBeNull()
    expect(s.input.age).toBe('41')
  })

  it('성공 응답은 success 상태와 결과를 만든다', async () => {
    const { result } = setup({ generate: async () => ({ ok: true, result: MOCK_RESULTS.P1 }) })
    await act(async () => {
      await result.current.gen.start()
    })
    expect(result.current.session.state.status).toBe('success')
    expect(result.current.session.state.result).toBe(MOCK_RESULTS.P1)
  })

  it('오류 응답은 error 상태와 코드를 남기고 이전 결과를 숨긴다', async () => {
    let n = 0
    const { result } = setup({
      generate: async () =>
        ++n === 1
          ? { ok: true, result: MOCK_RESULTS.P1 }
          : { ok: false, error: { code: 'RATE_LIMITED', message: 'x' } },
    })
    await act(async () => {
      await result.current.gen.start()
    })
    await act(async () => {
      await result.current.gen.start()
    })
    expect(result.current.session.state.status).toBe('error')
    expect(result.current.session.state.error?.code).toBe('RATE_LIMITED')
    expect(result.current.session.state.result).toBeNull()
  })
})
