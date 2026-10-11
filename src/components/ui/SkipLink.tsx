import { COMMON } from '@shared/messages'

export function SkipLink({ targetId = 'main' }: { targetId?: string }) {
  return (
    <a className="skip-link" href={`#${targetId}`}>
      {COMMON.skipToMain}
    </a>
  )
}
