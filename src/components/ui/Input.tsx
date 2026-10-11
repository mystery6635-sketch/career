import type { ComponentProps } from 'react'
import { TextField } from './TextField'

type InputProps = Omit<Extract<ComponentProps<typeof TextField>, { as?: 'input' }>, 'as'>

export function Input(props: InputProps) {
  return <TextField {...props} as="input" />
}
