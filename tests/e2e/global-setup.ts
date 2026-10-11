import { chromium, type FullConfig } from '@playwright/test'

// T132: 개발 서버를 처음 띄운 직후에는 Vite가 모듈을 처음 컴파일하고 의존성을 다시 최적화하느라
// 첫 테스트가 실패할 수 있다. 모든 경로를 한 번 열어 미리 컴파일시킨 뒤 테스트를 시작한다.
export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL ?? 'http://localhost:5173'
  const browser = await chromium.launch()
  const page = await browser.newPage()
  for (const path of ['/?mock=ok', '/input?mock=ok', '/result?mock=ok']) {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { level: 1 }).first().waitFor()
  }
  // 최적화된 의존성이 바뀌어 페이지가 다시 불러와졌다면 한 번 더 확인한다.
  await page.goto(`${baseURL}/?mock=ok`, { waitUntil: 'networkidle' })
  await browser.close()
}
