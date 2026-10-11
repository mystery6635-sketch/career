import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BREAKPOINTS } from '../../src/styles/breakpoints'

function files(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path, pattern)
    return pattern.test(name) ? [path.replaceAll('\\', '/')] : []
  })
}

const css = files('src/styles', /\.css$/)
const nonTokenCss = css.filter((f) => !f.endsWith('tokens.css'))
const sources = files('src', /\.(css|tsx?)$/).filter((f) => !f.endsWith('tokens.css'))

describe('디자인 규칙 검사 (Phase 4 선행 정리)', () => {
  it('tokens.css 밖에는 색 리터럴(#hex, rgb())이 없다', () => {
    const offenders = sources.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((line, i) => ({ f, i: i + 1, line }))
        .filter(({ line }) => /#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*') && !line.trim().startsWith('/*'))
        .map(({ f, i, line }) => `${f}:${i} ${line.trim()}`),
    )
    expect(offenders).toEqual([])
  })

  it('tokens.css 밖의 padding·margin·gap·font-size에는 px 리터럴이 없다(1px 테두리 기법과 -1px 제외)', () => {
    const offenders = nonTokenCss.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((line, i) => ({ f, i: i + 1, line }))
        .filter(({ line }) => {
          const m = line.match(/^\s*(padding|margin|gap|row-gap|column-gap|font-size)(-[a-z]+)?:\s*([^;]+);/)
          if (!m) return false
          return /(?<![\w.#-])(?!1px|0px)\d+(\.\d+)?px/.test(m[3])
        })
        .map(({ f, i, line }) => `${f}:${i} ${line.trim()}`),
    )
    expect(offenders).toEqual([])
  })

  it('CSS가 쓰는 --space-N, --fs-N 토큰은 모두 tokens.css에 정의되어 있다', () => {
    const defined = new Set([...readFileSync('src/styles/tokens.css', 'utf8').matchAll(/(--[a-z0-9-]+):/g)].map((m) => m[1]))
    const used = new Set(nonTokenCss.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1])))
    // --motion-delay는 요소마다 인라인으로 정하는 값이라 tokens.css에 없다.
    const missing = [...used].filter((name) => !defined.has(name) && name !== '--motion-delay')
    expect(missing).toEqual([])
  })

  it('분기 값은 breakpoints.ts와 tokens.css의 미디어 쿼리가 같다', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8')
    for (const px of [BREAKPOINTS.wide, BREAKPOINTS.desktop, BREAKPOINTS.tablet, BREAKPOINTS.mobile]) {
      expect(tokens).toContain(`@media (max-width: ${px}px)`)
    }
  })

  it('useIsMobile은 BREAKPOINTS.mobile을 쓴다(767px 중복 정의 없음)', () => {
    const hook = readFileSync('src/hooks/useIsMobile.ts', 'utf8')
    expect(hook).toContain('BREAKPOINTS.mobile')
    expect(hook).not.toMatch(/767/)
  })

  it('인쇄 규칙은 print.css와 print-result.css에만 있다(pages.css·components.css에 @media print 없음)', () => {
    for (const f of ['src/styles/pages.css', 'src/styles/components.css']) {
      expect(readFileSync(f, 'utf8')).not.toContain('@media print')
    }
  })

  it('src 컴포넌트에 인라인 style 속성이 없다(모션 지연 변수 제외)', () => {
    const offenders = files('src/components', /\.tsx$/).filter((f) => /style=\{\{(?!\s*\[?'--motion-delay')/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('버튼과 입력 요소는 공통 컴포넌트가 만든다: className="btn"과 className="control"은 각 한 곳(+ButtonLink)에만 있다', () => {
    const all = files('src', /\.tsx$/).map((f) => ({ f, text: readFileSync(f, 'utf8') }))
    const btn = all.filter(({ text }) => text.includes('className="btn"')).map(({ f }) => f)
    const control = all.filter(({ text }) => text.includes('className="control"')).map(({ f }) => f)
    expect(btn).toEqual(['src/components/ui/Button.tsx'])
    expect(control).toEqual(['src/components/ui/TextField.tsx', 'src/components/ui/Select.tsx'].sort())
  })
})
