import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const SHOTS = 'tests/e2e/__artifacts__/phase3'

// 예시 입력(P4와 같은 값). 화면 조작으로 채운다.
async function fillInput(page: Page) {
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

// 모바일에서는 섹션이 접혀 있어 입력 전에 모두 연다.
async function openAllSections(page: Page) {
  await page.locator('.form-section').first().waitFor()
  const toggles = page.locator('.form-section__toggle')
  const count = await toggles.count()
  for (let i = 0; i < count; i++) {
    if ((await toggles.nth(i).getAttribute('aria-expanded')) === 'false') await toggles.nth(i).click()
  }
}

async function goToInput(page: Page, query: string) {
  await page.goto(`/?${query}`)
  await page.getByRole('link', { name: /상담 시작하기/ }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: '구직자 정보 입력' })).toBeFocused()
  await openAllSections(page)
  await fillInput(page)
}

const generate = (page: Page) => page.getByRole('button', { name: /결과 생성하기/ }).click()

test.describe('메인 → 입력 → 결과', () => {
  test('전체 흐름과 화면 전환 규칙(H1 포커스, 문서 제목)', async ({ page }, info) => {
    await page.goto('/?mock=ok&persona=P4')
    await expect(page).toHaveTitle('초기상담 도우미')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('이력을')
    // 처음 열었을 때는 포커스를 옮기지 않아 첫 Tab이 본문 바로가기에 닿는다.
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')

    await page.getByRole('link', { name: /상담 시작하기/ }).first().click()
    await expect(page).toHaveTitle('구직자 정보 입력 · 초기상담 도우미')
    await expect(page.getByRole('heading', { level: 1, name: '구직자 정보 입력' })).toBeFocused()
    await page.screenshot({ path: `${SHOTS}/input-${info.project.name}.png`, fullPage: true })

    await openAllSections(page)
    await fillInput(page)
    await generate(page)
    await expect(page).toHaveURL(/\/result/)
    await expect(page.getByRole('heading', { level: 1, name: '입력하신 내용을 살펴보고 있어요' })).toBeFocused()
    await expect(page).toHaveTitle('입력하신 내용을 살펴보고 있어요 · 초기상담 도우미')

    const h1 = page.getByRole('heading', { level: 1, name: '상담 참고 결과' })
    await expect(h1).toBeFocused()
    await expect(page).toHaveTitle('상담 참고 결과 · 초기상담 도우미')
    await expect(page.locator('.job-card')).toHaveCount(3)
    await expect(page.locator('.keyword-card')).toHaveCount(3)
    // 화면에서 보이는 안내문은 상단 고정 바와 하단 박스, 두 곳이다(인쇄 전용 상자는 화면에서 숨김).
    await expect(page.getByText('결과는 참고용이며, 상담사와 함께 검토해 활용합니다.').locator('visible=true')).toHaveCount(2)
    await page.screenshot({ path: `${SHOTS}/result-${info.project.name}.png`, fullPage: true })
  })

  test('입력 → 결과 → 입력 수정하기 → 값이 유지된다', async ({ page }) => {
    await goToInput(page, 'mock=ok&persona=P4')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    await page.getByRole('button', { name: /입력 수정하기/ }).click()
    await expect(page).toHaveURL(/\/input/)
    await openAllSections(page)
    await expect(page.getByLabel(/^나이/)).toHaveValue('29')
    await expect(page.getByLabel('전공 1', { exact: true })).toHaveValue('식품영양학')
    await expect(page.getByRole('textbox', { name: /^강점 2/ })).toHaveValue('리더십이 있다')
  })

  test('입력 정보 요약은 기본 접힘이고 펼치면 입력 값이 보인다', async ({ page }) => {
    await goToInput(page, 'mock=ok&persona=P4')
    await generate(page)
    const details = page.locator('details.input-summary')
    await expect(details).not.toHaveAttribute('open', '')
    await details.locator('summary').click()
    await expect(details.getByText('식품영양학')).toBeVisible()
  })

  test('직접 진입하면 빈 화면과 입력으로 가는 버튼', async ({ page }) => {
    await page.goto('/result?mock=ok')
    await expect(page.getByRole('heading', { level: 1, name: '아직 입력된 정보가 없어요' })).toBeFocused()
    await page.getByRole('button', { name: /구직자 정보 입력하러 가기/ }).click()
    await expect(page).toHaveURL(/\/input/)
  })

  test('"이용 방법" 링크는 이용 흐름 섹션으로 이동한다', async ({ page }) => {
    await page.goto('/input?mock=ok')
    await page.getByRole('link', { name: '이용 방법' }).click()
    await expect(page).toHaveURL(/#flow/)
    await expect(page.locator('#flow')).toBeInViewport()
  })
})

test.describe('상태 화면 (Mock 시나리오 6개)', () => {
  test('fail-once: 실패 → 다시 시도 → 결과', async ({ page }) => {
    await goToInput(page, 'mock=fail-once&persona=P4')
    await generate(page)
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('결과를 만들지 못했어요')
    await expect(alert).toContainText('입력하신 내용은 그대로 남아 있습니다')
    await expect(page.getByRole('button', { name: /입력 수정하기/ })).toBeVisible()
    await page.getByRole('button', { name: /다시 시도/ }).click()
    await expect(page.locator('.job-card')).toHaveCount(3)
  })

  test('limit: 요청 제한 화면(숫자 없음)', async ({ page }) => {
    await goToInput(page, 'mock=limit')
    await generate(page)
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('요청이 잠시 많아요')
    await expect(alert).not.toContainText(/\d/)
    await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  })

  test('format: 형식 오류 화면, 부분 결과 없음', async ({ page }) => {
    await goToInput(page, 'mock=format')
    await generate(page)
    await expect(page.getByRole('alert')).toContainText('결과 형식이 맞지 않아 보여드릴 수 없어요')
    await expect(page.locator('.job-card')).toHaveCount(0)
  })

  test('fail: 생성 실패 화면', async ({ page }) => {
    await goToInput(page, 'mock=fail')
    await generate(page)
    await expect(page.getByRole('alert')).toContainText('연결이 원활하지 않았어요')
  })

  test('slow: 30초에 지연 안내, 31초 후 결과', async ({ page }) => {
    await page.clock.install()
    await goToInput(page, 'mock=slow&persona=P4')
    await generate(page)
    await expect(page.getByRole('heading', { level: 1, name: '입력하신 내용을 살펴보고 있어요' })).toBeVisible()
    await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toHaveCount(0)
    await page.clock.fastForward(30_500)
    await expect(page.getByText(/평소보다 오래 걸리고 있어요/)).toBeVisible()
    await expect(page.locator('.alert[role="status"]')).toBeVisible()
    // 가짜 시계를 조금씩 더 흘려 31초 지연이 끝날 때까지 기다린다.
    await expect(async () => {
      await page.clock.fastForward(500)
      await expect(page.locator('.job-card')).toHaveCount(3, { timeout: 300 })
    }).toPass({ timeout: 10_000 })
  })

  test('timeout: 120초에 시간 초과 화면, 구체 시간 문구 없음', async ({ page }) => {
    await page.clock.install()
    await goToInput(page, 'mock=timeout')
    await generate(page)
    await page.clock.fastForward(121_000)
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('시간이 너무 오래 걸려 중단했어요')
    await expect(alert).not.toContainText(/\d+\s*(초|분)/)
    await expect(page.getByRole('button', { name: /다시 시도/ })).toBeVisible()
  })

  test('분석 중 뒤로 가기: 요청이 중단되고 입력은 유지된다', async ({ page }) => {
    await goToInput(page, 'mock=timeout')
    await generate(page)
    await expect(page.getByRole('heading', { level: 1, name: '입력하신 내용을 살펴보고 있어요' })).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/input/)
    await openAllSections(page)
    await expect(page.getByLabel(/^나이/)).toHaveValue('29')
    // 결과 화면으로 다시 가도 이전 요청의 결과가 나타나지 않는다.
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1, name: '아직 입력된 정보가 없어요' })).toBeVisible()
  })

  test('재생성이 실패하면 이전 결과가 사라진다', async ({ page }) => {
    await goToInput(page, 'mock=fail-once&persona=P4')
    // 첫 호출은 실패 → 재시도로 성공, 이후 다시 생성하기 성공 후 안내가 나온다
    await generate(page)
    await page.getByRole('button', { name: /다시 시도/ }).click()
    await expect(page.locator('.job-card')).toHaveCount(3)
    await page.getByRole('button', { name: /다시 생성하기/ }).click()
    await expect(page.getByText('새로 생성한 결과로 바꿨어요. 이전 결과는 더 이상 표시되지 않습니다.')).toBeVisible()
  })
})

