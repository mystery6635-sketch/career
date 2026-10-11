# Implementation Plan: 추천 직업 및 자기소개서 키워드 생성

**Branch**: `001-job-recommendation-keywords` | **Date**: 2026-10-11 | **Spec**: [spec.md](./spec.md)

**Input**: `spec.md`(clarify 반영), `.specify/memory/constitution.md`(v2.0.0), `design-brief.md`, `design.md`(시안 A v3 기준)

## Summary

직업상담사가 구직자 정보를 입력하면 AI가 추천 직업 3개와 자기소개서 키워드 3개를 만들어 보여주는 웹 앱을 React + Vite + TypeScript와 Vercel 서버리스 함수로 구현한다. 화면은 메인, 구직자 정보 입력, 결과 세 개이며 결과 화면이 분석 중·빈 화면·생성 실패·시간 초과·요청 제한·복사 완료 상태를 보여준다. 입력은 Zod로 클라이언트와 서버에서 같은 스키마로 검증하고, 서버 라우트에서만 LLM을 호출한다. 응답은 스키마 검증과 의미 검증(근거 존재, 수치·부정 표현 금지)을 통과한 것만 표시하고, 실패 시 1회 재요청한다. 입력과 결과는 브라우저 메모리에만 있고 서버에 저장하지 않는다.

**범위 결정(중요)**: 요청한 스택이 "DB 없음"이므로 이번 계획은 **US1~US5와 FR-001~029, FR-036~041**(저장 관련 FR-030~035 제외)을 구현한다. 요구사항 품질 점검(`checklists/requirements-quality.md`)을 반영해 spec에 FR-039(외부 AI 전송 안내), FR-040(로그 정책), FR-041(강점 중복 경고)이 추가되었고, 시간 초과·형식 오류·요청 제한 기준이 확정되었다. 로그인·상담 이력·구직자 기록(US6~US8, FR-030~035)은 spec에 남아 있고 **Phase 2**로 미룬다. 이 결정과 위험은 research.md 0절에 있으며 사용자 확인이 필요하다.

## Technical Context

**Language/Version**: TypeScript(strict), Node.js LTS(20 이상, 구현 시 최신 LTS 확인), Vite(최신 안정 버전), React, `react-router-dom`

**Primary Dependencies**: React, Tailwind CSS(v4, `@theme` 토큰), Zod, LLM 공급자 SDK 1개(기본 Anthropic, `server/ai/client.ts`에 격리), `@fontsource`(IBM Plex Sans KR, IBM Plex Mono)

**Storage**: 없음. 입력과 결과는 브라우저 메모리(React Context), 서버는 요청 처리 중 메모리와 요청 제한용 메모리 카운터(IP 해시 키)만 사용

**Testing**: Vitest(단위·계약, 모의 LLM), Playwright(E2E, 1440×900·1024×768·390×844, 인쇄 미디어, `page.pdf`), `@axe-core/playwright`(접근성 자동 점검), 사람이 하는 페르소나 점검(`test-personas.md`)

**Target Platform**: 데스크톱·태블릿·모바일의 최신 Chromium·Safari·Firefox 브라우저(구체 지원 범위 확인 필요), Vercel 무료 플랜 배포

**Project Type**: web-application(Vite 단일 프로젝트, 화면과 서버리스 함수 동일 저장소)

**Performance Goals**: 필수 항목 입력 후 결과 확인 3분 이내(SC-001, LLM 응답 대기 포함). 서버 시도당 55초, 합계 110초, 클라이언트 120초 중단. 30초에 지연 안내(FR-023)

**Constraints**: API 키 서버 전용, 구직자 입력 본문 로그 금지, 나이를 모델과 서버로 보내지 않음, 무료·저비용 구성, Vercel 무료 플랜의 함수 실행 시간(확인 필요), 서버리스에서 메모리 요청 제한은 인스턴스별(최선 노력)

**Scale/Scope**: 소수 상담사 시범 사용 규모. 화면 3개 + 상태 화면 6종, 공통 컴포넌트 8종, API 엔드포인트 1개

