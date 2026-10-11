import type { ComponentProps } from 'react'
import { TextField } from './TextField'

type TextareaProps = Omit<Extract<ComponentProps<typeof TextField>, { as: 'textarea' }>, 'as'>

export function Textarea(props: TextareaProps) {
  return <TextField {...props} as="textarea" />
}
