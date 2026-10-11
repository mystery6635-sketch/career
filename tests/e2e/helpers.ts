import { expect, type Page } from '@playwright/test'

// visual.spec.ts와 regression.spec.ts가 같이 쓰는 화면 도달 도우미(T072, T075).

export async function fillInput(page: Page) {
  await page.getByLabel(/^나이/).fill('29')
  await page.getByLabel(/^최종학력/).selectOption('bachelor')
  await page.getByLabel(/^학력 상태/).selectOption('graduated')
  await page.getByLabel('전공 1', { exact: true }).fill('식품영양학')
  await page.getByLabel(/직무명/).fill('매장 직원')
  await page.getByLabel(/업종/).fill('카페')
  await page.getByLabel(/기간/).first().fill('1년 6개월')
  await page.getByRole('radio', { name: /인턴 경험 없음/ }).check()
  await page.getByLabel('자격증 1', { exact: true }).fill('위생사')
  await page.getByRole('textbox', { name: /^강점 1/ }).fill('성실함')
  await page.getByRole('textbox', { name: /^강점 2/ }).fill('리더십이 있다')
  await page.getByRole('textbox', { name: /^강점 3/ }).fill('사람들과 잘 지낸다')
}

export async function openAllSections(page: Page) {
  await page.locator('.form-section').first().waitFor()
  const toggles = page.locator('.form-section__toggle')
  const count = await toggles.count()
  for (let i = 0; i < count; i++) {
    if ((await toggles.nth(i).getAttribute('aria-expanded')) === 'false') await toggles.nth(i).click()
  }
}

export async function goToInput(page: Page, query: string) {
  await page.goto(`/?${query}`)
  await page.getByRole('link', { name: /상담 시작하기/ }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: '구직자 정보 입력' })).toBeFocused()
  await openAllSections(page)
  await fillInput(page)
}

export const generate = (page: Page) => page.getByRole('button', { name: /결과 생성하기/ }).click()

export type Screen = 'main' | 'input' | 'result'
export type State = 'analyzing' | 'slow' | 'empty' | 'fail' | 'format' | 'timeout' | 'limit'

export const SCREENS: Screen[] = ['main', 'input', 'result']
export const STATES: State[] = ['analyzing', 'slow', 'empty', 'fail', 'format', 'timeout', 'limit']

export async function reachScreen(page: Page, screen: Screen) {
  if (screen === 'main') {
    await page.goto('/?mock=ok')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  } else if (screen === 'input') {
    await page.goto('/input?mock=ok')
    await openAllSections(page)
  } else {
    await goToInput(page, 'mock=ok&persona=P4')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
  }
  await page.evaluate(() => document.fonts.ready)
}

// 분석 중·지연·시간 초과는 가짜 시계로 같은 값을 재현한다.
export async function reachState(page: Page, state: State) {
  if (state === 'empty') {
    await page.goto('/result?mock=ok')
    await expect(page.getByRole('heading', { level: 1, name: '아직 입력된 정보가 없어요' })).toBeVisible()
  } else if (state === 'analyzing' || state === 'slow' || state === 'timeout') {
    await page.clock.install()
    await goToInput(page, `mock=${state === 'analyzing' || state === 'slow' ? 'timeout' : state}&persona=P4`)
    await generate(page)
    await expect(page.getByRole('heading', { level: 1, name: '입력하신 내용을 살펴보고 있어요' })).toBeVisible()
    if (state === 'slow') {
      await page.clock.fastForward(30_500)
      await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toBeVisible()
    } else if (state === 'timeout') {
      await page.clock.fastForward(121_000)
      await expect(page.getByRole('alert')).toContainText('시간이 너무 오래 걸려 중단했어요')
    }
  } else {
    await goToInput(page, `mock=${state}&persona=P4`)
    await generate(page)
    await expect(page.getByRole('alert')).toBeVisible()
  }
  await page.evaluate(() => document.fonts.ready)
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}