## Constitution Check

*GATE: Phase 0 전 통과 필요. Phase 1 설계 후 재확인.*

| 원칙 | 사전 점검 (Phase 0 전) | 설계 후 재확인 (Phase 1 후) |
|------|------------------------|------------------------------|
| I 상담사 보조 | 통과: 안내문을 서버가 고정 문구로 붙임 | 통과: `notice` 서버 부착, 복사·인쇄 형식에 두 줄 포함(contracts/copy-and-print) |
| II 근거 필수 | 통과 예정 | 통과: V3·V4가 근거 없는 항목을 거부 |
| III 강점 존중 | 통과 예정 | 통과: V5(강점 3개 전부 다룸), V7(불일치 안내) |
| IV 수치 금지 | 통과 예정 | 통과: V8, 프롬프트, 안내문 두 줄 |
| V 차별 방지 | 통과 예정 | 통과: 나이를 모델에 보내지 않음, V9·V11, 페르소나 P1~P3 |
| VI 개인정보 | **주의**: spec의 저장·로그인 요구와 "DB 없음" 요구가 충돌 | 통과(Phase 1 범위): 아무것도 저장하지 않으므로 FR-025를 충족. 저장·접근통제·1년 삭제는 Phase 2로 미룸(정당화는 Complexity Tracking) |
| VII 입력 검증 | 통과 예정 | 통과: Zod 이중 검증, 식별 정보 차단, 지시문 경고 + 데이터 격리 |
| VIII 고정 출력 구조 | 통과 예정 | 통과: Zod + V1~V13, 재요청 1회, 부분 결과 금지 |
| IX API 키 서버 전용 | 통과 예정 | 통과: 서버리스 함수(`api/generate.ts`)에서만 호출, `VITE_` 금지, 번들 점검 테스트 |
| X 장애 시 안내·입력 유지 | 통과 예정 | 통과: 오류 코드별 화면 상태(contracts/generate-api 3절), 입력은 Context 유지 |
| XI 명세 범위 준수 | **주의**: US6~US8를 이번에 구현하지 않음 | 통과: spec을 바꾸지 않고 단계를 나눔. 시안의 인쇄 미리보기 화면·시안 도구 띠는 spec에 없어 구현하지 않음 |
| XII 쉬운 언어 | 통과 예정 | 통과: 프롬프트 톤 규칙, 금지 표현 검사, 사람 점검 |
| XIII 접근성 | 통과 예정 | 통과: design 22·23절을 컴포넌트 규칙으로 옮기고 axe + 수동 점검 |
| XIV 반응형 | 통과 예정 | 통과: 세 뷰포트와 인쇄 미디어 E2E |
| XV 단순한 MVP·추적 | 통과 예정 | 통과: 신규 외부 서비스 없음(DB·Redis 없음). 의존성 표에 필요성 기록. 이 계획 이후 tasks에 요구사항 번호 연결 |

**게이트 결과**: 위반 없음(정당화가 필요한 항목 2개는 Complexity Tracking에 기록). 원칙 충돌 해소 기록(Constitution "원칙 충돌 시 우선순위"):
- 충돌: 기능 편의성(저장·로그인 바로 구현)과 개인정보 보호(원칙 VI) → 우선순위 1이 우선하므로 저장 없이 시작한다.
- 충돌: 기능 편의성(새로고침에도 입력 유지)과 개인정보 보호 → 브라우저 저장소를 쓰지 않는다(research 7절).

### 의존성 표 (원칙 XV: 필요성 기록)

