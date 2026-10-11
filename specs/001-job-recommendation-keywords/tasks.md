---
description: "추천 직업 및 자기소개서 키워드 생성 — 구현 Task 목록"
---

# Tasks: 추천 직업 및 자기소개서 키워드 생성

**Input**: `specs/001-job-recommendation-keywords/` 의 `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `design.md`, `prompts/`, `test-personas.md`, `.specify/memory/constitution.md`(v2.0.0)
**작성일**: 2026-10-11
**구현 범위**: US1~US5와 FR-001~029, FR-036~041. 로그인·상담 이력·구직자 기록(US6~US8, FR-030~035)은 2단계이며 이 목록에 없다(spec Assumptions). "상담 이력으로 저장" 버튼은 비활성으로만 둔다.

> ## 기술 스택 변경 알림 (확인 필요)
> 이 목록은 요청에 따라 **React + Vite + TypeScript, 정적 페이지 + Vercel Serverless Function** 을 전제로 한다. 이전에 작성한 `plan.md`·`research.md`·`quickstart.md`는 **Next.js App Router** 기준이다. 두 기술 스택은 다르므로 T001에서 세 문서를 Vite 기준으로 먼저 고친다. 바뀌는 것: 라우팅(Next 라우트 → `react-router-dom`), 서버 코드(Route Handler → `api/generate.ts` 서버리스 함수), 폰트(`next/font` → `@fontsource`), 환경 변수 접두사(`NEXT_PUBLIC_` → `VITE_`). 요구사항, 스키마, 계약, 프롬프트, 디자인은 그대로다.

## 형식과 표기

```text
- [ ] T### [P] 작업 설명
  - 요구사항: spec ID · 원칙: Constitution 번호 · design: 섹션 · 파일: 경로
  - 검증: 확인 방법
  - 완료: 예/아니오로 답할 수 있는 한 줄
```

- `[P]`: 같은 Phase 안에서 다른 파일을 다루고 미완료 Task에 의존하지 않아 **병렬 진행 가능**. 없으면 순서대로.
- 원칙 번호: I 상담사 보조, II 근거 필수, III 강점 존중, IV 수치 금지, V 차별 방지, VI 개인정보, VII 입력 검증, VIII 고정 출력, IX 키 서버 전용, X 장애 안내, XI 범위 준수, XII 쉬운 언어, XIII 접근성, XIV 반응형, XV 단순 MVP·추적.
- design 섹션은 `design.md`의 `§` 번호이다. DM = `data-model.md`, API = `contracts/generate-api.md`, CP = `contracts/copy-and-print.md`, SP = `prompts/system-prompt.md`, BP = `prompts/banned-phrases.md`.
- 파일 경로 기준(저장소 루트):
  ```text
  index.html  vite.config.ts  vercel.json  .env.example  playwright.config.ts
  api/generate.ts                      # Vercel 서버리스 함수 진입점
  server/                              # 서버 전용 코드 (브라우저 번들에 들어가면 안 됨)
  shared/                              # 클라이언트·서버 공용 (Zod 스키마, 가드, 문구)
  src/{main.tsx, App.tsx, pages, components/{ui,main,input,result}, hooks, state, services/ai, mock, styles, lib}
  tests/{unit, contract, e2e, eval}  scripts/
  ```
- **Phase 완료 규칙**: 각 Phase의 마지막 Task(게이트)는 `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`가 모두 통과해야 체크할 수 있다(원칙 XV). 하나라도 실패하면 그 Phase는 완료가 아니다.
- **확인 필요** 표시는 이 목록 작성 시점에 확인하지 못한 외부 서비스·도구 동작이다.

## 의존 관계 요약

```text
Phase 1 ─▶ Phase 2 ─▶ Phase 3 ─▶ [Mock으로 전체 흐름 + /design-sync 검증] ─▶ Phase 4 ─▶ (디자인 확정) ─▶ Phase 5
                                                                                                         │
