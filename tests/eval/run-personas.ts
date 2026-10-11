// 페르소나 평가 스크립트(T103). `npm run eval:personas`
// 실제 LLM으로 P1~P4와 P5-a를 각각 3회 생성하고(재요청 없이 첫 응답을 그대로 검사해 원 응답의 품질을 본다),
// P5-b·c는 입력 단계에서 차단되는지 확인한다. 결과는 tests/eval/out/<시각>/ 에 저장한다(Git 제외).
// 비용 때문에 CI에는 넣지 않는다. 결과 파일에는 가상 페르소나만 있다.
// 환경 변수: LLM_PROVIDER, LLM_MODEL, LLM_API_KEY (LLM_PROVIDER=mock이면 비용 없이 스크립트만 확인한다).
// 옵션: --runs <횟수, 기본 3>  --only P1,P2
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { findInjection } from '../../shared/guard/injection.ts'
import { findPii } from '../../shared/guard/pii.ts'
import { GenerateRequestSchema, type GenerateRequest } from '../../shared/schema/request.ts'
import { ATTEMPT_TIMEOUT_MS, createLlm } from '../../server/ai/client.ts'
import { buildModelInput, buildUserMessage, SYSTEM_PROMPT } from '../../server/ai/prompt.ts'
import { toResult } from '../../server/ai/to-result.ts'
import { parseModelText, validateOutput } from '../../server/ai/validate-output.ts'
import { loadConfig } from '../../server/config.ts'
import { PERSONA_VARIANTS, PERSONAS } from '../../src/mock/personas.ts'

const out = (line: string) => process.stdout.write(`${line}\n`)
const arg = (name: string) => {
  const i = process.argv.indexOf(name)
  return i > -1 ? process.argv[i + 1] : undefined
}

const runs = Number(arg('--runs') ?? '3')
const only = arg('--only')?.split(',')
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const dir = join('tests', 'eval', 'out', stamp)
mkdirSync(dir, { recursive: true })

/** 나이를 뺀 요청(서버는 나이를 받지 않는다). */
function toRequest(input: object): unknown {
  const { age: _age, ...rest } = input as Record<string, unknown>
  void _age
  return rest
}

interface Row {
  persona: string
  run: number
  kind: 'generated' | 'blocked-check'
  ok: boolean
  rules: string[]
  note?: string
  file: string
}

const rows: Row[] = []
const save = (name: string, data: unknown) => writeFileSync(join(dir, name), `${JSON.stringify(data, null, 2)}\n`)

async function main() {
  let config
  try {
    config = loadConfig()
  } catch (error) {
    out(`설정 오류(${error instanceof Error ? error.name : 'Error'}): LLM_PROVIDER, LLM_MODEL, LLM_API_KEY를 확인해 주세요. 비용 없이 확인하려면 LLM_PROVIDER=mock을 쓰세요.`)
    process.exit(1)
  }
  const llm = createLlm(config)

  const generated = [
    ['P1', PERSONAS.P1],
    ['P2', PERSONAS.P2],
    ['P3', PERSONAS.P3],
    ['P4', PERSONAS.P4],
    ['P5-a', PERSONAS.P5],
  ] as const

  for (const [id, persona] of generated) {
    if (only && !only.includes(id) && !only.includes(id.split('-')[0])) continue
    const request = GenerateRequestSchema.parse(toRequest(persona)) as GenerateRequest
    const warnings = { injection: findInjection(request).length }
    for (let run = 1; run <= runs; run++) {
      const file = `${id}-${run}.json`
      let record: Record<string, unknown>
      try {
        const text = await llm({ system: SYSTEM_PROMPT, user: buildUserMessage(buildModelInput(request)) }, { timeoutMs: ATTEMPT_TIMEOUT_MS })
        const parsed = parseModelText(text)
        if (!parsed.ok) {
          record = { persona: id, run, request, validation: { ok: false, rules: ['V13'] }, modelOutput: null, result: null, warnings }
        } else {
          const validation = validateOutput(parsed.value, request)
          record = {
            persona: id,
            run,
            request,
            validation: validation.ok ? { ok: true, rules: [] } : { ok: false, rules: validation.rules },
            modelOutput: parsed.value,
            result: validation.ok ? toResult(validation.output, request) : null,
            warnings,
          }
        }
      } catch (error) {
        record = { persona: id, run, request, validation: { ok: false, rules: [] }, modelOutput: null, result: null, errorName: error instanceof Error ? error.name : 'Error', warnings }
      }
      save(file, record)
      const validation = record.validation as { ok: boolean; rules: string[] }
      rows.push({ persona: id, run, kind: 'generated', ok: validation.ok, rules: validation.rules, note: record.errorName as string | undefined, file })
      out(`${id} #${run}: ${validation.ok ? '통과' : `실패 ${validation.rules.join(',') || String(record.errorName ?? '')}`}`)
    }
  }

  // P5-b·c: 입력 단계에서 차단되어야 한다.
  for (const id of ['P5-b', 'P5-c']) {
    if (only && !only.includes(id) && !only.includes('P5')) continue
    const variant = PERSONA_VARIANTS.find((v) => v.id === id)!
    const body = toRequest(variant.input)
    const schema = GenerateRequestSchema.safeParse(body)
    const pii = schema.success ? findPii(schema.data) : []
    const blocked = !schema.success || pii.length > 0
    const file = `${id}.json`
    save(file, {
      persona: id,
      blocked,
      by: schema.success ? 'PII_DETECTED' : 'VALIDATION_FAILED',
      details: schema.success ? pii.map((p) => ({ path: p.path, rule: p.kind })) : schema.error.issues.map((i) => ({ path: i.path, rule: i.code })),
    })
    rows.push({ persona: id, run: 1, kind: 'blocked-check', ok: blocked, rules: [], file })
    out(`${id}: ${blocked ? '입력 단계에서 차단됨' : '차단되지 않음(오류)'}`)
  }

  save('summary.json', { provider: config.provider, runs, rows })
  const failed = rows.filter((r) => !r.ok)
  out(`\n저장 위치: ${dir}`)
  out(`합계 ${rows.length}건 중 통과 ${rows.length - failed.length}건, 실패 ${failed.length}건`)
  process.exit(failed.length > 0 ? 1 : 0)
}

void main()
