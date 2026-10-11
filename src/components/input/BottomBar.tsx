import { INPUT_PAGE, requiredProgress } from '@shared/messages'
import { Button } from '../ui/Button'

interface BottomBarProps {
  done: number
  total: number
  busy: boolean
  onGenerate: () => void
}

// 하단 고정 바. 진행은 막대 없이 텍스트로만 알린다(design §11).
export function BottomBar({ done, total, busy, onGenerate }: BottomBarProps) {
  return (
    <div className="bottom-bar no-print">
      <div className="bottom-bar__inner">
        <p className="bottom-bar__text">{requiredProgress(done, total)}</p>
        <Button variant="teal" icon="→" onClick={onGenerate} disabled={busy} block>
          {INPUT_PAGE.generate}
        </Button>
      </div>
    </div>
  )
}
