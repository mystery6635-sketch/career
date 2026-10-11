import { INPUT_PAGE } from '@shared/messages'
import { emptyCareer } from '../../state/draft'
import type { Career } from '@shared/schema'
import { fieldProps } from '../../state/validation'
import { Input } from '../ui/Input'
import { NoneChoice } from './NoneChoice'
import { RepeatableRows } from './RepeatableRows'
import type { SectionProps } from './BasicInfoSection'

export function CareerSection({ draft, onChange, feedback }: SectionProps) {
  return (
    <div className="form-stack">
      <p className="field__hint">{INPUT_PAGE.careerHint}</p>
      <NoneChoice
        label={INPUT_PAGE.noCareer}
        checked={draft.noCareer}
        onChange={(noCareer) => onChange({ noCareer })}
        fieldKey="careers"
        error={feedback.errors.careers}
      >
      {({ disabled, disabledReason }) => (
        <RepeatableRows<Career>
          rowLabel={INPUT_PAGE.careerRow}
          addLabel={INPUT_PAGE.careerAdd}
          items={draft.careers}
          onChange={(careers) => onChange({ careers })}
          createEmpty={emptyCareer}
          max={20}
          disabled={disabled}
          disabledReason={disabledReason}
          renderRow={(career, i, update) => (
            <div className="form-grid" role="group" aria-label={`${INPUT_PAGE.careerRow} ${i + 1}`}>
              <Input
                label={INPUT_PAGE.careerFields.jobTitle}
                {...fieldProps(feedback, `careers.${i}.jobTitle`)}
                required
                placeholder={INPUT_PAGE.careerPlaceholders.jobTitle}
                maxLength={100}
                value={career.jobTitle}
                onChange={(e) => update({ ...career, jobTitle: e.target.value })}
              />
              <Input
                label={INPUT_PAGE.careerFields.industry}
                {...fieldProps(feedback, `careers.${i}.industry`)}
                required
                placeholder={INPUT_PAGE.careerPlaceholders.industry}
                maxLength={100}
                value={career.industry}
                onChange={(e) => update({ ...career, industry: e.target.value })}
              />
              <Input
                label={INPUT_PAGE.careerFields.period}
                {...fieldProps(feedback, `careers.${i}.period`)}
                required
                placeholder={INPUT_PAGE.careerPlaceholders.period}
                maxLength={50}
                value={career.period}
                onChange={(e) => update({ ...career, period: e.target.value })}
              />
            </div>
          )}
        />
      )}
      </NoneChoice>
    </div>
  )
}
