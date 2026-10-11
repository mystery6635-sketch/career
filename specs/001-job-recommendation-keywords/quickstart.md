# Quickstart: 로컬 실행, 환경 변수, Vercel 배포, 동작 확인

**Feature**: `001-job-recommendation-keywords` | **작성일**: 2026-10-11
**대상**: 개발 경험이 많지 않은 1인 개발자. 명령은 Windows PowerShell 기준이다.
**지금 상태**: 코드가 아직 없다. 이 문서는 구현 후 그대로 따라 할 수 있게 쓴 절차이며, 아직 실행해 보지 않았다. 버전과 외부 서비스 화면은 바뀔 수 있으므로 어긋나면 각 서비스 공식 문서를 우선한다(확인 필요).
**구현 범위**: US1~US5. 로그인과 이력 저장은 없다(research 0절). 그러므로 **배포 주소를 공개하지 않는다**(6절).

---

## 1. 준비물

| 준비물 | 확인 방법 | 비고 |
|--------|-----------|------|
| Node.js LTS (20 이상, 최신 LTS 권장) | `node -v` | https://nodejs.org 에서 LTS 설치 |
| Git | `git --version` | 배포에 사용 |
| GitHub 계정 | | Vercel과 연결 |
| Vercel 계정(무료) | | GitHub 계정으로 가입 |
| LLM 공급자 API 키 | | 기본 Anthropic. 결제 수단 등록과 **월 사용 한도 설정**이 필요(가격·한도 확인 필요) |

## 2. 프로젝트 만들기 (한 번만)

`C:\AI_SERVICE\career`에서 실행한다. (`specs`, `.specify` 폴더는 그대로 둔다.)

```powershell
cd C:\AI_SERVICE\career
npm install react react-dom react-router-dom zod
npm install -D vite @vitejs/plugin-react typescript tailwindcss @tailwindcss/vite eslint@9 typescript-eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y vitest jsdom @testing-library/react @playwright/test @axe-core/playwright
# 이미 만들어진 저장소라면 npm install만 실행한다
npx playwright install chromium
```

- LLM 공급자 SDK는 선택한 공급자에 따라 설치한다(기본값 Anthropic: `npm install @anthropic-ai/sdk`). 새 의존성은 필요성을 plan.md의 의존성 표에 기록한다(원칙 XV).
- Tailwind v4는 `@tailwindcss/vite` 플러그인으로 설정한다. 토큰은 `src/styles/global.css`의 `@theme`에 design.md 16~19절 값을 옮긴다.

## 3. 환경 변수

프로젝트 루트에 `.env.local` 파일을 만든다. **이 파일은 Git에 올리지 않는다**(`.gitignore`에 들어 있다. 확인: `.gitignore`에 `.env*.local`이 있는지).

```text
LLM_PROVIDER=anthropic
LLM_MODEL=claude-haiku-5-5
LLM_API_KEY=여기에_발급받은_키
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_SECONDS=600
```

