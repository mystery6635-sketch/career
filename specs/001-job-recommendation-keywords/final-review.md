# 최종 점검 기록 (T124·T125·T129·T130·T131)

**Feature**: `001-job-recommendation-keywords` | **작성**: 2026-10-11 (자동화 가능한 항목까지 채움)
**범례**: 예 = 자동 테스트 또는 코드로 확인됨 / 대기 = 실제 LLM·사람·배포 환경이 필요해 아직 확인하지 못함(확인자·날짜는 확인한 사람이 적는다) / 아니오 = 확인했으나 충족하지 않음.
**게이트 결과(자동)**: `npm run check` 통과(Vitest 582개, lint·typecheck·build), `npm run test:e2e` 연속 2회 통과(397개 중 395 통과·2 건너뜀. 건너뜀은 1024px 전용 검사가 다른 두 뷰포트에서 생략된 것). T120의 흑백 인쇄 수동 확인은 대기라 T120은 체크하지 않았다, `npm run audit:design` 위반 0건, `npm run check:secrets` 통과.
**E2E 파일**: `tests/e2e/phase7.spec.ts`(T108~T111), `tests/e2e/phase8.spec.ts`(T117~T120, T123, T128, 보조), `tests/e2e/integration/generate.spec.ts`·`limit.spec.ts`(T113, T121, T122), 기존 `flow`·`validation`·`regression`·`visual`·`smoke`.

---

## 1. design.md §26 시각 검증 36개 (T124)

