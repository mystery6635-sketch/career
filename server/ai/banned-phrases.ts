// 금지 표현 탐지(T095). 기준은 specs/001-job-recommendation-keywords/prompts/banned-phrases.md이며 세 곳이 다르면 그 문서가 기준이다.
// 탐지는 "단어 단위"다: 용어는 어절의 시작에서만 일치한다("세심"의 "세"처럼 다른 단어 속 글자는 오탐이므로 제외).
// 입력 문자열 내용은 이 파일이 받지 않는다. 호출하는 쪽이 quotes(입력 원문 조각)만 넘긴다.

export type BannedRule = 'V8' | 'V9' | 'V10' | 'V11'

/** 어절 시작 경계: 앞이 문자·숫자가 아니어야 한다. */
const START = '(?<![\\p{L}\\p{N}])'

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** 용어 목록을 어절 시작 기준 정규식으로 만든다. 용어 안의 공백은 공백 0개 이상과 일치한다. */
function words(terms: string[]): RegExp {
  const body = terms.map((t) => escape(t).replace(/ /g, '\\s*')).join('|')
  return new RegExp(`${START}(?:${body})`, 'gu')
}

// ---- V8 수치 ----
// 숫자가 들어 있는 패턴: 입력에서 그대로 인용한 부분은 검사에서 뺀다.
const V8_NUMERIC: RegExp[] = [
  /\d[\d,.]*\s*(?:(?:천|백|만|억|조)\s*)*원(?:이상|이하|이|을|은|의|에|도|으로|부터|까지|짜리|대)?(?![가-힣])/gu,
  /\d[\d,.]*\s*(?:억|천만|만\s*원)/gu,
  /\d[\d,.]*\s*건(?:의|이|을|은|도|에)?(?![가-힣])/gu,
  /\d[\d,.]*\s*프로(?![가-힣])/gu,
]
// 숫자가 없어도 거부하는 표현
const V8_WORDS: RegExp[] = [
  /%|％|퍼센트/gu,
  words([
    '연봉', '급여', '월급', '임금', '취업률', '합격률', '경쟁률',
    '채용 공고', '공고 수', '상위', '순위',
  ]),
  // "시급한"(급하다)은 허용하고 시간당 임금 뜻의 "시급"만 거부한다.
  new RegExp(`${START}시급(?![하한히성])`, 'gu'),
]

// ---- V9 부정·배제 ----
// 항상 거부하는 표현
const V9_STRONG = words([
  '부족', '미흡', '모자라', '약점', '취약', '결핍', '열세',
  '경험이 없', '경력이 없', '자격이 없', '경험 부족',
  '경력단절', '경력공백', '근거가 없', '약하다', '약해요', '허황',
  '공백', '쉬었', '오래 쉬', '단절', '오랜만', '쉬다가',
  '부적격', '미달', '낙오', '뒤처', '실패', '문제가 있', '거짓', '과장',
])
// 입력 항목 이름 근처(12자 이내)에서만 거부하는 표현: 단독 출현은 통과한다.
const V9_CONTEXTUAL = words([
  '없어서', '없기 때문에', '없다는 점이',
  '어렵습니다', '어려워요', '불가능', '맞지 않', '적합하지 않', '힘들 것', '제한적',
])
const ITEM_NAMES = /경력|경험|인턴|자격증|자격|학력|학위|졸업|전공|교육이수|공백|나이/gu
const NEAR = 12

// ---- V10 단정 ----
const V10 = words([
  '반드시', '확실히', '틀림없', '보장', '확정', '무조건', '100%', '합격',
  '취업이 된다', '취업할 수 있다', '채용된다',
])

// ---- V11 연령·세대 ----
const V11: RegExp[] = [
  words(['나이', '연령', '연세', '세대', '젊', '청년', '청소년', '중장년', '장년', '노년', '고령', '시니어']),
  new RegExp(`${START}어린(?!이)`, 'gu'),
  /\d+\s*(?:세(?!대)|살)(?![가-힣]{2,})/gu,
]

function matches(text: string, re: RegExp): RegExpMatchArray[] {
  return [...text.matchAll(new RegExp(re.source, re.flags))]
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => matches(text, re).length > 0)
}

/** 입력 항목 이름이 일치 위치에서 12자 이내에 있는지. */
function nearItemName(text: string, index: number, length: number): boolean {
  for (const item of matches(text, ITEM_NAMES)) {
    const start = item.index ?? 0
    const end = start + item[0].length
    const gap = start >= index + length ? start - (index + length) : index >= end ? index - end : 0
    if (gap <= NEAR) return true
  }
  return false
}

/** quotes에 든 입력 원문 조각(2자 이상)을 문장에서 지운다. */
function stripQuotes(text: string, quotes: readonly string[]): string {
  let result = text
  for (const q of [...quotes].sort((a, b) => b.length - a.length)) {
    if (q.length >= 2) result = result.split(q).join(' ')
  }
  return result
}

/** 문장 하나가 위반하는 규칙(V8~V11) 목록. 위반이 없으면 빈 배열. */
export function findBannedRules(sentence: string, quotes: readonly string[] = []): BannedRule[] {
  const found: BannedRule[] = []
  const unquoted = stripQuotes(sentence, quotes)

  if (hasAny(unquoted, V8_NUMERIC) || hasAny(sentence, V8_WORDS)) found.push('V8')

  const strong = hasAny(sentence, [V9_STRONG])
  const contextual = matches(sentence, V9_CONTEXTUAL).some((m) =>
    nearItemName(sentence, m.index ?? 0, m[0].length),
  )
  if (strong || contextual) found.push('V9')

  if (hasAny(sentence, [V10])) found.push('V10')
  if (hasAny(sentence, V11)) found.push('V11')
  return found
}
