import { fileURLToPath } from 'node:url'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 로컬 개발에서 vercel dev 없이 /api/generate를 같은 핸들러에 연결한다.
function apiDevPlugin(): Plugin {
  return {
    name: 'api-generate-dev',
    configureServer(server) {
      // 서버 전용 변수(LLM_*, RATE_LIMIT_*)는 .env 파일에서 읽어 서버 프로세스에만 넣는다(브라우저 번들에는 VITE_ 변수만 간다).
      // 개발 서버에서 LLM_PROVIDER가 없으면 비용이 없는 mock 공급자를 쓴다. 프로덕션 빌드는 mock을 거부한다(server/config.ts).
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const key of ['LLM_PROVIDER', 'LLM_MODEL', 'LLM_API_KEY', 'LLM_MOCK_MODE', 'RATE_LIMIT_MAX', 'RATE_LIMIT_WINDOW_SECONDS']) {
        if (process.env[key] === undefined && env[key]) process.env[key] = env[key]
      }
      process.env.LLM_PROVIDER ||= 'mock'

      // 통합 E2E 전용(E2E_CONTROL=1일 때만): 요청 사이에 mock 공급자의 동작 방식(LLM_MOCK_MODE)을 바꾼다. 빌드 결과물에는 포함되지 않는다.
      if (process.env.E2E_CONTROL === '1' && process.env.LLM_PROVIDER === 'mock') {
        server.middlewares.use('/__e2e/mock-mode', (req, res) => {
          const mode = new URL(req.url ?? '/', 'http://localhost').searchParams.get('mode') ?? 'ok'
          process.env.LLM_MOCK_MODE = mode
          res.statusCode = 204
          res.end()
        })
      }

      server.middlewares.use('/api/generate', async (req, res) => {
        try {
          const { handleGenerate } = await server.ssrLoadModule('/server/handler.ts')
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const headers = { ...(req.headers as Record<string, string>) }
          headers['x-forwarded-for'] ||= req.socket.remoteAddress ?? 'unknown'
          const request = new Request(`http://localhost${req.url ?? '/'}`, {
            method: req.method,
            headers,
            body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
          })
          const response: Response = await handleGenerate(request)
          res.statusCode = response.status
          response.headers.forEach((value: string, key: string) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch {
          // 핸들러 밖(모듈 로딩 등)의 오류. 원인은 응답에 싣지 않는다.
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ ok: false, error: { code: 'INTERNAL', message: '개발 서버 오류', requestId: 'r_dev' } }))
        }
      })
    },
  }
}

export default defineConfig({
  resolve: { alias: { '@shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  plugins: [react(), tailwindcss(), apiDevPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['{shared,server,src}/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}', 'tests/contract/**/*.test.{ts,tsx}'],
  },
})