| # | 항목 | 답 | 근거 (테스트 이름 / 확인자·날짜) |
|---|------|----|----------------------------------|
| 1 | 1440px 메인 문구·CTA 첫 화면 | 예 | `flow.spec.ts` "데스크톱(1440px)에서 Hero 첫 화면에 H1과 주 CTA가 보인다" |
| 2 | 1024px Hero 1열, 제목 4줄 이내 | 예 | `phase8.spec.ts` "#2 1024px Hero는 1열이고 제목이 4줄 이내…" (줄 수), 회귀 스크린샷 `regression.spec.ts` main |
| 3 | 390px "상담 시작하기" 완전히 보임 | 예 | `phase8.spec.ts` "#3 주 CTA가 화면 안" |
| 4 | 안내문·개인정보 안내가 읽을 수 있는 크기 | 예 | `phase8.spec.ts` "#4 안내문이 읽을 수 있는 크기"(13px 이상). 실제 가독성은 대기 |
| 5 | 이력 조각 카드 4장·직업 카드 겹침 없음 | 대기 | 스크린샷은 있음(`regression.spec.ts-snapshots/main-*`). 겹침은 사람 확인(확인자·날짜: ) |
| 6 | 움직임 감소에서 장식 애니메이션 정지 | 예 | `phase8.spec.ts` "움직임 감소 (T119) reduce ›" 3개 |
| 7 | (필수)/(선택) 텍스트 | 예 | `phase8.spec.ts` "#7·#8·#9·#35 입력…" |
| 8 | 강점 입력란 3개, "정확히 3개" 제목 | 예 | 같은 테스트, `screens.test.tsx` "강점: 입력창이 정확히 3개이고…" |
| 9 | 글자 수 안내가 모든 텍스트 입력창 아래 | 예 | 같은 테스트(필드 수 = 글자 수 안내 수), `validation.spec.ts` "글자 수 안내와 최대에서 입력이 멈춘다" |
| 10 | 필수 비우고 제출: 요약+필드 오류 | 예 | `validation.spec.ts` "필수 항목 비우기" |
| 11 | 요약 링크가 해당 입력창에 포커스 | 예 | 같은 테스트, `phase7.spec.ts` "VALIDATION_FAILED는 입력 화면 필드 오류와 오류 요약이 된다" |
| 12 | 데스크톱 목차에 현재 섹션·상태 | 예 | `validation.spec.ts` "섹션 상태" |
| 13 | 390px 접이식 상태 텍스트, 오류 섹션 열림 | 예 | `validation.spec.ts` "섹션 상태"(모바일 자동 열림), `phase8.spec.ts` T123 `.form-section__state` 텍스트 검사 |
| 14 | "경력 없음" 선택 시 비활성+이유 글자 | 예 | `input-and-result.test.tsx` "선택하면 연결 입력이 비활성이 되고 이유가 글자로 보인다", `phase8.spec.ts` T117 |
| 15 | 하단 바 "결과 생성하기"가 모든 크기에서 화면 안 | 예 | `phase8.spec.ts` "하단 바·행동 버튼이 화면 안에 있다" |
| 16 | 직업·키워드 정확히 3개씩 | 예 | `flow.spec.ts` 전체 흐름, `integration/generate.spec.ts` "정상", `mock.test.ts` |
| 17 | 직업마다 입력 항목 태그 1개 이상 | 예 | `phase8.spec.ts` "#17 직업마다 입력 항목 태그 1개 이상" |
| 18 | 영역 A/B가 색 없이도 구분 | 대기 | 흑백 스크린샷 저장됨 `tests/e2e/__artifacts__/grayscale/result-*.png`. 사람 확인 필요(확인자·날짜: ) |
| 19 | 취업률·연봉·공고 수·%·게이지 없음 | 예 | `phase8.spec.ts` "금지 디자인 패턴 (T128)" |
| 20 | "확인 필요" 노란 상자+텍스트 배지 | 예 | `screens.test.tsx` "직업 카드…", `phase8.spec.ts` T123 색상 외 표시 `.confirm__badge`, 인쇄 `[확인 필요]`. 노란색 외형은 스크린샷 회귀 |
| 21 | 불일치 안내가 위축시키지 않고 제목·아이콘 있음 | 예 | `phase8.spec.ts` "#21 불일치 안내에 제목과 아이콘", `validate-output.test.ts` V9. 문구 어감은 XII 사람 검토 대기 |
| 22 | 복사 완료 알림이 화면 낭독기에 읽힘 | 대기 | `aria-live=polite` 안에 텍스트로 나타남은 자동 확인(`phase7.spec.ts` "CP 1절 형식으로 복사하고, polite 알림…"). 실청취(NVDA/VoiceOver)는 대기(확인자·날짜: ) |
| 23 | 인쇄 미리보기·실제 인쇄 A4 한 장 | 아니오(조건부) | P1~P5 결과는 1쪽(`flow.spec.ts` "P1~P5 Mock 결과는 A4 한 장이다", `phase8.spec.ts` 인쇄 미디어 `page.pdf` 1쪽). **한도를 모두 채운 최대 길이 결과는 2쪽**(T063·T112, 사용자 결정 대기). 인쇄 미리보기 별도 화면은 구현하지 않고 브라우저 인쇄를 쓴다 |
| 24 | 흑백 인쇄에서 A/B·확인 필요·불일치 구분 | 대기 | 구분 수단(채움/윤곽, `[확인 필요]`+이중선+이탤릭, 점선+라벨)은 `phase8.spec.ts` "인쇄 미디어 (T120)"가 확인. 실제 흑백 출력은 사람 확인(확인자·날짜: ) |
| 25 | 인쇄물·복사에 안내문 두 줄 | 예 | `phase8.spec.ts` "인쇄 미디어 (T120)"(위·아래), `copyText.test.ts` "안내문 두 줄이 첫 부분과 끝 부분에 있다" |
| 26 | 상태 화면 5종(분석 중·빈 화면·실패·시간 초과·요청 제한) | 예 | `visual.spec.ts` 상태 화면 7종, `phase7.spec.ts` "오류 코드별 화면 상태 (T108)" |
| 27 | 실패·시간 초과에 "입력하신 내용은 그대로 남아 있습니다" | 예 | `phase7.spec.ts` 오류 코드별 케이스(본문 문구 + 입력 유지) |
| 28 | 메인→입력→오류 수정→분석 중→결과→입력 수정→다시 생성 | 예 | `phase8.spec.ts` T117 키보드 전용 흐름, `phase7.spec.ts` "입력 수정 후 다시 생성 (T110)" |
| 29 | 실패→다시 시도→결과 | 예 | `phase7.spec.ts`(다시 시도 요청 동일), `integration/generate.spec.ts` "형식 오류 후 재요청 성공" |
| 30 | Tab으로 모든 요소에 포커스 표시 | 예 | `phase8.spec.ts` "키보드 전용 흐름 (T117)"(각 정지점에서 윤곽선 확인), `flow.spec.ts` "키보드: …윤곽선이 보인다" |
| 31 | 터치 영역 44px 이상 | 예 | `phase8.spec.ts` "뷰포트·터치 영역 (T118)"(3 뷰포트, 간격 8px 포함) |
| 32 | Header·버튼·입력창·배지 규칙 일관 | 예 | `npm run audit:design` 0건, `design-rules.test.ts` |
| 33 | Header에 로그인·회원 영역 없음 | 예 | `layout.test.tsx` "…로그인 요소가 없다", `phase8.spec.ts` T128 |
| 34 | 세 크기·360px 가로 스크롤 없음 | 예 | `phase8.spec.ts` T118(360px 포함), `flow.spec.ts` "반응형과 접근성", `regression.spec.ts` |
| 35 | 입력 화면에서 외부 AI 전송 안내가 입력 전에 | 예 | `phase8.spec.ts` "#7·#8·#9·#35 입력…"(문서 순서), `messages-and-state.test.ts` |
| 36 | 지시문·강점 중복 경고가 노랑+아이콘+텍스트, 제출 안 막음 | 예 | `validation.spec.ts` "경고와 차단", `phase8.spec.ts` T123 `.field__warning` 아이콘·텍스트 |

