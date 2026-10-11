import { expect, test, type Page, type Route } from '@playwright/test'
import { COPY_MESSAGES, STATUS_SCREENS } from '../../shared/messages'
import { buildCopyText } from '../../src/lib/copyText'
import { MOCK_RESULTS } from '../../src/mock/results'
import { generate, goToInput, openAllSections } from './helpers'

// Phase 7 화면 연결(T108~T111). 서버 응답은 `page.route`로 흉내 낸다(mock 쿼리 없이 실제 HTTP 서비스 경로를 탄다).
// 실제 /api/generate 라우트를 쓰는 통합 검증은 integration/*.spec.ts(T113).

const body = (value: unknown) => ({ contentType: 'application/json; charset=utf-8', body: JSON.stringify(value) })
const success = (result = MOCK_RESULTS.P4) => ({ status: 200, ...body({ ok: true, result }) })
const failure = (status: number, code: string, extra: Record<string, unknown> = {}) => ({
  status,
  ...body({ ok: false, error: { code, message: 'x', requestId: 'r_e2e', ...extra } }),
})

/** 요청마다 순서대로 응답한다. 마지막 응답은 반복한다. 본문을 모아 둔다. */
async function respondWith(page: Page, responses: Parameters<Route['fulfill']>[0][]) {
  const requests: string[] = []
  await page.route('**/api/generate', async (route) => {
    requests.push(route.request().postData() ?? '')
    await route.fulfill(responses[Math.min(requests.length - 1, responses.length - 1)])
  })
  return requests
}

const h1 = (page: Page) => page.getByRole('heading', { level: 1 })

