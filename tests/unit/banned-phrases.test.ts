// T095 금지 표현 탐지: BP 목록의 모든 분류(V8~V11)에 거부 테스트가 있고 정상 문장 모음이 통과한다.
import { describe, expect, it } from 'vitest'
import { findBannedRules, type BannedRule } from '../../server/ai/banned-phrases'
import { PASS_SENTENCES, REJECT_SENTENCES } from './banned-corpus'

describe('대표 금지 문장 거부', () => {
  for (const rule of Object.keys(REJECT_SENTENCES) as BannedRule[]) {
    it.each(REJECT_SENTENCES[rule])(`${rule}: %s`, (sentence) => {
      expect(findBannedRules(sentence)).toContain(rule)
    })
  }
})

describe('정상 문장 모음(오탐 회귀)', () => {
  it.each(PASS_SENTENCES)('통과: %s', (sentence) => {
    expect(findBannedRules(sentence)).toEqual([])
  })
})

describe('판단 규칙', () => {
  it('단어 단위: 다른 단어 속 글자는 오탐이 아니다("세심", "사회보장")', () => {
    expect(findBannedRules('세심한 기록 정리')).toEqual([])
    expect(findBannedRules('사회보장 업무')).toEqual([])
  })

  it('입력 항목 이름 근처에서만 거부하는 표현은 단독 출현을 통과시킨다', () => {
    expect(findBannedRules('이 부분은 어려워요.')).toEqual([])
    expect(findBannedRules('새 환경에 적응하기 어려워요.')).toEqual([])
    expect(findBannedRules('경력이 짧아서 어려워요.')).toContain('V9')
  })

  it('입력 항목 이름이 12자보다 멀면 통과한다', () => {
    expect(findBannedRules(`경력은 ${'가'.repeat(20)} 어려워요.`)).toEqual([])
  })

  it('입력 문자열 인용은 숫자 검사에서 제외한다', () => {
    expect(findBannedRules('입력하신 2급과 3개월 과정을 근거로 삼았어요.')).toEqual([])
    expect(findBannedRules('컴퓨터활용 120건 처리 경험이 있어요.', ['컴퓨터활용 120건 처리'])).toEqual([])
    expect(findBannedRules('컴퓨터활용 120건 처리 경험이 있어요.')).toContain('V8')
  })

  it('한 문장이 여러 규칙을 어길 수 있다', () => {
    expect(findBannedRules('나이가 많아 반드시 어려워요. 연봉도 낮아요.').sort()).toEqual(['V10', 'V11', 'V8', 'V9'])
  })
})
