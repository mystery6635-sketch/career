// 웹 표준 Request → Response 핸들러. Vercel 함수와 Vite 개발 서버가 같은 함수를 쓴다.
// 현재는 뼈대이며 501과 ApiError 형태만 반환한다(contracts/generate-api.md 4절).
export async function handleGenerate(_request: Request): Promise<Response> {
  const requestId = `r_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  return new Response(
    JSON.stringify({
      ok: false,
      error: { code: 'INTERNAL', message: '아직 구현되지 않았어요.', requestId },
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    },
  )
}
