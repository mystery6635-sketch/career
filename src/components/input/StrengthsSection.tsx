import { INPUT_PAGE } from '@shared/messages'
import { Input } from '../ui/Input'
import type { SectionProps } from './BasicInfoSection'

// 강점 입력창은 정확히 3개이다(FR-008).
export function StrengthsSection({ draft, onChange }: SectionProps) {
  return (
    <div className="form-stack">
      <p className="field__hint">{INPUT_PAGE.strengthsHint}</p>
      {draft.strengths.map((value, i) => (
        <div className="strength-row" key={i}>
          <span className="strength-row__chip" aria-hidden="true">
            {i + 1}
          </span>
          <Input
            label={`강점 ${i + 1}`}
            required
            placeholder={INPUT_PAGE.strengthPlaceholders[i]}
            maxLength={100}
            value={value}
            onChange={(e) => {
              const strengths = [...draft.strengths] as [string, string, string]
              strengths[i] = e.target.value
              onChange({ strengths })
            }}
          />
        </div>
      ))}
    </div>
  )
}
