import { test } from '@playwright/test'
import { reachScreen, reachState, SCREENS, STATES } from './helpers'

// T072: 세 화면 × 세 뷰포트(프로젝트) + 상태 화면 7종 + 인쇄 미디어를 저장한다.
// 시안 v3 캡처는 design-review.md의 방법(render_preview)으로 따로 만든다.
const OUT = 'tests/e2e/__artifacts__/visual'

test.describe('화면 캡처(T072)', () => {
  for (const screen of SCREENS) {
    test(`${screen} 화면`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await reachScreen(page, screen)
      await page.screenshot({ path: `${OUT}/${screen}-${info.project.name}.png`, fullPage: true })
    })
  }

  for (const state of STATES) {
    test(`상태 화면: ${state}`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await reachState(page, state)
      await page.screenshot({ path: `${OUT}/state-${state}-${info.project.name}.png`, fullPage: true })
    })
  }

  test('인쇄 미디어(결과)', async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await reachScreen(page, 'result')
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' })
    await page.screenshot({ path: `${OUT}/print-${info.project.name}.png`, fullPage: true })
  })
})
