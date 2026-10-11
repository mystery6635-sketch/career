import { Alert } from 'initial-counseling-helper'

const wrap = { display: 'grid', gap: 12, maxWidth: 560 } as const

export function Info() {
  return (
    <div style={wrap}>
      <Alert variant="info" title="참고용 안내">
        결과는 참고용이며, 상담사와 함께 검토해 활용합니다.
      </Alert>
    </div>
  )
}

export function Warning() {
  return (
    <div style={wrap}>
      <Alert variant="warning">평소보다 오래 걸리고 있어요. 입력하신 내용은 그대로 유지됩니다. 조금만 더 기다려 주세요.</Alert>
    </div>
  )
}

export function Error() {
  return (
    <div style={wrap}>
      <Alert variant="error" title="입력 내용을 확인해 주세요">
        나이는 15~99 사이의 숫자로 입력해 주세요.
      </Alert>
    </div>
  )
}

export function Success() {
  return (
    <div style={wrap}>
      <Alert variant="success">결과를 복사했어요. 구직자 입력 정보는 포함되지 않아요.</Alert>
    </div>
  )
}
