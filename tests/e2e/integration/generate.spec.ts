import { expect, test, type Page } from '@playwright/test'
import { STATUS_SCREENS } from '../../../shared/messages'
import { generate, goToInput } from '../helpers'

// T113·T121·T122: 실제 /api/generate 라우트와 서버 mock 공급자(LLM_PROVIDER=mock)를 쓰는 통합 E2E.
// 개발 서버(포트 5174)의 mock 동작은 요청 사이에 /__e2e/mock-mode로 바꾼다(playwright.config.ts). 테스트는 순서대로 돈다.
test.describe.configure({ mode: 'serial' })

const setMode = (page: Page, mode: 'ok' | 'format-error' | 'fail' | 'slow') =>
  page.request.get(`/__e2e/mock-mode?mode=${mode}`)

const h1 = (page: Page) => page.getByRole('heading', { level: 1 })

test.beforeEach(async ({ page }) => {
  await setMode(page, 'ok')
})

test('정상: 실제 라우트가 결과를 돌려주고 화면이 3+3을 보인다', async ({ page }) => {
  await goToInput(page, '')
  const responsePromise = page.waitForResponse((r) => r.url().endsWith('/api/generate'))
  await generate(page)
  const response = await responsePromise
  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('no-store')
  // 요청 본문에 나이가 없다(FR-004).
  const sent = JSON.parse(response.request().postData() ?? '{}')
  expect(sent).not.toHaveProperty('age')
  expect(sent.strengths).toHaveLength(3)

  await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 30_000 })
  await expect(page.locator('.keyword-card')).toHaveCount(3)
  // 서버가 붙인 표시 값: 연결된 입력 항목에 사용자가 입력한 강점이 보인다.
  await expect(page.locator('.keyword-card').first()).toContainText('성실함')
  await expect(page.getByText('결과는 참고용이며, 상담사와 함께 검토해 활용합니다.').locator('visible=true').first()).toBeVisible()
})

test('형식 오류 후 재요청 성공: 형식 오류 화면 -> 다시 시도 -> 결과', async ({ page }) => {
  await setMode(page, 'format-error')
  await goToInput(page, '')
  await generate(page)
  await expect(h1(page)).toHaveText(STATUS_SCREENS['invalid-output'].title, { timeout: 30_000 })
  await expect(page.locator('.job-card')).toHaveCount(0)
  await setMode(page, 'ok')
  await page.getByRole('button', { name: /다시 시도/ }).click()
  await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 30_000 })
})

test('실패: 공급자 오류는 생성 실패 화면이고 입력이 유지된다', async ({ page }) => {
  await setMode(page, 'fail')
  await goToInput(page, '')
  await generate(page)
  await expect(h1(page)).toHaveText(STATUS_SCREENS.failed.title, { timeout: 30_000 })
  await page.getByRole('button', { name: /입력 수정하기/ }).click()
  await expect(page.getByLabel(/^나이/)).toHaveValue('29')
})

test('지연: 30초에 지연 안내, 120초에 시간 초과(가짜 시계, 서버는 응답하지 않음)', async ({ page }) => {
  await setMode(page, 'slow')
  await page.clock.install()
  await goToInput(page, '')
  await generate(page)
  await expect(h1(page)).toHaveText(STATUS_SCREENS.analyzing.title)
  await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toHaveCount(0)
  await page.clock.fastForward(30_500)
  await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toBeVisible()
  await page.clock.fastForward(100_000)
  await expect(h1(page)).toHaveText(STATUS_SCREENS.timeout.title)
  await expect(page.getByRole('alert')).not.toContainText(/\d/)
})

test('T121: 네트워크 응답(성공·실패)에 API 키·서버 내부 식별 문자열이 없다', async ({ page }) => {
  const bodies: string[] = []
  page.on('response', async (r) => {
    if (!r.url().includes('/api/')) return
    bodies.push(JSON.stringify(r.headers()), await r.text().catch(() => ''))
  })
  await goToInput(page, '')
  await generate(page)
  await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 30_000 })
  await setMode(page, 'fail')
  await page.getByRole('button', { name: /다시 생성하기/ }).click()
  await expect(h1(page)).toHaveText(STATUS_SCREENS.failed.title, { timeout: 30_000 })
  expect(bodies.length).toBeGreaterThanOrEqual(4)
  const all = bodies.join('\n')
  for (const needle of ['LLM_API_KEY', 'x-api-key', 'anthropic', 'sk-ant-', 'applicant_data', 'server/ai']) {
    expect(all.toLowerCase(), needle).not.toContain(needle.toLowerCase())
  }
})

test('T122: 전체 흐름 뒤 저장소·쿠키·URL·콘솔에 입력이 남지 않는다', async ({ page, context }) => {
  const consoleLines: string[] = []
  page.on('console', (m) => consoleLines.push(m.text()))
  page.on('pageerror', (e) => consoleLines.push(e.message))
  await goToInput(page, '')
  await generate(page)
  await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 30_000 })
  await page.getByRole('button', { name: /입력 수정하기/ }).click()
  await page.getByRole('button', { name: /결과 생성하기/ }).click()
  await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 30_000 })

  const stored = await page.evaluate(async () => {
    const dbs = (await indexedDB.databases?.()) ?? []
    return {
      local: localStorage.length,
      session: sessionStorage.length,
      cookie: document.cookie,
      idb: dbs.length,
      caches: (await caches.keys()).length,
    }
  })
  expect(stored).toEqual({ local: 0, session: 0, cookie: '', idb: 0, caches: 0 })
  expect(await context.cookies()).toEqual([])
  expect(page.url()).not.toMatch(/29|식품영양학|성실함|카페|매장/)
  expect(decodeURIComponent(page.url())).not.toMatch(/식품영양학|성실함|카페|매장/)
  const text = consoleLines.join('\n')
  for (const value of ['식품영양학', '매장 직원', '카페', '성실함', '리더십이 있다', '사람들과 잘 지낸다']) {
    expect(text, `console contains ${value}`).not.toContain(value)
  }
})
