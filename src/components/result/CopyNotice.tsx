import { Alert } from '../ui/Alert'
import { COPY_MESSAGES } from '@shared/messages'

export type CopyStatus = 'idle' | 'success' | 'error'

// 낭독기가 변경을 알리도록 live region 컨테이너는 항상 렌더한다(aria-live=polite, design §14).
// 안쪽 Alert는 스스로 알리지 않는다(announce=false). 중첩 live region의 이중 낭독을 막기 위해서이다.
export function CopyNotice({ status }: { status: CopyStatus }) {
  return (
    <div aria-live="polite" className="no-print">
      {status === 'success' ? (
        <Alert variant="success" announce={false}>
          {COPY_MESSAGES.success}
        </Alert>
      ) : null}
      {status === 'error' ? (
        <Alert variant="error" announce={false}>
          {COPY_MESSAGES.error}
        </Alert>
      ) : null}
    </div>
  )
}
