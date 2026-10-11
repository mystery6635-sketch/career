// 문자열 정규화(data-model 1.1, FR-010). 클라이언트와 서버가 같은 함수를 쓴다.

/** 한 줄 입력 칸: 줄바꿈·연속 공백을 공백 하나로, 앞뒤 공백 제거. 공백만 있으면 빈 문자열. */
export function normalizeLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** 여러 줄 입력 칸(인턴 내용): 줄바꿈은 허용하되 연속 줄바꿈은 하나로, 줄 안의 연속 공백은 하나로. */
export function normalizeMultiline(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
}

/** 공백만 있는 값은 "비어 있음"이다. */
export function isBlank(value: string): boolean {
  return value.trim().length === 0
}
