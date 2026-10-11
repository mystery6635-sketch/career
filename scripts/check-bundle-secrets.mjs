// 빌드 결과물 API 키 검사 (T121, FR-040, 원칙 IX). `npm run check:secrets`
// dist/ 전체에서 다음을 찾아 0건인지 확인한다. 찾은 값 자체는 출력하지 않고 종류와 파일 경로만 출력한다.
//   (1) 환경 변수 LLM_API_KEY의 실제 값
//   (2) 공급자 키 접두사 패턴
//   (3) LLM_API_KEY 이름 문자열
//   (4) server/ 코드를 식별하는 문자열
// 사용: node scripts/check-bundle-secrets.mjs [--dir <검사할 폴더>]  (기본 dist)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const argDir = process.argv.indexOf('--dir')
const DIR = argDir > -1 ? process.argv[argDir + 1] : 'dist'

const apiKey = (process.env.LLM_API_KEY ?? '').trim()

/** 문자열 검사: [종류, 찾을 문자열]. server/ 코드는 클라이언트에 있을 이유가 없는 고유 문자열로 식별한다. */
const LITERALS = [
  ['env-name', 'LLM_API_KEY'],
  ['env-name', 'LLM_PROVIDER'],
  ['server-code', 'api.anthropic.com'],
  ['server-code', 'anthropic-version'],
  ['server-code', 'applicant_data'],
  ['server-code', 'x-api-key'],
  ['server-code', 'server/ai/'],
  ['server-code', 'server/handler'],
  ['server-code', 'createRateLimiter'],
  // mock 시나리오 코드·데이터는 프로덕션 번들에 없어야 한다(T107).
  ['mock-code', 'fail-once'],
  ['mock-code', '최대 길이 직업명'],
]

/** 공급자 키 접두사 패턴(Anthropic, OpenAI 형식 등). */
const PATTERNS = [
  ['key-pattern', /sk-ant-[A-Za-z0-9_-]{8,}/],
  ['key-pattern', /sk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ['key-pattern', /AIza[0-9A-Za-z_-]{35}/],
]

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* walk(path)
    else yield path
  }
}

if (!existsSync(DIR)) {
  process.stderr.write(`검사할 폴더가 없어요: ${DIR}. 먼저 npm run build를 실행해 주세요.\n`)
  process.exit(2)
}

const findings = []
let scanned = 0
for (const file of walk(DIR)) {
  const text = readFileSync(file).toString('latin1')
  // 한글 등 비 ASCII 문자열은 utf8로도 확인한다.
  const utf8 = readFileSync(file, 'utf8')
  scanned++
  if (apiKey.length >= 8 && (text.includes(apiKey) || utf8.includes(apiKey))) findings.push(['key-value', file])
  for (const [kind, needle] of LITERALS) if (utf8.includes(needle)) findings.push([kind, file, needle])
  for (const [kind, re] of PATTERNS) if (re.test(utf8)) findings.push([kind, file])
}

if (findings.length > 0) {
  process.stderr.write(`빌드 결과물에서 ${findings.length}건이 발견되었어요 (${DIR}, 파일 ${scanned}개 검사).\n`)
  for (const [kind, file, needle] of findings) {
    // 키 값과 패턴 일치 내용은 출력하지 않는다. 고정 문자열(식별자)만 이름을 보여준다.
    process.stderr.write(`  - [${kind}] ${file}${needle ? ` (${needle})` : ''}\n`)
  }
  process.exit(1)
}

process.stdout.write(`check:secrets 통과: ${DIR}의 파일 ${scanned}개에서 키·서버 코드 0건${apiKey ? '' : ' (LLM_API_KEY 값이 비어 있어 실제 값 검사는 건너뜀)'}.\n`)