Phase 8 ◀─ Phase 7 ◀─ (Phase 6 서버 라우트가 페르소나 5개 검증 통과) ◀─ Phase 6 ◀─ (Phase 5 스키마 완료) ◀──┘
```

---

## Phase 1. 프로젝트 설정

**목표**: 빈 저장소에서 `npm run dev`, `lint`, `test`, `test:e2e`, `build`가 모두 돌아가고, 정적 페이지와 서버리스 함수가 배포 가능한 상태.
**주의**: 이 Phase에서는 화면 내용을 만들지 않는다.

- [X] T001 스택 변경에 맞춰 **스택·경로를 언급하는 모든 문서**를 Vite + 서버리스 함수 기준으로 갱신한다: `plan.md`, `research.md`, `quickstart.md`, `data-model.md`, `contracts/generate-api.md`, `design.md`(§12 등), `prompts/system-prompt.md`, `prompts/banned-phrases.md`. 내용: (1) Next.js 표현 제거(위 "기술 스택 변경 알림"의 대응표), (2) 코드 경로 통일 — `lib/…`를 `shared/`(스키마·가드·문구), `server/`(AI·핸들러), `src/`(화면)로 바꾸고 문구 파일은 `shared/messages.ts` 하나로 한다, (3) plan.md의 시스템 구조 트리·의존성 표 갱신(`react-router-dom`, `@fontsource/*`, LLM SDK 추가와 필요성), (4) plan.md 맨 위 "스택 변경 알림" 문단 삭제.
  - 요구사항: FR-025, FR-040 · 원칙: IX, XV · design: §12 · 파일: `specs/001-job-recommendation-keywords/{plan.md, research.md, quickstart.md, data-model.md, design.md}`, `contracts/generate-api.md`, `prompts/system-prompt.md`, `prompts/banned-phrases.md`
  - 검증: 위 8개 파일에서 `Next.js`, `Route Handler`, `NEXT_PUBLIC_`, `next/font`, `create-next-app`, `App Router`, `lib/` 경로를 검색해 결과가 0건(이 목록 `tasks.md`와 "스택 변경 알림" 설명은 제외)
  - 완료: 8개 문서에 Next.js 전용 표현과 `lib/` 경로가 0건이고 문구 파일 경로가 `shared/messages.ts` 하나로 통일되었는가?

- [X] T002 Vite + React + TypeScript(strict) 프로젝트를 만든다. `react-router-dom`을 의존성에 추가한다(필요성: 3개 경로 이동과 뒤로 가기 처리. 직접 구현 시 접근성·포커스 처리 중복).
  - 요구사항: FR-028 · 원칙: XV · design: §3, §5 · 파일: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `src/main.tsx`, `src/App.tsx`
  - 검증: `npm run dev`로 빈 화면 확인, `npm run typecheck`
  - 완료: `npm run dev`가 오류 없이 실행되고 `npm run typecheck`가 통과하는가?

- [X] T003 [P] Tailwind CSS v4를 Vite 플러그인(`@tailwindcss/vite`)으로 설정하고 `src/styles/global.css`에서 불러온다(토큰 내용은 T012).
  - 요구사항: FR-027 · 원칙: XV · design: §16 · 파일: `package.json`, `vite.config.ts`, `src/styles/global.css`, `src/main.tsx`
  - 검증: 임시 유틸리티 클래스를 쓴 요소가 스타일을 받는지 확인 후 삭제
  - 완료: Tailwind 유틸리티 클래스가 빌드 결과에 적용되는가?

- [X] T004 [P] ESLint(TypeScript, React hooks, jsx-a11y 규칙)를 설정하고 `src`가 `server/*`를 가져오지 못하게 막는 import 제한 규칙을 넣는다(API 키 서버 전용 보호).
  - 요구사항: FR-040 · 원칙: IX, XIII, XV · design: §22 · 파일: `eslint.config.js`, `package.json`
  - 검증: `src`에서 `server/…`를 가져오는 임시 파일을 만들어 lint가 실패하는지 확인 후 삭제
  - 완료: `npm run lint`가 통과하고, `src`에서 `server/`를 가져오면 lint가 실패하는가?
  - 추가 규칙: `no-console`을 `error`로 설정한다(`src/`, `shared/`, `server/`). 서버의 로그는 `server/log.ts`(T093)만 쓰고, 브라우저 콘솔에는 입력·오류 객체를 출력하지 않는다(FR-040, 원칙 VI). 검증: `src`에 `console.log`를 넣으면 lint 실패. 완료: `no-console` 위반 시 lint가 실패하는가?

- [X] T005 [P] Vitest + Testing Library(jsdom)를 설정한다. `shared/`, `server/`, `src/`의 `*.test.ts(x)`와 `tests/unit`, `tests/contract`를 실행한다.
  - 요구사항: FR-010 · 원칙: XV · design: - · 파일: `vite.config.ts`(test 항목), `tests/setup.ts`, `tests/unit/smoke.test.ts`, `package.json`
  - 검증: `npm run test`
  - 완료: 샘플 테스트 1개가 실행되고 통과하는가?

- [X] T006 [P] Playwright(Chromium)를 설정한다. 프로젝트 3개(1440×900, 1024×768, 390×844)와 인쇄 에뮬레이션용 설정, `webServer`로 `npm run dev`(또는 빌드 미리보기)를 쓴다. `@axe-core/playwright`를 추가한다(필요성: 접근성 자동 점검).
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV, XV · design: §21 · 파일: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `package.json`
  - 검증: `npm run test:e2e`
  - 완료: 3개 뷰포트에서 샘플 E2E가 각각 통과하는가?

- [X] T007 `package.json` 스크립트를 정리한다: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`, `check`(lint + typecheck + test + build를 차례로 실행).
  - 요구사항: - · 원칙: XV · design: - · 파일: `package.json`
  - 검증: `npm run check`
  - 완료: `npm run check` 한 번으로 네 가지 검사가 모두 실행되는가? (T003~T006 완료 후)

- [X] T008 [P] 환경 변수 구조를 만든다. `.env.example`에 `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`(값 비움), `RATE_LIMIT_MAX=20`, `RATE_LIMIT_WINDOW_SECONDS=600`, `VITE_AI_MODE=http`를 적고, `.gitignore`에 `.env`, `.env.local`, `.env*.local`, `node_modules`, `dist`, `.vercel`, `test-results`, `playwright-report`를 넣는다. `VITE_` 접두사 변수에는 비밀을 두지 않는다고 주석으로 적는다.
  - 요구사항: FR-040 · 원칙: IX, XV · design: - · 파일: `.env.example`, `.gitignore`
  - 검증: `.env.local`을 임시로 만들어 `git status`(git 초기화 후)에 나타나지 않는지 확인
  - 완료: `.env.local`이 추적 대상에서 제외되고 `.env.example`에 실제 키가 없는가?

- [X] T009 [P] `vercel.json`을 만든다: SPA 경로 재작성(`/api/*`는 제외하고 나머지는 `index.html`), `api/generate.ts`의 `maxDuration`을 120으로 지정, `/api/*` 응답에 `Cache-Control: no-store`.
  - 요구사항: FR-023 · 원칙: X, XV · design: §14 · 파일: `vercel.json`
  - 검증: 배포 미리보기에서 `/input` 직접 접속이 열리고 `/api/generate`가 캐시되지 않는지 확인(T011)
  - 완료: `vercel.json`이 SPA 재작성과 함수 `maxDuration` 120을 모두 정의하는가? (Hobby 플랜 한도는 **확인 필요**, research 6절)

- [X] T010 서버리스 함수 뼈대와 로컬 개발 연결을 만든다. `api/generate.ts`는 현재 `501`과 계약의 `ApiError` 형태를 반환하고, 같은 처리 함수를 Vite 개발 서버 미들웨어 플러그인(`vite.config.ts`)이 `/api/generate`에 연결해 `vercel dev` 없이 로컬에서 호출된다. 핸들러는 웹 표준 `Request → Response` 형태로 `server/handler.ts`에 둔다.
  - 요구사항: FR-040 · 원칙: IX, XV · design: - · 파일: `api/generate.ts`, `server/handler.ts`, `vite.config.ts`
  - 검증: `npm run dev` 후 `curl -X POST http://localhost:5173/api/generate`가 501 JSON을 반환. Vercel 함수 진입 형식(웹 표준 export 지원 여부, ESM 확장자 규칙)은 **확인 필요**이므로 T011에서 배포 확인
  - 완료: 로컬과 배포 환경에서 `/api/generate`가 같은 핸들러 응답을 반환하는가?

- [ ] T011 Phase 1 게이트: Git 저장소 초기화 여부와 `.gitignore`를 확인하고, Vercel 미리보기 배포로 정적 페이지와 `/api/generate`(501) 응답, SPA 경로 직접 접속을 확인한다.
  - 요구사항: - · 원칙: IX, XV · design: - · 파일: (없음, 확인 작업)
  - 검증: `npm run check`, 미리보기 배포 주소 확인, 배포 로그에서 빌드 성공 확인
  - 완료: `npm run check`가 통과하고 미리보기에서 정적 페이지와 서버리스 함수가 모두 응답하는가?

---

## Phase 2. 디자인 시스템 기반

**목표**: design.md §16~§23 규칙을 토큰과 공통 컴포넌트로 옮긴다. 세 화면은 이 컴포넌트만 조합한다.
**의존**: Phase 1 완료.
**원칙**: 색상·간격·글자 크기는 토큰으로만 쓴다(하드코딩 금지, Phase 4에서 검출).

- [X] T012 색상 토큰을 Tailwind `@theme`에 선언한다. 이름은 시안 변수 그대로: `--navy-950 #07111F`, `--navy-900 #0B1B2E`, `--navy-800 #12283F`, `--teal-700 #0E5C63`, `--teal-800 #0A4A50`, `--green-700 #1B6B52`, `--mint #5BE0C0`, `--mint-ink #062B2A`, `--surface #F3F6F8`, `--card #FFFFFF`, `--ink #0B1B2E`, `--muted #41536A`, `--rule #CBD5DF`, `--field #6B7F95`, `--err #B42318`, `--err-bg #FDECEC`, `--need-bg #FFF3D6`, `--need-bd #C79A2E`, `--need-ink #6B4200`, `--soft-bg #E8EFF8`, `--soft-bd #7F9CC4`, `--soft-ink #16345F`, `--focus-light #0B1B2E`, `--focus-dark #FFD166`, 성공 `#14502B`, 영역 B 배경 `#E4ECF2`.
  - 요구사항: FR-027 · 원칙: XIII · design: §16, §18 · 파일: `src/styles/tokens.css`
  - 검증: 단위 테스트가 토큰 파일의 값을 design §16 표와 비교
  - 완료: 토큰 파일의 모든 색 값이 design §16과 일치하는가?

- [X] T013 [P] 글자·간격·반경·폭 토큰을 선언한다. 글자 크기와 줄 간격은 design §17 표(본문 17px/모바일 16px, 줄 간격 1.65, Hero H1 clamp(36px, 5.2vw, 60px) 등), 간격은 design §19 값 그대로(콘텐츠 최대 폭 1176px, 좌우 여백 32/24/16px, 섹션 84/64/48px, 상태 카드 680px, 인쇄 시트 794px), 반경 4~6px, 버튼 높이 52px·44px, 입력창 48px. 분기 1199/1100/1023/767px을 정의한다. 척도(4px/8px)로 정리하지 않는다.
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §17, §19, §20, §21 · 파일: `src/styles/tokens.css`
  - 검증: 단위 테스트가 값을 design 표와 비교
  - 완료: 글자·간격·폭 토큰이 design §17·§19 값과 일치하는가?

- [X] T014 [P] 글꼴을 자체 호스팅한다(`@fontsource/ibm-plex-sans-kr` 400/500/600/700, `@fontsource/ibm-plex-mono` 500). 대체 글꼴은 Noto Sans KR → sans-serif. 새 의존성 필요성: 실행 중 외부 글꼴 서버 호출 방지, 오프라인 대체.
  - 요구사항: - · 원칙: XV · design: §17 · 파일: `package.json`, `src/main.tsx`, `src/styles/tokens.css`
  - 검증: 네트워크 탭에서 외부 글꼴 요청 0건
  - 완료: 외부 글꼴 서버 요청 없이 IBM Plex 글꼴이 적용되는가? (라이선스 최종 확인은 **확인 필요**)

- [X] T015 전역 스타일과 포커스 스타일을 만든다: 리셋, 본문 17px(모바일 16px), `text-wrap: pretty/balance`, 포커스 3px 윤곽선(밝은 배경 `--focus-light`, Header·Hero 위 `--focus-dark`, 오프셋 2~3px), "본문 바로가기" 링크(포커스 시에만 보임), 스크린 리더 전용 클래스.
  - 요구사항: FR-027 · 원칙: XIII · design: §17, §22 · 파일: `src/styles/global.css`
  - 검증: Tab 키로 이동 시 포커스 윤곽선 확인(E2E T064에서 자동화)
  - 완료: 모든 링크·버튼이 Tab으로 포커스될 때 3px 윤곽선이 보이는가?

- [X] T016 [P] 모션 유틸리티를 만든다: `float-in`(0.7초, 지연 0.1~0.45초), `dash-flow`(3회 반복), `fade`, `spin`을 **움직임 허용 설정에서만** 정의한다. 기본 상태가 최종 화면이다. 움직임 감소 설정에서는 모두 정지·즉시 표시하고 smooth scroll도 끈다.
  - 요구사항: FR-027 · 원칙: XIII · design: §10, §23 · 파일: `src/styles/motion.css`
  - 검증: 브라우저에서 `prefers-reduced-motion: reduce` 에뮬레이션 시 애니메이션 없음(E2E T062·T119에서 자동화)
  - 완료: 움직임 감소 설정에서 정의된 모든 애니메이션이 적용되지 않는가?

- [X] T017 [P] 인쇄 기본 스타일을 만든다: `@page { size: A4; margin: 14mm }`, 본문 9.5pt·줄 간격 1.45, `.no-print` 숨김, 항목 상자 `break-inside: avoid`, 배경색 제거. 결과 화면 전용 인쇄 배치는 T063.
  - 요구사항: FR-022 · 원칙: XIV · design: §15 · 파일: `src/styles/print.css`
  - 검증: 인쇄 미디어 에뮬레이션에서 `.no-print` 요소가 보이지 않음
  - 완료: 인쇄 미디어에서 `.no-print` 요소가 숨겨지고 배경색이 없는가?

- [X] T018 Header와 Navigation 컴포넌트를 만든다: 로고 마크 + 서비스 이름(홈 링크), 오른쪽 "이용 방법" 링크 하나(메인의 `#flow`로 이동), 메인에서는 투명 겹침·내부 화면에서는 `--navy-950` 단색, 링크 44px 이상. **로그인·회원 영역 없음.** 서비스 이름은 상수 하나로 둔다(정식 이름 확정 시 교체).
  - 요구사항: FR-027 (로그인 영역 없음은 design §7 기준이며 FR-030은 2단계) · 원칙: XI, XIII · design: §7 · 파일: `src/components/ui/Header.tsx`, `shared/messages.ts`(서비스 이름 상수)
  - 검증: 컴포넌트 테스트(링크 이름, 로그인 요소 없음), Tab 순서 확인
  - 완료: Header에 서비스 이름과 "이용 방법" 링크만 있고 로그인 요소가 없는가?

- [X] T019 [P] Page Header 컴포넌트를 만든다: kicker(모노 14px, 틸, 자간 0.08em) → H1 → 부제(최대 38em). 화면 전환 시 H1이 포커스를 받는다(`tabIndex=-1`, 윤곽선 숨김).
  - 요구사항: FR-027 · 원칙: XIII · design: §8 · 파일: `src/components/ui/PageHeader.tsx`
  - 검증: 컴포넌트 테스트(H1 포커스 가능)
  - 완료: kicker·H1·부제가 렌더되고 H1에 프로그램으로 포커스를 줄 수 있는가?

- [X] T020 [P] Button 컴포넌트를 만든다: 변형 6종(민트, 고스트, 틸 채움, 흰색+네이비 테두리, 삭제(빨강 테두리), 추가(틸 점선)), 크기 52px·44px, 반경 6px, 굵기 600, 글자 17px/16px. 비활성은 불투명도 55%이며 **비활성 사유를 글자로** 보이는 `disabledReason` 속성을 둔다. 아이콘은 `aria-hidden`.
  - 요구사항: FR-027, FR-032 · 원칙: XIII · design: §20 · 파일: `src/components/ui/Button.tsx`
  - 검증: 컴포넌트 테스트(비활성 사유 텍스트가 접근 가능한 설명으로 연결됨)
  - 완료: 비활성 버튼에 사유 텍스트가 함께 표시되고 포커스·클릭이 막히는가?

- [X] T021 [P] 폼 필드 공통 래퍼와 Input을 만든다: 라벨 위, "(필수)"(틸 `--teal-800` 굵게) / "(선택)"(보조색) 텍스트, 힌트, 글자 수 안내 "n / 최대자"("(최대)" 표시), 오류 영역(빨강 2px 테두리 + 연한 빨강 배경 + 아이콘 + 굵은 텍스트), 높이 48px 이상, 1.5px `--field` 테두리, `aria-invalid`, `aria-describedby`(힌트 → 글자 수 → 오류 순). 경고(노랑) 표시도 지원한다.
  - 요구사항: FR-010, FR-027 · 원칙: VII, XIII · design: §11, §12, §20 · 파일: `src/components/ui/Field.tsx`, `src/components/ui/Input.tsx`
  - 검증: 컴포넌트 테스트(`aria-describedby` 순서, 필수 텍스트 존재)
  - 완료: 입력창에 필수/선택 텍스트, 글자 수, 오류가 접근 가능한 설명으로 연결되는가?

- [X] T022 [P] Textarea 컴포넌트를 만든다(Field 사용, 인턴 내용용, 글자 수 안내 포함).
  - 요구사항: FR-005, FR-037 · 원칙: VII, XIII · design: §11, §20 · 파일: `src/components/ui/Textarea.tsx`
  - 검증: 컴포넌트 테스트
  - 완료: Textarea가 Input과 같은 라벨·글자 수·오류 규칙을 따르는가?

- [X] T023 [P] Select 컴포넌트를 만든다(입력창과 같은 크기, 오른쪽 화살표, 최종학력·학력 상태용).
  - 요구사항: FR-001 · 원칙: XIII · design: §11, §20 · 파일: `src/components/ui/Select.tsx`
  - 검증: 컴포넌트 테스트(키보드 선택)
  - 완료: Select가 키보드만으로 선택되고 Field 규칙을 따르는가?

- [X] T024 [P] Radio와 Checkbox를 만든다: 높이 48px 박스형, 선택되면 연한 틸 배경 + 틸 테두리, 터치 영역 44px 이상. 인턴 있음/없음 라디오와 "없음" 선택지의 기반이다.
  - 요구사항: FR-005, FR-027 · 원칙: XIII · design: §11, §20 · 파일: `src/components/ui/Radio.tsx`, `src/components/ui/Checkbox.tsx`
  - 검증: 컴포넌트 테스트(Space·화살표 키 조작)
  - 완료: Radio·Checkbox가 키보드로 조작되고 선택 상태가 색 외에 표시(체크 표지)되는가?

- [X] T025 [P] Badge를 만든다: 상태 배지(진행 틸, 실패 빨강, 경고 노랑, 정보 파랑; 높이 36px, 반경 4px, 정사각 아이콘 칩 + 텍스트), "? 확인 필요" 배지, "? 표준 분류 확인 필요" 배지.
  - 요구사항: FR-017, FR-036 · 원칙: IV, XIII · design: §13.3, §13.5, §20 · 파일: `src/components/ui/Badge.tsx`
  - 검증: 컴포넌트 테스트(아이콘 + 텍스트 동시 존재)
  - 완료: 모든 배지 변형에 색 외에 아이콘과 텍스트가 있는가?

- [X] T026 [P] Tag(`항목명: 값`, 항목명은 굵은 틸 13px) 컴포넌트를 만든다.
  - 요구사항: FR-013 · 원칙: II · design: §13.3, §20 · 파일: `src/components/ui/Tag.tsx`
  - 검증: 컴포넌트 테스트
  - 완료: Tag가 "항목명: 값" 형식으로 렌더되는가?

- [X] T027 [P] Card 컴포넌트를 만든다: 흰 배경(영역 A 안은 `--surface`), 1px `--rule` 테두리, 반경 6px, **그림자 없음**. 영역 A(흰+틸 5px 위선, "A" 칩), 영역 B(`#E4ECF2`+네이비 5px 위선, "B" 칩) 변형.
  - 요구사항: FR-012, FR-014 · 원칙: XIII · design: §13.3, §13.4, §20 · 파일: `src/components/ui/Card.tsx`
  - 검증: 컴포넌트 테스트, 시각 확인은 T034
  - 완료: Card에 그림자가 없고 영역 A/B가 칩 글자(A/B)로도 구분되는가?

- [X] T028 [P] Alert 컴포넌트를 만든다: 정보, 경고(노랑), 오류(빨강), 성공(초록) 변형. 아이콘 + 텍스트 필수. 오류·실패는 `role=alert`, 나머지는 `role=status`(`aria-live=polite`). 지시문·강점 중복 경고에도 쓴다.
  - 요구사항: FR-010, FR-023, FR-027 · 원칙: X, XIII · design: §12, §14, §22 · 파일: `src/components/ui/Alert.tsx`
  - 검증: 컴포넌트 테스트(role 매핑)
  - 완료: Alert 변형별로 올바른 `role`과 아이콘·텍스트가 있는가?

- [X] T029 반복 입력 항목 컴포넌트를 만든다: 행마다 번호 라벨("경력 1"), 삭제 버튼(44px 이상, 빨강 테두리), 마지막 한 행의 버튼은 "비우기"(내용만 비움), 점선 "추가" 버튼, 최대 개수에 도달하면 "최대 N개까지 입력할 수 있어요"로 바뀌고 비활성, 외부에서 비활성화(없음 선택)할 수 있고 사유를 글자로 표시. 값은 부모가 관리(제어 컴포넌트).
  - 요구사항: FR-002, FR-003, FR-006, FR-007, FR-037 · 원칙: VII, XIII · design: §11 · 파일: `src/components/input/RepeatableRows.tsx`
  - 검증: 컴포넌트 테스트(추가·삭제·최대 도달·비우기·키보드 조작)
  - 완료: 최대 개수에서 추가가 막히고 안내 문구가 보이며, 키보드만으로 추가·삭제가 되는가?

- [X] T030 [P] "없음" 선택지 컴포넌트를 만든다("경력 없음", "자격증 없음", "교육이수 없음", 인턴 "없음"): 같은 크기의 테두리 박스 선택지, 선택하면 연결된 반복 입력이 비활성(점선 테두리)이 되며 다른 선택지와 시각적 차이를 두지 않는다.
  - 요구사항: FR-003, FR-006, FR-007 · 원칙: V, XII, XIII · design: §11 · 파일: `src/components/input/NoneChoice.tsx`
  - 검증: 컴포넌트 테스트(선택 시 연결 입력 비활성 + 사유 텍스트)
  - 완료: "없음"을 선택하면 연결 입력이 비활성이 되고 이유가 글자로 보이는가?

- [X] T031 상태 화면 컴포넌트를 만든다(최대 폭 680px 카드: 상태 배지 + H1 + 설명 + 행동 버튼). 변형: 분석 중(단계 4개 목록 "완료/진행 중/대기" 텍스트, 진행률 숫자·막대 없음), 지연(30초, 노랑 `role=status`), 빈 화면, 생성 실패, 형식 오류, 시간 초과, 요청 제한. 문구는 design §14 표 그대로. 실패·시간 초과·요청 제한·형식 오류는 `role=alert`.
  - 요구사항: FR-020, FR-023, FR-038 · 원칙: X, XII, XIII · design: §14 · 파일: `src/components/result/StatusScreen.tsx`
  - 검증: 컴포넌트 테스트(변형별 문구·행동 버튼·role), 문구가 `shared/messages.ts` 한 곳에서 옴
  - 완료: 7개 변형 모두 design §14의 문구와 행동 버튼을 갖고 "입력하신 내용은 그대로 남아 있습니다"가 실패 계열에 있는가?

- [X] T032 [P] 복사 알림 컴포넌트를 만든다: 성공(초록 ✓ + "결과를 복사했어요. 구직자 입력 정보는 포함되지 않아요."), 실패(빨강 "복사하지 못했어요. 결과를 직접 선택해 복사해 주세요."), `role=status`/`aria-live=polite`, 버튼 글자 "✓ 복사했어요"는 2.5초 후 복귀.
  - 요구사항: FR-021, FR-027 · 원칙: XIII · design: §14, §22 · 파일: `src/components/result/CopyNotice.tsx`
  - 검증: 컴포넌트 테스트(live region 존재, 문구)
  - 완료: 복사 성공·실패 알림이 `aria-live=polite` 영역에 텍스트로 나타나는가?

- [X] T033 [P] 공통 컴포넌트 단위 테스트를 정리하고, 개발 전용 컴포넌트 갤러리(`/dev/ui`)를 만든다. 갤러리는 `import.meta.env.DEV`에서만 등록되어 프로덕션 번들에 들어가지 않는다.
  - 요구사항: - · 원칙: XI, XV · design: §20 · 파일: `src/dev/UiGallery.tsx`, `src/App.tsx`, `tests/unit/ui/*.test.tsx`
  - 검증: `npm run build` 후 `dist`에 갤러리 문자열이 없음
  - 완료: 갤러리가 개발 서버에서만 열리고 빌드 결과에 포함되지 않는가?

- [X] T034 Phase 2 게이트: 갤러리에서 컴포넌트를 1440/1024/390px로 확인하고(눈으로, 스크린샷 저장) `npm run check`를 통과시킨다.
  - 요구사항: FR-027 · 원칙: XIII, XV · design: §16~§23 · 파일: (확인 작업)
  - 검증: `npm run check`, 스크린샷 `tests/e2e/__artifacts__/phase2/`
  - 완료: `npm run check`가 통과하고 모든 컴포넌트가 갤러리에서 깨지지 않고 보이는가?

---

## Phase 3. 세 핵심 화면과 Mock Data

**목표**: 실제 AI 없이 Mock AI Service로 메인 → 입력 → 결과 전체 흐름, 모든 상태 화면, 복사·인쇄까지 로컬에서 재현한다.
**의존**: Phase 2 완료. 이 Phase는 검증(Zod) 없이 화면만 만든다(검증은 Phase 5).
**이 Phase 끝 → Mock으로 전체 흐름 확인 + `/design-sync` 검증 → Phase 4.**

### 3-A 기반: 라우팅, 상태, 문구, Mock

- [X] T035 라우팅과 화면 전환 규칙을 만든다: `/`(메인), `/input`(입력), `/result`(결과와 모든 상태 화면). 화면 전환 시 H1로 포커스 이동과 `document.title` 갱신, 새 화면은 맨 위로.
  - 요구사항: FR-027, FR-028 · 원칙: XIII · design: §5, §8, §22 · 파일: `src/App.tsx`, `src/hooks/useRouteFocus.ts`, `src/pages/MainPage.tsx`, `src/pages/InputPage.tsx`, `src/pages/ResultPage.tsx`
  - 검증: 컴포넌트·E2E 테스트(전환 후 `document.activeElement`가 H1, 제목 변경)
  - 완료: 세 경로 이동 후 포커스가 H1에 있고 문서 제목이 화면마다 다른가?

- [X] T036 세션 상태 컨텍스트를 만든다(`input`, `status`(idle/loading/slow/success/error), `result`, `error`, `regenerated`, `requestId`). 상태는 **React 메모리에만** 두고 `localStorage`, `sessionStorage`, 쿠키, IndexedDB, URL에 쓰지 않는다. 새로고침하면 사라진다.
  - 요구사항: FR-025, FR-011 · 원칙: VI, X · design: §5 · 파일: `src/state/session.tsx`
  - 검증: 단위 테스트 + 코드 검색(`localStorage|sessionStorage|document.cookie|indexedDB` 0건)
  - 완료: 상태가 메모리에만 있고 브라우저 저장소 사용 코드가 0건인가?

- [X] T037 [P] 입력·결과 TypeScript 타입을 data-model 기준으로 임시 정의한다(Phase 5에서 Zod 추론 타입으로 교체). 필드명과 열거 값은 DM 1.1, 2.1, 2.2 그대로.
  - 요구사항: FR-001~008, FR-012, FR-014 · 원칙: VIII · design: §13 · 파일: `shared/types.ts`
  - 검증: `npm run typecheck`
  - 완료: 타입이 DM의 모든 필드를 포함하는가?

- [X] T038 [P] 문구 상수 파일을 만든다: 서비스 이름, 안내문 두 줄, 개인정보 안내문, **외부 AI 전송 안내문(FR-039)**, 메인·입력·결과 제목, 상태 화면 문구(§14, 형식 오류 포함), 오류 문구 9개(§12)와 추가 오류·경고 문구(DM 1.3·1.5), 저장 버튼 비활성 안내("상담 이력 저장은 아직 준비 중이에요"). **클라이언트와 서버가 함께 쓰므로 `shared/`에 둔다**(서버가 `notice` 두 줄을 결과에 붙이기 위해 읽어야 하고, `server/`가 `src/`를 가져오지 않는다). 문구는 이 파일에서만 가져온다.
  - 요구사항: FR-016, FR-039, FR-010 · 원칙: I, IV, VI, XII · design: §2, §12, §14 · 파일: `shared/messages.ts`
  - 검증: 단위 테스트(안내문 두 줄이 design §2와 일치)
  - 완료: 안내문 두 줄·개인정보 안내·AI 전송 안내·오류 문구가 `shared/messages.ts` 한 파일에 있고, 다른 파일에 같은 문구가 복사되어 있지 않은가(안내문 두 줄을 검색해 정의가 1곳)?

- [X] T039 [P] Mock 입력 데이터를 만든다: `test-personas.md`의 P1~P5(P4-b 중복 강점, P5-a 지시문, P5-b 식별 정보, P5-c 한도 초과 변형 포함). 모든 인물은 가상.
  - 요구사항: FR-018, SC-005 · 원칙: V, VII · design: §27 · 파일: `src/mock/personas.ts`
  - 검증: 단위 테스트(5개 이상, 신규 진입자는 `noCareer=true`)
  - 완료: 페르소나 입력 5개와 변형이 모두 정의되어 있는가?

- [X] T040 [P] Mock 결과 데이터를 만든다: 페르소나별 `ResultPayload` 예시(DM 2.2 형태). 직업 3개·키워드 3개, `needsConfirmation` 문장 1개 이상, `isStandardName=false` 직업 1개, 불일치 안내(`mismatchNote`)가 있는 키워드(P4), 경력이 있는 페르소나는 직업 1개 이상이 `career` 참조(V14), `notice` 두 줄 포함, 키워드의 `linkedInputs`는 객관 항목 연결 키워드와 `strength`만 연결된 키워드(불일치)를 모두 포함. 수치·부정 표현·연령 표현 없음. 최대 길이 결과(문장 120자, 항목 최대) 1개 추가(A4 확인용).
  - 요구사항: FR-012~017, FR-036 · 원칙: II, III, IV, V · design: §13 · 파일: `src/mock/results.ts`
  - 검증: 단위 테스트(개수, 필드 존재). 스키마 통과 검증은 T084
  - 완료: 페르소나별 Mock 결과와 최대 길이 결과가 있고 모두 직업 3·키워드 3인가?

- [X] T041 Mock AI Service를 만든다. 인터페이스 `generate(input, { signal }) → ResultPayload | ApiError`. 시나리오 `ok`, `slow`(31초 이상 지연 후 성공), `timeout`(응답 없음), `fail`(생성 실패), `format`(형식 오류), `limit`(요청 제한). 선택은 개발 환경의 `?mock=` 쿼리 또는 `VITE_AI_MODE=mock`으로 한다. **결과 선택 규칙**: `?persona=P1`~`P5`가 있으면 해당 페르소나의 Mock 결과를, 없으면 입력의 첫 번째 강점 문장이 페르소나 입력과 일치하는 결과를, 어느 것도 아니면 P1 결과를 돌려준다(임의 입력에도 항상 유효한 결과). 시나리오 선택 UI는 만들지 않는다(제품 UI 아님, 시안의 "시안 도구" 띠 구현 금지). 프로덕션 빌드에서는 mock 코드가 제거되도록 환경 상수로 분기한다.
  - 요구사항: FR-023, FR-038, FR-020 · 원칙: X, XI · design: §3, §14 · 파일: `src/services/ai/types.ts`, `src/services/ai/mock.ts`, `src/services/ai/index.ts`
  - 검증: 단위 테스트(시나리오별 결과·지연·`AbortSignal` 중단, 선택 규칙 3가지: 쿼리·강점 일치·기본값)
  - 완료: 6개 시나리오를 각각 재현할 수 있고 `AbortSignal`로 중단되는가?

### 3-B 메인 페이지

- [X] T042 메인 페이지 Hero를 만든다: 상단 라벨 "직업상담사를 위한 초기상담 도구", H1 "이력을 강점으로, 강점을 직무로."("강점", "직무" 민트 강조), 보조 문구, CTA 2개("상담 시작하기 →" 민트 52px → `/input`, "이용 방법 보기" 고스트), 참고용 안내문 두 줄 박스, 개인정보 안내(▣ 아이콘, 한 줄), 외부 AI 전송 안내(FR-039). 배경은 정적 그라데이션 + 정적 격자(48px, 흰색 4.5%, 위에서 아래로 사라지는 마스크).
  - 요구사항: FR-016, FR-025, FR-039 · 원칙: I, IV, VI, XIII · design: §2, §9, §10 · 파일: `src/components/main/Hero.tsx`, `src/pages/MainPage.tsx`
  - 검증: 컴포넌트 테스트(문구·링크), 1440px에서 첫 화면에 H1·CTA 표시(E2E T064)
  - 완료: Hero에 문구, CTA 2개, 안내문 두 줄, 개인정보·AI 전송 안내가 모두 있는가?

- [X] T043 [P] 이력 조각 시각 요소를 만든다: 카드 4장(학력/경력/자격증/강점, 폭 210px) + 추천 직업 카드(폭 220px, 위쪽 4px 민트 선, "추천 직업 · 가상 예시") + SVG 연결선 4개(민트 1.5px). 장식이므로 `aria-hidden`. 모바일(≤767px)은 2×2 카드 + "연결" 구분선 + 직업 카드 세로 배치. 같은 정보가 결과 미리보기에도 텍스트로 있어야 한다.
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §9, §10 · 파일: `src/components/main/ResumeFragments.tsx`
  - 검증: 컴포넌트 테스트(`aria-hidden`), 모바일 변형 확인
  - 완료: 시각 요소가 `aria-hidden`이고 모바일에서 세로 배치로 바뀌는가?

- [X] T044 [P] 이용 흐름 4단계(① 구직자 정보 입력 ② AI 분석 ③ 결과 확인 ④ 상담사와 함께 검토, 제목 "상담 중 이렇게 이용해요"), "시작하기 전에 확인해 주세요"(안내문, 개인정보 안내, 주 CTA 반복), 푸터("저장하기를 누르기 전에는 저장되지 않습니다.")를 만든다. 4열(≤1023px 2열, ≤767px 세로 타임라인).
  - 요구사항: FR-016, FR-025 · 원칙: I, VI, XIV · design: §2, §3.1, §4 · 파일: `src/components/main/FlowSteps.tsx`, `src/components/main/NoticeSection.tsx`, `src/components/main/Footer.tsx`
  - 검증: 컴포넌트 테스트, 3개 뷰포트 확인(T061)
  - 완료: 4단계와 안내 섹션, 푸터가 있고 "이용 방법" 링크가 `#flow`로 이동하는가?

### 3-C 구직자 정보 입력 페이지

- [X] T045 입력 페이지 골격을 만든다: PageHeader(kicker "STEP 01 · 입력", 제목 "구직자 정보 입력"), 왼쪽 섹션 목차(230px, ≤1100px 190px, 섹션별 상태 ○/✓/!), 오류 요약 자리, 하단 고정 바("필수 항목 N/4개 입력됨 · 저장하기를 누르기 전에는 저장되지 않습니다." + "결과 생성하기 →", 진행은 텍스트만), **외부 AI 전송 안내문(FR-039)을 입력 제목 아래**에 표시.
  - 요구사항: FR-025, FR-039 · 원칙: VI, XIII · design: §3.2, §11 · 파일: `src/pages/InputPage.tsx`, `src/components/input/SectionNav.tsx`, `src/components/input/BottomBar.tsx`
  - 검증: 컴포넌트 테스트(문구, 하단 바 텍스트)
  - 완료: 목차, 하단 고정 바, 외부 AI 전송 안내가 입력 화면에 있는가?

- [X] T046 기본 정보 섹션을 만든다: 나이(숫자 텍스트, 힌트 "숫자만 입력해 주세요. 15~99 사이… 추천 결과를 만드는 데 사용되지 않아요."), 최종학력(고졸 이하/전문대/대졸/석사/박사), 학력 상태(졸업/재학/휴학/중퇴/졸업예정), 전공(반복 입력, 힌트 "고졸 이하는 비워 두어도 됩니다"). 나이는 `input` 상태에만 두고 생성 요청 경로에는 전달하지 않는다.
  - 요구사항: FR-001, FR-002, FR-004 · 원칙: V, VI · design: §11 · 파일: `src/components/input/BasicInfoSection.tsx`
  - 검증: 컴포넌트 테스트(옵션 값, 힌트 문구)
  - 완료: 나이·학력·학력 상태·전공 입력이 있고 필수/선택 텍스트가 표시되는가?

- [X] T047 [P] 경력 섹션을 만든다: "경력 없음" 선택지 + 직무명·업종·기간 3칸 반복 행("경력 추가").
  - 요구사항: FR-003 · 원칙: V, XII · design: §11 · 파일: `src/components/input/CareerSection.tsx`
  - 검증: 컴포넌트 테스트(없음 선택 시 행 비활성)
  - 완료: 경력 없음 선택 시 경력 행이 비활성이 되고 사유가 보이는가?

- [X] T048 [P] 인턴 경험 섹션을 만든다: 있음/없음 라디오, "있음"일 때만 내용(Textarea)·기간 표시.
  - 요구사항: FR-005 · 원칙: XII · design: §11 · 파일: `src/components/input/InternSection.tsx`
  - 검증: 컴포넌트 테스트(있음 선택 시 내용·기간 표시)
  - 완료: "있음"을 고르면 내용·기간 입력이 나타나는가?

- [X] T049 [P] 자격증·교육이수 섹션을 만든다: 자격증 반복 입력 + "자격증 없음", 교육이수(과정명 + 기간) 반복 입력 + "교육이수 없음".
  - 요구사항: FR-006, FR-007 · 원칙: XII · design: §11 · 파일: `src/components/input/CertTrainingSection.tsx`
  - 검증: 컴포넌트 테스트
  - 완료: 자격증·교육이수에 각각 "없음" 선택지가 있고 선택 시 입력이 비활성인가?

- [X] T050 [P] 강점 섹션을 만든다: 입력창 3개(번호 칩, 제목 옆 "(필수 · 정확히 3개)", 힌트 "3개 적어 주세요. 각 100자 이내.", placeholder 예시 3개).
  - 요구사항: FR-008 · 원칙: III, XIII · design: §11 · 파일: `src/components/input/StrengthsSection.tsx`
  - 검증: 컴포넌트 테스트(입력창 정확히 3개)
  - 완료: 강점 입력창이 정확히 3개이고 제목에 "정확히 3개"가 있는가?

- [X] T051 모바일 접이식(아코디언) 구조를 만든다: ≤767px에서 섹션 제목이 버튼, 오른쪽에 상태 텍스트("미입력", "✓ 입력됨", "! 확인 필요", "선택")와 화살표, 첫 섹션만 열림, 오류 섹션 자동 열림 준비(Phase 5에서 연결). 목차는 모바일에서 숨긴다.
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §4, §11, §22 · 파일: `src/components/input/MobileAccordion.tsx`
  - 검증: 컴포넌트 테스트(키보드로 열고 닫기, `aria-expanded`)
  - 완료: 390px에서 섹션이 접이식이고 키보드로 열고 닫을 수 있는가?

- [X] T052 입력 페이지를 세션 상태와 연결한다: 모든 필드 값이 `input` 상태에 저장되고, "결과 생성하기"를 누르면(검증 없이) 요청을 시작하고 `/result`로 이동한다. 페이지를 떠났다 돌아와도 입력이 유지된다.
  - 요구사항: FR-011, FR-024, FR-025 · 원칙: VI, X · design: §5 · 파일: `src/pages/InputPage.tsx`, `src/state/session.tsx`
  - 검증: E2E(입력 → 결과 → 입력 수정하기 → 값 유지)
  - 완료: 결과 화면에서 입력 화면으로 돌아와도 입력한 값이 모두 남아 있는가?

### 3-D 생성 흐름과 결과 페이지

- [X] T053 생성 훅을 만든다: 요청 시작, 30초에 `slow` 전환, 120초에 `AbortController`로 중단하고 시간 초과 상태, "다시 시도"(0초부터 다시 셈), 한 번에 요청 하나(진행 중 중복 제출 불가), 분석 중 화면 이탈(뒤로 가기) 시 요청 중단 + 입력 유지 + 결과 폐기, 늦게 도착한 이전 요청 응답 무시(`requestId`).
  - 요구사항: FR-023, FR-024, FR-011 · 원칙: X · design: §5, §14 · 파일: `src/hooks/useGenerate.ts`
  - 검증: 단위 테스트(가짜 타이머: 30초·120초, 재시도, 이탈 중단, 중복 제출 차단)
  - 완료: 30초에 지연, 120초에 시간 초과로 바뀌고 이탈·중복 제출이 처리되는가?

- [X] T054 결과 페이지 골격을 만든다: 상단 고정 참고용 안내 바(네이비, 두 줄), PageHeader(kicker "STEP 03 · 결과 확인", 제목 "상담 참고 결과"), 재생성 직후에만 보이는 알림("새로 생성한 결과로 바꿨어요. 이전 결과는 더 이상 표시되지 않습니다."), 행동 버튼 바 + 상태 알림 영역(`role=status`, `aria-live=polite`), 접기/펼치기 입력 정보 요약(기본 접힘, 나이·최종학력·전공·경력·인턴·자격증·교육이수·강점 3개).
  - 요구사항: FR-016, FR-024 · 원칙: I, IV, XIII · design: §13.1, §13.2, §13.6 · 파일: `src/pages/ResultPage.tsx`, `src/components/result/NoticeBar.tsx`, `src/components/result/ActionBar.tsx`, `src/components/result/InputSummary.tsx`
  - 검증: 컴포넌트 테스트(안내문 두 줄, 요약 접힘 기본값)
  - 완료: 상단 고정 안내 바에 두 줄 안내문이 있고 입력 요약이 기본 접힘인가?

- [X] T055 추천 직업 카드를 만든다: "추천 직업 N", 직업명(24px) + 보조 설명, `isStandardName=false`이면 "? 표준 분류 확인 필요" 배지, 추천 근거(문장 단위), 연결된 입력 항목 Tag들("전공: 사회복지학"), "상담에서 함께 확인할 점" 상자(왼쪽 네이비 4px 선), `needsConfirmation` 문장은 노란 점선 상자 + "? 확인 필요" 배지로 감싸는 `ConfirmNeeded`.
  - 요구사항: FR-012, FR-013, FR-017, FR-036 · 원칙: II, IV, XII · design: §13.3, §13.5 · 파일: `src/components/result/JobCard.tsx`, `src/components/result/ConfirmNeeded.tsx`
  - 검증: 컴포넌트 테스트(Tag 1개 이상, 배지 조건부, 확인 필요 표시)
  - 완료: 직업 카드에 근거·연결 항목 Tag·확인할 점이 있고 `needsConfirmation` 문장이 배지와 함께 표시되는가?

- [X] T056 [P] 키워드 카드와 불일치 안내를 만든다: "키워드 N", 키워드(24px), 정의 목록("연결 강점", "연결 직업"), "연결된 입력 항목" Tag들(`strength` 제외 객관 항목만, 없으면 영역 생략. design §13.4 제안, T069 승인 전제), "설명"(2~3문장), `mismatchNote`가 있으면 머리말 태그 "※ 상담에서 함께 보강해요" + 파란 안내 상자(제목 "이야기를 더 나눠 보면 좋아요", ※ 아이콘). 라벨은 "연결 직업"이다("연결 직무" 금지).
  - 요구사항: FR-014, FR-015 · 원칙: III, XII · design: §13.4, §13.7 · 파일: `src/components/result/KeywordCard.tsx`, `src/components/result/MismatchNote.tsx`
  - 검증: 컴포넌트 테스트(불일치 조건부 표시, "연결 직업" 라벨, 객관 항목 Tag는 `strength` 제외·없으면 영역 없음)
  - 완료: `mismatchNote`가 있는 키워드만 불일치 안내와 태그가 나타나는가?

- [X] T057 결과 영역 A/B 조립과 하단 요소를 만든다: 영역 A(제목 "취업 가능성이 높은 추천 직업 3개", 부제 "입력하신 이력과의 적합도를 기준으로 골랐고, 연결된 근거와 함께 보여드려요."), 영역 B(제목 "자기소개서 키워드 3개"), "? 확인 필요" 범례, 하단 참고용 안내문(흰 박스), 비활성 "상담 이력으로 저장" 버튼(사유 글자 "상담 이력 저장은 아직 준비 중이에요"). 카드 폭: ≥1200px 3열, ≤1199px 1열(본문 17.5px).
  - 요구사항: FR-012, FR-014, FR-016, FR-032(비활성만) · 원칙: I, IV, XI, XIV · design: §13, §21 · 파일: `src/pages/ResultPage.tsx`
  - 검증: 컴포넌트 테스트(직업 3·키워드 3, 안내문 위·아래)
  - 완료: 결과에 직업 카드 3개, 키워드 카드 3개, 위·아래 안내문, 비활성 저장 버튼이 있는가?

- [X] T058 결과 페이지를 상태 화면과 연결한다: `idle` → 빈 화면, `loading` → 분석 중, `slow` → 지연 안내 추가, `error`(코드별) → 생성 실패·형식 오류·시간 초과·요청 제한(행동: 다시 시도, 입력 수정하기), `success` → 결과. 상태 전환 시 H1 포커스.
  - 요구사항: FR-020, FR-023, FR-038 · 원칙: X, XIII · design: §14, API 3 · 파일: `src/pages/ResultPage.tsx`, `src/components/result/StatusScreen.tsx`
  - 검증: E2E(Mock 시나리오 6개로 각 화면 확인)
  - 완료: Mock 시나리오 6개에서 각각 올바른 상태 화면과 행동 버튼이 나타나는가?

- [X] T059 [P] 복사 텍스트 생성 함수를 만든다(CP 1절 형식): 안내문 두 줄을 맨 위와 맨 아래에, `needsConfirmation` 문장에 "[확인 필요] " 접두, `mismatchNote`가 있는 키워드만 "함께 이야기 나눠 볼 점", `strength` 외 연결 항목이 있는 키워드만 "연결된 입력 항목" 줄, 구직자 입력 정보(나이·학력·요약)는 포함하지 않음.
  - 요구사항: FR-016, FR-021, SC-009 · 원칙: I, IV · design: §13.5, §13.7, CP 1 · 파일: `src/lib/copyText.ts`, `tests/unit/copyText.test.ts`
  - 검증: 단위 테스트(CP 1절 테스트 표 5개)
  - 완료: 복사 텍스트가 안내문 두 줄을 위·아래에 포함하고 입력 정보를 포함하지 않는가?

- [X] T060 복사·인쇄·입력 수정·다시 생성 버튼을 연결한다: 복사하기(주, 클립보드 + 복사 알림), 인쇄하기(`window.print()`), 입력 수정하기(`/input`, 값 유지), 다시 생성하기(Mock 재호출, 이전 결과 교체 + 재생성 알림, **실패하면 이전 결과 숨김**). 진행 중에는 생성·다시 생성 버튼 비활성.
  - 요구사항: FR-021, FR-022, FR-024 · 원칙: X, XIII · design: §13.6 · 파일: `src/components/result/ActionBar.tsx`, `src/pages/ResultPage.tsx`
  - 검증: E2E(복사 알림 텍스트, 입력 수정 후 재생성, 재생성 실패 시 이전 결과 없음)
  - 완료: 네 버튼이 동작하고 재생성이 실패하면 이전 결과가 화면에 없는가?

### 3-E 반응형, 모션, 인쇄

- [X] T061 반응형을 적용하고 점검한다: 분기 1199/1100/1023/767px. design §21 표(Hero 열 수, CTA 방향, 이용 흐름 열 수, 목차 폭, 하단 바 방향, 결과 카드 열 수, 행동 버튼 줄바꿈, 요약 열 수)와 "크기별 완료 기준"(1440/1024/390px, 최소 360px 가로 스크롤 없음)을 따른다.
  - 요구사항: FR-028 · 원칙: XIV · design: §4, §21 · 파일: 각 컴포넌트·페이지 스타일
  - 검증: Playwright 3개 뷰포트에서 `document.documentElement.scrollWidth <= innerWidth`와 360px 추가 점검, 스크린샷
  - 완료: 360/390/1024/1440px 모두에서 가로 스크롤이 없고 design §21 표의 열 구성과 같은가?

- [X] T062 모션과 움직임 감소 동작을 적용한다(design §23 표): Gradient·Grid Glow는 정적, Floating Card는 `float-in`(감소 시 최종 위치 즉시 표시), 연결선은 3회 후 정지(감소 시 정지 상태로 표시), Hero 문구·CTA 진입, 전환 페이드(감소 시 없음), 분석 중 회전 아이콘(감소 시 정지, 단계는 텍스트), 단계 간격 1초/0.7초, smooth scroll(감소 시 즉시).
  - 요구사항: FR-027 · 원칙: XIII · design: §10, §23 · 파일: `src/styles/motion.css`, `src/components/main/ResumeFragments.tsx`, `src/components/main/Hero.tsx`, `src/components/result/StatusScreen.tsx`
  - 검증: E2E(`reducedMotion: 'reduce'`에서 `getAnimations()` 0개)
  - 완료: 움직임 감소 설정에서 화면의 모든 애니메이션이 없는가?

- [ ] T063 결과 화면 인쇄 레이아웃을 만든다(CP 2절, design §15): Header·상단 바·행동 버튼·상태 알림·입력 요약·재생성 알림 숨김, 제목 "상담 참고 결과"(굵은 밑줄), 안내 상자(두 줄, 굵은 테두리), A 영역(검은 바탕 흰 글자 제목), B 영역(흰 바탕·굵은 테두리·왼쪽 두꺼운 선), 항목 상자 1px 검은 테두리, 굵은 라벨("근거 · ", "연결 항목 · ", "상담에서 함께 확인할 점 · "), "확인 필요"는 `[확인 필요]` 텍스트 + 왼쪽 이중선 + 이탤릭, 불일치는 점선 구분선 + "함께 이야기 나눠 볼 점" 라벨, 하단 안내문 두 줄 + "[확인 필요]" 설명. 서비스 이름·생성 일시·구직자 입력 정보는 인쇄하지 않는다. 별도 인쇄 미리보기 화면은 만들지 않는다.
  - **진행 기록**: 인쇄 레이아웃과 P1~P5 결과 A4 1쪽 확인 완료. 최대 길이 결과는 2쪽이라 완료 처리하지 않음(phase3-review.md, 사용자 결정 필요).
  - 요구사항: FR-016, FR-022 · 원칙: I, XIV · design: §15, CP 2 · 파일: `src/styles/print.css`, `src/pages/ResultPage.tsx`
  - 검증: Playwright 인쇄 에뮬레이션 + `page.pdf({ format: 'A4' })` 페이지 수. 최대 길이 Mock 결과(T040)로 확인. 흑백 구분은 **수동 확인**
  - 완료: 최대 길이 Mock 결과의 A4 PDF가 1쪽이고 안내문 두 줄이 위·아래에 있는가? (1쪽을 넘으면 문장 길이 한도를 줄이도록 spec FR-022·DM 2.1 조정을 사용자에게 보고)

- [X] T064 Mock 기반 E2E를 작성한다: 메인 → 입력(예시 입력) → 결과 흐름, 실패 → 다시 시도 → 결과, 요청 제한 화면, 지연 화면, 빈 화면(직접 진입), 키보드 포커스 표시, `document.title` 변경.
  - 요구사항: FR-023, FR-028, FR-038 · 원칙: X, XIII, XIV · design: §5, §14, §22 · 파일: `tests/e2e/flow.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 3개 뷰포트에서 Mock 흐름 E2E가 모두 통과하는가?

- [X] T065 Mock으로 로컬 UI 전체 흐름을 직접 확인한다: design.md §26의 항목(1~34번 중 Mock으로 가능한 것)을 `?mock=` 시나리오로 예/아니오 기록한다. 결과를 `specs/001-job-recommendation-keywords/phase3-review.md`에 남긴다.
  - 요구사항: FR-028 · 원칙: XIV, XV · design: §26 · 파일: `specs/001-job-recommendation-keywords/phase3-review.md`
  - 검증: 사람이 브라우저로 확인
  - 완료: §26 항목의 예/아니오 기록이 파일에 있고 "아니오" 항목마다 후속 Task나 예외가 적혀 있는가?

- [X] T066 Phase 3 게이트: `npm run check`와 `npm run test:e2e`를 통과시키고, **Phase 4 시작 전 Mock으로 전체 흐름과 `/design-sync`를 먼저 검증**한다.
  - **진행 기록**: `/design-sync`로 컴포넌트 17개를 새 Claude Design 프로젝트에 올림(미리보기 전부 good, 렌더 검사 17/17). 시안 v3와 구현 화면의 화면 단위 비교는 아직 하지 않았고, T065 기록과 `npm run check` 결과는 완료. 게이트 판정은 비교 후.
  - 요구사항: - · 원칙: XV · design: - · 파일: (확인 작업)
  - 검증: `npm run check`, `npm run test:e2e`
  - 완료: 두 명령이 모두 통과하고 T065 기록이 완료되었는가?

---

## Phase 4. Claude Design 동기화와 UI 수정

**목표**: 구현을 승인된 Claude Design 화면과 맞추고 CRITICAL·HIGH 시각 문제를 고친다.
**의존**: Phase 3 게이트(T066) 완료. **이 Phase가 끝나 디자인이 확정되기 전에는 Phase 5를 시작하지 않는다.**
**확인 필요**: `/design-sync`의 정확한 동작(어느 방향으로 동기화하는지, 입력·출력 형식)은 이 저장소에서 확인하지 못했다. T070에서 먼저 확인한다.

- [X] T067 `/design-sync` 실행 전 코드 구조 검사 스크립트를 만든다: (1) 하드코딩된 색(`#hex`, `rgb(`, `hsl(` — `tokens.css`와 인쇄 전용 값 제외), (2) 하드코딩된 간격·글자 크기(임의 값 `px` — 토큰 밖), (3) 컴포넌트 분리(페이지 파일이 `components/ui`를 쓰지 않고 직접 스타일링한 요소), (4) 토큰 이름이 design §16과 다른 사용을 검출해 보고서(`tests/e2e/__artifacts__/audit.md`)로 출력한다.
  - 요구사항: FR-027 · 원칙: XIII, XV · design: §16, §19, §20 · 파일: `scripts/audit-design.mjs`, `package.json`(`audit:design`)
  - 검증: 의도적으로 하드코딩 색을 넣은 임시 파일에서 검출되는지 확인
  - 완료: `npm run audit:design`이 하드코딩된 색·간격을 목록으로 출력하는가?

- [X] T068 검사 결과를 수정한다: 검출된 하드코딩 값을 토큰으로 바꾸고, 반복되는 스타일 조각은 공통 컴포넌트로 옮긴다. 예외가 필요하면 파일과 이유를 `audit-design.mjs`의 허용 목록에 기록한다.
  - 요구사항: FR-027 · 원칙: XV · design: §16, §19 · 파일: `src/**`, `scripts/audit-design.mjs`
  - 검증: `npm run audit:design`
  - 완료: 검사 결과에 허용 목록 밖의 하드코딩이 0건인가?

- [X] T069 디자인 승인 기준을 확정한다(사용자 확인): 승인한 시안이 `시안 A - 서비스 프로토타입 v3.html`인지 확인한다(design 확인 필요 #1). v3에 없는 항목(외부 AI 전송 안내문, 지시문·강점 중복·식별 정보 경고, 형식 오류 상태, 시간 초과 문구 변경, 저장 버튼 비활성 안내)을 시안에 반영할지 결정해 `design-review.md`에 기록한다. **함께 승인받을 제안 값 목록**(spec Clarifications `Session 2026-10-11`과 design의 "제안, 승인 대기" 표시 항목): 요청 제한 10분 20회, 대기 중 취소 버튼 없음, 움직임 감소 시 페이드 없이 정지, 태블릿(≤1199px) 본문 17.5px 채택, 간격·글자 토큰은 시안 값 그대로, 터치 대상 간격 8px, 보조 글자 최소 13px, 경고·AI 전송 안내·형식 오류·시간 초과 문구, A4 한 장 목표, 강점 최소 2자, 키워드 카드의 "연결된 입력 항목" Tag 표시(design §13.4). 승인·수정·거절을 항목별로 기록하고, 거절·수정된 항목은 spec·design·tasks에 반영한다.
  - 요구사항: FR-009, FR-010, FR-020, FR-039, FR-041 · 원칙: XI · design: §2, §12, §14, 확인 필요 모음 · 파일: `specs/001-job-recommendation-keywords/design-review.md`
  - 검증: 사용자 답변 기록
  - 완료: 기준 시안, v3 미반영 항목의 처리, 위 제안 값 전부의 승인 여부가 `design-review.md`에 항목별로 기록되었는가?

- [X] T070 `/design-sync`를 실행한다. 실행 전에 이 명령이 무엇을 읽고 쓰는지(Claude Design 프로젝트 `ddba158f-537c-469e-9fe9-38e50fb7fbbd`의 파일을 덮어쓰는지) 확인하고, 덮어쓰기라면 사용자 승인을 받은 뒤 실행한다. 결과를 기록한다.
  - **진행 기록**: 사용자 결정으로 건너뜀(2026-10-11)
  - 요구사항: - · 원칙: XI, XV · design: §16 · 파일: `specs/001-job-recommendation-keywords/design-review.md`
  - 검증: 명령 출력과 변경된 파일 목록을 기록
  - 완료: `/design-sync` 실행 결과(변경 대상, 오류 유무)가 기록되어 있는가?

- [X] T071 실제 컴포넌트와 디자인 토큰을 동기화한다: `src/styles/tokens.css`와 design.md §16~§20, Claude Design 시안의 CSS 변수를 대조해 차이를 목록화하고, **시안과 문서가 기준**이라는 규칙으로 코드(또는 승인된 경우 문서)를 맞춘다.
  - 요구사항: FR-027 · 원칙: XIII · design: §16~§20 · 파일: `src/styles/tokens.css`, `specs/001-job-recommendation-keywords/design.md`(필요 시), `design-review.md`
  - 검증: 토큰 값 비교 단위 테스트(T012, T013) 통과
  - 완료: 토큰 차이 목록이 비어 있거나 모든 차이에 결정 기록이 있는가?

- [X] T072 화면 캡처를 만든다: 세 화면 × 세 뷰포트(1440/1024/390px) + 상태 화면 7종 + 인쇄 미디어를 Playwright로 저장한다. 같은 화면을 Claude Design 시안 v3와 비교할 수 있게 `render_preview`로 시안 캡처 방법을 `design-review.md`에 기록한다(시안은 소스 기반 검증만 가능했고 렌더링은 아직 못 봤다).
  - 요구사항: FR-028 · 원칙: XIV · design: §21, §26 · 파일: `tests/e2e/visual.spec.ts`, `tests/e2e/__artifacts__/`, `design-review.md`
  - 검증: 스크린샷 파일 생성
  - 완료: 세 화면 × 세 뷰포트와 상태 화면 7종, 인쇄의 캡처가 저장되었는가?

- [X] T073 구현과 승인된 시안 세 화면을 비교한다. design §26의 34개 항목과 §22 접근성 항목을 기준으로 문제를 표(심각도 CRITICAL/HIGH/MEDIUM/LOW | 화면 | 문제 | 관련 요구사항 | 수정 제안)로 `design-review.md`에 정리한다. 반투명·그라데이션 위 글자 대비를 측정한다(design §22 남은 항목). **시안 v3에 없는 상태(FR-039 안내문, 형식 오류, 지시문·강점 중복·식별 정보 경고 등)는 이 비교에서 "시안 없음"으로 표시하고 design §12·§14 기준으로 별도 점검한다. 그중 Phase 5에서 구현되는 UI는 T090에서 확인한다.**
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §22, §26 · 파일: `specs/001-job-recommendation-keywords/design-review.md`
  - 검증: 사람이 캡처와 시안을 대조
  - 완료: 비교 표가 있고 모든 문제에 심각도가 지정되었는가?

- [X] T074 CRITICAL·HIGH 문제를 모두 수정한다. 수정마다 `design-review.md`의 해당 행에 결과를 기록한다. MEDIUM·LOW는 목록으로 남긴다.
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: 문제별 · 파일: `src/**`, `design-review.md`
  - 검증: 수정한 문제를 같은 방법으로 재확인
  - 완료: CRITICAL·HIGH 문제가 0개 남았는가?

- [X] T075 디자인 회귀 검증을 만든다: 세 뷰포트, 인쇄 미디어, 모든 상태 화면(분석 중·지연·빈 화면·생성 실패·형식 오류·시간 초과·요청 제한)에 대해 스크린샷 비교 + `@axe-core/playwright` + 가로 스크롤 검사를 E2E로 자동화한다.
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §21, §22, §26 · 파일: `tests/e2e/regression.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 회귀 E2E가 세 뷰포트·인쇄·상태 화면 7종 모두에서 통과하는가? (입력 오류·경고 상태는 Phase 5의 T090에서 이 회귀 파일에 추가한다)

- [X] T076 Phase 4 게이트와 **디자인 확정 승인**: `npm run check`, `npm run test:e2e`, `npm run audit:design`을 통과시키고, 사용자에게 구현 화면을 보여 디자인 확정 승인을 받아 `design-review.md`에 기록한다. 승인 전에는 Phase 5를 시작하지 않는다. 승인 기록에는 "Phase 5에서 입력 오류·경고 UI가 추가되며 T090에서 design §12 기준으로 확인한다"를 포함한다.
  - 요구사항: - · 원칙: XV · design: - · 파일: `design-review.md`
  - 검증: 세 명령 통과 + 사용자 승인 기록
  - 완료: 세 명령이 통과하고 사용자의 디자인 확정 승인이 기록되었는가?

---

## Phase 5. 입력 검증과 데이터 계약

**목표**: 입력·출력 Zod 스키마를 클라이언트와 서버가 공유하고, 화면 오류 표시를 완성한다.
**의존**: Phase 4 게이트(T076, 디자인 확정) 완료.
**제약 인용**: 아래 Task의 한도는 spec FR-037과 data-model.md 1.1절의 값을 그대로 쓴다.

- [X] T077 입력 스키마를 만든다(`shared/schema/input.ts`): `age` 정수 15~99 / `education.level` ∈ {고졸 이하, 전문대, 대졸, 석사, 박사}(코드 값 `highschool_or_below`, `college`, `bachelor`, `master`, `doctor`) / `education.status` ∈ {졸업, 재학, 휴학, 중퇴, 졸업예정}(`graduated`, `enrolled`, `leave`, `dropout`, `expected`) / `majors` 각 1~100자, 최대 6개 / `noCareer` 불리언이며 `true`이면 `careers` 빈 배열 / `careers` 최대 20개, 각 `jobTitle` 1~100자·`industry` 1~100자·`period` 1~50자, `noCareer=false`이면 1개 이상 / `intern.has` 필수, `has=true`이면 `content` 1~400자·`period` 1~50자 / `certifications` 각 1~100자, 최대 20개, `noCertifications=true`이면 빈 배열 / `trainings` 최대 20개, 각 `courseName` 1~100자·`period` 1~50자, `noTrainings=true`이면 빈 배열 / `strengths` **정확히 3개**, 각 공백 제외 2~100자. 오류 문구는 design §12 확정 문구와 DM 1.1 문구를 `shared/messages.ts`(T038)에서 가져온다.
  - 요구사항: FR-001~008, FR-010, FR-037 · 원칙: VII · design: §11, §12 · 파일: `shared/schema/input.ts`
  - 검증: 단위 테스트(경계값, T089)
  - 완료: 위 모든 필드·한도가 스키마에 있고 문구가 한 파일에서 오는가?

- [X] T078 [P] 문자열 정규화 함수를 만든다: 앞뒤 공백 제거, 한 줄 입력 칸의 줄바꿈·연속 공백을 공백 하나로, 인턴 내용은 줄바꿈 허용하되 연속 줄바꿈 하나로, 공백만 있는 값은 비어 있음.
  - 요구사항: FR-010 · 원칙: VII · design: §12 · 파일: `shared/schema/normalize.ts`, `tests/unit/normalize.test.ts`
  - 검증: 단위 테스트
  - 완료: 공백만 있는 값이 "비어 있음"으로 처리되는가?

- [X] T079 [P] 생성 요청 스키마를 만든다(`shared/schema/request.ts`): `GenerateRequest` = 입력에서 **`age`를 뺀** 엄격 객체(모르는 필드는 거부), "없음" 불리언은 요청에 포함하지 않고 빈 배열로 전달.
  - 요구사항: FR-004, FR-029 · 원칙: V, VI · design: - · 파일: `shared/schema/request.ts`
  - 검증: 단위 테스트(`age`·`name`·`phone` 포함 요청 거부)
  - 완료: `age`가 포함된 요청이 스키마에서 거부되는가?

- [X] T080 [P] 출력 스키마를 만든다(`shared/schema/output.ts`): `jobs` 정확히 3개{`title` 1~30자, `subtitle` 1~40자, `isStandardName`, `rationale` 문장 1~3개, `linkedInputs` 1~6개, `checkPoint` 한 문장} / `keywords` 정확히 3개{`keyword` 1~20자, `strengthIndex` 0~2(3개가 0,1,2를 한 번씩), `linkedJobIndex` 0~2, `description` 문장 2~3개, `linkedInputs` 1~6개(`strength` 포함), `mismatchNote` 문자열 또는 null} / `Sentence`={`text` 1~120자, `needsConfirmation`} / `InputRef`={`field` ∈ education, major, career, intern, certification, training, strength, `index`}. `ResultPayload`는 `linkedInputs`에 `label`, `value`, 키워드에 `strengthText`, `linkedJobTitle`, 그리고 `notice`(두 줄), `generatedAt`을 추가한다.
  - 요구사항: FR-012~015, FR-020, FR-036 · 원칙: II, III, VIII · design: §13 · 파일: `shared/schema/output.ts`
  - 검증: 단위 테스트(개수 2/4개 거부, 문장 수·길이 한도)
  - 완료: 출력 스키마가 DM 2.1·2.2와 필드·한도가 일치하는가?

- [X] T081 [P] API 오류 스키마를 만든다(`shared/schema/api.ts`): `ApiError` {`code` ∈ VALIDATION_FAILED, PII_DETECTED, RATE_LIMITED, UPSTREAM_FAILED, OUTPUT_INVALID, TIMEOUT, INTERNAL, `message`, `retryAfterSeconds`?, `details`?(경로·규칙만, 입력 값 없음), `requestId`}, 성공·실패 응답 유니온.
  - 요구사항: FR-020, FR-023, FR-038 · 원칙: VIII, X · design: §14 · 파일: `shared/schema/api.ts`
  - 검증: 단위 테스트
  - 완료: 오류 코드 7개가 API 3절과 같은가?

- [X] T082 [P] 입력 보호 함수를 만든다(클라이언트·서버 공용): 식별 정보 형식 감지(주민등록번호 6-7자리, 휴대전화·일반전화 번호, 이메일) → **차단**, 지시문 형태 감지(DM 1.3 목록) → **경고만**, 강점 중복(공백·문장 부호 제거 후 같은 문장) → **경고만**.
  - 요구사항: FR-009, FR-010, FR-041 · 원칙: VI, VII · design: §12 · 파일: `shared/guard/pii.ts`, `shared/guard/injection.ts`, `shared/guard/duplicate-strength.ts`, `tests/unit/guard.test.ts`
  - 검증: 단위 테스트(P5-a, P5-b, P4-b 입력과 정상 입력의 오탐 회귀)
  - 완료: 식별 정보는 차단, 지시문·중복은 경고로 분류되고 정상 입력이 통과하는가?

- [X] T083 임시 타입을 Zod 추론 타입으로 교체한다(`shared/types.ts` 삭제 또는 `z.infer`로 재export). 컴파일 오류를 모두 해결한다.
  - 요구사항: FR-001~008 · 원칙: VII, VIII · design: - · 파일: `shared/types.ts`, `src/**`
  - 검증: `npm run typecheck`
  - 완료: 수동으로 쓴 입력·결과 타입이 남아 있지 않고 타입 검사가 통과하는가?

- [X] T084 Mock Data가 스키마를 통과하는지 검증한다: 페르소나 입력(정상 케이스)은 `ApplicantInput`을 통과하고(비정상 변형은 기대한 이유로 실패), Mock 결과는 `ResultPayload`를 통과해야 한다. 실패하면 Mock Data를 고친다.
  - 요구사항: FR-012~015 · 원칙: VIII · design: §13 · 파일: `tests/unit/mock-schema.test.ts`, `src/mock/*.ts`
  - 검증: `npm run test`
  - 완료: Mock 결과 전부가 출력 스키마를 통과하고 비정상 변형이 기대한 이유로 거부되는가?

- [X] T085 필드 오류와 글자 수 안내를 연결한다: 제출 시 입력 스키마로 검증해 오류를 해당 입력창 아래에 표시하고(빨강 + 아이콘 + 굵은 텍스트), 글자 수 안내 "n / 최대자"와 최대 도달 시 "(최대)"를 모든 텍스트 입력창에 표시한다. 오류 문구는 design §12 확정 문구 그대로.
  - 요구사항: FR-010, FR-011, FR-037 · 원칙: VII, XIII · design: §11, §12 · 파일: `src/hooks/useFormValidation.ts`, `src/components/input/*`
  - 검증: 컴포넌트·E2E 테스트(필수 항목 비우고 제출)
  - 완료: 필수 항목을 비우고 제출하면 해당 입력창 아래에 확정 문구의 오류가 보이는가?

- [X] T086 오류 요약을 만든다: 제출 시 오류가 있으면 입력 제목 아래 빨강 2px 테두리 박스("입력 내용을 확인해 주세요. 고칠 항목이 N개 있어요."), 항목마다 "라벨: 메시지" 링크(높이 44px), 링크를 누르면 해당 입력창으로 스크롤·포커스, `role=alert`이며 포커스를 받음, 입력을 고치면 항목이 사라지고 개수가 갱신(0이면 요약 소멸), 오류 섹션의 목차 아이콘 "!"과 모바일 "! 확인 필요" 표시 + 모바일에서 오류 섹션 자동 열림. 결과는 생성하지 않고 다른 입력은 유지한다.
  - 요구사항: FR-010, FR-011 · 원칙: VII, XIII · design: §12, §22 · 파일: `src/components/input/ErrorSummary.tsx`, `src/components/input/SectionNav.tsx`, `src/components/input/MobileAccordion.tsx`
  - 검증: E2E(링크 클릭 → 포커스 이동, 수정 → 개수 감소, 모바일 자동 열림)
  - 완료: 오류 요약 링크가 해당 입력창에 포커스를 주고 입력을 고치면 개수가 줄어드는가?

- [X] T087 경고와 차단을 연결한다: 식별 정보 감지 시 필드 오류(차단, 오류 요약 포함), 지시문 형태·강점 중복 감지 시 노랑 경고(오류 요약 개수에 미포함, 제출 가능, `role=status`). 문구는 DM 1.3·design §12 표.
  - 요구사항: FR-009, FR-010, FR-041 · 원칙: VI, VII · design: §12 · 파일: `src/components/input/*`, `src/hooks/useFormValidation.ts`
  - 검증: E2E(P5-a 경고 후 제출 가능, P5-b 차단, P4-b 경고)
  - 완료: 식별 정보는 제출이 막히고 지시문·중복은 경고 후 제출되는가?

- [X] T088 상호 배타와 개수·길이 제한을 적용한다: "없음" 선택 시 반복 입력 비활성(제출에서 제외), 강점 정확히 3개, 반복 항목 최대 개수(경력·자격증·교육이수 20, 전공 6), 텍스트 최대 길이(100/400/50자). 최대에서 입력이 멈추고 "(최대)" 표시.
  - 요구사항: FR-003, FR-006~008, FR-037 · 원칙: VII · design: §11 · 파일: `src/components/input/*`
  - 검증: 단위·컴포넌트 테스트(경계값)
  - 완료: 최대 개수·길이에서 추가·입력이 막히고 안내가 보이는가?

- [X] T089 경계값 단위 테스트를 작성한다: 나이 14/15/99/100·소수·문자, 강점 2/3/4개·1자/2자/100자/101자, 전공 6/7개, 경력·자격증·교육이수 20/21개, 100/101자·400/401자·50/51자, 없음과 입력 동시, 인턴 있음 + 내용·기간 누락, 공백만 입력.
  - 요구사항: FR-004, FR-008, FR-037 · 원칙: VII · design: §11 · 파일: `tests/unit/input-schema.test.ts`
  - 검증: `npm run test`
  - 완료: 모든 경계값 케이스가 기대한 결과(통과·거부)를 내는가?

- [X] T090 E2E와 시각 회귀를 작성한다: 필수 항목 비우기 → 오류 요약 + 필드 오류 → 링크 포커스 → 수정 → 다시 제출, 강점 3개 아님, 나이 범위 밖, 다른 입력 유지. **디자인 확정(T076) 이후에 추가된 UI의 시각 확인**: 오류 요약, 필드 오류(빨강 2px + 아이콘 + 굵은 텍스트), 글자 수 안내 "n / 최대자"·"(최대)", 지시문·강점 중복 경고(노랑, 오류 개수 미포함), 식별 정보 차단 오류, 모바일 오류 섹션 자동 열림 상태를 세 뷰포트에서 캡처해 `tests/e2e/regression.spec.ts`에 추가하고, design §12 표(위치·문구·색 + 아이콘 + 텍스트)와 대조한 결과를 `design-review.md`의 "Phase 5 추가 UI" 절에 기록한다. 대조에서 CRITICAL·HIGH가 나오면 이 Task 안에서 수정한다.
  - 요구사항: FR-009, FR-010, FR-011, FR-041, SC-006 · 원칙: VII, XIII · design: §12, §22 · 파일: `tests/e2e/validation.spec.ts`, `tests/e2e/regression.spec.ts`, `specs/001-job-recommendation-keywords/design-review.md`
  - 검증: `npm run test:e2e`, 캡처와 design §12 표 대조(사람)
  - 완료: 검증 E2E와 입력 오류·경고 상태 회귀가 3개 뷰포트에서 통과하고 design §12 대조 기록에 미해결 CRITICAL·HIGH가 없는가?

- [X] T091 Phase 5 게이트: `npm run check`, `npm run test:e2e`(T090 시각 회귀 포함), `npm run audit:design` 통과. 스키마가 `shared/`에만 있고 `src/`·`server/`가 같은 모듈을 가져오는지 확인한다.
  - 요구사항: - · 원칙: VII, VIII, XV · design: - · 파일: (확인 작업)
  - 검증: 세 명령 + `shared/schema` 외 위치에 스키마 중복 정의 0건(검색)
  - 완료: 세 명령이 통과하고 스키마 정의가 한 곳뿐이며 T090의 design §12 대조 기록이 완료되었는가?

---

## Phase 6. AI 연동 서버 기반

**목표**: 서버리스 함수가 계약대로 입력을 검증하고, 안전한 프롬프트로 LLM을 호출하고, 검증된 결과만 반환한다.
**의존**: Phase 5 스키마 완료(T091).
**확인 필요**: LLM 공급자 SDK와 가격, Vercel Hobby 함수 최대 실행 시간(120초 가능 여부), 서버리스 함수의 ESM·공유 폴더 번들링.

- [X] T092 서버 설정 모듈을 만든다: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`를 읽고, 필수 값이 없으면 `INTERNAL`로 처리하되 원인은 응답에 노출하지 않는다. 프로덕션에서 `LLM_PROVIDER=mock`이면 시작을 거부한다. 키 값은 로그·응답에 쓰지 않는다.
  - 요구사항: FR-040 · 원칙: IX, XV · design: - · 파일: `server/config.ts`, `tests/contract/config.test.ts`
  - 검증: 단위 테스트(누락, 프로덕션 mock 거부)
  - 완료: 프로덕션에서 `mock` 공급자가 거부되고 키가 로그에 나오지 않는가?

- [X] T093 [P] 안전한 로거를 만든다: 요청 식별자, 처리 단계, 결과 코드, 소요 시간, 재요청 여부만 기록. 요청·응답 본문, 입력 값, 모델 응답 원문, 프롬프트, SDK 오류 객체 전체는 기록하지 않는다(상태 코드와 오류 이름만). **`Error.message`·스택·Zod 오류의 `received` 값도 기록하지 않는다**(JSON 파싱 오류 메시지에 본문 조각이, Zod 오류에 입력 값이 들어갈 수 있다). 오류는 `code`와 오류 클래스 이름만 로그로 남긴다.
  - 요구사항: FR-040 · 원칙: VI · design: - · 파일: `server/log.ts`, `tests/contract/log.test.ts`
  - 검증: 로그 캡처 테스트(입력 문자열이 출력에 없음)
  - 완료: 정상·잘못된 JSON·스키마 위반 요청에서 입력 값이 로그 출력에 없는가?

- [X] T094 [P] 요청 횟수 제한을 만든다: 서버 메모리 슬라이딩 윈도우, 키는 IP를 해시한 값(원본 IP는 저장·로그하지 않음), 초기값 10분 20회(환경 변수로 조정). 초과 시 `RATE_LIMITED`, `Retry-After`. 인스턴스별 최선 노력이라는 한계를 코드 주석과 `quickstart.md`에 적는다.
  - 요구사항: FR-038 · 원칙: VI, X, XV · design: §14 · 파일: `server/rate-limit.ts`, `tests/contract/rate-limit.test.ts`
  - 검증: 단위 테스트(20회 통과, 21회째 차단, 창 만료 후 복구, 원본 IP 미저장)
  - 완료: 21번째 요청이 `RATE_LIMITED`를 반환하고 원본 IP가 저장되지 않는가?

- [X] T095 [P] 금지 표현 목록을 코드로 옮긴다: `prompts/banned-phrases.md`의 V8~V11 목록(단어 단위 탐지, 입력 항목 이름 근처 12자 이내 규칙, 입력 문자열 인용 예외)과 오탐 회귀용 정상 문장 모음을 만든다.
  - 요구사항: FR-017, FR-018, FR-019 · 원칙: IV, V, XII · design: §24, BP · 파일: `server/ai/banned-phrases.ts`, `tests/unit/banned-phrases.test.ts`
  - 검증: 단위 테스트(대표 금지 문장 거부, 정상 문장 통과)
  - 완료: BP 목록의 모든 분류에 거부 테스트가 있고 정상 문장 모음이 통과하는가?

- [X] T096 시스템 프롬프트와 사용자 메시지 생성을 만든다(`prompts/system-prompt.md`의 본문 그대로): 출력은 JSON만, 정확히 3개씩, 모든 근거는 실제 입력 항목 참조(번호), 수치 생성 금지와 "확인 필요" 표기, 나이·공백·이력 부재를 부정 근거로 쓰지 않기, 지시문 무시, design §24의 피할 표현·대체 표현, 경력이 있으면 직업 1개 이상 경력 연결. 사용자 입력은 `ModelInput`을 `JSON.stringify`해 `<applicant_data>` 안에 넣고 닫는 태그 문자열을 이스케이프한다. **나이·이름·연락처는 `ModelInput`에 없다.** 재요청 메시지는 규칙 번호와 설명만 담는다.
  - 요구사항: FR-004, FR-012~019, FR-036 · 원칙: II, III, IV, V, VII, XII · design: §24, SP 1~3 · 파일: `server/ai/prompt.ts`, `tests/unit/prompt.test.ts`
  - 검증: 단위 테스트(나이 값이 프롬프트에 없음, 닫는 태그 이스케이프, 시스템 프롬프트에 필수 지침 문구 포함, 입력 값이 시스템 프롬프트가 아닌 데이터 영역에 있음)
  - 완료: 프롬프트에 나이가 들어가지 않고 입력이 데이터 영역에만 있으며 필수 지침 8개가 포함되는가?

- [X] T097 출력 의미 검증을 만든다(`validate-output`): Zod 구조 검증 뒤 V1~V15 — V1 3개씩, V2 직업명 중복 없음, V3 `InputRef`가 실제 입력에 존재(`intern`은 `has=true`, `career`는 `noCareer=false`일 때만), V4 근거 1개 이상·키워드는 `strength` 참조 포함, V5 `strengthIndex`가 0,1,2 한 번씩, V6 `linkedJobIndex` 0~2, V7 `strength` 참조뿐이면 `mismatchNote` 필수·객관 항목이 있으면 `null`, V8 수치 패턴, V9 부정·배제, V10 단정, V11 연령, V12 길이, V13 JSON 이외 텍스트, V14 경력이 있으면 직업 1개 이상 `career` 참조, V15 문장 수·120자. 실패 시 규칙 번호만 반환(응답 본문은 로그에 남기지 않음).
  - 요구사항: FR-013~015, FR-017, FR-018, FR-020, SC-003 · 원칙: II, III, IV, V, VIII · design: §13, DM 5 · 파일: `server/ai/validate-output.ts`, `tests/unit/validate-output.test.ts`
  - 검증: 규칙마다 위반 케이스 1개 + 통과 케이스 1개 단위 테스트, Mock 결과 전체(T040)가 통과
  - 완료: V1~V15 각각에 위반·통과 테스트가 있고 Mock 결과가 모두 통과하는가?

- [X] T098 LLM 클라이언트를 공급자 한 곳으로 격리한다(`server/ai/client.ts`): 기본 Anthropic(저비용 모델), 시도당 제한 55초, 호출 오류는 `UPSTREAM_FAILED`로 변환, 공급자의 속도 제한도 `UPSTREAM_FAILED`. 테스트·개발용 `mock` 공급자(정상, 형식 오류, 실패, 지연 모드)는 프로덕션 빌드에서 거부. 키는 서버 환경 변수에서만 읽는다.
  - 요구사항: FR-023 · 원칙: IX, X · design: - · 파일: `server/ai/client.ts`, `package.json`(SDK 추가, 필요성 기록)
  - 검증: 단위 테스트(mock 모드), 시도 제한 시간(가짜 타이머)
  - 완료: 모든 LLM 호출 코드가 `client.ts` 한 파일에만 있고 mock이 프로덕션에서 거부되는가?

- [X] T099 생성 흐름을 만든다(`server/ai/generate.ts`): `ModelInput` 구성(번호 부여) → 프롬프트 → 호출 → 파싱 → Zod + `validate-output` → 실패 시 같은 입력으로 **1회** 재요청(규칙 번호만 전달) → 그래도 실패하면 `OUTPUT_INVALID`, 합계 110초 초과 시 `TIMEOUT`, 성공 시 표시용 값(`label`, `value`, `strengthText`, `linkedJobTitle`)과 `notice` 두 줄(`shared/messages.ts`에서 가져옴)·`generatedAt`을 서버가 붙인다. 모델은 안내문을 만들지 않는다.
  - 요구사항: FR-012~016, FR-020, FR-023 · 원칙: I, II, VIII, X · design: §13, API 2 · 파일: `server/ai/generate.ts`, `server/ai/to-result.ts`, `tests/contract/generate-flow.test.ts`
  - 검증: 모의 LLM으로 (첫 응답 실패 → 두 번째 성공 → 호출 정확히 2회), (두 번 모두 실패 → `OUTPUT_INVALID`), (가짜 번호 지목 → 거부), (`notice` 항상 포함)
  - 완료: 재요청이 정확히 1회이고 `notice`가 모델 출력과 무관하게 항상 붙는가?

- [X] T100 요청 핸들러를 만든다(`server/handler.ts`): 본문 32KB 초과 → `VALIDATION_FAILED`, 요청 제한 확인(비싼 작업 전), `GenerateRequest` 엄격 검증(`age` 포함 시 거부), 입력 정규화, 식별 정보 감지 → `PII_DETECTED`, 생성 흐름, 오류 코드·HTTP 상태를 API 3절대로 반환, 응답에 원인(공급자명·스택) 미포함, `Cache-Control: no-store`, `POST` 외 메서드는 405. **핸들러 전체를 `try/catch`로 감싸** 본문 파싱 오류(잘못된 JSON 포함)를 포함한 모든 예외를 `INTERNAL`(파싱 오류는 `VALIDATION_FAILED`)로 바꾸고, 예외 객체를 던지거나 `console`로 출력하지 않는다(호스팅 런타임이 잡히지 않은 예외를 메시지째 로그에 남기기 때문).
  - 요구사항: FR-004, FR-009, FR-010, FR-020, FR-023, FR-038 · 원칙: VI, VII, VIII, X · design: §14, API 1~4 · 파일: `server/handler.ts`, `api/generate.ts`
  - 검증: 계약 테스트(T101)
  - 완료: 오류 코드 7개가 API 3절의 HTTP 상태로 반환되고 응답에 내부 원인이 없는가?

- [X] T101 계약 테스트를 작성한다(API 6절 11개 행): `age` 포함 → 400·LLM 호출 0회, 강점 2개/4개 → 400, 주민번호 형식 → `PII_DETECTED`, 모의 LLM 직업 2개 → 재요청 후 `OUTPUT_INVALID`, 첫 응답 실패·둘째 성공, 가짜 항목 번호, `%`·`연봉` 출력 거부, `notice` 항상 포함, 21번째 요청 → 429, 로그에 입력 값 없음, 응답·번들에 키 없음. 추가: **잘못된 JSON 본문(입력 문자열 조각 포함)과 스키마 위반 본문을 보낸 뒤 로그·응답에 그 문자열이 없음**.
  - 요구사항: FR-004, FR-009, FR-013, FR-016, FR-017, FR-020, FR-038, FR-040 · 원칙: II, IV, VI, VIII, IX · design: API 6 · 파일: `tests/contract/generate.test.ts`
  - 검증: `npm run test`
  - 완료: API 6절의 11개 테스트가 모두 통과하는가?

- [X] T102 로컬 개발 서버와 서버리스 함수를 연결해 확인한다: `npm run dev`에서 `/api/generate`가 `server/handler.ts`를 통해 `LLM_PROVIDER=mock`으로 응답하고, 서버 코드가 브라우저 번들에 들어가지 않는지 확인(ESLint 규칙 T004 + 빌드 산출물 검색).
  - 요구사항: FR-040 · 원칙: IX · design: - · 파일: `vite.config.ts`, `api/generate.ts`
  - 검증: `curl`로 mock 응답 확인, `dist`에서 `server/` 코드 문자열 검색 0건
  - 완료: 로컬에서 mock 공급자로 `/api/generate`가 계약 형태로 응답하는가?

- [X] T103 [P] 페르소나 평가 스크립트를 만든다(`tests/eval/run-personas.ts`, `npm run eval:personas`): 실제 LLM으로 P1~P5(P5-b·c는 입력 단계 차단 확인)를 각각 3회 생성하고, `validate-output` 결과와 결과 JSON을 `tests/eval/out/`(Git 제외)에 저장한다. 비용 때문에 CI에는 넣지 않는다. 결과 파일에는 가상 페르소나만 있다.
  - 요구사항: FR-018, SC-005, SC-013 · 원칙: II, IV, V, XII · design: §24, test-personas · 파일: `tests/eval/run-personas.ts`, `.gitignore`, `package.json`
  - 검증: 모의 공급자로 스크립트가 실행됨
  - 완료: 스크립트가 페르소나별 3회 결과와 자동 검증 결과를 파일로 저장하는가?

- [ ] T104 서버 라우트의 페르소나 5개 검증을 수행한다(**실제 LLM**): P1~P5 각 3회 이상 생성해 (a) 자동 검증 V1~V15 전부 통과, (b) 사람이 `test-personas.md`의 점검표(공통 A~E 포함)를 예/아니오로 기록한다. 결과를 `specs/001-job-recommendation-keywords/persona-review.md`에 남긴다.
  - 요구사항: FR-013~019, SC-002~005, SC-013 · 원칙: II, III, IV, V, XII · design: §24, test-personas · 파일: `specs/001-job-recommendation-keywords/persona-review.md`
  - 검증: 사람 검토(검토자 1명 이상) + `npm run eval:personas`
  - 완료: P1~P5 모두 자동 검증을 통과하고 검토자 점검표에 "아니오"가 0개이거나 예외가 기록되었는가? (**Phase 7 시작 조건**)

- [ ] T105 점검에서 문제가 나오면 프롬프트와 금지 표현을 고치고 T104를 반복한다. 고칠 때는 `prompts/banned-phrases.md`(기준) → `server/ai/banned-phrases.ts`, `prompts/system-prompt.md` → `server/ai/prompt.ts` 순으로 같은 변경을 반영한다.
  - 요구사항: FR-018, FR-019 · 원칙: V, XII · design: §24 · 파일: `prompts/*.md`, `server/ai/*.ts`
  - 검증: T104 재실행
  - 완료: 마지막 T104 실행에서 문제가 0건이고 문서와 코드의 금지 표현 목록이 같은가?

- [ ] T106 Phase 6 게이트: `npm run check`(계약 테스트 포함)와 T104 페르소나 검증 통과, Vercel 미리보기에 환경 변수를 설정해 실제 호출 1회를 확인한다(함수 `maxDuration` 120초 허용 여부 확인).
  - 요구사항: FR-023, FR-040 · 원칙: IX, X, XV · design: - · 파일: (확인 작업)
  - 검증: `npm run check`, 미리보기 호출 로그 확인(입력 본문이 없는지 포함)
  - 완료: `npm run check`와 페르소나 검증이 통과하고 미리보기에서 실제 호출이 성공했는가?

---

## Phase 7. 실제 AI 결과 연결

**목표**: 화면이 Mock이 아닌 실제 서버 라우트를 쓰도록 바꾸고, 오류·재시도·복사·인쇄를 실제 데이터로 완성한다.
**의존**: Phase 6의 서버 라우트가 페르소나 5개 검증을 통과(T104)한 뒤 시작.

- [X] T107 HTTP AI 서비스를 만든다(`src/services/ai/http.ts`): `/api/generate`에 요청 본문(**나이 제외**)을 보내고 응답을 출력 스키마·`ApiError` 스키마로 검증한다. 응답 형식이 맞지 않으면 클라이언트 "생성 실패"로 처리. `VITE_AI_MODE`로 `http`(기본)와 `mock`을 전환하며, mock은 테스트·개발용으로 **유지**한다. 프로덕션 빌드에서는 mock 시나리오 코드가 포함되지 않게 한다.
  - 요구사항: FR-004, FR-020, FR-023 · 원칙: VIII, IX, X · design: API 1, 3 · 파일: `src/services/ai/http.ts`, `src/services/ai/index.ts`, `vite.config.ts`
  - 검증: 단위 테스트(요청 본문에 `age` 없음, 응답 스키마 검증), `dist`에서 mock 시나리오 문자열 검색 0건
  - 완료: 요청 본문에 나이가 없고 프로덕션 빌드에 mock 코드가 없는가?

- [X] T108 오류 코드별 화면 상태를 연결한다(API 3절): `UPSTREAM_FAILED`·`INTERNAL`·네트워크·응답 형식 오류 → 생성 실패, `OUTPUT_INVALID` → 형식 오류, `TIMEOUT`·120초 중단 → 시간 초과, `RATE_LIMITED` → 요청 제한(숫자 미표시), `VALIDATION_FAILED`·`PII_DETECTED` → 입력 화면 필드 오류 + 오류 요약.
  - 요구사항: FR-009, FR-020, FR-023, FR-038 · 원칙: VII, X · design: §14, API 3 · 파일: `src/hooks/useGenerate.ts`, `src/pages/ResultPage.tsx`, `src/pages/InputPage.tsx`
  - 검증: E2E(`page.route`로 오류 코드별 응답을 주입해 화면 확인)
  - 완료: 오류 코드 7개와 클라이언트 오류 3개가 각각 올바른 화면으로 이어지는가?

- [X] T109 생성 실패 시 입력 유지와 다시 시도를 완성한다: 모든 실패·시간 초과·요청 제한 화면에서 `input`이 그대로이고, "다시 시도"가 입력을 다시 하지 않고 같은 입력으로 요청하며(타이머 0초부터), "입력 수정하기"가 `/input`에서 값을 유지한다.
  - 요구사항: FR-011, FR-023, SC-007 · 원칙: X · design: §5, §14 · 파일: `src/hooks/useGenerate.ts`, `src/state/session.tsx`
  - 검증: E2E(실패 주입 → 입력 유지 확인 → 다시 시도 성공)
  - 완료: 실패 후 입력값이 모두 남아 있고 다시 시도로 결과가 나오는가?

- [X] T110 입력 수정 후 다시 생성을 완성한다: 결과 화면 "입력 수정하기" → 수정 → "결과 생성하기" → 새 결과(재생성 알림), "다시 생성하기" → 새 결과, 재생성 실패 시 이전 결과를 표시하지 않고 오류 화면을 보인다. 새 결과가 이전과 달라질 수 있다.
  - 요구사항: FR-024 · 원칙: X · design: §5, §13.6 · 파일: `src/hooks/useGenerate.ts`, `src/pages/ResultPage.tsx`
  - 검증: E2E(입력 하나 수정 후 재생성, 재생성 실패 주입)
  - 완료: 수정한 입력이 요청에 반영되고 재생성 실패 시 이전 결과가 보이지 않는가?

- [X] T111 결과 복사를 실제 결과로 완성한다: 클립보드에 CP 1절 형식으로 복사, 성공·실패 알림이 `aria-live=polite`에 텍스트로 나타나 화면 낭독기에 알려지고, 버튼 글자가 2.5초간 "✓ 복사했어요". 클립보드 권한 거부 시 실패 알림.
  - 요구사항: FR-021, FR-027 · 원칙: XIII · design: §14, §22, CP 1 · 파일: `src/components/result/ActionBar.tsx`, `src/components/result/CopyNotice.tsx`
  - 검증: E2E(클립보드 읽기로 내용 확인, live region 텍스트 확인, 권한 거부 시뮬레이션)
  - 완료: 복사한 텍스트에 안내문 두 줄이 있고 알림이 `aria-live` 영역에 나타나는가?

- [ ] T112 인쇄를 실제 결과로 완성한다: 인쇄 미디어에서 최대 길이 실제 결과(문장 120자 한도를 채운 결과)가 A4 한 장인지 확인한다. 한 장을 넘으면 문장 길이 한도를 줄이도록 spec FR-022·DM 2.1·`validate-output` V15·프롬프트를 함께 조정하고 사용자에게 보고한다.
  - 요구사항: FR-022 · 원칙: XIV · design: §15, CP 2 · 파일: `src/styles/print.css`, `server/ai/validate-output.ts`(조정 시), `spec.md`·`data-model.md`(조정 시)
  - 검증: `page.pdf({ format: 'A4' })` 페이지 수
  - 완료: 최대 길이 결과의 A4 PDF가 1쪽인가?

- [X] T113 [P] 서버 mock 공급자를 쓰는 통합 E2E를 만든다(`LLM_PROVIDER=mock`, 개발 서버): 정상, 형식 오류 후 재요청 성공, 실패, 요청 제한(`RATE_LIMIT_MAX=2`), 지연(31초 이상은 가짜 타이머 또는 짧은 임계값 환경 변수)을 실제 `/api/generate` 경로로 재현한다.
  - 요구사항: FR-020, FR-023, FR-038 · 원칙: VIII, X · design: §14 · 파일: `tests/e2e/integration.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 서버 mock 공급자로 5개 시나리오가 실제 라우트 경로에서 재현되는가?

- [ ] T114 페르소나 5개로 **실제 AI 출력을 화면에서** 검증한다: P1~P5를 실제 화면에서 입력해 결과 화면까지 확인하고(직업 3·키워드 3, 연결 입력 Tag, 확인 필요 표시, 불일치 안내, 안내문 위·아래, 수치 없음), 결과를 `persona-review.md`의 "화면 검증" 절에 기록한다.
  - 요구사항: FR-012~019, SC-002~005, SC-013 · 원칙: II, III, IV, V, XII · design: §13, §24, §27 · 파일: `specs/001-job-recommendation-keywords/persona-review.md`
  - 검증: 사람이 화면 확인(검토자 1명 이상)
  - 완료: 페르소나 5개 모두 화면에서 직업 3·키워드 3과 안내문이 확인되고 "아니오" 항목이 없거나 예외가 기록되었는가?

- [ ] T115 Phase 7 게이트: `npm run check`, `npm run test:e2e`, `npm run audit:design` 통과, Vercel 미리보기에서 실제 AI로 전체 흐름(메인 → 입력 → 결과 → 복사·인쇄) 1회 확인.
  - 요구사항: - · 원칙: XV · design: - · 파일: (확인 작업)
  - 검증: 세 명령 + 미리보기 확인
  - 완료: 세 명령이 통과하고 미리보기에서 실제 AI 전체 흐름이 끝까지 되는가?

---

## Phase 8. 테스트와 최종 검증

**목표**: 요구사항·원칙·디자인 검토 기준을 예/아니오로 최종 점검하고 배포 가능 상태를 확인한다.
**의존**: Phase 7 게이트(T115) 완료.

- [X] T116 [P] 금지 표현 자동 검사 테스트를 정리한다: 수치·퍼센트(V8), 나이·연령(V11), 나이·공백·이력 부재 관련 부정 근거(V9), 단정(V10)을 BP의 코퍼스(거부해야 할 문장 모음 + 통과해야 할 정상 문장 모음)로 검사하고, 페르소나 Mock·실제 결과 저장본에도 적용한다.
  - 요구사항: FR-017, FR-018, SC-004, SC-005 · 원칙: IV, V · design: §24 · 파일: `tests/unit/banned-corpus.test.ts`
  - 검증: `npm run test`
  - 완료: 거부 코퍼스 전부가 거부되고 정상 코퍼스·저장된 결과 전부가 통과하는가?

- [X] T117 [P] 키보드 전용 E2E를 작성한다(마우스 없이): 메인 → "본문 바로가기" → "상담 시작하기" → 입력(모든 필드, 반복 추가·삭제, "없음" 선택, 아코디언) → 결과 생성 → 복사 → 인쇄 버튼 → 입력 수정하기 → 다시 생성. 모든 단계에서 포커스 표시를 확인한다.
  - 요구사항: FR-027 · 원칙: XIII · design: §22, §26 · 파일: `tests/e2e/keyboard.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 마우스 없이 전체 흐름이 완료되고 각 포커스 요소에 윤곽선이 있는가?

- [X] T118 [P] 뷰포트 E2E를 완성한다(1440/1024/390px, 최소 360px): design §21 "크기별 완료 기준"(가로 스크롤 없음, 버튼 화면 안, 열 수)을 화면별로 검사한다. 추가: (1) **터치 영역** — 모든 `button`, `a`, `input`, `select`, `textarea`, 라디오·체크 박스, 접이식 제목의 `boundingBox` 높이가 44px 이상이고 인접 대상 사이 간격이 8px 이상(간격은 T069 승인 전제)인지 세 뷰포트에서 검사, (2) **사용 맥락**(design §6) — 1024px에서 결과 카드 본문이 17.5px이고 카드가 1열인지 검사.
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §6, §21, §22, §26 31번 · 파일: `tests/e2e/viewports.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 네 너비에서 가로 스크롤이 없고 열 구성이 design §21과 같으며, 모든 상호작용 요소가 44px 이상인가?

- [X] T119 [P] 움직임 감소 E2E를 작성한다(`reducedMotion: 'reduce'`): design §23 효과별 표의 9개 효과가 모두 정지·즉시 표시인지(`document.getAnimations()` 0개, smooth scroll 없음), Gradient·Grid Glow가 정적인지 검사한다.
  - 요구사항: FR-027 · 원칙: XIII · design: §10, §23 · 파일: `tests/e2e/reduced-motion.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 움직임 감소 설정에서 진행 중인 애니메이션이 0개인가?

- [ ] T120 [P] 인쇄 미디어 E2E를 완성한다: 숨김·표시 요소, 안내문 두 줄 위·아래, 입력 정보 없음, `[확인 필요]` 텍스트 + 이중선, 불일치 "함께 이야기 나눠 볼 점" 라벨, 배경색 없음, `page.pdf` 1쪽. 흑백 구분은 **수동 확인**으로 기록한다.
  - 요구사항: FR-016, FR-022, SC-009 · 원칙: I, XIV · design: §15, CP 2 · 파일: `tests/e2e/print.spec.ts`
  - 검증: `npm run test:e2e`, 흑백 인쇄 수동 확인 기록
  - 완료: 인쇄 E2E가 통과하고 흑백 구분 수동 확인이 기록되었는가?

- [X] T121 [P] 빌드 결과물 API 키 검사를 만든다(`scripts/check-bundle-secrets.mjs`, `npm run check:secrets`): `dist/` 전체에서 (1) 환경 변수 `LLM_API_KEY`의 실제 값, (2) 공급자 키 접두사 패턴, (3) `LLM_API_KEY` 이름 문자열, (4) `server/` 코드 식별 문자열을 검색해 0건인지 확인한다. 네트워크 응답에도 키가 없음을 E2E로 확인.
  - 요구사항: FR-040 · 원칙: IX · design: - · 파일: `scripts/check-bundle-secrets.mjs`, `package.json`, `tests/e2e/secrets.spec.ts`
  - 검증: 의도적으로 키 문자열을 번들에 넣은 임시 빌드에서 검출되는지 확인
  - 완료: `npm run check:secrets`가 키·서버 코드 0건을 보고하는가?

- [X] T122 [P] 입력 비저장 검사를 만든다: (브라우저) 전체 흐름 후 `localStorage`, `sessionStorage`, 쿠키, IndexedDB, Cache Storage가 비어 있고 URL에 입력이 없는지 Playwright로 확인 / (서버) 로그 캡처 테스트(정상·잘못된 JSON·스키마 위반 요청 모두)와 Vercel 로그 수동 확인 기록(입력 본문·모델 응답·프롬프트가 없음) / (브라우저 콘솔) Playwright가 전체 흐름 동안 `console` 메시지를 수집해 입력 문자열이 없음을 확인.
  - 요구사항: FR-025, FR-040 · 원칙: VI · design: - · 파일: `tests/e2e/storage.spec.ts`, `tests/contract/log.test.ts`
  - 검증: `npm run test:e2e`, `npm run test`
  - 완료: 전체 흐름 후 브라우저 저장소가 모두 비어 있고, 서버 로그와 브라우저 콘솔 메시지에 입력 값이 없는가?

- [X] T123 [P] 접근성 자동 점검을 모든 화면·상태에 실행한다(`@axe-core/playwright`): 메인, 입력(오류 상태 포함), 결과, 상태 화면 7종에서 위반 0건. 추가: **색상 외 표시** — 상태 배지·Alert·필드 오류·"확인 필요"·필수/선택·섹션 상태 요소마다 (a) 텍스트가 비어 있지 않고 (b) 아이콘 요소가 있는지 검사하고, 화면 전체에 `filter: grayscale(1)`을 적용한 스크린샷을 저장해 상태 구분이 가능한지 사람이 확인한다(design §18, §26 18번).
  - 요구사항: FR-027 · 원칙: XIII · design: §22 · 파일: `tests/e2e/a11y.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 모든 화면·상태에서 axe 위반이 0건이고 상태 요소마다 텍스트와 아이콘이 있는가?

- [ ] T124 design.md §26 시각 검증 항목(36개)을 최종 점검하고 예/아니오를 `final-review.md`에 기록한다. 자동화한 항목은 해당 테스트 이름을, 수동 항목(겹침, 대비, 흑백, A4)은 확인자와 날짜를 적는다. **화면 낭독기 실청취 확인**(NVDA 또는 VoiceOver)도 포함한다: 오류 요약, 분석 중 단계·지연 안내, 생성 실패·시간 초과·요청 제한 카드, 복사 완료·실패, 재생성 알림이 읽히는지 항목별로 예/아니오를 적는다(`aria-live` 존재만으로 갈음하지 않는다).
  - 요구사항: FR-027, FR-028 · 원칙: XIII, XIV · design: §26 · 파일: `specs/001-job-recommendation-keywords/final-review.md`
  - 검증: 사람 확인 + 테스트 대응표
  - 완료: 36개 항목 모두 예/아니오와 근거가 기록되어 있고 "아니오"에 후속 조치가 있는가?

- [ ] T125 Constitution 원칙 I~XV의 검토 기준을 최종 점검한다. 각 원칙의 검토 기준(예/아니오)을 하나씩 확인하고 근거(테스트 이름·파일·화면)를 `final-review.md`에 기록한다. "아니오"가 있으면 수정하거나 예외를 기록하지 않고는 배포하지 않는다(Constitution 품질 게이트). **1단계에서 "예"가 될 수 없는 항목은 `specs/001-job-recommendation-keywords/exceptions.md`에 예외로 기록한다**: 원칙 VI의 "다른 상담사 계정과 로그인하지 않은 사용자는 저장 데이터에 접근할 수 없는가"(저장 데이터 자체가 없어 해당 없음), "1년 후 자동 삭제와 상담사 직접 삭제가 동작하는가"(저장 없음, 2단계), 원칙 XI의 "명세 요구가 모두 구현"(FR-030~035 2단계)이다. 각 예외에는 항목, 사유, 1단계에서의 대체 통제(비저장, 주소 비공개, 공급자 사용 한도), 2단계 해소 계획, 승인자·날짜를 적는다.
  - 요구사항: FR-001~041 · 원칙: I~XV · design: - · 파일: `specs/001-job-recommendation-keywords/final-review.md`, `specs/001-job-recommendation-keywords/exceptions.md`
  - 검증: 사람 확인
  - 완료: 15개 원칙의 모든 검토 기준이 예이거나 `exceptions.md`에 승인된 예외로 기록되었는가?

- [ ] T126 요구사항 품질 체크리스트(`checklists/requirements-quality.md`)와 `checklists/requirements.md`를 검토자가 최종 검토한다. 항목 체크는 검토자만 하며, 미해결 항목은 spec 수정 또는 예외로 처리한다.
  - 요구사항: FR-001~041 · 원칙: XI, XV · design: - · 파일: `specs/001-job-recommendation-keywords/checklists/*.md`
  - 검증: 사람 확인
  - 완료: 두 체크리스트의 모든 항목이 검토자에 의해 체크되었거나 미해결 사유가 기록되었는가?

- [ ] T127 프로덕션 배포를 확인한다: Vercel 프로덕션에서 환경 변수(`mock` 아님), 함수 `maxDuration`, 응답 헤더(`no-store`), 요청 제한, LLM 공급자 콘솔의 월 사용 한도 설정, 배포 주소 비공개(로그인이 없으므로 FR-030은 2단계. 주소를 외부에 공유하지 않고 검색 엔진 노출·링크 공유가 없는지 확인)와 공급자 사용 한도 하드 설정을 **공개 노출 방지 조건**으로 확인하고 `quickstart.md`의 5.2절 17개 항목을 실제 배포 주소에서 수행한다.
  - 요구사항: FR-023, FR-038, FR-040 · 원칙: IX, X, XV · design: - · 파일: `specs/001-job-recommendation-keywords/final-review.md`, `quickstart.md`
  - 검증: 배포 주소에서 사람이 수행
  - 완료: quickstart 5.2의 17개 항목이 배포 주소에서 모두 예이고, 공급자 사용 한도가 설정되었으며, 주소가 비공개로 관리되는 것이 `final-review.md`에 기록되었는가?

- [X] T128 [P] 금지 디자인 패턴 검사 E2E를 만든다(design §25): 결과·입력·메인 화면에 `%`·`progressbar`·`meter` 역할·게이지·진행 막대가 없음(입력 하단 바는 텍스트 진행만), 텍스트에 이모지가 없음, 카드·버튼의 `box-shadow`가 없음(하단 고정 바·인쇄 시트 예외), 카드 `border-radius` ≤ 6px, Header에 로그인·회원 영역 없음, 사람 인물 이미지 없음(`img`가 없거나 장식).
  - 요구사항: FR-017, FR-027 · 원칙: IV, V, XI · design: §25, §26 19·33번 · 파일: `tests/e2e/forbidden-patterns.spec.ts`
  - 검증: `npm run test:e2e`
  - 완료: 금지 패턴 7종이 모든 화면에서 0건인가?

- [ ] T129 SC-001 소요 시간을 확인한다: 처음 사용하는 상담사 1명 이상이 **표준 입력**(경력 2개, 자격증 1개, 강점 3개 수준)을 입력하고 결과를 확인하기까지 걸린 시간을 결과 생성 대기 포함으로 측정해 `final-review.md`에 기록한다.
  - 요구사항: SC-001 · 원칙: XV · design: §26 28번 · 파일: `specs/001-job-recommendation-keywords/final-review.md`
  - 검증: 사람이 스톱워치로 측정(실제 AI, 배포 미리보기). 측정 대상 상담사 확보는 **사용자 확인 필요**
  - 완료: 표준 입력으로 측정한 시간이 기록되어 있고 3분 이내인가?

- [ ] T130 SC-008 시범 사용을 확인한다: 시범 상담사에게 안내 없이 결과 확인까지 진행하게 하고, 도달한 사람 수와 막힌 지점을 `final-review.md`에 기록한다(목표 80% 이상). 막힌 지점이 있으면 후속 Task를 만든다.
  - 요구사항: SC-008 · 원칙: XV, XIV · design: §26 28번 · 파일: `specs/001-job-recommendation-keywords/final-review.md`
  - 검증: 사람 관찰(시범 상담사 수와 일정은 **사용자 확인 필요**)
  - 완료: 시범 사용 결과(인원, 도달 비율, 막힌 지점)가 기록되어 있고 도달 비율이 80% 이상이거나 후속 조치가 있는가?

- [ ] T131 Phase 8 게이트와 릴리스 준비: `npm run check`, `npm run test:e2e`, `npm run check:secrets`, `npm run audit:design`이 모두 통과하고, `final-review.md`에 미해결 CRITICAL·HIGH가 없는지 확인한다. `quickstart.md`가 실제 절차와 일치하는지 마지막으로 확인한다.
  - 요구사항: - · 원칙: XV · design: - · 파일: `final-review.md`, `quickstart.md`
  - 검증: 네 명령 통과
  - 완료: 네 명령이 모두 통과하고 `final-review.md`에 미해결 CRITICAL·HIGH가 0개인가?

---

## Phase별 Task 개수와 의존 관계 요약

| Phase | 이름 | Task 범위 | 개수 | [P] 개수 | 시작 조건 | 완료(게이트) 조건 |
|-------|------|-----------|------|----------|-----------|-------------------|
| 1 | 프로젝트 설정 | T001~T011 | 11 | 6 | 없음 | T011: `npm run check` + Vercel 미리보기 정적 페이지·서버리스 응답 |
| 2 | 디자인 시스템 기반 | T012~T034 | 23 | 17 | Phase 1 완료 | T034: `npm run check` + 컴포넌트 갤러리 확인 |
| 3 | 세 핵심 화면과 Mock Data | T035~T066 | 32 | 12 | Phase 2 완료 | T066: `npm run check` + `test:e2e` + Mock 전체 흐름·`/design-sync` 사전 검증(T065) |
| 4 | Claude Design 동기화와 UI 수정 | T067~T076 | 10 | 0 | **Phase 3 게이트 + Mock 전체 흐름 검증 완료** | T076: 세 명령 + **사용자 디자인 확정 승인** |
| 5 | 입력 검증과 데이터 계약 | T077~T091 | 15 | 5 | **Phase 4 게이트(디자인 확정)** | T091: 세 명령 + 스키마 단일 정의 |
| 6 | AI 연동 서버 기반 | T092~T106 | 15 | 4 | **Phase 5 스키마 완료(T091)** | T106: `npm run check` + 페르소나 5개 검증 통과(T104) + 미리보기 실제 호출 |
| 7 | 실제 AI 결과 연결 | T107~T115 | 9 | 1 | **Phase 6 서버 라우트의 페르소나 5개 검증 통과(T104)** | T115: 세 명령 + 미리보기 실제 AI 전체 흐름 |
| 8 | 테스트와 최종 검증 | T116~T131 | 16 | 9 | Phase 7 게이트 | T131: 네 명령 + 최종 점검 기록 |
| **합계** | | T001~T131 | **131** | **54** | | |

```text
Phase 1 → Phase 2 → Phase 3 → [Mock 전체 흐름 + /design-sync 검증(T065, T066)] → Phase 4 → [디자인 확정(T076)] → Phase 5
Phase 5(T091) → Phase 6 → [페르소나 5개 검증(T104)] → Phase 7 → Phase 8
```

- **Phase 내부 순서**: 3-A(T035~T041) → 3-B(T042~T044, 서로 [P]) 와 3-C(T045~T052) → 3-D(T053~T060) → 3-E(T061~T066). Phase 5는 T077(입력 스키마) 후 [P] 스키마들, T083~T084(타입 교체·Mock 검증) 후 T085~T090(화면 연결). Phase 6은 T092~T095 [P] 후 T096~T101(핵심 서버), T102~T106(검증).
- **병렬 진행 가능 구간**: Phase 2의 컴포넌트(T019~T032), Phase 3의 메인 하위 컴포넌트(T043·T044)와 입력 섹션(T047~T050), Phase 5의 스키마(T078~T082), Phase 6의 서버 부품(T093~T095), Phase 8의 테스트 대부분(T116~T123).
- **MVP 범위(US1)**: Phase 1~3 + Phase 5의 입력 스키마 + Phase 6~7을 마치면 US1(추천 직업·키워드 확인), US2(입력 오류 안내), US3(복사·인쇄), US4(실패 시 재시도), US5(수정 후 재생성)가 모두 충족된다. 이 목록에는 US6~US8이 없다.

## 사용자 스토리별 Task (spec US → 구현·검증)

| US | 구현 Task | 검증 Task | 독립 검증(spec Independent Test) |
|----|-----------|-----------|-----------------------------------|
| US1 추천 직업·키워드 확인 | T040~T058, T096~T099, T107 | T064, T097, T101, T104, T114 | 필수 항목만 채운 유효 입력으로 직업 3·키워드 3·안내문 확인 (T064, T114) |
| US2 입력 오류 안내 | T077~T079, T082, T085~T088 | T089, T090 | 필수 항목 비우거나 비정상 값 → 항목별 안내, 결과 미생성 (T090) |
| US3 복사·인쇄 | T059, T060, T063, T111, T112 | T111, T120 | 복사·인쇄 후 내용과 안내문 포함 (T111, T120) |
| US4 실패 시 재시도 | T053, T108, T109 | T064, T113 | 실패 주입 후 입력 유지·재시도 성공 (T109, T113) |
| US5 수정 후 재생성 | T060, T110 | T110, T113 | 입력 하나 수정 후 재생성 시 새 결과로 교체 (T110) |
| US6~US8 | 2단계 — 이 목록에 없음 | - | - |

## 요구사항 추적 (spec ID → 주요 Task)

| 요구사항 | 주요 Task |
|----------|-----------|
| FR-001~008 입력 | T046~T050, T077 |
| FR-009 식별 정보 차단, FR-010 검증, FR-037 한도 | T077, T082, T085~T089, T100 |
| FR-011 입력 유지 | T036, T052, T109 |
| FR-012~015 출력, FR-036 직업명 | T040, T055~T057, T080, T097, T099 |
| FR-016 안내문 | T038, T054, T057, T059, T063, T099 |
| FR-017 수치·"확인 필요", FR-018 차별 방지, FR-019 쉬운 말 | T095~T097, T105, T116 |
| FR-020 구조 오류, FR-023 지연·실패, FR-038 요청 제한 | T031, T041, T053, T058, T094, T099~T101, T108 |
| FR-021 복사, FR-022 인쇄 | T032, T059, T060, T063, T111, T112, T120 |
| FR-024 재생성 | T060, T110 |
| FR-025 비저장, FR-040 로그, FR-039 AI 전송 안내, FR-041 강점 중복 | T036, T038, T042, T045, T082, T087, T093, T121, T122 |
| FR-027 접근성, FR-028 반응형 | T015, T016, T061, T062, T117~T119, T123 |
| FR-029 식별 정보 비전송 | T079 |
| FR-030~035 (2단계) | 이 목록에 없음. 저장 버튼은 비활성(T057) |
| SC-001 3분 이내 | T129 |
| SC-002·003 개수·근거 참조 | T080, T097, T101, T104 |
| SC-004·005 수치·부정 근거 | T095, T097, T116, T104 |
| SC-006·007 오류 수정·재시도 | T090, T109 |
| SC-008 시범 사용 | T130 |
| SC-009 안내문 100% | T059, T063, T099, T120 |
| SC-013 표현 검토 | T104, T114 |
| SC-010~012 (2단계) | 이 목록에 없음 |

## 확인 필요 모음

1. **기술 스택 변경**: Next.js → Vite. T001에서 문서를 갱신한다. 이 변경에 동의하는지 확인이 필요하다.
2. `/design-sync`의 동작과 대상(Claude Design 프로젝트를 덮어쓰는지): T070에서 실행 전 확인.
3. 승인된 시안이 v3인지(T069), v3에 없는 항목을 시안에 반영할지.
4. LLM 공급자·모델·가격, Vercel Hobby 함수 최대 실행 시간(120초), 서버리스 함수의 ESM·공유 폴더 번들링 방식.
5. A4 한 장 여부(T063, T112): 넘으면 문장 길이 한도를 줄이는 spec 조정이 필요하다.
6. 서비스 정식 이름(가칭 "초기상담 도우미"): 상수 한 곳(T038)만 바꾸면 된다.
7. 2단계(로그인·이력·구직자 기록)는 별도 계획이 필요하다.

## Phase 9: Convergence

- [X] T132 Playwright E2E를 콜드 스타트에도 안정적으로 만든다: 개발 서버를 처음 띄운 직후 첫 프로젝트(desktop-1440)에서 `flow.spec.ts` 8개(H1 포커스, `.job-card` 3개, 입력 수정, 요약 접힘, fail-once, limit, format, 뒤로 가기, 복사)가 실패하고 같은 테스트를 다시 실행하면 통과한다. `playwright.config.ts`의 `webServer`에 워밍업(첫 요청으로 mock 모듈과 `?mock=` 경로 선컴파일) 또는 대기 조건을 추가하고, `npm run test:e2e`를 새 서버에서 연속 2회 모두 통과시킨다 per Constitution XV, SC 완료 기준 "모든 테스트 성공" (partial)
