import { Choice, type ChoiceProps } from './Choice'

export function Radio(props: ChoiceProps) {
  return <Choice {...props} type="radio" />
}
