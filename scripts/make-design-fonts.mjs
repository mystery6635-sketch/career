// /design-sync가 싣는 글꼴 CSS(.design-sync/fonts.css)를 만든다.
// @fontsource의 CSS는 woff2와 woff를 모두 가리키는데, 디자인 시스템 프로젝트에는 woff2만 올린다(파일 수 절반).
// 사용: node scripts/make-design-fonts.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const SOURCES = [
  ['ibm-plex-sans-kr', ['400', '500', '600', '700']],
  ['ibm-plex-mono', ['500']],
]

let out = '/* 자동 생성: scripts/make-design-fonts.mjs. woff2만 가리킨다. 직접 고치지 않는다. */\n'
for (const [name, weights] of SOURCES) {
  for (const weight of weights) {
    const css = readFileSync(`node_modules/@fontsource/${name}/${weight}.css`, 'utf8')
    out += css
      .replace(/url\(\.\/files\/([^)]+\.woff2)\) format\('woff2'\), url\(\.\/files\/[^)]+\.woff\) format\('woff'\)/g, `url(../node_modules/@fontsource/${name}/files/$1) format('woff2')`)
      .replace(/\/\*[^*]*\*\/\n/g, '')
  }
}
mkdirSync('.design-sync', { recursive: true })
writeFileSync('.design-sync/fonts.css', out)
console.log('faces:', (out.match(/@font-face/g) ?? []).length, 'bytes:', out.length)
