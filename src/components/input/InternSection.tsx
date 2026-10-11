import { useId } from 'react'
import { INPUT_PAGE } from '@shared/messages'
import { Input } from '../ui/Input'
import { Radio } from '../ui/Radio'
import { Textarea } from '../ui/Textarea'
import type { SectionProps } from './BasicInfoSection'

export function InternSection({ draft, onChange }: SectionProps) {
  const name = useId()
  const labelId = `${name}-label`
  return (
    <div className="form-stack">
      <div role="radiogroup" aria-labelledby={labelId} className="form-stack">
        <p className="group__title" id={labelId}>
          {INPUT_PAGE.internGroup} <span className="group__badge">(필수)</span>
        </p>
        <Radio
          name={name}
          label={INPUT_PAGE.internHas}
          checked={draft.internHas === true}
          onChange={() => onChange({ internHas: true })}
        />
        <Radio
          name={name}
          label={INPUT_PAGE.internNone}
          checked={draft.internHas === false}
          onChange={() => onChange({ internHas: false })}
        />
      </div>
      {draft.internHas === true ? (
        <>
          <Textarea
            label={INPUT_PAGE.internContent}
            required
            maxLength={400}
            value={draft.internContent}
            onChange={(e) => onChange({ internContent: e.target.value })}
          />
          <Input
            label={INPUT_PAGE.internPeriod}
            required
            maxLength={50}
            value={draft.internPeriod}
            onChange={(e) => onChange({ internPeriod: e.target.value })}
          />
        </>
      ) : null}
    </div>
  )
}
