import { useId } from 'react'
import { INPUT_PAGE } from '@shared/messages'
import { fieldProps } from '../../state/validation'
import { FieldMessage } from '../ui/Field'
import { Input } from '../ui/Input'
import { Radio } from '../ui/Radio'
import { Textarea } from '../ui/Textarea'
import type { SectionProps } from './BasicInfoSection'

export function InternSection({ draft, onChange, feedback }: SectionProps) {
  const name = useId()
  const labelId = `${name}-label`
  const choiceError = feedback.errors['intern.has']
  const errorId = `${name}-error`
  return (
    <div className="form-stack">
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={choiceError ? errorId : undefined}
        className="form-stack"
      >
        <p className="group__title" id={labelId}>
          {INPUT_PAGE.internGroup} <span className="group__badge">(필수)</span>
        </p>
        <Radio
          name={name}
          label={INPUT_PAGE.internHas}
          data-field="intern.has"
          checked={draft.internHas === true}
          onChange={() => onChange({ internHas: true })}
        />
        <Radio
          name={name}
          label={INPUT_PAGE.internNone}
          checked={draft.internHas === false}
          onChange={() => onChange({ internHas: false })}
        />
        {choiceError ? (
          <FieldMessage kind="error" id={errorId}>
            {choiceError}
          </FieldMessage>
        ) : null}
      </div>
      {draft.internHas === true ? (
        <>
          <Textarea
            label={INPUT_PAGE.internContent}
            {...fieldProps(feedback, 'intern.content')}
            required
            maxLength={400}
            value={draft.internContent}
            onChange={(e) => onChange({ internContent: e.target.value })}
          />
          <Input
            label={INPUT_PAGE.internPeriod}
            {...fieldProps(feedback, 'intern.period')}
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
