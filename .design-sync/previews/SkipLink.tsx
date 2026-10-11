import * as React from 'react'
import { SkipLink } from 'initial-counseling-helper'

// 평소에는 화면 밖에 있다가 포커스를 받으면 나타난다. 미리보기에서는 포커스를 줘서 보인다.
export function Focused() {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    ref.current?.querySelector('a')?.focus()
  }, [])
  return (
    <div ref={ref} style={{ position: 'relative', minHeight: 80 }}>
      <SkipLink />
    </div>
  )
}
