// 강점 중복 감지(FR-041). 경고만 하며 클라이언트에서 쓴다.

/** 공백·문장 부호를 없애고 소문자로 맞춘다. */
export function normalizeForCompare(text: string): string {
  return text.replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase()
}

export interface DuplicateStrength {
  /** 두 번째로 나온(경고를 보일) 강점의 번호(0부터) */
  index: number
  /** 먼저 나온 같은 강점의 번호(0부터) */
  sameAs: number
}

export function findDuplicateStrengths(strengths: readonly string[]): DuplicateStrength[] {
  const seen = new Map<string, number>()
  const result: DuplicateStrength[] = []
  strengths.forEach((text, index) => {
    const key = normalizeForCompare(text)
    if (key.length === 0) return
    const first = seen.get(key)
    if (first === undefined) seen.set(key, index)
    else result.push({ index, sameAs: first })
  })
  return result
}
