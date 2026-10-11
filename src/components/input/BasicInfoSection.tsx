import { INPUT_PAGE } from '@shared/messages'
import type { EducationLevel, EducationStatus } from '@shared/schema'
import type { InputDraft } from '../../state/draft'
import type { Feedback } from '../../state/validation'
import { fieldProps } from '../../state/validation'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { RepeatableRows } from './RepeatableRows'

export interface SectionProps {
  draft: InputDraft
  onChange: (patch: Partial<InputDraft>) => void
  /** 제출 뒤의 오류와 경고(T085~T087) */
  feedback: Feedback
}

export function BasicInfoSection({ draft, onChange, feedback }: SectionProps) {
  return (
    <div className="form-stack">
      {/* 나이는 화면 입력과 표시에만 쓰이고 생성 요청에는 전달하지 않는다(FR-004). */}
      <div className="field--age">
        <Input
          label={INPUT_PAGE.ageLabel}
          {...fieldProps(feedback, 'age')}
          required
          hint={INPUT_PAGE.ageHint}
          placeholder={INPUT_PAGE.agePlaceholder}
          inputMode="numeric"
          maxLength={3}
          value={draft.age}
          onChange={(e) => onChange({ age: e.target.value })}
        />
      </div>
      <Select
        label={INPUT_PAGE.levelLabel}
        {...fieldProps(feedback, 'level')}
        required
        placeholder={INPUT_PAGE.select}
        options={INPUT_PAGE.levelOptions.map((o) => ({ ...o }))}
        value={draft.level}
        onChange={(e) => onChange({ level: e.target.value as '' | EducationLevel })}
      />
      <Select
        label={INPUT_PAGE.statusLabel}
        {...fieldProps(feedback, 'status')}
        required
        placeholder={INPUT_PAGE.select}
        options={INPUT_PAGE.statusOptions.map((o) => ({ ...o }))}
        value={draft.status}
        onChange={(e) => onChange({ status: e.target.value as '' | EducationStatus })}
      />
      <div className="group">
        <h3 className="group__title">
          {INPUT_PAGE.majorLabel} <span className="group__badge">(선택)</span>
        </h3>
        <p className="field__hint">{INPUT_PAGE.majorHint}</p>
        <RepeatableRows<string>
          rowLabel={INPUT_PAGE.majorLabel}
          addLabel={INPUT_PAGE.majorAdd}
          items={draft.majors}
          onChange={(majors) => onChange({ majors })}
          createEmpty={() => ''}
          max={6}
          renderRow={(value, i, update) => (
            <Input
              label={`${INPUT_PAGE.majorLabel} ${i + 1}`}
              hideLabel
              {...fieldProps(feedback, `majors.${i}`)}
              maxLength={100}
              value={value}
              onChange={(e) => update(e.target.value)}
            />
          )}
        />
      </div>
    </div>
  )
}