### 1.1 화면 낭독기 실청취 확인 (NVDA 또는 VoiceOver) — 모두 대기

| 항목 | 읽힘 | 확인자·날짜 |
|------|------|-------------|
| 오류 요약(`role=alert`, 제출 후 포커스) | 대기 | |
| 분석 중 단계·지연 안내(`role=status`) | 대기 | |
| 생성 실패 카드 | 대기 | |
| 시간 초과 카드 | 대기 | |
| 요청 제한 카드 | 대기 | |
| 복사 완료·실패 알림 | 대기 | |
| 재생성 알림 | 대기 | |

자동으로 확인된 것은 live region의 존재와 텍스트이며(`a11y.test.tsx` "실패 계열 카드는 role=alert 하나이다", `phase7.spec.ts`) 실청취를 갈음하지 않는다.

### 1.2 접근성 자동 점검 요약 (T123)
`phase8.spec.ts` "접근성 자동 점검 (T123)": 메인, 입력, 입력 오류, 결과, 상태 화면 7종에서 axe(wcag2a·2aa·21a·21aa) 위반 0건. 상태 배지·Alert·필드 오류·경고·"확인 필요" 배지는 텍스트가 비어 있지 않고 아이콘 요소가 있음을 확인했다. 필수/선택 표시와 섹션 상태는 텍스트로만 구분하며(`미입력`·`선택` 등 일부에는 기호 없음) 텍스트 존재만 확인했다. 흑백(grayscale) 스크린샷은 `tests/e2e/__artifacts__/grayscale/`에 저장된다. **상태 구분이 되는지는 사람이 확인해야 한다(대기, 확인자·날짜: )**.

---

## 2. Constitution 원칙 I~XV 검토 기준 (T125)

