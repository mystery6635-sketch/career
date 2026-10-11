// T116 금지 표현 코퍼스 검사: 거부 코퍼스는 전부 거부되고, 정상 코퍼스·페르소나 Mock 결과·저장된 실제 결과는 전부 통과한다.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findBannedRules, type BannedRule } from '../../server/ai/banned-phrases'
import { collectQuotes } from '../../server/ai/validate-output'
import type { GenerateRequest } from '../../shared/schema/request'
import type { ResultPayload } from '../../shared/schema/output'
import { PERSONAS, type PersonaId } from '../../src/mock/personas'
import { MOCK_RESULTS } from '../../src/mock/results'
import { PASS_SENTENCES, REJECT_SENTENCES } from './banned-corpus'

const RULES = Object.keys(REJECT_SENTENCES) as BannedRule[]

function toRequest(persona: (typeof PERSONAS)[PersonaId]): GenerateRequest {
  const { age: _age, ...rest } = persona
  void _age
  return rest as GenerateRequest
}

/** 결과 안의 모델이 쓴 문장(안내문·표시용 값 제외). */
function modelSentences(result: ResultPayload): string[] {
  return [
    ...result.jobs.flatMap((j) => [j.title, j.subtitle, j.checkPoint.text, ...j.rationale.map((s) => s.text)]),
    ...result.keywords.flatMap((k) => [k.keyword, ...k.description.map((s) => s.text), ...(k.mismatchNote ? [k.mismatchNote] : [])]),
  ]
}

describe('거부 코퍼스', () => {
  it('각 분류(V8~V11)에 코퍼스가 있다', () => {
    for (const rule of RULES) expect(REJECT_SENTENCES[rule].length).toBeGreaterThanOrEqual(5)
  })

  for (const rule of RULES) {
    it(`${rule} 코퍼스 ${REJECT_SENTENCES[rule].length}문장이 전부 거부된다`, () => {
      const missed = REJECT_SENTENCES[rule].filter((s) => !findBannedRules(s).includes(rule))
      expect(missed).toEqual([])
    })
  }
})

describe('정상 코퍼스', () => {
  it('전부 통과한다', () => {
    const flagged = PASS_SENTENCES.filter((s) => findBannedRules(s).length > 0)
    expect(flagged).toEqual([])
  })
})

describe('페르소나 Mock 결과', () => {
  it.each(Object.keys(MOCK_RESULTS) as PersonaId[])('%s: 모델이 쓴 문장이 전부 통과한다', (id) => {
    const quotes = collectQuotes(toRequest(PERSONAS[id]))
    const flagged = modelSentences(MOCK_RESULTS[id]).filter((s) => findBannedRules(s, quotes).length > 0)
    expect(flagged).toEqual([])
  })
})

describe('저장된 실제 결과(tests/eval/out, 있을 때만)', () => {
  const root = 'tests/eval/out'
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (name.endsWith('.json')) files.push(path)
    }
  }
  if (existsSync(root)) walk(root)

  it('저장본 전부가 통과한다(저장본이 없으면 건너뜀)', () => {
    const flagged: string[] = []
    for (const file of files) {
      const saved = JSON.parse(readFileSync(file, 'utf8')) as { persona?: string; request?: GenerateRequest; result?: ResultPayload | null }
      if (!saved.result || !saved.request) continue
      const quotes = collectQuotes(saved.request)
      if (modelSentences(saved.result).some((s) => findBannedRules(s, quotes).length > 0)) flagged.push(file)
    }
    expect(flagged).toEqual([])
  })
})
