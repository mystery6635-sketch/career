import { test, expect } from '@playwright/test'

test('앱이 열리고 한국어 문서 제목을 가진다', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('초기상담 도우미')
})

test('/api/generate 뼈대는 501 ApiError를 반환한다', async ({ request }) => {
  const res = await request.post('/api/generate', { data: {} })
  expect(res.status()).toBe(501)
  const body = await res.json()
  expect(body.ok).toBe(false)
  expect(body.error.requestId).toMatch(/^r_/)
})
