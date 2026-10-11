// 입력·결과 타입(data-model 1.1, 2.1, 2.2). Phase 5에서 Zod 추론 타입으로 교체한다.

export type EducationLevel = 'highschool_or_below' | 'college' | 'bachelor' | 'master' | 'doctor'
export type EducationStatus = 'graduated' | 'enrolled' | 'leave' | 'dropout' | 'expected'

export interface Career {
  jobTitle: string
  industry: string
  period: string
}

export interface Training {
  courseName: string
  period: string
}

export interface ApplicantInput {
  age: number
  education: { level: EducationLevel; status: EducationStatus }
  majors: string[]
  noCareer: boolean
  careers: Career[]
  intern: { has: boolean; content?: string; period?: string }
  noCertifications?: boolean
  certifications: string[]
  noTrainings?: boolean
  trainings: Training[]
  strengths: [string, string, string]
}

/** 나이를 뺀 생성 요청(data-model 1.2). */
export type GenerateRequest = Omit<ApplicantInput, 'age'>

export type InputField =
  | 'education'
  | 'major'
  | 'career'
  | 'intern'
  | 'certification'
  | 'training'
  | 'strength'

export interface InputRef {
  field: InputField
  index?: number
}

export interface LinkedInput extends InputRef {
  /** 항목명(예: "전공"). 서버가 실제 입력에서 만든다. */
  label: string
  value: string
}

export interface Sentence {
  text: string
  needsConfirmation: boolean
}

export interface ResultJob {
  title: string
  subtitle: string
  isStandardName: boolean
  rationale: Sentence[]
  linkedInputs: LinkedInput[]
  checkPoint: Sentence
}

export interface ResultKeyword {
  keyword: string
  strengthIndex: 0 | 1 | 2
  linkedJobIndex: 0 | 1 | 2
  description: Sentence[]
  linkedInputs: LinkedInput[]
  mismatchNote: string | null
  strengthText: string
  linkedJobTitle: string
}

export interface ResultPayload {
  jobs: [ResultJob, ResultJob, ResultJob]
  keywords: [ResultKeyword, ResultKeyword, ResultKeyword]
  notice: [string, string]
  generatedAt: string
}

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'PII_DETECTED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_FAILED'
  | 'OUTPUT_INVALID'
  | 'TIMEOUT'
  | 'INTERNAL'

export interface ApiError {
  code: ApiErrorCode
  message: string
  retryAfterSeconds?: number
  details?: { path: (string | number)[]; rule: string }[]
  requestId?: string
}
