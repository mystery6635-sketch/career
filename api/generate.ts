import { handleGenerate } from '../server/handler.js'

// Vercel 함수 진입 형식(웹 표준 export, ESM 확장자 규칙)은 확인 필요: T011 배포에서 확인
export function POST(request: Request): Promise<Response> {
  return handleGenerate(request)
}
