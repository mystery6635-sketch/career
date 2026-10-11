import type { StatusVariant } from '@shared/messages'
import type { ApiErrorCode } from '@shared/schema'

/** 오류 코드 → 상태 화면(design §14, contracts/generate-api.md 3절). */
export function errorToVariant(code: ApiErrorCode | undefined): StatusVariant {
  switch (code) {
    case 'RATE_LIMITED':
      return 'rate-limited'
    case 'OUTPUT_INVALID':
      return 'invalid-output'
    case 'TIMEOUT':
      return 'timeout'
    default:
      // UPSTREAM_FAILED, INTERNAL, 네트워크 오류. 입력 검증 오류(VALIDATION_FAILED, PII_DETECTED)는
      // Phase 5에서 입력 화면 오류로 연결한다.
      return 'failed'
  }
}
