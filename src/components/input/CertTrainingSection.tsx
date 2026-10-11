import { INPUT_PAGE } from '@shared/messages'
import { emptyTraining } from '../../state/draft'
import type { Training } from '@shared/types'
import { Input } from '../ui/Input'
import { NoneChoice } from './NoneChoice'
import { RepeatableRows } from './RepeatableRows'
import type { SectionProps } from './BasicInfoSection'

export function CertTrainingSection({ draft, onChange }: SectionProps) {
  return (
    <div className="form-stack">
      <div className="group">
        <h3 className="group__title">
          {INPUT_PAGE.certLabel} <span className="group__badge">(선택)</span>
        </h3>
        <p className="field__hint">{INPUT_PAGE.certHint}</p>
        <NoneChoice
          label={INPUT_PAGE.noCert}
          checked={draft.noCertifications}
          onChange={(noCertifications) => onChange({ noCertifications })}
        >
          {({ disabled, disabledReason }) => (
            <RepeatableRows<string>
              rowLabel={INPUT_PAGE.certLabel}
              addLabel={INPUT_PAGE.certAdd}
              items={draft.certifications}
              onChange={(certifications) => onChange({ certifications })}
              createEmpty={() => ''}
              max={20}
              disabled={disabled}
              disabledReason={disabledReason}
              renderRow={(value, i, update) => (
                <Input
                  label={`${INPUT_PAGE.certLabel} ${i + 1}`}
                  hideLabel
                  maxLength={100}
                  value={value}
                  onChange={(e) => update(e.target.value)}
                />
              )}
            />
          )}
        </NoneChoice>
      </div>

      <div className="group">
        <h3 className="group__title">
          {INPUT_PAGE.trainingRow} <span className="group__badge">(선택)</span>
        </h3>
        <p className="field__hint">{INPUT_PAGE.trainingHint}</p>
        <NoneChoice
          label={INPUT_PAGE.noTraining}
          checked={draft.noTrainings}
          onChange={(noTrainings) => onChange({ noTrainings })}
        >
          {({ disabled, disabledReason }) => (
            <RepeatableRows<Training>
              rowLabel={INPUT_PAGE.trainingRow}
              addLabel={INPUT_PAGE.trainingAdd}
              items={draft.trainings}
              onChange={(trainings) => onChange({ trainings })}
              createEmpty={emptyTraining}
              max={20}
              disabled={disabled}
              disabledReason={disabledReason}
              renderRow={(training, i, update) => (
                <div className="form-grid" role="group" aria-label={`${INPUT_PAGE.trainingRow} ${i + 1}`}>
                  <Input
                    label={INPUT_PAGE.trainingFields.courseName}
                    placeholder={INPUT_PAGE.trainingPlaceholders.courseName}
                    maxLength={100}
                    value={training.courseName}
                    onChange={(e) => update({ ...training, courseName: e.target.value })}
                  />
                  <Input
                    label={INPUT_PAGE.trainingFields.period}
                    placeholder={INPUT_PAGE.trainingPlaceholders.period}
                    maxLength={50}
                    value={training.period}
                    onChange={(e) => update({ ...training, period: e.target.value })}
                  />
                </div>
              )}
            />
          )}
        </NoneChoice>
      </div>
    </div>
  )
}