| 원칙 | 검토 기준 | 답 | 근거 |
|------|-----------|----|------|
| I | 결과 화면에 참고용 안내가 항상 표시 | 예 | `screens.test.tsx` "안내문 두 줄: 상단 바와 하단 박스", `flow.spec.ts` 전체 흐름(안내문 2곳) |
| I | 인쇄·복사물에도 안내 포함 | 예 | `copyText.test.ts`, `phase8.spec.ts` 인쇄 미디어(T120) |
| I | 단정적 표현 없음 | 예 | `validate-output.test.ts` V10, `banned-corpus.test.ts`(V10 코퍼스 전부 거부). 실제 LLM 출력은 대기(T104) |
| II | 직업 3개 각각 입력 항목 근거 | 예 | `validate-output.test.ts` V4, `mock.test.ts` "모든 직업의 연결 입력이 1개 이상…" |
| II | 키워드 3개 각각 입력 항목 근거 | 예 | 같은 테스트(키워드는 strength 포함) |
| II | 근거 없는 항목이 출력되지 않게 검증하는 테스트 | 예 | `validate-output.test.ts` V3·V4, `server/generate-flow.test.ts` "가짜 항목 번호 지목 -> 거부(V3)하고 재요청" |
| III | 강점 3개 모두 다뤄짐 | 예 | `validate-output.test.ts` V5 |
| III | 객관 정보 연결 강점에 연결 항목 표시 | 예 | `screens.test.tsx` "키워드 카드: …객관 항목 Tag는 강점 제외" |
| III | 연결 안 된 강점에 비하하지 않는 안내 | 예(자동 범위) | V7, `screens.test.tsx` "불일치 키워드: 안내 상자…", `validate-output.test.ts` V9. 문구 어감은 XII 사람 검토에 포함 |
| IV | 프롬프트에 수치 금지·"확인 필요" 지침 | 예 | `prompt.test.ts` "prompts/system-prompt.md 1절 본문과 같다" + 프롬프트 파일 |
| IV | 출처 없는 수치 탐지·차단 | 예 | `validate-output.test.ts` V8, `server/generate.test.ts` "7. 출력에 수치…-> 거부(V8)" |
| IV | 샘플 입력 테스트 결과에 출처 없는 수치 없음 | 대기 | Mock·코퍼스 기준은 통과(`banned-corpus.test.ts`). **실제 LLM으로 P1~P5**(T104)는 대기 |
| IV | "취업 가능성" 표현에 적합도 기준·비보장 안내 동반 | 예 | 서버 고정 notice 2줄(`generate.test.ts` "8. 성공해도 notice는 항상 두 줄"), `phase8.spec.ts` T120(위·아래) |
| V | 프롬프트에 차별적 배제 금지 지침 | 예 | 프롬프트 파일, `banned-phrases.test.ts`(V9·V11) |
| V | 나이 높음·공백·인턴 없음 입력에서도 부정 표현 없음 | 대기 | Mock·코퍼스는 통과. 실제 LLM P2·P3(T104) 대기 |
| V | 차별 방지 테스트가 자동/수동 체크리스트로 존재 | 예 | `banned-corpus.test.ts`, `test-personas.md` |
| VI | 고유식별정보 필드 없음 | 예 | `input-schema.test.ts`, 입력 폼(이름·연락처·주민번호 필드 없음) |
| VI | 저장 실행 전에는 서버 저장 없음 | 예(해당 범위) | 저장 기능 없음. `integration/generate.spec.ts` "T122: 전체 흐름 뒤 저장소·쿠키·URL·콘솔에 입력이 남지 않는다" |
| VI | 이름·연락처가 생성 요청에 없음 | 예 | `prompt.test.ts` "나이·이름·연락처가 없다", `http-service.test.ts` "요청 본문에 나이가 없고…" |
| VI | 다른 상담사·비로그인의 저장 데이터 접근 불가 | 해당 없음(예외) | 저장 데이터가 없다. `exceptions.md` E-1 |
| VI | 1년 후 자동 삭제·직접 삭제 | 해당 없음(예외) | 저장이 없다(2단계). `exceptions.md` E-2 |
| VI | 서버 로그에 입력 본문 없음 | 예(코드·테스트) | `server/generate.test.ts` "10. 로그 캡처…", "잘못된 JSON 본문…", "스키마 위반 본문…", `server/log.test.ts`. **Vercel 로그 수동 확인은 대기(배포 후)** |
| VI | 식별 정보 형식 감지·차단 | 예 | `generate.test.ts` "3. 강점에 주민번호 형식 -> 400 PII_DETECTED", `validation.spec.ts` "식별 정보는 필드 오류로 차단한다" |
| VII | 필수 누락 시 항목별 오류 | 예 | `validation.spec.ts` "필수 항목 비우기" |
| VII | 최대 길이·허용 값이 서버에서 검증 | 예 | `server/generate.test.ts` 스키마 위반 400, `input-schema.test.ts` |
| VII | 지시문이 데이터로만 처리 | 예(구조) / 대기(실제 LLM) | `prompt.test.ts` "입력은 <applicant_data> 안에만 있다", "입력이 닫는 태그를 흉내 내도…". P5-a 실제 LLM은 대기(T104) |
| VIII | 응답 스키마가 서버에서 검증 | 예 | `schema-contracts.test.ts`, `validate-output.test.ts`, 클라이언트도 `http-service.test.ts`로 응답 검증 |
| VIII | 3개 미만·초과 응답이 화면에 안 나옴 | 예 | V1, `phase7.spec.ts` "응답 형식 오류"(직업 2개 응답 -> 생성 실패, `http-service.test.ts`) |
| VIII | 재요청 상한과 오류 처리 | 예 | `generate-flow.test.ts` "…호출 정확히 2회…", `generate.test.ts` "4. …재요청 1회 후 OUTPUT_INVALID" |
| IX | 번들·네트워크 응답에 API 키 없음 | 예 | `npm run check:secrets`, `integration/generate.spec.ts` "T121: 네트워크 응답…" |
| IX | 브라우저가 AI 공급자를 직접 호출 안 함 | 예 | `check:secrets`(`api.anthropic.com` 등 0건), `llm-client.test.ts` |
| IX | 키가 환경 변수이고 커밋되지 않음 | 예(커밋 없음) | `.gitignore`의 `.env*.local`, 아직 커밋 자체가 없음. **저장소에 키가 없는지는 첫 커밋 전 `git status`로 재확인** |
| X | 실패 유형별 안내 | 예 | `phase7.spec.ts` "오류 코드별 화면 상태 (T108)" 7개 |
| X | 재시도 버튼, 입력 재입력 불필요 | 예 | `phase7.spec.ts`(다시 시도 요청 동일·입력 수정하기 값 유지), `useGenerate.test.tsx` |
| X | 지연 상태와 타임아웃 | 예 | `flow.spec.ts` slow·timeout, `integration/generate.spec.ts` "지연…" |
| XI | 구현된 기능이 모두 명세 요구에 대응 | 아니오(예외) | 명세 FR-030~035(로그인·저장)는 2단계. `exceptions.md` E-3 |
| XI | 명세에 없는 화면·저장·계정 기능 없음 | 확인 필요 | 화면·저장·계정 기능은 없다. 다만 `@supabase/supabase-js` 의존성과 `src/lib/supabase.ts`가 있다(어디서도 import되지 않으며 번들에 없음). 2단계 준비물이라면 `exceptions.md` E-4로 승인 필요 |
| XI | 범위 추가 시 명세 먼저 수정 | 대기 | 검토자 확인 필요(범위 추가로 볼 수 있는 항목은 Supabase 의존성 하나) |
| XII | 프롬프트에 쉬운 언어·낙인 금지 지침 | 예 | `prompt.test.ts`, 프롬프트 파일 |
| XII | 샘플 결과에 어려운 용어·위축 표현 없음 | 예(Mock) / 대기(실제) | `banned-corpus.test.ts`. 실제 LLM 결과는 대기 |
| XII | 상담사·검토자가 "함께 봐도 괜찮다" 확인 | 대기 | 사람 검토(SC-013). 확인자·날짜: |
| XIII | 입력·제출·재시도·복사·인쇄가 키보드만으로, 포커스 보임 | 예 | `phase8.spec.ts` "키보드 전용 흐름 (T117)"(3 뷰포트) |
| XIII | 상태가 색상 외 텍스트로도 표시 | 예 | `phase8.spec.ts` "접근성 자동 점검 (T123)" 색상 외 표시 |
| XIII | reduced-motion에서 애니메이션 중지 | 예 | `phase8.spec.ts` "움직임 감소 (T119)" |
| XIV | 세 크기에서 핵심 시나리오 완료 | 예 | 모든 E2E가 3 뷰포트 프로젝트로 실행(`flow.spec.ts` 전체 흐름, T117) |
| XIV | 가로 스크롤·잘림 없음 | 예 | `phase8.spec.ts` T118, `regression.spec.ts` |
| XIV | 인쇄 시 결과·안내가 읽기 좋게 | 예(조건부) | 인쇄 미디어 E2E 통과. **최대 길이 결과는 2쪽**(T112 사용자 결정 대기) |
| XV | 각 Task가 요구사항·원칙과 연결 | 예 | `tasks.md` 요구사항 추적 표 |
| XV | 완료 처리된 모든 Task에서 테스트·빌드 통과 | 예(체크된 Task 기준) | 게이트 결과 위 참고. 미체크 Task는 완료 처리하지 않음 |
| XV | 도구·서비스가 무료·저비용이고 필요성 설명 | 확인 필요 | `plan.md` 의존성 표 기준. `@supabase/supabase-js`는 표에 없어 필요성 기록이 필요(E-4와 함께) |

