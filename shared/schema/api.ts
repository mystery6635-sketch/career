// API 오류·응답 스키마(contracts/generate-api.md 3~4절). details에는 경로와 규칙 이름만 넣고 입력 값은 넣지 않는다.
import { z } from 'zod'
import { ResultPayloadSchema } from './output.js'

export const API_ERROR_CODES = [
  'VALIDATION_FAILED',
  'PII_DETECTED',
  'RATE_LIMITED',
  'UPSTREAM_FAILED',
  'OUTPUT_INVALID',
  'TIMEOUT',
  'INTERNAL',
] as const

export const ApiErrorSchema = z.object({
  code: z.enum(API_ERROR_CODES),
  message: z.string(),
  retryAfterSeconds: z.number().int().min(0).optional(),
  details: z
    .array(z.object({ path: z.array(z.union([z.string(), z.number()])), rule: z.string() }))
    .optional(),
  requestId: z.string(),
})

export const GenerateSuccessSchema = z.object({ ok: z.literal(true), result: ResultPayloadSchema })
export const GenerateFailureSchema = z.object({ ok: z.literal(false), error: ApiErrorSchema })
export const GenerateResponseSchema = z.discriminatedUnion('ok', [GenerateSuccessSchema, GenerateFailureSchema])

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]
export type ApiError = z.infer<typeof ApiErrorSchema>
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>
