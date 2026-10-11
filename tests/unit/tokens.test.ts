import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/tokens.css', 'utf8')
const design = readFileSync('specs/001-job-recommendation-keywords/design.md', 'utf8')

function tokenValue(name: string): string | undefined {
  const m = css.match(new RegExp(`${name}:\\s*([^;]+);`))
  return m?.[1].trim().toLowerCase()
}

// design.md §16 표에서 `--이름` / `--이름` | #값 / #값 행을 읽는다.
function designColors(): [string, string][] {
  const section = design.split('## 16. 디자인 토큰')[1].split('## 17.')[0]
  const out: [string, string][] = []
  for (const line of section.split('\n')) {
    if (!line.startsWith('| `--')) continue
    const cells = line.split('|').map((c) => c.trim())
    const names = [...cells[1].matchAll(/`(--[a-z0-9-]+)`/g)].map((m) => m[1])
    const values = cells[2].split('/').map((v) => v.trim().toLowerCase())
    names.forEach((n, i) => out.push([n, values[i]]))
  }
  return out
}

describe('디자인 토큰 (T012, T013)', () => {
  const colors = designColors()

  it('design §16의 색 토큰을 모두 읽었다', () => {
    expect(colors.length).toBeGreaterThanOrEqual(24)
  })

  it.each(colors)('%s 값이 design §16과 같다', (name, value) => {
    expect(tokenValue(name)).toBe(value)
  })

  it('design §18 성공색과 영역 B 배경이 선언되어 있다', () => {
    expect(tokenValue('--success')).toBe('#14502b')
    expect(tokenValue('--area-b-bg')).toBe('#e4ecf2')
  })

  it.each([
    ['--fs-body', '17px'],
    ['--lh-body', '1.65'],
    ['--fs-hero-h1', 'clamp(36px, 5.2vw, 60px)'],
    ['--lh-hero-h1', '1.18'],
    ['--fs-hero-sub', '19px'],
    ['--fs-h2', 'clamp(26px, 3.4vw, 36px)'],
    ['--fs-page-title', 'clamp(28px, 3.4vw, 36px)'],
    ['--fs-status-h1', '28px'],
    ['--fs-area-title', '24px'],
    ['--fs-card-title', '24px'],
    ['--fs-card-body', '16.5px'],
    ['--lh-card-body', '1.75'],
    ['--fs-label', '16.5px'],
    ['--fs-hint', '14.5px'],
    ['--fs-count', '13.5px'],
    ['--fs-kicker', '14px'],
    ['--content-max', '1176px'],
    ['--gutter', '32px'],
    ['--section-y', '84px'],
    ['--hero-top', '132px'],
    ['--hero-bottom', '88px'],
    ['--status-card-w', '680px'],
    ['--print-sheet-w', '794px'],
    ['--radius', '6px'],
    ['--btn-h', '52px'],
    ['--btn-h-sm', '44px'],
    ['--field-h', '48px'],
  ])('%s = %s (design §17, §19, §20)', (name, value) => {
    expect(tokenValue(name)).toBe(value)
  })

  it('모바일(≤767px)에서 본문 16px, 좌우 여백 16px, 섹션 48px이다', () => {
    const mobile = css.split('@media (max-width: 767px)')[1]
    expect(mobile).toMatch(/--fs-body:\s*16px/)
    expect(mobile).toMatch(/--gutter:\s*16px/)
    expect(mobile).toMatch(/--section-y:\s*48px/)
  })

  it('분기 1199/1023/767px이 정의되어 있다', () => {
    for (const bp of ['1199px', '1023px', '767px']) expect(css).toContain(`max-width: ${bp}`)
  })
})
