// 입력 스키마(data-model 1.1). 클라이언트와 서버가 이 한 곳의 정의를 쓴다. 문구는 messages.ts에서만 가져온다.
import { z } from 'zod'
import {
  INPUT_ERRORS as E,
  maxChars,
  maxItemsReached,
  strengthRequired,
  strengthTooShort,
} from '../messages.js'
import { normalizeLine, normalizeMultiline } from './normalize.js'

export const EDUCATION_LEVELS = ['highschool_or_below', 'college', 'bachelor', 'master', 'doctor'] as const
export const EDUCATION_STATUSES = ['graduated', 'enrolled', 'leave', 'dropout', 'expected'] as const

export const LIMITS = {
  age: { min: 15, max: 99 },
  text: 100,
  period: 50,
  internContent: 400,
  majors: 6,
  careers: 20,
  certifications: 20,
  trainings: 20,
  strengths: 3,
  strengthMin: 2,
} as const

const required = (message: string) => ({ error: message })

/** 정규화 후 1~max자. 비면 emptyMessage, 넘으면 "최대 N자" 문구. */
const line = (max: number, emptyMessage: string) =>
  z
    .string(required(emptyMessage))
    .transform(normalizeLine)
    .pipe(z.string().min(1, required(emptyMessage)).max(max, required(maxChars(max))))

const list = <T extends z.ZodType>(item: T, max: number) =>
  z.array(item, required(E.bodyInvalid)).max(max, required(maxItemsReached(max)))

const education = z.strictObject({
  level: z.enum(EDUCATION_LEVELS, required(E.level)),
  status: z.enum(EDUCATION_STATUSES, required(E.status)),
})

const career = z.strictObject({
  jobTitle: line(LIMITS.text, E.careerFields),
  industry: line(LIMITS.text, E.careerFields),
  period: line(LIMITS.period, E.careerFields),
})

const training = z.strictObject({
  courseName: line(LIMITS.text, E.trainingFields),
  period: line(LIMITS.period, E.trainingFields),
})

const intern = z.strictObject({
  has: z.boolean(required(E.internChoice)),
  content: z
    .string()
    .transform(normalizeMultiline)
    .pipe(z.string().max(LIMITS.internContent, required(maxChars(LIMITS.internContent))))
    .optional(),
  period: z
    .string()
    .transform(normalizeLine)
    .pipe(z.string().max(LIMITS.period, required(maxChars(LIMITS.period))))
    .optional(),
})

/** 강점 정확히 3개, 각 공백 제외 2~100자. 오류 문구에 쓰는 번호는 1부터. */
const strengths = z
  .array(z.string(required(E.bodyInvalid)), required(E.bodyInvalid))
  .transform((values) => values.map(normalizeLine))
  .superRefine((values, ctx) => {
    if (values.length !== LIMITS.strengths) {
      ctx.addIssue({ code: 'custom', message: E.strengthsCount, params: { rule: 'count' } })
      return
    }
    values.forEach((value, i) => {
      const meaningful = value.replace(/\s/g, '').length
      if (meaningful === 0) {
        ctx.addIssue({ code: 'custom', path: [i], message: strengthRequired(i + 1), params: { rule: 'required' } })
      } else if (meaningful < LIMITS.strengthMin) {
        ctx.addIssue({ code: 'custom', path: [i], message: strengthTooShort(i + 1), params: { rule: 'too_short' } })
      } else if (value.length > LIMITS.text) {
        ctx.addIssue({ code: 'custom', path: [i], message: maxChars(LIMITS.text), params: { rule: 'too_long' } })
      }
    })
  })
  .transform((values) => values as [string, string, string])

/** 나이를 뺀 공통 필드. 입력 스키마와 생성 요청 스키마가 함께 쓴다(refine 없는 순수 shape). */
export const applicantShape = {
  education,
  majors: list(line(LIMITS.text, E.majorRequired), LIMITS.majors),
  noCareer: z.boolean(required(E.careerRequired)),
  careers: list(career, LIMITS.careers),
  intern,
  certifications: list(line(LIMITS.text, E.certRequired), LIMITS.certifications),
  trainings: list(training, LIMITS.trainings),
  strengths,
}

type CrossFields = {
  noCareer: boolean
  careers: unknown[]
  intern: { has: boolean; content?: string; period?: string }
  certifications: unknown[]
  trainings: unknown[]
  noCertifications?: boolean
  noTrainings?: boolean
}

/** 필드 사이 규칙: 없음과 입력 동시 금지, 경력 필수, 인턴 있음이면 내용·기간 필수. */
export function checkCrossFields(value: CrossFields, ctx: z.RefinementCtx): void {
  const add = (path: (string | number)[], message: string, rule: string) =>
    ctx.addIssue({ code: 'custom', path, message, params: { rule } })

  if (value.noCareer && value.careers.length > 0) add(['careers'], E.careerExclusive, 'exclusive')
  if (!value.noCareer && value.careers.length === 0) add(['careers'], E.careerRequired, 'required')
  if (value.noCertifications && value.certifications.length > 0) {
    add(['certifications'], E.certExclusive, 'exclusive')
  }
  if (value.noTrainings && value.trainings.length > 0) add(['trainings'], E.trainingExclusive, 'exclusive')
  if (value.intern.has) {
    if (!value.intern.content) add(['intern', 'content'], E.internContent, 'required')
    if (!value.intern.period) add(['intern', 'period'], E.internPeriod, 'required')
  }
}

export const ApplicantInputSchema = z
  .strictObject({
    age: z
      .number(required(E.ageNotNumber))
      .refine((n) => Number.isInteger(n) && n >= LIMITS.age.min && n <= LIMITS.age.max, required(E.ageRange)),
    ...applicantShape,
    noCertifications: z.boolean().optional(),
    noTrainings: z.boolean().optional(),
  })
  .superRefine(checkCrossFields)

export type ApplicantInput = z.infer<typeof ApplicantInputSchema>
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]
export type EducationStatus = (typeof EDUCATION_STATUSES)[number]
export type Career = z.infer<typeof career>
export type Training = z.infer<typeof training>