| 변수 | 의미 | 주의 |
|------|------|------|
| `LLM_PROVIDER` | 사용할 공급자 | 개발·테스트에서만 `mock` 허용(가짜 응답). 프로덕션에서 `mock`이면 서버가 시작을 거부한다 |
| `LLM_MODEL` | 모델 이름 | 품질이 부족하면 더 큰 모델로 바꾼다 |
| `LLM_API_KEY` | API 키 | **`VITE_`로 시작하는 이름을 쓰지 않는다.** 그 접두사가 붙으면 브라우저로 노출된다(원칙 IX) |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS` | 요청 제한(초기값) | research 4절 |

키가 코드나 채팅, 스크린샷에 노출되면 즉시 공급자 콘솔에서 폐기하고 새로 발급한다.

## 4. 로컬 실행

```powershell
npm run dev
```

브라우저에서 http://localhost:3000 을 연다. 화면(메인 → 입력 → 결과)이 보이면 성공이다.
가짜 응답으로 먼저 확인하려면 `.env.local`의 `LLM_PROVIDER=mock`으로 바꾸고 다시 `npm run dev`를 실행한다(비용 없음).

## 5. 동작 확인 시나리오

각 항목은 예/아니오로 답한다. "아니오"가 있으면 해당 요구사항을 고친 뒤 다시 확인한다.

### 5.1 자동 테스트

```powershell
npm run test          # Vitest: 스키마, 검증 규칙(V1~V13), 입력 보호, 복사 텍스트, 계약 테스트
npm run build         # 타입과 빌드 확인
npm run test:e2e      # Playwright: 1440·1024·390px, 인쇄 미디어, 접근성 자동 점검
```

테스트나 빌드가 실패하면 그 작업은 완료로 표시하지 않는다(원칙 XV).

### 5.2 직접 확인 (실제 LLM)

`.env.local`을 실제 공급자로 바꾼 뒤 `test-personas.md`의 P1~P5를 입력한다.

| # | 확인 | 관련 |
|---|------|------|
| 1 | P1을 입력하고 결과가 직업 3개, 키워드 3개로 나오는가? | SC-002 |
| 2 | 모든 근거에 연결된 입력 항목 태그가 있는가? | SC-003 |
| 3 | 결과 위·아래에 안내문 두 줄이 있는가? | FR-016 |
| 4 | 취업률, 연봉, 채용 공고 수, 퍼센트가 없는가? | SC-004 |
| 5 | P2, P3에서 나이·공백·이력 부재를 부정적 근거로 쓴 문장이 없는가? | SC-005 |
| 6 | P4에서 불일치 안내가 비하 없는 문장으로 나오는가? | FR-015 |
| 7 | P5-a의 지시문이 실행되지 않고 구조가 유지되는가? | FR-010 |
| 8 | P5-b의 식별 정보가 입력 단계에서 막히는가? | FR-009 |
| 9 | 필수 항목을 비우고 제출하면 항목별 오류와 요약이 나오고, 고치면 다른 입력이 유지되는가? | US2, SC-006 |
| 10 | 개발자 도구 네트워크 탭에서 `/api/generate` 요청 본문에 `age`가 없는가? | FR-004 |
| 11 | 네트워크 탭과 페이지 소스에 API 키가 없는가? | 원칙 IX |
| 12 | `LLM_API_KEY`를 일부러 비워 보면 "생성 실패" 화면이 나오고 입력이 남아 있는가? | US4, SC-007 |
| 13 | 결과 복사 후 붙여넣은 텍스트에 안내문 두 줄과 직업 3개·키워드 3개가 있는가? | FR-021, SC-009 |
| 14 | 인쇄 미리보기(Ctrl+P)에서 안내문이 있고 입력 정보가 없으며 A4 한 장인가? | FR-022 |
| 15 | 흑백으로 인쇄했을 때 A/B 영역과 "확인 필요"가 구분되는가? | design 15절 (수동) |
| 16 | 서버 터미널 로그에 구직자 입력 내용이 없는가? | 원칙 VI |
| 17 | 새로고침하면 결과가 사라지고 "빈 화면"이 나오는가? | FR-025 |

실패·지연·제한 화면은 개발 환경에서 `LLM_PROVIDER=mock`의 지연·실패 모드(구현 시 환경 변수로 제공)로 일으킨다. 제한 화면은 `RATE_LIMIT_MAX=2`로 낮춰 3번째 요청에서 확인한다.

### 5.3 화면 크기와 접근성 (design 26절)

크롬 개발자 도구의 기기 모드에서 1440×900, 1024×768, 390×844로 바꿔 가며 design.md 26절의 34개 항목을 예/아니오로 확인한다. 자동 접근성 점검은 일부만 잡으므로 키보드(Tab)만으로 입력 → 생성 → 복사 → 인쇄를 끝낼 수 있는지, 운영체제의 "움직임 줄이기" 설정에서 애니메이션이 멈추는지는 직접 확인한다.

## 6. Vercel 배포

> **배포 전 반드시**: ① LLM 공급자 콘솔에서 **월 사용 한도(하드 한도)** 를 설정한다. 요청 제한은 메모리 방식이라 완전하지 않으며 이 한도가 최종 방어선이다(research 4절). ② 로그인이 없으므로 **배포 주소를 외부에 공유하지 않는다.** 주소를 아는 누구나 생성 API를 호출할 수 있다.

### 6.1 GitHub에 올리기

```powershell
git init
git add .
git status
```

`git status`에 `.env.local`이 **보이지 않는지** 확인한 뒤 계속한다. 보이면 올리지 말고 `.gitignore`를 고친다.

```powershell
git commit -m "feat: initial app"
```

GitHub에서 빈 저장소를 만들고, 안내되는 `git remote add origin …`와 `git push -u origin main`을 실행한다.

### 6.2 Vercel에서 배포

1. https://vercel.com 에 로그인 → **Add New → Project** → 방금 만든 GitHub 저장소를 **Import**.
2. Framework Preset은 Vite로 자동 인식된다. `vercel.json`의 SPA 재작성과 함수 설정은 그대로 둔다.
3. **Environment Variables**에 3절의 변수를 입력한다(`LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`). `LLM_PROVIDER`는 `mock`이 아닌 실제 값이다. 키는 Production에만 넣어도 된다.
4. **Deploy**를 누른다. 끝나면 `https://…vercel.app` 주소가 생긴다.
5. 그 주소에서 5.2절의 항목 1, 3, 9, 11, 13, 14를 다시 확인한다.

환경 변수를 바꾸면 **다시 배포(Redeploy)** 해야 적용된다.

### 6.3 배포 후 점검

| 확인 | 방법 |
|------|------|
| 실행 시간 제한이 120초 이상 허용되는가? | Vercel 프로젝트 설정의 Functions 항목과 공식 문서에서 무료 플랜 한도 확인 (**확인 필요**, research 6절) |
| 로그에 입력이 남지 않는가? | Vercel → Logs에서 `/api/generate` 로그를 보고 입력 문장이 없는지 확인 |
| 무료 한도 | Vercel 사용량 화면에서 확인 (한도는 바뀔 수 있으므로 **확인 필요**) |

## 7. 자주 막히는 곳

| 증상 | 원인과 해결 |
|------|-------------|
| 화면은 뜨는데 결과가 항상 "생성 실패" | `.env.local`의 키가 비었거나 잘못됨, 또는 `npm run dev`를 환경 변수 변경 후 다시 시작하지 않음 |
| Vercel에서만 실패 | Vercel 환경 변수 누락 또는 변경 후 Redeploy 안 함 |
| 20번 넘게 눌렀더니 "요청 제한" | 정상 동작. `RATE_LIMIT_MAX`로 조정 |
| 120초 전에 끊김 | Vercel 실행 시간 한도(6.3절 확인) |
| `.env.local`이 `git status`에 보임 | `.gitignore` 수정 후 `git rm --cached .env.local` |
| 한글 글꼴이 다르게 보임 | 글꼴 로딩 실패. `@fontsource` 설정과 대체 글꼴 확인 |

## 8. 이 계획이 만드는 파일 (참고)

```text
specs/001-job-recommendation-keywords/
├── plan.md  research.md  data-model.md  quickstart.md  test-personas.md
├── contracts/generate-api.md  contracts/copy-and-print.md
└── prompts/system-prompt.md
```
