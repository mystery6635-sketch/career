import { createHttpService } from './http'
import type { AiService, MockScenario } from './types'

// 앱을 처음 열 때의 주소 쿼리를 한 번만 읽는다(화면 이동으로 쿼리가 사라져도 유지).
const initialSearch = typeof window === 'undefined' ? '' : window.location.search
const params = new URLSearchParams(initialSearch)

/** 개발 환경의 ?mock= 쿼리 또는 VITE_AI_MODE=mock. 프로덕션 빌드에서는 상수로 false가 되어 mock 코드가 제거된다. */
const MOCK_ENABLED = import.meta.env.VITE_AI_MODE === 'mock' || (import.meta.env.DEV && params.has('mock'))

export async function createAiService(): Promise<AiService> {
  if (MOCK_ENABLED) {
    const { createMockService } = await import('./mock')
    return createMockService((params.get('mock') ?? 'ok') as MockScenario, params.get('persona') ?? undefined)
  }
  return createHttpService()
}