test.describe('복사·인쇄', () => {
  test('복사하기: 알림 문구와 버튼 글자, 클립보드에 입력 정보 없음', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await goToInput(page, 'mock=ok&persona=P4')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    await page.getByRole('button', { name: /결과 복사하기/ }).click()
    await expect(page.getByText('결과를 복사했어요. 구직자 입력 정보는 포함되지 않아요.')).toBeVisible()
    await expect(page.getByRole('button', { name: /✓ 복사했어요/ })).toBeVisible()
    const text = await page.evaluate(() => navigator.clipboard.readText())
    expect(text).toContain('A. 취업 가능성이 높은 추천 직업 3개')
    expect(text).not.toContain('29')
    expect(text).not.toContain('나이')
  })

  test('인쇄 미디어: 헤더·행동 버튼·입력 요약은 숨고 안내문이 위·아래에 보인다', async ({ page }) => {
    await goToInput(page, 'mock=ok&persona=P4')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator('.header')).toBeHidden()
    await expect(page.locator('.action-bar')).toBeHidden()
    await expect(page.locator('.input-summary')).toBeHidden()
    await expect(page.locator('.print-notice')).toBeVisible()
    await expect(page.locator('.notice-bar')).toBeHidden()
    await expect(page.locator('.notice-bottom')).toBeVisible()
    // 구직자 입력 정보(나이)는 인쇄 화면에 없다
    expect(await page.locator('body').innerText()).not.toContain('나이')
  })
})

