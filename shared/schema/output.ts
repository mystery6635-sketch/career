// 출력 스키마(data-model 2.1, 2.2). 모델 출력(ModelOutput)과 화면 결과(ResultPayload)를 한 곳에서 정의한다.
import { z } from 'zod'

export const INPUT_FIELDS = [
  'education',
  'major',
  'career',
  'intern',
  'certification',
  'training',
  'strength',
] as const

const three = <T extends z.ZodType>(item: T) => z.tuple([item, item, item])

export const SentenceSchema = z.strictObject({
  text: z.string().min(1).max(120),
  needsConfirmation: z.boolean(),
})

export const InputRefSchema = z.object({
  field: z.enum(INPUT_FIELDS),
  index: z.number().int().min(0).optional(),
})

const inputRefs = z.array(InputRefSchema).min(1).max(6)

const modelJob = z.object({
  title: z.string().min(1).max(30),
  subtitle: z.string().min(1).max(40),
  isStandardName: z.boolean(),
  rationale: z.array(SentenceSchema).min(1).max(3),
  linkedInputs: inputRefs,
  checkPoint: SentenceSchema,
})

const modelKeyword = z.object({
  keyword: z.string().min(1).max(20),
  strengthIndex: z.literal([0, 1, 2]),
  linkedJobIndex: z.literal([0, 1, 2]),
  description: z.array(SentenceSchema).min(2).max(3),
  linkedInputs: inputRefs,
  mismatchNote: z.string().min(1).max(300).nullable(),
})

export const ModelOutputSchema = z.object({
  jobs: three(modelJob),
  keywords: three(modelKeyword),
})

// ---- 화면 결과: 서버가 표시용 값을 붙인다 ----

export const LinkedInputSchema = InputRefSchema.extend({
  label: z.string(),
  value: z.string(),
})

const resultJob = modelJob.extend({ linkedInputs: z.array(LinkedInputSchema).min(1).max(6) })

const resultKeyword = modelKeyword.extend({
  linkedInputs: z.array(LinkedInputSchema).min(1).max(6),
  strengthText: z.string(),
  linkedJobTitle: z.string(),
})

export const ResultPayloadSchema = z.object({
  jobs: three(resultJob),
  keywords: three(resultKeyword),
  notice: z.tuple([z.string(), z.string()]),
  generatedAt: z.string(),
})

export type InputField = (typeof INPUT_FIELDS)[number]
export type Sentence = z.infer<typeof SentenceSchema>
export type InputRef = z.infer<typeof InputRefSchema>
export type LinkedInput = z.infer<typeof LinkedInputSchema>
export type ModelOutput = z.infer<typeof ModelOutputSchema>
export type ResultJob = z.infer<typeof resultJob>
export type ResultKeyword = z.infer<typeof resultKeyword>
export type ResultPayload = z.infer<typeof ResultPayloadSchema>
