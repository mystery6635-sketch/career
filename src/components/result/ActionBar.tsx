import { RESULT_PAGE } from '@shared/messages'
import { Button } from '../ui/Button'
import { CopyNotice, type CopyStatus } from './CopyNotice'

interface ActionBarProps {
  copyStatus: CopyStatus
  copied: boolean
  busy: boolean
  onCopy: () => void
  onPrint: () => void
  onEdit: () => void
  onRegenerate: () => void
}

// [결과 복사하기(주)] [인쇄하기] [상담 이력으로 저장] | [입력 수정하기] [다시 생성하기] + 상태 알림 영역
export function ActionBar({ copyStatus, copied, busy, onCopy, onPrint, onEdit, onRegenerate }: ActionBarProps) {
  const a = RESULT_PAGE.actions
  return (
    <div className="action-bar no-print">
      <div className="action-bar__buttons">
        <div className="action-bar__group">
          <Button variant="teal" size="sm" icon="⧉" onClick={onCopy}>
            {copied ? a.copied : a.copy}
          </Button>
          <Button variant="outline" size="sm" icon="⎙" onClick={onPrint}>
            {a.print}
          </Button>
          <Button variant="outline" size="sm" icon="▤" disabled disabledReason={a.saveDisabled}>
            {a.save}
          </Button>
        </div>
        <div className="action-bar__group">
          <Button variant="outline" size="sm" icon="✎" onClick={onEdit}>
            {a.edit}
          </Button>
          <Button variant="outline" size="sm" icon="↻" onClick={onRegenerate} disabled={busy}>
            {a.regenerate}
          </Button>
        </div>
      </div>
      <CopyNotice status={copyStatus} />
    </div>
  )
}