test.describe('오류 코드별 화면 상태 (T108)', () => {
  const CASES: { name: string; response: Parameters<Route['fulfill']>[0]; variant: keyof typeof STATUS_SCREENS }[] = [
    { name: 'UPSTREAM_FAILED', response: failure(502, 'UPSTREAM_FAILED'), variant: 'failed' },
    { name: 'INTERNAL', response: failure(500, 'INTERNAL'), variant: 'failed' },
    { name: '응답 형식 오류({ok} 아님)', response: { status: 200, ...body({ hello: 'world' }) }, variant: 'failed' },
    { name: '응답 형식 오류(JSON 아님)', response: { status: 502, contentType: 'text/html', body: '<html>bad gateway</html>' }, variant: 'failed' },
    { name: 'OUTPUT_INVALID', response: failure(502, 'OUTPUT_INVALID'), variant: 'invalid-output' },
    { name: 'TIMEOUT', response: failure(504, 'TIMEOUT'), variant: 'timeout' },
    { name: 'RATE_LIMITED', response: failure(429, 'RATE_LIMITED', { retryAfterSeconds: 60 }), variant: 'rate-limited' },
  ]

  for (const { name, response, variant } of CASES) {
    test(`${name} -> ${variant} 화면, 입력 유지·다시 시도·입력 수정하기 (T109)`, async ({ page }) => {
      const requests = await respondWith(page, [response, response, success()])
      await goToInput(page, '')
      await generate(page)
      await expect(h1(page)).toHaveText(STATUS_SCREENS[variant].title)
      await expect(h1(page)).toBeFocused()
      const alert = page.getByRole('alert')
      await expect(alert).toContainText(STATUS_SCREENS[variant].body)
      // 숫자는 어느 화면에도 나오지 않는다(요청 제한의 재시도 시간 포함, FR-038).
      if (variant === 'rate-limited' || variant === 'timeout') await expect(alert).not.toContainText(/\d/)
      await expect(page.locator('.job-card')).toHaveCount(0)

      // 다시 시도: 입력을 다시 하지 않고 같은 입력으로 요청하고, 같은 오류 화면이 다시 나온다.
      await page.getByRole('button', { name: /다시 시도/ }).click()
      await expect(page.getByRole('alert')).toContainText(STATUS_SCREENS[variant].body)
      expect(requests).toHaveLength(2)
      expect(requests[1]).toBe(requests[0])

      // 입력 수정하기: /input에서 값이 그대로다.
      await page.getByRole('button', { name: /입력 수정하기/ }).click()
      await expect(page).toHaveURL(/\/input/)
      await openAllSections(page)
      await expect(page.getByLabel(/^나이/)).toHaveValue('29')
      await expect(page.getByLabel('전공 1', { exact: true })).toHaveValue('식품영양학')
      await expect(page.getByRole('textbox', { name: /^강점 3/ })).toHaveValue('사람들과 잘 지낸다')

      // 입력 화면에서 다시 생성하면 같은 입력으로 요청해 결과가 나온다.
      await generate(page)
      await expect(page.locator('.job-card')).toHaveCount(3)
      expect(requests).toHaveLength(3)
      expect(requests[2]).toBe(requests[0])
    })
  }

  test('다시 시도는 같은 입력으로 요청하고 타이머가 0초부터 다시 시작한다 (T109)', async ({ page }) => {
    await page.clock.install()
    const requests = await respondWith(page, [failure(502, 'UPSTREAM_FAILED')])
    await goToInput(page, '')
    await generate(page)
    await expect(h1(page)).toHaveText(STATUS_SCREENS.failed.title)
    // 두 번째 요청은 응답이 오지 않는다. 29초에는 지연 안내가 없고 30.5초에 생긴다(첫 요청 시각이 아니라 다시 시도한 시각부터 센다).
    await page.unroute('**/api/generate')
    await page.route('**/api/generate', () => undefined) // 응답하지 않음
    await page.clock.fastForward(20_000)
    await page.getByRole('button', { name: /다시 시도/ }).click()
    await expect(h1(page)).toHaveText(STATUS_SCREENS.analyzing.title)
    await page.clock.fastForward(29_000)
    await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toHaveCount(0)
    await page.clock.fastForward(1_500)
    await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toBeVisible()
    expect(requests).toHaveLength(1)
  })

  test('네트워크 오류는 생성 실패 화면이다', async ({ page }) => {
    await page.route('**/api/generate', (route) => route.abort('connectionrefused'))
    await goToInput(page, '')
    await generate(page)
    await expect(h1(page)).toHaveText(STATUS_SCREENS.failed.title)
    await expect(page.getByRole('button', { name: /다시 시도/ })).toBeVisible()
  })

  test('VALIDATION_FAILED는 입력 화면 필드 오류와 오류 요약이 된다', async ({ page }) => {
    await respondWith(page, [failure(400, 'VALIDATION_FAILED', { details: [{ path: ['strengths', 1], rule: 'too_small' }] })])
    await goToInput(page, '')
    await generate(page)
    await expect(page).toHaveURL(/\/input/)
    const summary = page.locator('.error-summary')
    await expect(summary).toBeFocused()
    await expect(summary).toContainText('강점 2')
    await expect(page.getByRole('textbox', { name: /^강점 2/ })).toHaveAttribute('aria-invalid', 'true')
    // 입력은 유지된다.
    await expect(page.getByLabel(/^나이/)).toHaveValue('29')
    // 요약 링크로 해당 입력창에 이동한다.
    await summary.getByRole('link', { name: /강점 2/ }).click()
    await expect(page.getByRole('textbox', { name: /^강점 2/ })).toBeFocused()
    // 고치면 서버 오류 표시는 사라진다.
    await page.getByRole('textbox', { name: /^강점 2/ }).fill('팀을 이끄는 힘이 있다')
    await expect(summary).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: /^강점 2/ })).not.toHaveAttribute('aria-invalid', 'true')
  })

  test('PII_DETECTED는 해당 입력창 오류가 된다', async ({ page }) => {
    await respondWith(page, [failure(400, 'PII_DETECTED', { details: [{ path: ['majors', 0], rule: 'phone' }] })])
    await goToInput(page, '')
    await generate(page)
    await expect(page).toHaveURL(/\/input/)
    await expect(page.locator('.error-summary')).toContainText('개인 식별 정보')
    await expect(page.getByLabel('전공 1', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  })
})

