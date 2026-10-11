import { expect, test } from '@playwright/test'
import { STATUS_SCREENS } from '../../../shared/messages'
import { generate, goToInput } from '../helpers'

// T113: 요청 제한(RATE_LIMIT_MAX=2). 별도 서버(포트 5175)를 쓰므로 다른 통합 테스트의 요청 횟수와 섞이지 않는다.
test.use({ baseURL: 'http://localhost:5175' })

test('요청 제한: 3번째 요청은 429이고 요청 제한 화면(숫자 없음)이 나오며 입력은 유지된다', async ({ page }) => {
  await goToInput(page, '')
  const statuses: number[] = []
  page.on('response', (r) => {
    if (r.url().endsWith('/api/generate')) statuses.push(r.status())
  })
  await generate(page)
  await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 30_000 })
  await page.getByRole('button', { name: /다시 생성하기/ }).click()
  await expect(page.getByText('새로 생성한 결과로 바꿨어요')).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /다시 생성하기/ }).click()

  const h1 = page.getByRole('heading', { level: 1 })
  await expect(h1).toHaveText(STATUS_SCREENS['rate-limited'].title, { timeout: 30_000 })
  expect(statuses).toEqual([200, 200, 429])
  await expect(page.getByRole('alert')).not.toContainText(/\d/)
  await expect(page.locator('.job-card')).toHaveCount(0)
  await page.getByRole('button', { name: /입력 수정하기/ }).click()
  await expect(page.getByLabel(/^나이/)).toHaveValue('29')
})
