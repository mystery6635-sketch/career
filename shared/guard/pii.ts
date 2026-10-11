// 식별 정보 형식 감지(FR-009). 차단 대상이다. 오탐(자격증 번호 등)을 줄이려고 패턴은 보수적이다.
// 클라이언트와 서버가 같은 함수를 쓴다. 값은 반환하지 않고 종류만 반환한다.

export type PiiKind = 'resident_id' | 'phone' | 'email'

const PATTERNS: [PiiKind, RegExp][] = [
  // 주민등록번호: 6자리-7자리(하이픈 필수)
  ['resident_id', /(?<!\d)\d{6}\s*[-‐–]\s*\d{7}(?!\d)/],
  // 휴대전화: 010·011·016~019, 국제 표기 +82 10 포함
  ['phone', /(?<!\d)(?:\+82[-.\s]?0?|0)1[016789][-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/],
  // 일반전화: 지역번호는 02 또는 03x~06x, 구분 기호가 있는 형태만
  ['phone', /(?<!\d)0(?:2|[3-6][1-5])[-.\s)]\s?\d{3,4}[-.\s]\d{4}(?!\d)/],
  ['email', /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/],
]

export function detectPii(text: string): PiiKind | null {
  for (const [kind, pattern] of PATTERNS) {
    if (pattern.test(text)) return kind
  }
  return null
}

export interface PiiHit {
  path: (string | number)[]
  kind: PiiKind
}

type Scannable = {
  majors?: string[]
  careers?: { jobTitle: string; industry: string; period: string }[]
  intern?: { content?: string; period?: string }
  certifications?: string[]
  trainings?: { courseName: string; period: string }[]
  strengths?: string[]
}

/** 자유 텍스트 필드 전체를 검사한다. 위치(경로)와 종류만 돌려준다. */
export function findPii(value: Scannable): PiiHit[] {
  const hits: PiiHit[] = []
  const check = (path: (string | number)[], text: string | undefined) => {
    if (!text) return
    const kind = detectPii(text)
    if (kind) hits.push({ path, kind })
  }
  value.majors?.forEach((t, i) => check(['majors', i], t))
  value.careers?.forEach((c, i) => {
    check(['careers', i, 'jobTitle'], c.jobTitle)
    check(['careers', i, 'industry'], c.industry)
    check(['careers', i, 'period'], c.period)
  })
  check(['intern', 'content'], value.intern?.content)
  check(['intern', 'period'], value.intern?.period)
  value.certifications?.forEach((t, i) => check(['certifications', i], t))
  value.trainings?.forEach((t, i) => {
    check(['trainings', i, 'courseName'], t.courseName)
    check(['trainings', i, 'period'], t.period)
  })
  value.strengths?.forEach((t, i) => check(['strengths', i], t))
  return hits
}
