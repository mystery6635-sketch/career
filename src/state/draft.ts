// 입력 화면의 폼 상태(문자열 중심). 검증 전의 값이므로 ApplicantInput과 모양이 조금 다르다.
import type {
  ApplicantInput,
  Career,
  EducationLevel,
  EducationStatus,
  GenerateRequest,
  Training,
} from '@shared/schema'

export interface InputDraft {
  age: string
  level: '' | EducationLevel
  status: '' | EducationStatus
  majors: string[]
  noCareer: boolean
  careers: Career[]
  /** null = 아직 선택하지 않음 */
  internHas: boolean | null
  internContent: string
  internPeriod: string
  noCertifications: boolean
  certifications: string[]
  noTrainings: boolean
  trainings: Training[]
  strengths: [string, string, string]
}

export const emptyCareer = (): Career => ({ jobTitle: '', industry: '', period: '' })
export const emptyTraining = (): Training => ({ courseName: '', period: '' })

export function emptyDraft(): InputDraft {
  return {
    age: '',
    level: '',
    status: '',
    majors: [''],
    noCareer: false,
    careers: [emptyCareer()],
    internHas: null,
    internContent: '',
    internPeriod: '',
    noCertifications: false,
    certifications: [''],
    noTrainings: false,
    trainings: [emptyTraining()],
    strengths: ['', '', ''],
  }
}

const rowsOrBlank = <T,>(rows: T[], blank: () => T): T[] => (rows.length > 0 ? rows : [blank()])

export function applicantToDraft(input: ApplicantInput): InputDraft {
  return {
    age: String(input.age),
    level: input.education.level,
    status: input.education.status,
    majors: rowsOrBlank(input.majors, () => ''),
    noCareer: input.noCareer,
    careers: rowsOrBlank(input.careers, emptyCareer),
    internHas: input.intern.has,
    internContent: input.intern.content ?? '',
    internPeriod: input.intern.period ?? '',
    noCertifications: input.certifications.length === 0,
    certifications: rowsOrBlank(input.certifications, () => ''),
    noTrainings: input.trainings.length === 0,
    trainings: rowsOrBlank(input.trainings, emptyTraining),
    strengths: [...input.strengths] as [string, string, string],
  }
}

const filled = (list: string[]) => list.map((v) => v.trim()).filter(Boolean)

/** 생성 요청을 만든다. 나이는 요청에 넣지 않는다(FR-004). 검증은 Phase 5에서 붙인다. */
export function draftToRequest(draft: InputDraft): GenerateRequest {
  const careers = draft.noCareer
    ? []
    : draft.careers
        .map((c) => ({ jobTitle: c.jobTitle.trim(), industry: c.industry.trim(), period: c.period.trim() }))
        .filter((c) => c.jobTitle || c.industry || c.period)
  const trainings = draft.noTrainings
    ? []
    : draft.trainings
        .map((t) => ({ courseName: t.courseName.trim(), period: t.period.trim() }))
        .filter((t) => t.courseName || t.period)
  return {
    education: { level: draft.level as EducationLevel, status: draft.status as EducationStatus },
    majors: filled(draft.majors),
    noCareer: draft.noCareer,
    careers,
    intern: draft.internHas
      ? { has: true, content: draft.internContent.trim(), period: draft.internPeriod.trim() }
      : { has: false },
    certifications: draft.noCertifications ? [] : filled(draft.certifications),
    trainings,
    strengths: draft.strengths.map((s) => s.trim()) as [string, string, string],
  }
}
