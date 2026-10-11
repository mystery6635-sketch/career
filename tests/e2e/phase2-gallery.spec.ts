import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Phase 2 게이트(T034): 갤러리를 세 크기로 열어 스크린샷을 저장하고 기본 조건을 점검한다.
test('갤러리: 외부 요청 없음, 가로 스크롤 없음, 스크린샷 저장', async ({ page }, testInfo) => {
  const external: string[] = []
  page.on('request', (req) => {
    const url = new URL(req.url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && !req.url().startsWith('data:')) external.push(req.url())
  })

  await page.goto('/dev/ui')
  await expect(page.getByRole('heading', { level: 1, name: '공통 컴포넌트 갤러리' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)

  expect(external).toEqual([])

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)

  await page.screenshot({
    path: `tests/e2e/__artifacts__/phase2/gallery-${testInfo.project.name}.png`,
    fullPage: true,
  })
})

test('갤러리: IBM Plex 글꼴이 적용된다', async ({ page }) => {
  await page.goto('/dev/ui')
  await page.evaluate(() => document.fonts.ready)
  const loaded = await page.evaluate(() =>
    [...document.fonts].some((f) => f.family.includes('IBM Plex Sans KR') && f.status === 'loaded'),
  )
  expect(loaded).toBe(true)
})

test('갤러리: Tab 포커스 윤곽선 3px', async ({ page }) => {
  await page.goto('/dev/ui')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: '본문 바로가기' })
  await expect(skip).toBeFocused()
  await page.keyboard.press('Tab')
  const brand = page.locator('.header__brand')
  await expect(brand).toBeFocused()
  const width = await brand.evaluate((el) => getComputedStyle(el).outlineWidth)
  expect(width).toBe('3px')
})

test('갤러리: 모든 버튼·링크의 높이는 44px 이상', async ({ page }) => {
  await page.goto('/dev/ui')
  const small = await page.$$eval('button:not(:disabled), a[href]', (els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({ text: el.textContent?.trim(), h: el.getBoundingClientRect().height }))
      .filter((x) => x.h < 43.5 && !String(x.text).includes('본문 바로가기')),
  )
  expect(small).toEqual([])
})

test('갤러리: axe 자동 점검에서 심각한 위반 없음', async ({ page }) => {
  await page.goto('/dev/ui')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(serious.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
})

test('움직임 감소: 애니메이션이 적용되지 않는다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/dev/ui')
  const spin = await page.locator('.motion-spin').first().evaluate((el) => getComputedStyle(el).animationName)
  expect(spin).toBe('none')
})

test('인쇄 미디어: .no-print 요소가 숨겨진다', async ({ page }) => {
  await page.goto('/dev/ui')
  await page.emulateMedia({ media: 'print' })
  const hidden = await page.locator('.no-print').first().evaluate((el) => getComputedStyle(el).display)
  expect(hidden).toBe('none')
})