test.describe('입력 수정 후 다시 생성 (T110)', () => {
  test('결과 -> 입력 수정하기 -> 수정 -> 결과 생성하기: 새 결과와 재생성 알림', async ({ page }) => {
    const requests = await respondWith(page, [success(MOCK_RESULTS.P4), success(MOCK_RESULTS.P1)])
    await goToInput(page, '')
    await generate(page)
    await expect(page.locator('.job-card').first()).toContainText(MOCK_RESULTS.P4.jobs[0].title)
    await expect(page.getByText('새로 생성한 결과로 바꿨어요')).toHaveCount(0)
    await page.getByRole('button', { name: /입력 수정하기/ }).click()
    await openAllSections(page)
    await page.getByRole('textbox', { name: /^강점 2/ }).fill('꼼꼼하게 기록을 남긴다')
    await generate(page)
    await expect(page.locator('.job-card').first()).toContainText(MOCK_RESULTS.P1.jobs[0].title)
    await expect(page.getByText('새로 생성한 결과로 바꿨어요. 이전 결과는 더 이상 표시되지 않습니다.')).toBeVisible()
    expect(requests[1]).toContain('꼼꼼하게 기록을 남긴다')
    expect(requests[1]).not.toContain('"age"')
  })

  test('다시 생성하기: 새 결과로 바뀌고 알림이 나온다', async ({ page }) => {
    await respondWith(page, [success(MOCK_RESULTS.P4), success(MOCK_RESULTS.P2)])
    await goToInput(page, '')
    await generate(page)
    await expect(page.locator('.job-card').first()).toContainText(MOCK_RESULTS.P4.jobs[0].title)
    await page.getByRole('button', { name: /다시 생성하기/ }).click()
    await expect(page.locator('.job-card').first()).toContainText(MOCK_RESULTS.P2.jobs[0].title)
    await expect(page.getByText('새로 생성한 결과로 바꿨어요')).toBeVisible()
  })

  test('재생성이 실패하면 이전 결과를 표시하지 않고 오류 화면을 보인다', async ({ page }) => {
    await respondWith(page, [success(MOCK_RESULTS.P4), failure(502, 'UPSTREAM_FAILED')])
    await goToInput(page, '')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    await page.getByRole('button', { name: /다시 생성하기/ }).click()
    await expect(h1(page)).toHaveText(STATUS_SCREENS.failed.title)
    await expect(page.locator('.job-card')).toHaveCount(0)
    await expect(page.locator('.keyword-card')).toHaveCount(0)
    await expect(page.getByText(MOCK_RESULTS.P4.jobs[0].title)).toHaveCount(0)
  })
})

test.describe('결과 복사 (T111)', () => {
  test('CP 1절 형식으로 복사하고, polite 알림과 버튼 글자가 2.5초 뒤 돌아온다', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.clock.install()
    await respondWith(page, [success(MOCK_RESULTS.P4)])
    await goToInput(page, '')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    // 시계를 멈춘 뒤 복사해 2.5초 경계를 정확히 잰다.
    await page.clock.pauseAt(new Date(Date.now() + 60_000))
    await page.getByRole('button', { name: /결과 복사하기/ }).click()
    // Windows 클립보드는 줄바꿈을 CRLF로 바꾸므로 LF로 맞춰 비교한다.
    const copied = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')
    expect(copied).toBe(buildCopyText(MOCK_RESULTS.P4))
    // 알림은 aria-live=polite 영역 안에 글자로 나타난다.
    const live = page.locator('[aria-live="polite"]').filter({ hasText: COPY_MESSAGES.success })
    await expect(live).toHaveCount(1)
    await expect(page.getByRole('button', { name: /✓ 복사했어요/ })).toBeVisible()
    await page.clock.fastForward(2_400)
    await expect(page.getByRole('button', { name: /✓ 복사했어요/ })).toBeVisible()
    await page.clock.fastForward(200)
    await expect(page.getByRole('button', { name: /결과 복사하기/ })).toBeVisible()
  })

  test('클립보드 권한이 거부되면 실패 알림이 나온다', async ({ page }) => {
    await page.addInitScript(() => {
      navigator.clipboard.writeText = () => Promise.reject(new DOMException('denied', 'NotAllowedError'))
    })
    await respondWith(page, [success(MOCK_RESULTS.P4)])
    await goToInput(page, '')
    await generate(page)
    await page.getByRole('button', { name: /결과 복사하기/ }).click()
    await expect(page.locator('[aria-live="polite"]').filter({ hasText: COPY_MESSAGES.error })).toHaveCount(1)
    await expect(page.getByRole('button', { name: /✓ 복사했어요/ })).toHaveCount(0)
  })
})
