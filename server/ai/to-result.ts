// 검증을 통과한 ModelOutput에 표시용 값을 붙인다(data-model 2.2). 모델은 번호만 지목하고,
// 항목명·값·안내문은 서버가 실제 입력과 고정 문구에서 만든다.
import { FIELD_LABELS, INPUT_PAGE, NOTICE_LINES } from '../../shared/messages.js'
import type { InputRef, LinkedInput, ModelOutput, ResultPayload } from '../../shared/schema/output.js'
import type { GenerateRequest } from '../../shared/schema/request.js'

const levelLabel = (v: string) => INPUT_PAGE.levelOptions.find((o) => o.value === v)?.label ?? v
const statusLabel = (v: string) => INPUT_PAGE.statusOptions.find((o) => o.value === v)?.label ?? v

/** 화면 표시용 항목. 번호가 필요 없는 education·intern은 index를 버린다. */
export function resolveLink(request: GenerateRequest, ref: InputRef): LinkedInput {
  const label = FIELD_LABELS[ref.field]
  const index = ref.index ?? 0
  switch (ref.field) {
    case 'education':
      return {
        field: 'education',
        label,
        value: `${levelLabel(request.education.level)} ${statusLabel(request.education.status)}`,
      }
    case 'major':
      return { field: 'major', index, label, value: request.majors[index] }
    case 'career': {
      const c = request.careers[index]
      return { field: 'career', index, label, value: `${c.jobTitle} · ${c.industry} · ${c.period}` }
    }
    case 'intern':
      return { field: 'intern', label, value: `${request.intern.content ?? ''} (${request.intern.period ?? ''})` }
    case 'certification':
      return { field: 'certification', index, label, value: request.certifications[index] }
    case 'training': {
      const t = request.trainings[index]
      return { field: 'training', index, label, value: `${t.courseName} · ${t.period}` }
    }
    case 'strength':
      return { field: 'strength', index, label, value: request.strengths[index] }
  }
}

export function toResult(output: ModelOutput, request: GenerateRequest, now: Date = new Date()): ResultPayload {
  const jobs = output.jobs.map((job) => ({
    ...job,
    linkedInputs: job.linkedInputs.map((r) => resolveLink(request, r)),
  })) as ResultPayload['jobs']

  const keywords = output.keywords.map((kw) => ({
    ...kw,
    linkedInputs: kw.linkedInputs.map((r) => resolveLink(request, r)),
    strengthText: request.strengths[kw.strengthIndex],
    linkedJobTitle: jobs[kw.linkedJobIndex].title,
  })) as ResultPayload['keywords']

  return {
    jobs,
    keywords,
    // 안내문은 모델 출력과 무관하게 항상 서버가 붙인다(FR-016).
    notice: [NOTICE_LINES[0], NOTICE_LINES[1]],
    generatedAt: now.toISOString(),
  }
}
