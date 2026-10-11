// 생성 요청 스키마(data-model 1.2). 나이를 뺀 엄격 객체다. 모르는 필드(age, name, phone, noCertifications 등)는 거부한다.
import { z } from 'zod'
import { applicantShape, checkCrossFields } from './input.js'

export const GenerateRequestSchema = z.strictObject(applicantShape).superRefine(checkCrossFields)

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
