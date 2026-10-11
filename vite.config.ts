import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 로컬 개발에서 vercel dev 없이 /api/generate를 같은 핸들러에 연결한다.
function apiDevPlugin(): Plugin {
  return {
    name: 'api-generate-dev',
    configureServer(server) {
      server.middlewares.use('/api/generate', async (req, res) => {
        const { handleGenerate } = await server.ssrLoadModule('/server/handler.ts')
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const request = new Request(`http://localhost${req.url ?? '/'}`, {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: ['GET', 'HEAD'].includes(req.method ?? 'GET') ? undefined : Buffer.concat(chunks),
        })
        const response: Response = await handleGenerate(request)
        res.statusCode = response.status
        response.headers.forEach((value: string, key: string) => res.setHeader(key, value))
        res.end(Buffer.from(await response.arrayBuffer()))
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
