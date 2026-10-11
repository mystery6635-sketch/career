import { describe, expect, it } from 'vitest'
import { NOTICE_LINES } from '@shared/messages'
import { buildCopyText } from '../../src/lib/copyText'
import { MAX_LENGTH_RESULT, MOCK_RESULTS } from '../../src/mock/results'
import { PERSONAS } from '../../src/mock/personas'

const p4 = buildCopyText(MOCK_RESULTS.P4)

describe('복사 텍스트 (T059, contracts/copy-and-print.md 1절)', () => {
  it('안내문 두 줄이 첫 부분과 끝 부분에 있다', () => {
    const lines = p4.split('\n')
    const head = lines.slice(0, 6).join('\n')
    const tail = lines.slice(-3).join('\n')
    for (const n of NOTICE_LINES) {
      expect(head).toContain(n)
      expect(tail).toContain(n)
    }
  })

  it('직업 3개와 키워드 3개의 번호가 모두 있다', () => {
    const [a, b] = p4.split('B. 자기소개서 키워드 3개')
    for (const n of [1, 2, 3]) {
      expect(a).toMatch(new RegExp(`^${n}\\. `, 'm'))
      expect(b).toMatch(new RegExp(`^${n}\\. `, 'm'))
    }
  })

  it('needsConfirmation 문장에 "[확인 필요] " 접두가 있고 설명 줄이 있다', () => {
    expect(p4).toContain('[확인 필요] 실제 담당 업무의 범위와 필요한 자격은 확인이 필요해요.')
    expect(p4).toContain('[확인 필요] 표시가 붙은 문장은 상담에서 직접 확인이 필요한 내용입니다.')
  })

  it('확인 필요 문장이 하나도 없으면 설명 줄이 없다', () => {
    const none = structuredClone(MOCK_RESULTS.P1)
    for (const j of none.jobs) j.checkPoint.needsConfirmation = false
    expect(buildCopyText(none)).not.toContain('표시가 붙은 문장은')
  })

  it('통용 직업명에는 "[표준 분류 확인 필요]" 줄이 있다', () => {
    expect(p4).toContain('[표준 분류 확인 필요]')
  })

  it('mismatchNote가 있는 키워드만 "함께 이야기 나눠 볼 점" 줄이 있다', () => {
    const count = (p4.match(/함께 이야기 나눠 볼 점:/g) ?? []).length
    expect(count).toBe(MOCK_RESULTS.P4.keywords.filter((k) => k.mismatchNote).length)
    expect(count).toBe(1)
  })

  it('키워드의 "연결된 입력 항목" 줄은 strength 외 연결 항목이 있을 때만 있다', () => {
    const keywordPart = p4.split('B. 자기소개서 키워드 3개')[1]
    const blocks = keywordPart.split(/\n(?=\d\. )/).filter((b) => /^\d\. /.test(b))
    expect(blocks).toHaveLength(3)
    const withLine = blocks.filter((b) => b.includes('연결된 입력 항목:'))
    expect(withLine).toHaveLength(MOCK_RESULTS.P4.keywords.filter((k) => k.linkedInputs.some((l) => l.field !== 'strength')).length)
    expect(blocks[1]).not.toContain('연결된 입력 항목:')
    expect(keywordPart).not.toMatch(/연결된 입력 항목: 강점/)
  })

  it('나이, 입력 정보 요약, 나이 값이 복사 텍스트에 없다', () => {
    for (const id of ['P1', 'P2', 'P3', 'P4', 'P5'] as const) {
      const text = buildCopyText(MOCK_RESULTS[id])
      expect(text).not.toContain('나이')
      expect(text).not.toContain('입력 정보 요약')
      expect(text).not.toMatch(new RegExp(`(^|[^\\d])${PERSONAS[id].age}([^\\d]|$)`))
    }
  })

  it('최대 길이 결과도 만들어진다', () => {
    expect(buildCopyText(MAX_LENGTH_RESULT).length).toBeGreaterThan(2000)
  })
})
