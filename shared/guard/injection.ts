// 지시문 형태 감지(data-model 1.3). 경고만 하며 차단하지 않는다. 실제 방어는 데이터 격리와 출력 검증이 맡는다.
// "지시"라는 말은 업무 문장에 흔하므로 "무시·출력·역할 변경" 같은 동작과 함께 나올 때만 감지한다.

const PATTERNS: RegExp[] = [
  /(이전|앞선|위의?|기존|모든)\s*(지시|지침|명령|규칙|내용|프롬프트)[^.\n]{0,12}(무시|잊어|따르지)/,
  /(지시|지침|명령|규칙)(사항)?\s*(을|를)?\s*(모두\s*)?(무시|잊어)/,
  /(이|위|앞)\s*문장[을를]?\s*무시/,
  /시스템\s*프롬프트/,
  /프롬프트[을를]?\s*(그대로\s*)?(출력|보여|알려|공개)/,
  /역할[을를]?\s*(바꿔|변경|바꾸)/,
  /(JSON|json)\s*(대신|말고|이\s*아닌)/,
  /(영어|다른\s*형식|다른\s*언어)로\s*(답|알려|출력|써)/,
  /ignore\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+|any\s+)?(the\s+)?(previous|prior|above)/i,
  /(system|developer)\s+prompt/i,
  /you\s+are\s+now\b/i,
  /\bact\s+as\b/i,
]

export function detectInjection(text: string): boolean {
  return PATTERNS.some((p) => p.test(text))
}

export interface InjectionHit {
  path: (string | number)[]
}

type Scannable = {
  majors?: string[]
  careers?: { jobTitle: string; industry: string; period: string }[]
  intern?: { content?: string; period?: string }
  certifications?: string[]
  trainings?: { courseName: string; period: string }[]
  strengths?: string[]
}

export function findInjection(value: Scannable): InjectionHit[] {
  const hits: InjectionHit[] = []
  const check = (path: (string | number)[], text: string | undefined) => {
    if (text && detectInjection(text)) hits.push({ path })
  }
  value.majors?.forEach((t, i) => check(['majors', i], t))
  value.careers?.forEach((c, i) => {
    check(['careers', i, 'jobTitle'], c.jobTitle)
    check(['careers', i, 'industry'], c.industry)
  })
  check(['intern', 'content'], value.intern?.content)
  value.certifications?.forEach((t, i) => check(['certifications', i], t))
  value.trainings?.forEach((t, i) => check(['trainings', i, 'courseName'], t.courseName))
  value.strengths?.forEach((t, i) => check(['strengths', i], t))
  return hits
}
