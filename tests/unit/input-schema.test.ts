// T089 경계값 단위 테스트: 나이, 강점, 전공, 반복 항목 개수, 글자 수, 상호 배타, 인턴, 공백만 입력.
import { describe, expect, it } from 'vitest'
import { INPUT_ERRORS, strengthRequired, strengthTooShort } from '../../shared/messages'
import { ApplicantInputSchema, type ApplicantInput } from '../../shared/schema/input'
import { validRequest } from '../contract/fixtures'

const base = (): ApplicantInput => ({ age: 34, ...validRequest() })
const run = (patch: Record<string, unknown>) => ApplicantInputSchema.safeParse({ ...base(), ...patch })
const messages = (patch: Record<string, unknown>) => {
  const r = run(patch)
  return r.success ? [] : r.error.issues.map((i) => i.message)
}
const rep = <T>(v: T, n: number): T[] => Array.from({ length: n }, () => v)

describe('입력 스키마 경계값', () => {
  it('정상 입력을 통과시킨다', () => {
    expect(ApplicantInputSchema.safeParse(base()).success).toBe(true)
  })

  it.each([
    [14, false],
    [15, true],
    [99, true],
    [100, false],
    [34.5, false],
    ['abc', false],
    [Number.NaN, false],
    [null, false],
  ])('나이 %s -> 통과 %s', (age, ok) => {
    expect(run({ age }).success).toBe(ok)
  })

  it('나이 문구: 숫자 아님과 범위 밖을 구분한다', () => {
    expect(messages({ age: 'abc' })).toEqual([INPUT_ERRORS.ageNotNumber])
    expect(messages({ age: 100 })).toEqual([INPUT_ERRORS.ageRange])
  })

  it.each([
    [['가', '나'], false],
    [['가나', '다라', '마바'], true],
    [rep('강점입니다', 4), false],
    [['가나', '다라'], false],
  ])('강점 개수/내용 %j -> 통과 %s', (strengths, ok) => {
    expect(run({ strengths }).success).toBe(ok)
  })

  it('강점 2개/4개는 strengths 경로 오류', () => {
    for (const s of [rep('강점입니다', 2), rep('강점입니다', 4)]) {
      const r = run({ strengths: s })
      expect(r.success).toBe(false)
      if (!r.success) expect(r.error.issues[0].path).toEqual(['strengths'])
    }
  })

  it.each([
    [1, false, strengthTooShort(1)],
    [2, true, ''],
    [100, true, ''],
    [101, false, '최대 100자까지 입력할 수 있어요.'],
  ])('강점 %i자', (len, ok, message) => {
    const strengths = ['가'.repeat(len), '다라', '마바']
    expect(run({ strengths }).success).toBe(ok)
    if (!ok) expect(messages({ strengths })).toContain(message)
  })

  it('강점 공백만 입력은 비어 있음으로 본다', () => {
    expect(messages({ strengths: ['   ', '다라', '마바'] })).toEqual([strengthRequired(1)])
  })

  it.each([
    [6, true],
    [7, false],
  ])('전공 %i개', (n, ok) => {
    expect(run({ majors: rep('경영학', n) }).success).toBe(ok)
  })

  it('전공은 비어도 된다(고졸 이하)', () => {
    expect(run({ majors: [] }).success).toBe(true)
  })

  const career = { jobTitle: '사무 보조', industry: '제조업', period: '1년' }
  it.each([
    [20, true],
    [21, false],
  ])('경력 %i개', (n, ok) => {
    expect(run({ careers: rep(career, n) }).success).toBe(ok)
  })

  it.each([
    [20, true],
    [21, false],
  ])('자격증 %i개', (n, ok) => {
    expect(run({ certifications: rep('컴퓨터활용능력', n) }).success).toBe(ok)
  })

  it.each([
    [20, true],
    [21, false],
  ])('교육이수 %i개', (n, ok) => {
    expect(run({ trainings: rep({ courseName: '엑셀 과정', period: '2개월' }, n) }).success).toBe(ok)
  })

  it.each([
    ['전공', (n: number) => ({ majors: ['가'.repeat(n)] }), 100],
    ['직무명', (n: number) => ({ careers: [{ ...career, jobTitle: '가'.repeat(n) }] }), 100],
    ['업종', (n: number) => ({ careers: [{ ...career, industry: '가'.repeat(n) }] }), 100],
    ['경력 기간', (n: number) => ({ careers: [{ ...career, period: '가'.repeat(n) }] }), 50],
    ['자격증', (n: number) => ({ certifications: ['가'.repeat(n)] }), 100],
    ['과정명', (n: number) => ({ trainings: [{ courseName: '가'.repeat(n), period: '1개월' }] }), 100],
    ['교육 기간', (n: number) => ({ trainings: [{ courseName: '과정', period: '가'.repeat(n) }] }), 50],
    ['인턴 기간', (n: number) => ({ intern: { has: true, content: '업무 보조', period: '가'.repeat(n) } }), 50],
    ['인턴 내용', (n: number) => ({ intern: { has: true, content: '가'.repeat(n), period: '3개월' } }), 400],
  ])('%s 글자 수 한도 %i자', (_name, make, max) => {
    expect(run(make(max)).success).toBe(true)
    expect(run(make(max + 1)).success).toBe(false)
  })

  it('없음과 입력이 동시에 있으면 거부한다', () => {
    expect(run({ noCareer: true }).success).toBe(false)
    expect(run({ noCertifications: true }).success).toBe(false)
    expect(run({ noTrainings: true, trainings: [{ courseName: '과정', period: '1개월' }] }).success).toBe(false)
    expect(run({ noCareer: true, careers: [] }).success).toBe(true)
  })

  it('경력 없음이 아닌데 경력이 비어 있으면 거부한다', () => {
    expect(messages({ careers: [] })).toEqual([INPUT_ERRORS.careerRequired])
  })

  it('경력의 칸이 비면 확정 문구', () => {
    expect(messages({ careers: [{ jobTitle: '', industry: '제조업', period: '1년' }] })).toEqual([INPUT_ERRORS.careerFields])
  })

  it('인턴: 있음 + 내용·기간 누락', () => {
    expect(messages({ intern: { has: true } })).toEqual([INPUT_ERRORS.internContent, INPUT_ERRORS.internPeriod])
    expect(messages({ intern: { has: true, content: '업무 보조', period: '   ' } })).toEqual([INPUT_ERRORS.internPeriod])
    expect(run({ intern: { has: true, content: '업무 보조', period: '3개월' } }).success).toBe(true)
  })

  it('인턴 선택을 안 하면 확정 문구', () => {
    expect(messages({ intern: {} })).toEqual([INPUT_ERRORS.internChoice])
  })

  it('학력 선택 누락은 확정 문구', () => {
    expect(messages({ education: { status: 'graduated' } })).toEqual([INPUT_ERRORS.level])
    expect(messages({ education: { level: 'bachelor' } })).toEqual([INPUT_ERRORS.status])
  })

  it('공백만 입력한 값은 비어 있음이고, 정규화된 값이 반환된다', () => {
    expect(messages({ majors: ['   '] })).toEqual([INPUT_ERRORS.majorRequired])
    const r = run({ majors: ['  사회\n 복지학  '], intern: { has: true, content: ' 가\n\n\n나  다 ', period: '3\n개월' } })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.majors).toEqual(['사회 복지학'])
      expect(r.data.intern.content).toBe('가\n나 다')
      expect(r.data.intern.period).toBe('3 개월')
    }
  })

  it('모르는 필드는 거부한다', () => {
    expect(run({ name: '가상' }).success).toBe(false)
  })
})
