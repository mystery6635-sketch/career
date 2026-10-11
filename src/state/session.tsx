// 세션 상태는 React 메모리에만 둔다. 저장소·쿠키·URL에 쓰지 않으며 새로고침하면 사라진다(FR-025, 원칙 VI).
import { createContext, useCallback, useContext, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react'
import type { ApiError, ResultPayload } from '@shared/schema'
import { createAiService } from '../services/ai'
import type { AiService } from '../services/ai/types'
import { emptyDraft, type InputDraft } from './draft'
import { GenerationController } from './generation'

export type GenerateStatus = 'idle' | 'loading' | 'slow' | 'success' | 'error'

export interface SessionState {
  input: InputDraft
  status: GenerateStatus
  result: ResultPayload | null
  error: ApiError | null
  /** 재생성 직후에만 true. 안내 문구 표시용 */
  regenerated: boolean
  requestId: string | null
  /** 이전 결과가 있는 상태에서 시작한 요청인지 */
  regenerating: boolean
}

export type SessionAction =
  | { type: 'setInput'; input: InputDraft }
  | { type: 'start'; requestId: string }
  | { type: 'slow'; requestId: string }
  | { type: 'success'; requestId: string; result: ResultPayload }
  | { type: 'fail'; requestId: string; error: ApiError }
  | { type: 'discard' }

export function initialState(): SessionState {
  return {
    input: emptyDraft(),
    status: 'idle',
    result: null,
    error: null,
    regenerated: false,
    requestId: null,
    regenerating: false,
  }
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'setInput':
      return { ...state, input: action.input }
    case 'start':
      return {
        ...state,
        status: 'loading',
        error: null,
        regenerated: false,
        requestId: action.requestId,
        regenerating: state.result !== null,
      }
    case 'slow':
      // 이전 요청의 늦은 알림은 무시한다.
      return action.requestId === state.requestId && state.status === 'loading'
        ? { ...state, status: 'slow' }
        : state
    case 'success':
      return action.requestId === state.requestId
        ? { ...state, status: 'success', result: action.result, error: null, regenerated: state.regenerating, regenerating: false }
        : state
    case 'fail':
      // 재생성이 실패하면 이전 결과는 보이지 않는다(FR-024).
      return action.requestId === state.requestId
        ? { ...state, status: 'error', result: null, error: action.error, regenerated: false, regenerating: false }
        : state
    case 'discard':
      // 분석 중 화면을 떠남: 요청 중단, 입력 유지, 결과 폐기
      return { ...state, status: 'idle', result: null, error: null, regenerated: false, requestId: null, regenerating: false }
  }
}

interface SessionContextValue {
  state: SessionState
  dispatch: Dispatch<SessionAction>
  controller: GenerationController
  getService: () => Promise<AiService>
  setInput: (input: InputDraft) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children, service }: { children: ReactNode; service?: AiService }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, initialState)
  const [controller] = useState(() => new GenerationController(service))

  const getService = useCallback(() => controller.service(createAiService), [controller])

  const setInput = useCallback((input: InputDraft) => dispatch({ type: 'setInput', input }), [])

  const value = useMemo(
    () => ({ state, dispatch, controller, getService, setInput }),
    [state, controller, getService, setInput],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('SessionProvider 안에서만 쓸 수 있어요.')
  return ctx
}
