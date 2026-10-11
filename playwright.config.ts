import { defineConfig } from '@playwright/test'

// 통합 E2E(T113)는 실제 /api/generate 라우트와 서버 mock 공급자를 쓴다. 기본 스위트가 요청 제한에 걸리지 않도록
// 별도 개발 서버(포트 5174: 제한 넉넉함, 5175: RATE_LIMIT_MAX=2)와 별도 프로젝트로 분리한다.
// E2E_CONTROL=1은 요청 사이에 mock 동작을 바꾸는 개발 전용 엔드포인트를 켠다(vite.config.ts, 빌드에는 없음).
const INTEGRATION_PORT = 5174
const LIMIT_PORT = 5175
const integrationServer = (port: number, env: Record<string, string>) => ({
  command: `npm run dev -- --port ${port} --strictPort`,
  url: `http://localhost:${port}`,
  reuseExistingServer: false,
  timeout: 120_000,
  env: { LLM_PROVIDER: 'mock', LLM_MOCK_MODE: 'ok', E2E_CONTROL: '1', ...env },
})

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173' },
  webServer: [
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
    },
    integrationServer(INTEGRATION_PORT, { RATE_LIMIT_MAX: '1000' }),
    integrationServer(LIMIT_PORT, { RATE_LIMIT_MAX: '2', RATE_LIMIT_WINDOW_SECONDS: '600' }),
  ],
  projects: [
    { name: 'desktop-1440', testIgnore: /integration\//, use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'tablet-1024', testIgnore: /integration\//, use: { browserName: 'chromium', viewport: { width: 1024, height: 768 } } },
    { name: 'mobile-390', testIgnore: /integration\//, use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    {
      // 한 서버의 mock 동작을 요청 사이에 바꾸므로 같은 서버를 쓰는 테스트는 순서대로 한 번에 하나씩 돈다.
      name: 'integration',
      testMatch: /integration\/.*\.spec\.ts/,
      fullyParallel: false,
      use: { browserName: 'chromium', viewport: { width: 1440, height: 900 }, baseURL: `http://localhost:${INTEGRATION_PORT}` },
    },
  ],
})
