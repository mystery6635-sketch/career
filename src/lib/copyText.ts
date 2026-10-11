// 복사 텍스트 형식(contracts/copy-and-print.md 1절). 구직자 입력 정보(나이, 입력 요약)는 넣지 않는다.
import { needsConfirmLabel, RESULT_PAGE, standardNameConfirmLabel } from '@shared/messages'
import type { LinkedInput, ResultPayload, Sentence } from '@shared/types'

const CONFIRM_PREFIX = `[${needsConfirmLabel}] `

const sentenceText = (s: Sentence) => (s.needsConfirmation ? CONFIRM_PREFIX : '') + s.text
const joinSentences = (list: Sentence[]) => list.map(sentenceText).join(' ')
const linkedText = (list: LinkedInput[]) => list.map((l) => `${l.label}: ${l.value}`).join(', ')

export function hasConfirmation(result: ResultPayload): boolean {
  const sentences = [
    ...result.jobs.flatMap((j) => [...j.rationale, j.checkPoint]),
    ...result.keywords.flatMap((k) => k.description),
  ]
  return sentences.some((s) => s.needsConfirmation)
}

export function buildCopyText(result: ResultPayload): string {
  const notice = result.notice.map((line) => `※ ${line}`)
  const out: string[] = ['상담 참고 결과', '', ...notice, '', `A. ${RESULT_PAGE.areaATitle}`, '']

  result.jobs.forEach((job, i) => {
    out.push(`${i + 1}. ${job.title} (${job.subtitle})`)
    if (!job.isStandardName) out.push(`   [${standardNameConfirmLabel}]`)
    out.push(`   ${RESULT_PAGE.job.rationale}: ${joinSentences(job.rationale)}`)
    out.push(`   ${RESULT_PAGE.job.linked}: ${linkedText(job.linkedInputs)}`)
    out.push(`   ${RESULT_PAGE.job.checkPoint}: ${sentenceText(job.checkPoint)}`)
    out.push('')
  })

  out.push(`B. ${RESULT_PAGE.areaBTitle}`, '')
  result.keywords.forEach((k, i) => {
    out.push(`${i + 1}. ${k.keyword}`)
    out.push(`   ${RESULT_PAGE.keyword.strength}: ${k.strengthText}`)
    out.push(`   ${RESULT_PAGE.keyword.job}: ${k.linkedJobTitle}`)
    const objective = k.linkedInputs.filter((l) => l.field !== 'strength')
    if (objective.length > 0) out.push(`   ${RESULT_PAGE.keyword.linked}: ${linkedText(objective)}`)
    out.push(`   ${RESULT_PAGE.keyword.description}: ${joinSentences(k.description)}`)
    if (k.mismatchNote) out.push(`   함께 이야기 나눠 볼 점: ${k.mismatchNote}`)
    out.push('')
  })

  if (hasConfirmation(result)) {
    out.push(`[${needsConfirmLabel}] 표시가 붙은 문장은 상담에서 직접 확인이 필요한 내용입니다.`)
  }
  out.push(...notice)
  return out.join('\n')
}
