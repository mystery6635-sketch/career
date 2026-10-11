// 디자인 구조 검사 (T067, T068). `npm run audit:design`
// (1) 하드코딩 색, (2) 하드코딩 간격·글자 크기, (3) 공통 컴포넌트를 거치지 않은 직접 요소,
// (4) 토큰 이름·값이 design.md §16과 어긋나는 사용을 찾아 tests/e2e/__artifacts__/audit.md에 쓴다.
// 허용 목록 밖의 위반이 있으면 종료 코드 1.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, sep } from 'node:path'

const ROOT = process.cwd()
const SRC = process.env.AUDIT_SRC ?? 'src'
const DESIGN = 'specs/001-job-recommendation-keywords/design.md'
const REPORT = 'tests/e2e/__artifacts__/audit.md'

// 허용 목록: 'check|파일|이유' 형식. 예외가 필요하면 여기에 파일과 이유를 적는다.
const ALLOW = [
  {
    check: 'component',
    file: 'src/components/input/MobileAccordion.tsx',
    reason: '아코디언 머리글은 aria-expanded를 가진 전용 토글 버튼이라 .btn(Button)과 모양·역할이 다르다. 스타일은 .form-section__toggle.',
  },
  {
    check: 'token-use',
    token: '--motion-delay',
    reason: '요소마다 인라인으로 정하는 애니메이션 지연 값이라 tokens.css에 없다.',
  },
]

function walk(dir, pattern) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return walk(path, pattern)
    return pattern.test(name) ? [path.split(sep).join('/')] : []
  })
}

const isComment = (line) => /^\s*(\/\/|\/\*|\*)/.test(line)
const allowedFile = (check, file) => ALLOW.some((a) => a.check === check && a.file === file)
const allowedToken = (token) => ALLOW.some((a) => a.check === 'token-use' && a.token === token)

const all = walk(SRC, /\.(css|tsx?)$/)
const tokensPath = `${SRC}/styles/tokens.css`
const nonToken = all.filter((f) => f !== tokensPath)
const cssNonToken = nonToken.filter((f) => f.endsWith('.css'))
const read = (f) => readFileSync(f, 'utf8').split('\n')

const color = []
const spacing = []
const component = []
const token = []

for (const f of nonToken) {
  read(f).forEach((line, i) => {
    if (isComment(line)) return
    if (/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/.test(line)) color.push(`${f}:${i + 1} ${line.trim()}`)
  })
}

const SPACING_PROP = /^\s*(padding|margin|gap|row-gap|column-gap|font-size)(-[a-z]+)?:\s*([^;]+);/
for (const f of cssNonToken) {
  read(f).forEach((line, i) => {
    const m = line.match(SPACING_PROP)
    if (m && /(?<![\w.#-])(?!1px|0px)\d+(\.\d+)?px/.test(m[3])) spacing.push(`${f}:${i + 1} ${line.trim()}`)
  })
}
for (const f of nonToken.filter((x) => x.endsWith('.tsx'))) {
  read(f).forEach((line, i) => {
    if (/style=\{\{[^}]*\b(padding|margin|gap|fontSize)\b[^}]*\d+px/.test(line)) spacing.push(`${f}:${i + 1} ${line.trim()}`)
  })
}

// 페이지와 ui 밖 컴포넌트는 button·input·select·textarea를 직접 쓰지 않고 components/ui를 거친다.
for (const f of nonToken.filter((x) => x.endsWith('.tsx') && !x.startsWith(`${SRC}/components/ui/`))) {
  if (allowedFile('component', f)) continue
  read(f).forEach((line, i) => {
    if (isComment(line)) return
    if (/<(button|input|select|textarea)\b/.test(line)) component.push(`${f}:${i + 1} ${line.trim()}`)
  })
}
for (const f of walk(`${SRC}/pages`, /\.tsx$/)) {
  if (allowedFile('component', f)) continue
  const text = readFileSync(f, 'utf8')
  if (!/from '\.\.\/components\//.test(text)) component.push(`${f}:1 components를 가져오지 않는 페이지 파일`)
}

// 토큰: CSS가 쓰는 var(--x)는 tokens.css에 있어야 하고, design §16의 토큰은 이름과 값이 같아야 한다.
const tokensText = readFileSync(tokensPath, 'utf8')
const defined = new Map([...tokensText.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toLowerCase()]))
for (const f of cssNonToken) {
  read(f).forEach((line, i) => {
    for (const m of line.matchAll(/var\((--[a-z0-9-]+)/g)) {
      if (!defined.has(m[1]) && !allowedToken(m[1])) token.push(`${f}:${i + 1} 정의되지 않은 토큰 ${m[1]}`)
    }
  })
}
const design = readFileSync(DESIGN, 'utf8')
const sec16 = design.slice(design.indexOf('## 16. 디자인 토큰'), design.indexOf('## 17.'))
for (const row of sec16.split('\n').filter((l) => l.startsWith('| `--'))) {
  const cells = row.split('|').map((c) => c.trim())
  const names = [...cells[1].matchAll(/`(--[a-z0-9-]+)`/g)].map((m) => m[1])
  const values = cells[2].split('/').map((v) => v.trim().toLowerCase())
  names.forEach((name, i) => {
    if (!defined.has(name)) token.push(`design §16 토큰 ${name}이 tokens.css에 없음`)
    else if (defined.get(name) !== values[i]) token.push(`design §16 ${name}=${values[i]} 와 tokens.css ${defined.get(name)} 값이 다름`)
  })
}

const sections = [
  ['1. 하드코딩된 색(#hex, rgb(, hsl() — tokens.css 밖', color],
  ['2. 하드코딩된 간격·글자 크기(px 리터럴, 1px·0px 제외) — 토큰 밖', spacing],
  ['3. 공통 컴포넌트를 거치지 않은 직접 요소', component],
  ['4. 토큰 이름·값 불일치(design §16)', token],
]
const total = sections.reduce((n, [, list]) => n + list.length, 0)
const out = [
  '# 디자인 구조 검사 결과',
  '',
  `위반 합계: ${total}건 (허용 목록 제외)`,
  '',
  ...sections.flatMap(([title, list]) => [`## ${title}: ${list.length}건`, '', ...(list.length ? list.map((l) => `- \`${l}\``) : ['- 없음']), '']),
  '## 허용 목록(audit-design.mjs `ALLOW`)',
  '',
  ...ALLOW.map((a) => `- ${a.check} ${a.file ?? a.token}: ${a.reason}`),
  '',
].join('\n')
mkdirSync(join(ROOT, 'tests/e2e/__artifacts__'), { recursive: true })
writeFileSync(join(ROOT, REPORT), out)
console.log(out)
process.exit(total === 0 ? 0 : 1)