| 의존성 | 필요성 | 비용 |
|--------|--------|------|
| Vite, React, TypeScript | 지정 스택 | 무료 |
| react-router-dom | `/`, `/input`, `/result` 3개 경로 이동과 뒤로 가기·포커스 처리(직접 구현 시 중복) | 무료 |
| @fontsource/* | IBM Plex Sans KR·Plex Mono 자체 호스팅(라이선스 확인 필요) | 무료 |
| Tailwind CSS | 지정 스택, 토큰 반영 | 무료 |
| Zod | 지정 스택, 이중 검증 | 무료 |
| LLM 공급자 SDK | 서버에서 LLM 호출. 직접 HTTP 호출로 대체 가능하나 오류 처리 단순화 | SDK 무료, **API 사용료 발생(확인 필요)** |
| Vitest, @testing-library/react, jsdom | 지정 스택(Vitest), 컴포넌트 단위 테스트 | 무료 |
| Playwright | 지정 스택, 뷰포트·인쇄 E2E | 무료 |
| @axe-core/playwright | 접근성 자동 점검(원칙 XIII), 직접 구현 불가 | 무료 |

## Project Structure

### Documentation (this feature)

```text
specs/001-job-recommendation-keywords/
├── plan.md                  # 이 파일
├── research.md              # 기술 선택 이유와 대안
├── data-model.md            # 입력·출력 스키마, 상태, 검증 규칙
├── quickstart.md            # 로컬 실행, 환경 변수, Vercel 배포, 동작 확인
├── test-personas.md         # 페르소나 입력 5개(+변형)
├── contracts/
│   ├── generate-api.md      # 요청·응답·오류 코드와 화면 상태
│   └── copy-and-print.md    # 복사 텍스트·인쇄 형식
├── prompts/
│   ├── system-prompt.md     # AI 시스템 프롬프트 초안
│   └── banned-phrases.md    # 금지 표현 목록과 판단 기준 (프롬프트·검증·사람 점검의 공통 원천)
├── design-brief.md, design.md, spec.md, checklists/
└── tasks.md                 # /speckit-tasks에서 생성 (이 명령에서는 만들지 않음)
```

### Source Code (repository root)

```text
shared/                           # 클라이언트·서버 공용 (src는 server/를 가져오지 않는다)
├── schema/                        # input.ts, request.ts, output.ts, api.ts (Zod, 한 곳에서 정의)
├── guard/                         # pii.ts, injection.ts, duplicate-strength.ts, banned-phrases.ts(prompts/banned-phrases.md 기준)
└── messages.ts                    # 문구 단일 원천
server/                            # 서버 전용 (API 키 보호)
├── handler.ts                     # Request → Response, 서버리스 함수와 Vite 개발 서버가 공유
├── ai/                            # prompt.ts, client.ts(공급자 격리), generate.ts(재요청 흐름), validate-output.ts, to-result.ts
├── log.ts                         # 본문 없는 로그
└── rate-limit.ts
api/generate.ts                    # POST /api/generate (Vercel 서버리스 함수)
src/
├── main.tsx, App.tsx              # 경로: / (메인), /input (입력), /result (결과 + 상태 화면)
├── pages/                         # 3개 화면
├── components/
│   ├── ui/                        # Header, PageHeader, Button, Input(+Select, Checkbox, Radio), Card, Badge, Tag, Alert
│   ├── main/                      # Hero(+ResumeFragments), FlowSteps, NoticeSection, Footer
│   ├── input/                     # InputForm, SectionNav, MobileAccordion, RepeatableRows, NoneChoice, StrengthsFields, ErrorSummary, BottomBar
│   └── result/                    # NoticeBar, ActionBar, InputSummary, JobCard, KeywordCard, MismatchNote, ConfirmNeeded, StatusScreen
├── hooks/, state/                 # session-context.tsx, use-generate.ts(타이머 30·120초, AbortController)
├── services/ai/                   # 클라이언트 호출(http)과 Mock
├── format/                        # copy-text.ts
└── styles/global.css              # @theme 토큰(design 16~19절), print 스타일
tests/
├── unit/                          # schema, guard, validate-output, copy-text
├── contract/                      # /api/generate (모의 LLM)
├── e2e/                           # 1440·1024·390, print, a11y
├── fixtures/personas/             # test-personas.md의 JSON
└── eval/                          # eval:personas (실제 LLM, 수동 실행)
```

**Structure Decision**: Vite 단일 프로젝트(화면 `src/`, 서버 `server/`·`api/`, 공유 `shared/`). `shared/schema`가 클라이언트와 서버의 유일한 검증 원천이고, `server/ai/client.ts`가 LLM 공급자를 격리한다. Phase 2(로그인·저장)가 들어오면 `server/auth`, `server/store`를 추가하며 기존 구조를 바꾸지 않는다.

## 구현 단계 순서 (tasks 분해의 기준)

| 단계 | 내용 | 먼저 와야 하는 이유 |
|------|------|----------------------|
| 0 | 프로젝트 생성, 토큰(`@theme`), 폰트, Vitest·Playwright 설정 | 이후 모든 것의 기반 |
| 1 | **공통 컴포넌트 8종** 정의: Header, Page Header, Button, Input, Card, Badge, Tag, Alert (design 19~20절 규칙, 포커스·44px·색+아이콘+텍스트) | 사용자 요청. 세 화면의 일관성(design 26절 32번) |
| 2 | `shared/schema` + `shared/guard`(식별 정보, 지시문, 한도) + 단위 테스트 | 원칙 VII, 입력 화면과 API가 의존 |
| 3 | 입력 화면(폼, 오류 요약, 하단 바, 반복 입력, "없음" 선택지) | US2 |
| 4 | `server/ai`(프롬프트, 클라이언트, 재요청, validate-output) + `/api/generate` + 계약 테스트(모의 LLM) | US1 핵심, 원칙 II·IV·V·VIII |
| 5 | 세션 상태 + 결과 화면(카드, 확인 필요, 불일치 안내, 상태 화면 6종, 타이머) | US1, US4, US5 |
| 6 | 복사, 인쇄(print 스타일), 요청 제한 | US3, FR-038 |
| 7 | 메인 화면(Hero, 시각 요소, 이용 흐름, 모션과 reduced-motion) | 진입 화면. 기능 의존이 없어 뒤에 둠 |
| 8 | E2E(뷰포트·인쇄·a11y), 실제 LLM 페르소나 점검, design 26절 수동 확인, 헌법 검토 기준 예/아니오 확인 | 원칙 XV 완료 기준 |

## Complexity Tracking

> 위반은 없지만 Constitution이 "정당한 이유와 함께 기록"하라고 요구하는 편차를 적는다.

| 편차 | 필요한 이유 | 더 단순한 대안을 쓰지 않은 이유 |
|------|-------------|----------------------------------|
| spec의 US6~US8·FR-030~035를 이번 단계에서 구현하지 않음 | 사용자가 "DB 사용 안 함, 저장하지 않음"을 스택으로 지정함. 저장 없는 구조가 개인정보 위험이 가장 작음 | 모두 구현하려면 인증·DB가 필요해 지정 스택과 충돌한다. **사용자가 Phase 2 포함 여부를 정해야 한다** |
| 요청 제한이 메모리 방식(인스턴스별 최선 노력) | "DB 없음" 요구를 지키면서 비용 폭주를 줄임 | 외부 카운터(Redis)는 정확하지만 서비스가 하나 늘어남. 공급자 월 사용 한도를 최종 방어선으로 둠(research 4절) |
| 공개 상태에서 인증 없는 생성 API | 로그인이 Phase 2임 | 로그인을 먼저 만들면 DB가 필요. 배포 주소 비공개와 사용 한도로 위험을 줄임(quickstart 6절) |

## 사용자 확인이 필요한 결정

1. (2026-10-11 단계 분리 수용됨, 분석 F02) Phase 2(US6~US8)를 이 계획에 넣을지, 나눌지. 넣으려면 "DB 없음"을 바꿔야 한다.
2. LLM 공급자와 모델(기본 Anthropic + 저비용 모델로 가정). 구직자 이력이 외부 LLM으로 전송되므로 기관 개인정보 방침과 맞는지 확인이 필요하다.
3. Vercel 무료 플랜에서 120초 실행이 가능한지(구현 전에 확인). 불가하면 FR-023 값을 바꿀지 결정해야 한다.
4. 시안에 없는 화면·문구(지시문·강점 중복·식별 정보 경고, 외부 AI 전송 안내문, 형식 오류 문구, 저장 버튼 비활성 상태)는 design 2·12·14절에 정의했다. 시안(v3)에 반영할지는 사용자가 정한다.
5. 인쇄 미리보기 화면은 만들지 않고 브라우저 인쇄로 대체(요청 사항, design 3절에 기록).
6. 품질 점검에서 내가 정한 값이 맞는지 확인: 재생성 변동 허용·재생성 실패 시 이전 결과 미표시(FR-024), 식별 정보 차단·지시문 경고(FR-009, FR-010), 시간 초과 문구에서 구체 시간 제거, 요청 제한 10분 20회, 대기 중 취소 없음, A4 한 장 목표(FR-022), 구간 정의(768~1100px 태블릿). 모두 spec Clarifications(2026-10-11)에 기록되었다.

---

## 대응표 1. Constitution 원칙 → 이 계획에서 충족하는 방법

| 원칙 | 충족 방법 | 검증 (원칙 검토 기준에 대한 예/아니오 확인 수단) |
|------|-----------|-----------------------------------------------|
| **I 상담사 중심 보조** | 서버가 `notice` 두 줄을 항상 결과에 붙임(모델은 만들지 않음). 화면 상단 고정 바와 하단, 복사 텍스트 위·아래, 인쇄 위·아래에 포함. V10이 단정 표현 거부 | 계약 테스트("notice 항상 포함"), 복사 텍스트 테스트, print E2E |
| **II 입력 연결 근거 필수** | 출력 스키마의 `linkedInputs`를 직업·키워드 모두 1개 이상으로 강제(V4). 모델은 항목 번호만 지목하고 서버가 실제 입력 값으로 표시 문구를 만듦(V3) | 단위 테스트(V3·V4), 모의 LLM이 가짜 번호를 낼 때 거부 |
| **III 강점 존중과 보강** | 키워드 3개가 강점 0,1,2를 한 번씩 다룸(V5). 객관 항목과 연결되지 않으면 `mismatchNote` 필수, 연결되면 `null`(V7). 프롬프트에 불일치 문장 형식 | 단위 테스트, 페르소나 P4 사람 점검 |
| **IV 검증되지 않은 수치 금지** | 프롬프트에 수치 금지·"확인 필요" 규칙. V8이 퍼센트·금액·연봉·취업률·공고 수 패턴을 탐지해 재요청. `needsConfirmation` 문장은 화면·복사·인쇄에서 표시. "취업 가능성이 높은" 제목은 안내문 2줄(적합도 기준·비보장)과 함께 노출 | 단위 테스트(V8), 페르소나 공통 C, 화면 점검 26절 19번 |
| **V 차별 방지** | **나이를 생성 요청과 모델 입력에서 제외**(요청 스키마가 `age`를 거부). 프롬프트에 차별 금지 지침. V9(부정·배제 표현), V11(연령 표현) | 계약 테스트("age 포함 시 400, LLM 호출 0회"), 페르소나 P1~P3 사람 점검 |
| **VI 개인정보 최소 수집과 통제된 저장** | Phase 1(FR-025, FR-039, FR-040): 입력 전 외부 AI 전송 안내문 표시. 입력·결과를 서버·브라우저 저장소에 저장하지 않음(메모리만). 이름·연락처·주민번호 입력란 없음. 식별 정보 형식은 클라이언트·서버에서 차단. 로그에 요청·응답 본문·입력 값·모델 응답 원문 미기록(규칙 번호·코드만). IP는 해시해 요청 제한에만 사용. **Phase 2**: 소유자 접근 통제, 1년 자동 삭제, 수동 삭제(이번 범위 밖, Complexity Tracking) | 계약 테스트("로그에 입력 값 없음", PII 차단), 배포 후 Vercel 로그 확인(quickstart 6.3), P5-b |
| **VII 입력 검증** | `shared/schema`의 Zod를 클라이언트·서버가 공유. 항목별 한도(FR-037, 기간 50자 포함)와 허용 값, 식별 정보 차단, 지시문·강점 중복 경고(FR-009, FR-010, FR-041), 서버 재검증, 요청 본문 32KB 상한, 문자열 정규화 | 단위 테스트, P4-b/P5-a/P5-c |
| **VIII 고정된 출력 구조** | 출력 Zod 스키마 + 의미 검증 V1~V13, 실패 시 1회 재요청, 그래도 실패하면 `OUTPUT_INVALID`(부분 결과 없음) | 계약 테스트(직업 2개 → 재요청 → 오류) |
| **IX API 키 서버 전용** | LLM 호출은 서버리스 함수에서만. 키는 `LLM_API_KEY`(`VITE_` 금지). `.env.local`은 Git 제외. 호출 코드는 `server/ai/client.ts` 한 곳 | 빌드 산출물에서 키 문자열 검색 테스트, 네트워크 탭 점검(quickstart 5.2의 11번) |
| **X 장애 시 안내와 입력 유지** | 오류 코드별 화면 상태 매핑(생성 실패/형식 오류/시간 초과/요청 제한을 문구까지 구분), 입력은 Context에 유지, 다시 시도·입력 수정하기 제공, 30초 지연 문구와 120초 중단(서버가 먼저 중단해도 같은 상태) | E2E(실패·지연·제한 화면, 입력 유지), 계약 표 |
| **XI 명세 범위 준수** | 구현 대상은 spec의 FR만. 시안의 도구 띠·인쇄 미리보기 화면은 만들지 않음. 새로고침 경고 같은 spec에 없는 기능은 추가하지 않음. 각 task에 FR 번호 연결 | tasks 단계의 FR 추적, 대응표 2 |
| **XII 쉬운 언어와 존중하는 표현** | 프롬프트의 톤 규칙(design 24절의 피할 표현·대체 표현 그대로), 금지 표현 검사, 오류·상태 문구는 시안 확정 문구를 `messages.ts` 한 곳에서 사용 | 프롬프트 점검표(system-prompt 5절), 페르소나 공통 A |
| **XIII 접근성** | 컴포넌트 규칙에 포커스 3px·44px·색+아이콘+텍스트·`aria-live` 반영(design 22절). reduced-motion에서 애니메이션 중지(23절). 화면 전환 시 H1 포커스와 `document.title` 갱신 | `@axe-core/playwright`, 키보드 E2E, 수동 점검 26절 |
| **XIV 반응형 핵심 시나리오** | 분기 1199/1100/1023/767px(design 21절). 입력 → 결과 → 복사/인쇄 E2E를 1440·1024·390px에서 실행. print 미디어 스타일 | Playwright 3개 뷰포트, print 에뮬레이션, `page.pdf` |
| **XV 단순한 MVP와 추적 가능한 완료** | 단일 Vite 프로젝트, DB·외부 카운터 없음, 의존성 표에 필요성·비용 기록, tasks에 FR 번호 연결, 테스트·빌드 통과 전에는 완료 처리 안 함 | `npm run test`, `npm run build`, `npm run test:e2e` 통과 |

---

## 대응표 2. design.md 섹션 → 구현할 컴포넌트·스타일·테스트

| design 섹션 | 구현할 컴포넌트 | 스타일 | 테스트 |
|-------------|-----------------|--------|--------|
| 1 콘셉트와 목표 | (전체 방향. 별도 컴포넌트 없음) | | 대응표의 각 검증으로 분산 |
| 2 서비스 이름과 핵심 문구 | `shared/messages.ts`(문구 단일 원천), Hero 문구, NoticeBar | | 단위: 안내문 두 줄 문구 일치. **서비스 이름은 상수 하나**(정식 이름 확정 시 일괄 교체) |
| 3 세 화면의 정보 구조 | `app/page.tsx`, `app/input/page.tsx`, `app/result/page.tsx` | | E2E: 화면별 영역 순서와 제목 확인 |
| 4 화면별 레이아웃 | 각 페이지 레이아웃, SectionNav(데스크톱), MobileAccordion(≤767px) | 반응형 분기 1199/1100/1023/767px | E2E 3개 뷰포트: 열 수, 목차 유무 |
| 5 화면 간 이동 | `use-generate.ts`(상태 전이), 라우팅 `/`·`/input`·`/result` | | E2E: 메인→입력→오류→수정→결과→입력 수정→다시 생성, 실패→다시 시도→결과 |
| 6 사용 맥락별 차이 | InputSummary(접기), 태블릿 폭 본문 17.5px, ActionBar | ≤1199px 카드 본문 크기 | E2E 1024px: 결과 카드 1열, 본문 크기 |
| 7 Header와 Navigation | `ui/Header`, 본문 바로가기 링크(`layout.tsx`) | 메인 투명 겹침, 내부 `#07111F` 단색, 링크 44px | E2E: Tab 첫 포커스가 바로가기 링크, 로그인 영역 없음 |
| 8 Page Header | `ui/PageHeader`(kicker, H1, 부제), 화면 전환 시 H1 포커스 훅 | kicker 모노 14px | E2E: 전환 후 포커스가 H1, `document.title` 변경 |
| 9 메인 Hero 구조 | `main/Hero`, CTA 2개, 참고용·개인정보 안내 박스 | 52px 버튼, 민트/고스트 | E2E 1440: 첫 화면에 문구·주 CTA 보임, 390: CTA 화면 안 |
| 10 Gradient, Grid Glow, Floating Card | `main/ResumeFragments`(이력 조각 4장 + 직업 카드 + SVG 연결선, `aria-hidden`) | 그라데이션 색, 48px 격자(마스크), 카드 210px·220px, 진입 모션, 연결선 3회 | E2E: reduced-motion 에뮬레이션에서 애니메이션 정지, 시각 요소 `aria-hidden`. 겹침은 **수동 확인** |
| 11 입력 폼 구조 | `InputForm`, `RepeatableRows`, `NoneChoice`, `StrengthsFields`, `ui/Input` 계열 | 입력창 48px·1.5px 테두리, 라벨 위, "(필수)/(선택)" 텍스트 | 단위: FR-037 한도(100/400자, 20/6개). E2E: 강점 3개 입력란, "없음" 선택 시 비활성 + 이유 텍스트 |
| 12 입력 검증과 오류 표시 | `ErrorSummary`(`role=alert`, 링크 포커스 이동), 필드 오류, 글자 수 안내, `shared/guard`(PII·지시문) | 오류 빨강 2px + 아이콘 + 굵은 텍스트 | 단위: 확정 오류 문구 일치, PII 차단, 지시문 경고. E2E: 비우고 제출 → 요약·필드 오류, 링크 → 포커스, 수정하면 개수 갱신 |
| 13 결과 페이지 구조 | `NoticeBar`(상단 고정), `ActionBar`, `InputSummary`, `JobCard`, `KeywordCard`, `ConfirmNeeded`, `MismatchNote`, 하단 안내 | 영역 A 흰+틸, B 청회색+네이비, 칩 A/B, 태그 | 단위: 출력 스키마가 13.3·13.4 필드와 일치(data-model 6절). E2E: 직업 3·키워드 3, 태그 1개 이상, 수치·게이지 없음 |
| 14 상태 화면 | `result/StatusScreen`(분석 중, 지연, 시간 초과, 빈 화면, 생성 실패, 요청 제한), 복사 알림(`aria-live`) | 상태 배지 36px, 카드 폭 680px | E2E: 오류 코드 → 화면 매핑(contracts 3절), 30초·120초 타이머(가짜 타이머), 실패 시 입력 유지, "입력하신 내용은 그대로" 문구 |
| 15 인쇄 레이아웃 | `app/globals.css`의 `@media print`, `window.print()` 호출(별도 화면 없음) | A4, 14mm, 9.5pt, 흑백 구분, `break-inside: avoid` | E2E: print 에뮬레이션에서 숨김·표시 요소, 안내문 두 줄, `page.pdf` 1쪽. 흑백 구분은 **수동 확인** |
| 16 디자인 토큰 | `@theme` 색 토큰(시안 변수 이름 유지) | `--navy-950`~`--focus-dark` 전부 | 단위: 토큰 파일이 design 16절 값과 일치. 대비는 axe + **수동 측정** |
| 17 타이포그래피 계층 | `@fontsource`(Plex Sans KR, Plex Mono), 글자 크기 토큰 | 크기·굵기·줄 간격 표, 본문 최소 16px | E2E: 본문 computed font-size ≥ 16px. 글꼴 라이선스 **확인 필요** |
| 18 색상 역할 | 컴포넌트 변형(Button 종류, Badge 종류, Alert 종류) | 색 역할 표 | E2E/axe: 색 외에 아이콘·텍스트 존재 |
| 19 간격과 최대 콘텐츠 폭 | 레이아웃 컨테이너(1176px), 섹션·카드 간격 | 간격 표 값을 토큰/클래스로 | E2E: 컨테이너 최대 폭, 가로 스크롤 없음 |
| 20 버튼·입력창·카드·배지·태그 | `ui/Button`, `ui/Input`(+Select·Checkbox·Radio), `ui/Card`, `ui/Badge`, `ui/Tag`, `ui/Alert` (**단계 1에서 가장 먼저 정의**) | 높이 52/44px, 반경 4~6px, 그림자 없음 | 단위: 컴포넌트 렌더(이름·역할·비활성 사유 텍스트). E2E: 터치 영역 ≥ 44px |
| 21 반응형 규칙 | 분기별 클래스, 하단 바 세로 쌓임, 행동 버튼 2열 | 1199/1100/1023/767px | E2E 1440/1024/390 표(design 21절)의 항목 |
| 22 키보드 포커스와 접근성 | 포커스 링 유틸리티(밝은/어두운 배경), `aria-*`, 오류 요약 포커스, 전환 포커스 | 3px 윤곽선, 오프셋 2~3px | `@axe-core/playwright`, 키보드만으로 입력→생성→복사→인쇄 E2E |
| 23 prefers-reduced-motion | 모든 장식 애니메이션을 `motion-safe`에서만 정의 | 기본 상태 = 최종 상태, 연결선 3회 | E2E: `reducedMotion: 'reduce'`에서 애니메이션 없음. 페이드 대체 여부는 **확인 필요** |
| 24 문구 톤 규칙 | `prompts/system-prompt.md`, `shared/guard/banned-phrases.ts`(V9·V10), `messages.ts` | | 단위: 금지 표현 탐지. 사람 점검: 페르소나 공통 A |
| 25 금지할 디자인 패턴 | 구현 시 사용하지 않음(수치, 게이지, 이모지, 로그인 영역 등) | 그림자·큰 둥근 모서리 금지 | E2E: 결과에 `%`·진행 막대 없음, Header에 로그인 영역 없음 |
| 26 구현 후 시각 검증 항목 | (구현 완료 후 확인 절차) | | quickstart 5.3의 수동 점검 34개 + 위 자동화 가능한 항목(1·2·3·6·7·8·10·11·14·15·16·17·22·26·27·30·31·33·34번은 E2E로 일부 자동화). 나머지(겹침, 대비, 흑백, A4)는 수동 |
| 27 엣지 케이스별 기대 결과와 화면 상태 (품질 점검에서 추가) | 신규 진입자·공백·중장년·추상/중복 강점·불일치·지시문·식별 정보·고졸 이하·없음 모순·중복 제출·뒤로 가기·새로고침 각각의 화면(입력 경고, 결과 카드, 상태 화면) | | E2E: 케이스별 한 개씩(페르소나 P1~P5 + 중복 제출·뒤로 가기·새로고침) |
| 확인 필요 항목 모음(23개) | 이 계획에서 답한 것: #18 글꼴(자체 호스팅), #17 토큰(시안 값 그대로), #23 톤 규칙(프롬프트·검증), #9 STEP 02 kicker 없음 유지, #10 결과로 돌아가기 경로 없음 유지 | | 남는 것: #1~4, #8(시안 보완 여부), #11~16·#19~22(렌더링·디자인 결정) |
