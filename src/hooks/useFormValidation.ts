import { useMemo, useState } from 'react'
import type { InputDraft } from '../state/draft'
import { validateDraft, type Feedback, type SummaryItem } from '../state/validation'

/**
 * 입력 화면 검증 상태(T085~T087). 제출 전에는 오류를 보이지 않고(경고는 항상 보임),
 * 제출한 뒤에는 입력을 고칠 때마다 다시 검사해 오류·요약 개수를 갱신한다.
 * 서버가 거부한 항목(T108)은 사용자가 입력을 고치기 전까지 같은 자리에 오류로 보인다.
 */
export function useFormValidation(draft: InputDraft, initialServerItems: SummaryItem[] = []) {
  const [submitted, setSubmitted] = useState(initialServerItems.length > 0)
  const [focusTick, setFocusTick] = useState(initialServerItems.length > 0 ? 1 : 0)
  const [serverItems, setServerItems] = useState(initialServerItems)
  const result = useMemo(() => validateDraft(draft), [draft])

  const merged = useMemo(() => {
    const items = submitted ? [...result.items] : []
    const errors = submitted ? { ...result.errors } : {}
    for (const item of serverItems) {
      if (item.key in errors) continue
      errors[item.key] = item.message
      items.push(item)
    }
    return { items, errors }
  }, [submitted, result, serverItems])

  const feedback: Feedback = useMemo(
    () => ({ errors: merged.errors, warnings: result.warnings }),
    [merged, result],
  )
  const errorSections = useMemo(() => new Set(merged.items.map((i) => i.section)), [merged])

  /** 제출한다. 오류가 있으면 그 목록을 돌려주고 요약으로 포커스를 옮기도록 알린다. */
  const submit = (): SummaryItem[] => {
    setSubmitted(true)
    if (result.items.length > 0) setFocusTick((t) => t + 1)
    return result.items
  }

  /** 입력을 고치면 서버 오류 표시는 사라지고 화면 검증이 이어받는다. */
  const clearServerItems = () => setServerItems((items) => (items.length > 0 ? [] : items))

  return { feedback, items: merged.items, errorSections, focusTick, submit, clearServerItems }
}
