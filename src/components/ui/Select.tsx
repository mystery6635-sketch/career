import type { SelectHTMLAttributes } from 'react'
import { Field, type FieldProps } from './Field'

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> &
  Pick<FieldProps, 'label' | 'required' | 'hint' | 'error' | 'warning'> & {
    options: { value: string; label: string }[]
    placeholder?: string
  }

export function Select({ label, required, hint, error, warning, options, placeholder, ...rest }: SelectProps) {
  return (
    <Field label={label} required={required} hint={hint} error={error} warning={warning}>
      {(p) => (
        <span className="select-wrap">
          <select {...rest} {...p} className="control">
            {placeholder ? <option value="">{placeholder}</option> : null}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="select-wrap__arrow" aria-hidden="true">
            ▾
          </span>
        </span>
      )}
    </Field>
  )
}
