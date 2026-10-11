import { useCallback } from 'react'
import { draftToRequest } from '../state/draft'
import { useSession } from '../state/session'
import { clientError } from '../services/ai/types'

export { SLOW_AFTER_MS, TIMEOUT_AFTER_MS } from '../state/generation'

// 생성 흐름: 30초에 지연 안내, 120초에 중단(시간 초과), 한 번에 요청 하나, 늦게 온 응답 무시(FR-023, FR-024).
export function useGenerate() {
  const { state, dispatch, controller, getService } = useSession()

  /** 분석 중 화면을 떠날 때: 요청 중단, 입력 유지, 결과 폐기. */
  const abort = useCallback(() => {
    controller.cancel()
    dispatch({ type: 'discard' })
  }, [controller, dispatch])

  const start = useCallback(async () => {
    const token = controller.begin((requestId) => dispatch({ type: 'slow', requestId }))
    if (!token) return // 진행 중에는 중복 제출을 막는다.
    dispatch({ type: 'start', requestId: token.requestId })

    try {
      const service = await getService()
      const outcome = await service.generate(draftToRequest(state.input), { signal: token.signal })
      if (!token.isCurrent()) return // 이미 떠났거나 새 요청이 시작됨
      controller.finish(token)
      dispatch(
        outcome.ok
          ? { type: 'success', requestId: token.requestId, result: outcome.result }
          : { type: 'fail', requestId: token.requestId, error: outcome.error },
      )
    } catch {
      if (!token.isCurrent()) return
      const timedOut = controller.timedOut
      controller.finish(token)
      dispatch({
        type: 'fail',
        requestId: token.requestId,
        error: timedOut
          ? clientError('TIMEOUT', '시간이 너무 오래 걸렸어요.')
          : clientError('INTERNAL', '결과를 만들지 못했어요.'),
      })
    }
  }, [controller, dispatch, getService, state.input])

  const busy = state.status === 'loading' || state.status === 'slow'
  return { start, abort, busy }
}
