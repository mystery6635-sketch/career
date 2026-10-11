// T097 출력 의미 검증: V1~V15 각각에 위반 1개 + 통과 1개, Mock 결과 전체(T040)가 통과한다.
import { describe, expect, it } from 'vitest'
import { parseModelText, validateOutput, type RuleId } from '../../server/ai/validate-output'
import type { GenerateRequest } from '../../shared/schema/request'
import { MOCK_RESULTS } from '../../src/mock/results'
import { PERSONAS } from '../../src/mock/personas'
import { validModelOutput, validRequest } from '../contract/fixtures'

type Out = ReturnType<typeof validModelOutput>
const request = validRequest()

function rulesOf(mutate: (out: Out) => void, req: GenerateRequest = request): RuleId[] {
  const out = validModelOutput()
  mutate(out)
  const r = validateOutput(out, req)
  return r.ok ? [] : r.rules
}

const sentence = (text: string, needsConfirmation = false) => ({ text, needsConfirmation })

describe('validateOutput', () => {
  it('통과: 정상 출력', () => {
    expect(validateOutput(validModelOutput(), request).ok).toBe(true)
  })

  it('V1: 직업/키워드가 3개가 아니면 거부', () => {
    expect(rulesOf((o) => o.jobs.pop())).toEqual(['V1'])
    expect(rulesOf((o) => o.keywords.push(o.keywords[0]))).toEqual(['V1'])
    expect(validateOutput('문자열', request)).toEqual({ ok: false, rules: ['V1'] })
  })

  it('V2: 직업명 중복(공백·대소문자 무시) 거부', () => {
    expect(rulesOf((o) => (o.jobs[1].title = ' 사회 복지사 '))).toEqual(['V2'])
  })

  it('V3: 실제 입력에 없는 항목·번호를 지목하면 거부', () => {
    expect(rulesOf((o) => o.jobs[0].linkedInputs.push({ field: 'certification', index: 5 }))).toEqual(['V3'])
    expect(rulesOf((o) => o.jobs[0].linkedInputs.push({ field: 'intern' }))).toEqual(['V3'])
    expect(rulesOf((o) => o.jobs[0].linkedInputs.push({ field: 'training', index: 0 }))).toEqual(['V3'])
    expect(rulesOf((o) => o.jobs[0].linkedInputs.push({ field: 'major' }))).toEqual(['V3'])
    const noCareer: GenerateRequest = { ...request, noCareer: true, careers: [] }
    expect(rulesOf(() => undefined, noCareer)).toContain('V3')
    expect(rulesOf((o) => o.jobs[0].linkedInputs.push({ field: 'education' }))).toEqual([])
  })

  it('V4: 연결 항목이 비었거나 키워드에 강점 참조가 없으면 거부', () => {
    expect(rulesOf((o) => (o.jobs[0].linkedInputs = []))).toEqual(['V4'])
    expect(rulesOf((o) => (o.keywords[0].linkedInputs = [{ field: 'career', index: 0 }]))).toContain('V4')
  })

  it('V5: 강점 번호가 0,1,2를 한 번씩이 아니면 거부', () => {
    expect(rulesOf((o) => (o.keywords[1].strengthIndex = 0))).toEqual(['V5'])
    expect(rulesOf((o) => (o.keywords[1].strengthIndex = 3))).toEqual(['V5'])
  })

  it('V6: 연결 직업 번호가 0~2가 아니면 거부', () => {
    expect(rulesOf((o) => (o.keywords[0].linkedJobIndex = 3))).toEqual(['V6'])
  })

  it('V7: 강점만 연결되면 mismatchNote 필수, 객관 항목이 있으면 null', () => {
    const note = '이 강점은 지금 입력된 이력만으로는 뒷받침하는 내용이 아직 적어요. 상담에서 함께 떠올려 보면 좋아요.'
    expect(rulesOf((o) => (o.keywords[0].linkedInputs = [{ field: 'strength', index: 0 }]))).toEqual(['V7'])
    expect(
      rulesOf((o) => {
        o.keywords[0].linkedInputs = [{ field: 'strength', index: 0 }]
        o.keywords[0].mismatchNote = note as never
      }),
    ).toEqual([])
    expect(rulesOf((o) => (o.keywords[0].mismatchNote = note as never))).toEqual(['V7'])
  })

  it('V8: 수치 거부, 입력 인용은 통과', () => {
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('취업률이 높아요.')))).toEqual(['V8'])
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('합격률이 80% 예요.')))).toContain('V8')
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('연봉이 높아요.')))).toEqual(['V8'])
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('사회복지사 2급 자격증과 2년 경력이 있어요.')))).toEqual([])
  })

  it('V9: 부정·배제 표현 거부', () => {
    expect(rulesOf((o) => (o.jobs[0].checkPoint = sentence('경력 공백이 있어서 어려워요.')))).toEqual(['V9'])
    expect(rulesOf((o) => (o.jobs[0].checkPoint = sentence('행정 업무 경험은 상담에서 함께 확인해요.')))).toEqual([])
  })

  it('V10: 단정 표현 거부', () => {
    expect(rulesOf((o) => (o.keywords[0].description[0] = sentence('반드시 합격할 수 있어요.')))).toContain('V10')
    expect(rulesOf((o) => (o.keywords[0].description[0] = sentence('구체적인 장면과 함께 쓰면 좋아요.')))).toEqual([])
  })

  it('V11: 연령·세대 표현 거부', () => {
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('중장년에게 어울려요.')))).toEqual(['V11'])
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('세심하게 정리하는 강점이 있어요.')))).toEqual([])
  })

  it('V12: 필드 길이 한도 초과 거부', () => {
    expect(rulesOf((o) => (o.jobs[0].title = '가'.repeat(31)))).toEqual(['V12'])
    expect(rulesOf((o) => (o.keywords[0].keyword = '가'.repeat(21)))).toEqual(['V12'])
    expect(rulesOf((o) => (o.jobs[0].title = '가'.repeat(30)))).toEqual([])
  })

  it('V13: JSON 이외 텍스트 거부, 코드 블록 표시는 벗기고 통과', () => {
    const json = JSON.stringify(validModelOutput())
    expect(parseModelText(json).ok).toBe(true)
    expect(parseModelText('```json\n' + json + '\n```').ok).toBe(true)
    expect(parseModelText('결과입니다. ' + json).ok).toBe(false)
    expect(parseModelText(json + ' 이상입니다.').ok).toBe(false)
    expect(parseModelText('{깨진 JSON').ok).toBe(false)
  })

  it('V14: 경력이 있으면 직업 1개 이상이 경력과 연결되어야 한다', () => {
    const strip = (o: Out) => {
      for (const j of o.jobs) j.linkedInputs = j.linkedInputs.filter((r) => r.field !== 'career')
    }
    expect(rulesOf(strip)).toEqual(['V14'])
    const noCareer: GenerateRequest = { ...request, noCareer: true, careers: [] }
    const stripKeywords = (o: Out) => {
      strip(o)
      for (const k of o.keywords) k.linkedInputs = [{ field: 'strength', index: k.strengthIndex }, { field: 'major', index: 0 }]
    }
    expect(rulesOf(stripKeywords, noCareer)).toEqual([])
  })

  it('V15: 문장 수와 문장 길이 한도 거부', () => {
    expect(rulesOf((o) => (o.jobs[0].rationale = []))).toEqual(['V15'])
    expect(rulesOf((o) => (o.keywords[0].description = [o.keywords[0].description[0]]))).toEqual(['V15'])
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('가'.repeat(121))))).toEqual(['V15'])
    expect(rulesOf((o) => (o.jobs[0].rationale[0] = sentence('가'.repeat(120))))).toEqual([])
  })

  it('구조 오류는 SCHEMA', () => {
    expect(rulesOf((o) => ((o.jobs[0] as { isStandardName: unknown }).isStandardName = 'yes'))).toEqual(['SCHEMA'])
  })
})

describe('Mock 결과(T040) 전체가 통과한다', () => {
  const entries = Object.entries(MOCK_RESULTS).map(([id, result]) => [id, result] as const)
  it.each(entries)('%s', (id, result) => {
    const persona = PERSONAS[id as keyof typeof PERSONAS]
    const { age: _age, noCertifications: _a, noTrainings: _b, ...req } = persona as typeof persona & {
      noCertifications?: boolean
      noTrainings?: boolean
    }
    void [_age, _a, _b]
    const output = {
      jobs: result.jobs.map((j) => ({ ...j, linkedInputs: j.linkedInputs.map(({ field, index }) => ({ field, index })) })),
      keywords: result.keywords.map((k) => ({ ...k, linkedInputs: k.linkedInputs.map(({ field, index }) => ({ field, index })) })),
    }
    const r = validateOutput(output, req as GenerateRequest)
    expect(r.ok ? [] : r.rules).toEqual([])
  })

})