**T125 판정**: 위 표에 "대기"(실제 LLM·사람·배포 필요)와 "확인 필요"(Supabase 의존성 결정)가 남아 있으므로 T125는 체크하지 않는다.

---

## 3. 대기 중인 실제 환경·사람 항목

| Task | 필요한 것 | 상태 |
|------|-----------|------|
| T104·T105·T106·T114·T115 | 실제 LLM API 키(P1~P5 실제 호출, 미리보기 실제 AI 흐름) | 대기(키 없음) |
| T124 | 화면 낭독기 실청취, 겹침·대비·흑백·A4 수동 확인 | 대기 |
| T127 | 프로덕션 배포, 공급자 월 한도, 헤더·함수 설정 실제 확인, quickstart 5.2 17항목 | 대기 |
| T129 | 처음 쓰는 상담사의 표준 입력 소요 시간 | 대기(측정값: ) |
| T130 | 시범 상담사 안내 없이 진행(목표 80%) | 대기(도달 수·막힌 지점: ) |
| Vercel 로그 확인 | 배포 후 로그에 입력 본문·모델 응답·프롬프트가 없음 | 대기 |

## 4. 미해결 CRITICAL·HIGH (T131)

- **HIGH(사용자 결정 대기)**: 최대 길이 결과가 인쇄 시 2쪽(T063·T112). 문장 한도 축소(FR-022·DM 2.1·V15·프롬프트 동시 조정) 또는 2쪽 허용 중 선택이 필요하다.
- **HIGH(사용자 결정 대기)**: T011·T063의 A4 결정.
- **MEDIUM**: Supabase 의존성·`src/lib/supabase.ts`의 범위 문제(원칙 XI·XV).
- 위 외 자동 게이트에서 발견된 CRITICAL·HIGH는 없다.