test.describe('A4 인쇄 쪽수 (T063)', () => {
  async function pdfPages(page: Page, persona: string): Promise<number> {
    await goToInput(page, `mock=ok&persona=${persona}`)
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    await page.emulateMedia({ media: 'print' })
    const pdf = await page.pdf({ format: 'A4', preferCSSPageSize: true, printBackground: false })
    return (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length
  }

  for (const id of ['P1', 'P2', 'P3', 'P4', 'P5']) {
    test(`${id} Mock 결과는 A4 한 장이다`, async ({ page }) => {
      expect(await pdfPages(page, id)).toBe(1)
    })
  }

  // 한도를 모두 채운 최악 결과. 한 장에 들어가지 않으면 문장 한도를 줄이거나 두 장을 허용하는 결정이 필요하다(FR-022, 사용자 결정).
  test('최대 길이 결과의 쪽수를 기록한다(한 장 요구: 사용자 결정 필요)', async ({ page }) => {
    const pages = await pdfPages(page, 'MAX')
    test.info().annotations.push({ type: 'max-length-pdf-pages', description: String(pages) })
    expect(pages).toBeLessThanOrEqual(2)
  })
})

test.describe('반응형과 접근성 (T061, T062)', () => {
  for (const [name, path] of [
    ['메인', '/?mock=ok'],
    ['입력', '/input?mock=ok'],
  ] as const) {
    test(`${name}: 가로 스크롤 없음(360px 포함)`, async ({ page }) => {
      for (const width of [360, 390, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${name} ${width}px`).toBeLessThanOrEqual(0)
      }
    })
  }

  test('결과: 가로 스크롤 없음(360px 포함)', async ({ page }) => {
    await goToInput(page, 'mock=ok&persona=P3')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    for (const width of [360, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `result ${width}px`).toBeLessThanOrEqual(0)
    }
  })

  test('결과 카드 열 수: 1440px 3열, 1024px 1열', async ({ page }) => {
    await goToInput(page, 'mock=ok&persona=P3')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    const columns = () =>
      page.locator('.card-grid').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
    await page.setViewportSize({ width: 1440, height: 900 })
    expect(await columns()).toBe(3)
    await page.setViewportSize({ width: 1024, height: 768 })
    expect(await columns()).toBe(1)
  })

  test('모바일(390px): 입력 섹션이 접이식이고 목차가 없다', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/input?mock=ok')
    await expect(page.locator('.section-nav')).toHaveCount(0)
    const toggles = page.locator('.form-section__toggle')
    await expect(toggles).toHaveCount(5)
    await expect(toggles.nth(0)).toHaveAttribute('aria-expanded', 'true')
    await expect(toggles.nth(1)).toHaveAttribute('aria-expanded', 'false')
  })

  test('데스크톱(1440px)에서 Hero 첫 화면에 H1과 주 CTA가 보인다', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    await expect(page.getByRole('link', { name: /상담 시작하기/ }).first()).toBeInViewport()
  })

  test('움직임 감소: 화면의 모든 애니메이션이 없다', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?mock=ok')
    const running = await page.evaluate(() => document.getAnimations().length)
    expect(running).toBe(0)
  })

  test('움직임 허용: 연결선 흐름은 3회 후 멈춘다(무한 반복 아님)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const iterations = await page.locator('.rf__line').first().evaluate((el) => getComputedStyle(el).animationIterationCount)
    expect(iterations).toBe('3')
  })

  test('키보드: 모든 링크·버튼이 Tab으로 포커스될 때 윤곽선이 보인다', async ({ page }) => {
    await page.goto('/?mock=ok')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: '본문 바로가기' })).toBeFocused()
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      const outline = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const s = getComputedStyle(el)
        return { width: s.outlineWidth, style: s.outlineStyle }
      })
      expect(outline).toEqual({ width: '3px', style: 'solid' })
    }
  })

  for (const [name, path] of [
    ['메인', '/?mock=ok'],
    ['입력', '/input?mock=ok'],
  ] as const) {
    test(`${name}: axe 점검에서 심각한 위반 없음`, async ({ page }) => {
      await page.goto(path)
      if (path.startsWith('/input')) await openAllSections(page)
      // 진입 애니메이션(0.7초)이 끝난 뒤에 대비를 잰다.
      await page.waitForTimeout(1200)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    })
  }

  test('결과: axe 점검에서 심각한 위반 없음', async ({ page }) => {
    await goToInput(page, 'mock=ok&persona=P4')
    await generate(page)
    await expect(page.locator('.job-card')).toHaveCount(3)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  })
})
