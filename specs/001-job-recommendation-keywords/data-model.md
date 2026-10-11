# Data Model: 입력 스키마와 출력 스키마

**Feature**: `001-job-recommendation-keywords` | **작성일**: 2026-10-11
**저장소**: 없음. 이 문서의 모든 데이터는 브라우저 메모리(입력, 결과)와 요청 처리 중인 서버 메모리에만 존재한다(FR-025, 원칙 VI).
**범위**: US1~US5. 상담사 계정, 구직자 기록, 상담 이력(spec Key Entities의 뒤 세 개)은 Phase 2이며 여기서 정의하지 않는다.

모든 스키마는 `shared/schema/`에서 Zod로 한 번만 정의한다. 표의 "한도"는 FR-037과 design 11절을 따른다.
문자열은 앞뒤 공백을 제거하고 빈 문자열은 "입력 없음"으로 본다.

---

## 1. 입력 스키마

### 1.1 화면 입력 `ApplicantInput` (클라이언트 상태)

| 필드 | 타입 | 필수 | 규칙 | 근거 |
|------|------|------|------|------|
| `age` | 정수 | 필수 | 15~99. 숫자 이외는 "나이를 숫자로 입력해 주세요.", 범위 밖은 "나이는 15~99 사이의 숫자로 입력해 주세요." | FR-004 |
| `education.level` | 열거 | 필수 | `highschool_or_below`(고졸 이하) / `college`(전문대) / `bachelor`(대졸) / `master`(석사) / `doctor`(박사) | FR-001 |
| `education.status` | 열거 | 필수 | `graduated`(졸업) / `enrolled`(재학) / `leave`(휴학) / `dropout`(중퇴) / `expected`(졸업예정) | FR-001 |
| `majors` | 문자열 배열 | 선택 | 각 1~100자, 최대 6개. 고졸 이하는 비어도 됨. 중복 제거는 하지 않음 | FR-002, FR-037 |
| `noCareer` | 불리언 | 필수(경력과 택일) | `true`이면 `careers`는 빈 배열이어야 함 | FR-003 |
| `careers` | 객체 배열 | `noCareer=false`이면 1개 이상 | 최대 20개. 아래 `Career` | FR-003, FR-037 |
| `intern.has` | 불리언 | 필수 | 선택하지 않으면 "인턴 경험이 있는지 선택해 주세요." | FR-005 |
| `intern.content` | 문자열 | `has=true`이면 필수 | 1~400자 | FR-005, FR-037 |
| `intern.period` | 문자열 | `has=true`이면 필수 | 1~50자 | FR-005 |
| `noCertifications` | 불리언 | 선택 | `true`이면 `certifications`는 비어야 함 | FR-006 |
| `certifications` | 문자열 배열 | 선택 | 각 1~100자, 최대 20개 | FR-006, FR-037 |
| `noTrainings` | 불리언 | 선택 | `true`이면 `trainings`는 비어야 함 | FR-007 |
| `trainings` | 객체 배열 | 선택 | 최대 20개. 아래 `Training` | FR-007, FR-037 |
| `strengths` | 문자열 배열 | 필수 | **정확히 3개**, 각 공백 제외 2~100자. 비면 "강점 N을 입력해 주세요. 강점은 정확히 3개가 필요해요.", 1자면 "강점 N을 2자 이상 적어 주세요." | FR-008, FR-037 |

`Career`: `jobTitle`(1~100자), `industry`(1~100자), `period`(1~50자). 세 칸 모두 필요하며 하나라도 비면 "경력의 직무명·업종·기간을 모두 입력해 주세요. 비어 있는 칸이 있어요."
`Training`: `courseName`(1~100자), `period`(1~50자).

오류 문구는 design 12절에 확정된 문구를 `shared/messages.ts`에서 그대로 쓴다. 새 문구는 1.3절과 1.5절에 정의한다.

**문자열 정규화(모든 문자열 필드)**: 앞뒤 공백 제거, 한 줄 입력 칸(전공, 직무명, 업종, 기간, 자격증, 과정명, 강점)은 줄바꿈과 연속 공백을 공백 하나로 바꾼다. 인턴 내용은 줄바꿈을 허용하되 연속 줄바꿈은 하나로 줄인다. 공백만 있는 값은 "비어 있음"이다(FR-010).
**상호 배타**: `noCareer=true`이면 `careers`가 비어 있어야 하고, `noCertifications`, `noTrainings`도 같다. 위반하면 `VALIDATION_FAILED`(FR-003).
**학력 조합**: 학력 수준과 상태의 조합은 제한하지 않는다(spec Edge Cases).

### 1.2 생성 요청 `GenerateRequest` (클라이언트 → 서버)

`ApplicantInput`에서 **나이를 뺀** 값이다. 서버는 나이를 받지 않는다.

| 필드 | 설명 |
|------|------|
| `education`, `majors`, `noCareer`, `careers`, `intern`, `certifications`, `trainings`, `strengths` | 1.1절과 같은 규칙 |
| (없음) `age` | 요청에 포함하지 않는다. 포함되어 오면 서버가 무시하지 않고 `VALIDATION_FAILED`로 거부한다(엄격 객체). 나이가 새어 들어가는 일을 코드 구조로 막는다. |
| (없음) 이름, 연락처 | 이 단계에는 존재하지 않는다. Phase 2에서도 요청에 포함하지 않는다(FR-029). |

"없음 선택" 불리언(`noCertifications`, `noTrainings`)은 화면 상태용이고 요청에는 비어 있는 배열로 보낸다. 요청 본문은 32KB를 넘으면 거부한다.

### 1.3 입력 보호 검사 (FR-009, FR-010, 원칙 VI, VII)

자유 텍스트 필드(`majors`, `careers.*`, `intern.*`, `certifications`, `trainings.*`, `strengths`)에 대해 클라이언트와 서버가 같은 함수를 실행한다.

| 검사 | 대상 패턴 | 처리 | 화면 문구(제안, design에 없음 → 확인 필요) |
|------|-----------|------|---------------------------------------------|
| 식별 정보 | 주민등록번호 형식(6자리-7자리), 휴대전화·일반전화 번호 형식, 이메일 형식 | **차단**. `PII_DETECTED`, 필드 위치 반환 (FR-009) | "이름·연락처 같은 개인 식별 정보는 입력하지 않아요. 해당 부분을 지워 주세요." |
| 지시문 형태 | "이전 지시를 무시", "시스템 프롬프트", "ignore previous", 역할 변경 요청 등 목록 | **경고만**(차단하지 않음). 입력은 데이터로만 취급되며 4절의 격리로 실행되지 않는다 (FR-010) | "AI에게 내리는 지시문처럼 보이는 내용이 있어요. 구직자의 이력만 적어 주세요." |
| 강점 중복 | 정규화(공백·문장 부호 제거, 소문자화) 후 같은 문장 | **경고만**. 클라이언트에서만 검사(서버는 결과에 영향 없음) (FR-041) | "강점 N이 강점 M과 같아요. 서로 다른 강점을 적어 주세요." |
| 길이·개수 | FR-037 한도 | **차단**. `VALIDATION_FAILED` | "최대 N자까지 입력할 수 있어요." / "최대 N개까지 입력할 수 있어요" |

- 식별 정보는 개인정보 보호가 최우선이라(Constitution 우선순위 1) 차단한다. 오탐(예: 자격증 번호가 전화번호 형식)을 줄이기 위해 패턴은 보수적으로 만든다. 오탐 시 상담사가 지우고 다시 입력한다.
- 지시문은 업무 문장에 "지시"라는 말이 흔히 쓰여 오탐이 많다. 그래서 차단하지 않고 경고하며, 실제 방어는 데이터 격리와 출력 검증이 맡는다.
- 경고의 화면 형태는 design 12절에 정의했다(노랑 + 아이콘 + 텍스트, 오류 요약 개수에 미포함). 시안(v3)에는 아직 없으므로 시안 보완 여부는 사용자가 정한다.

### 1.5 메시지 카탈로그 (`shared/messages.ts`)

모든 사용자 노출 문구는 이 파일 한 곳에 둔다. 코드 곳곳에 문구를 쓰지 않는다(원칙 XII).

| 분류 | 문구 출처 |
|------|-----------|
| 입력 오류 9개 | design 12절 확정 문구 (나이 숫자·범위, 최종학력, 학력 상태, 경력, 경력 칸, 인턴 선택, 인턴 내용, 인턴 기간, 강점 N 필수) |
| 추가 입력 오류·경고 | 1.3절 표(식별 정보, 지시문, 강점 중복, 길이·개수), 강점 2자 미만 |
| 상태 화면 | design 14절(분석 중, 지연, 시간 초과, 빈 화면, 생성 실패, 형식 오류, 요청 제한, 복사 완료·실패) |
| 안내문 두 줄 | design 2절 (서버가 결과에 부착) |
| 저장 버튼 비활성 안내 | "상담 이력 저장은 아직 준비 중이에요" |
| 외부 AI 전송 안내 | design 2절 (FR-039) |

### 1.4 모델에 전달하는 입력 `ModelInput`

서버가 `GenerateRequest`에서 만든다. 항목마다 **번호(index)** 를 붙여 모델이 근거를 번호로 지목하게 한다.

| 필드 | 내용 |
|------|------|
| `education` | `{ level, status }` (한국어 표시값으로 변환) |
| `majors[i]` | 전공 문자열 |
| `careers[i]` | `{ jobTitle, industry, period }` 또는 `noCareer: true` |
| `intern` | `{ has, content?, period? }` |
| `certifications[i]` | 문자열 |
| `trainings[i]` | `{ courseName, period }` |
| `strengths[0..2]` | 문자열 3개 |

나이, 이름, 연락처, IP, 요청 시각은 포함하지 않는다.

---

## 2. 출력 스키마

### 2.1 모델이 만드는 JSON `ModelOutput`

모델은 **JSON 객체 하나만** 출력한다. 필드가 design 13절의 카드 구조와 1:1로 대응한다.

```json
{
  "jobs": [
    {
      "title": "사회복지사",
      "subtitle": "복지기관 사례 관리",
      "isStandardName": true,
      "rationale": [
        { "text": "사회복지학을 전공했고 사회복지사 2급 자격증이 있어요.", "needsConfirmation": false }
      ],
      "linkedInputs": [
        { "field": "major", "index": 0 },
        { "field": "certification", "index": 0 }
      ],
      "checkPoint": { "text": "행정 업무 경험은 상담에서 함께 이야기 나누며 확인해 보면 좋아요.", "needsConfirmation": false }
    }
  ],
  "keywords": [
    {
      "keyword": "경청",
      "strengthIndex": 2,
      "linkedJobIndex": 0,
      "description": [
        { "text": "…", "needsConfirmation": false },
        { "text": "…", "needsConfirmation": false }
      ],
      "linkedInputs": [
        { "field": "strength", "index": 2 },
        { "field": "career", "index": 0 }
      ],
      "mismatchNote": null
    }
  ]
}
```

(위는 형태 예시이며 `jobs`, `keywords`는 각각 정확히 3개여야 한다.)

#### `jobs[i]` — design 13.3 추천 직업 카드

| 필드 | 타입 | 규칙 | 화면 위치 / 근거 |
|------|------|------|------------------|
| `title` | 문자열 | 1~30자, 3개가 서로 달라야 함 | 직업명(24px) / FR-012 |
| `subtitle` | 문자열 | 1~40자 | 직업명 옆 보조 설명 |
| `isStandardName` | 불리언 | `false`이면 "표준 분류 확인 필요" 배지 | FR-036 |
| `rationale` | `Sentence[]` | 1~3개 | "추천 근거" 본문 / FR-013 |
| `linkedInputs` | `InputRef[]` | **1개 이상**, 최대 6개 | "연결된 입력 항목" 태그 / FR-013, 원칙 II |
| `checkPoint` | `Sentence` | 한 문장 | "상담에서 함께 확인할 점" 상자 / FR-012 |

#### `keywords[i]` — design 13.4 키워드 카드

| 필드 | 타입 | 규칙 | 화면 위치 / 근거 |
|------|------|------|------------------|
| `keyword` | 문자열 | 1~20자 | 키워드(24px) / FR-014 |
| `strengthIndex` | 0, 1, 2 | 3개 키워드가 **0, 1, 2를 한 번씩** 가져야 함 | "연결 강점" / FR-014, FR-015 |
| `linkedJobIndex` | 0, 1, 2 | `jobs`의 위치 | "연결 직업" / FR-014 |
| `description` | `Sentence[]` | **2~3개** | "설명" / FR-014 |
| `linkedInputs` | `InputRef[]` | 1개 이상. `strength` 참조를 반드시 포함 | "연결된 입력 항목" Tag(`strength` 제외, 없으면 영역 생략, 제안) / SC-003 |
| `mismatchNote` | 문자열 또는 `null` | 강점이 객관 이력과 연결되지 않으면 필수, 아니면 `null` | 불일치 안내 상자 / FR-015, 원칙 III |

`mismatchNote`가 있으면 화면은 "※ 상담에서 함께 보강해요" 태그와 파란 안내 상자(제목 "이야기를 더 나눠 보면 좋아요")를 보인다(design 13.7). 문장은 `prompts/system-prompt.md`의 불일치 문장 규칙을 따른다.

#### 공통 타입

- `Sentence`: `{ text: 문자열(1~120자), needsConfirmation: 불리언 }`. `needsConfirmation=true`이면 화면에서 노란 점선 상자 + "? 확인 필요" 배지, 복사에서 `[확인 필요] ` 접두, 인쇄에서 `[확인 필요]` + 이중선 + 이탤릭(design 13.5, FR-017).
- `InputRef`: `{ field, index? }`.
  - `field`: `education` / `major` / `career` / `intern` / `certification` / `training` / `strength`
  - `index`: `major`, `career`, `certification`, `training`은 필수(해당 배열 범위 안), `strength`는 필수(0~2), `education`과 `intern`은 없음.
  - 모델은 번호만 지목하고, **표시용 문구(예: "전공: 사회복지학")는 서버가 실제 입력에서 만든다.** 모델이 만든 가짜 입력 값이 화면에 나오지 않게 하기 위해서이다.

### 2.2 화면에 전달하는 결과 `ResultPayload` (서버 → 클라이언트)

`ModelOutput` 검증을 통과한 값에 서버가 표시용 값을 붙인 것이다.

| 필드 | 설명 |
|------|------|
| `jobs[i]` | `ModelOutput.jobs[i]`와 같음. 단 `linkedInputs[j]`에 `label`(항목명, 예 "전공"), `value`(실제 입력 문자열)를 추가 |
| `keywords[i]` | `ModelOutput.keywords[i]`와 같음. 추가로 `strengthText`(연결 강점의 실제 입력 문자열), `linkedJobTitle`(연결 직업명), `linkedInputs`에 `label`, `value` 추가 |
| `notice` | 공통 안내문 두 줄 (FR-016). **서버가 고정 문구를 붙인다. 모델은 안내문을 만들지 않는다.** |
| `generatedAt` | 생성 시각(ISO 문자열). 화면에 표시하지 않아도 되며 재생성 안내 구분에 쓴다 |

`notice` 고정 문구(design 2절): 1줄 "결과는 참고용이며, 상담사와 함께 검토해 활용합니다." 2줄 "입력하신 이력과의 적합도를 기준으로 한 결과이며, 채용 수요나 취업을 보장하지 않습니다."
안내문을 모델에 맡기면 빠질 수 있으므로(FR-016, SC-009) 서버·화면 코드가 항상 붙인다.

---

## 3. 클라이언트 상태

### 3.1 화면 상태 `SessionState`

| 필드 | 설명 |
|------|------|
| `input` | `ApplicantInput`의 현재 값. 생성 실패와 재시도, 입력 수정하기 후에도 유지 |
| `status` | `idle` / `loading` / `slow` / `success` / `error` |
| `result` | 마지막 성공한 `ResultPayload` 또는 없음 |
| `error` | `ApiError`(contracts 참고) 또는 없음 |
| `regenerated` | 재생성 직후 true. 재생성 안내 표시용 |
| `requestId` | 진행 중 요청 식별자. 이전 요청의 늦은 응답이 현재 화면을 덮어쓰지 않게 함 |

### 3.2 상태 전이

```
idle ──[결과 생성하기, 입력 유효]──▶ loading ──(30초)──▶ slow
loading/slow ──[성공]──▶ success
loading/slow ──[VALIDATION/PII 오류]──▶ (입력 화면으로 복귀, 필드 오류 표시)
loading/slow ──[RATE_LIMITED]──▶ error(요청 제한)
loading/slow ──[UPSTREAM_FAILED / OUTPUT_INVALID / INTERNAL]──▶ error(생성 실패)
loading/slow ──[120초 또는 TIMEOUT]──▶ error(시간 초과)
error ──[다시 시도]──▶ loading (input 그대로)
error ──[입력 수정하기]──▶ 입력 화면 (input 그대로)
success ──[다시 생성하기]──▶ loading (result는 새 결과가 성공할 때까지 유지, regenerated=true로 교체)
success ──[입력 수정하기]──▶ 입력 화면 → [결과 생성하기] → loading
새로고침 / 직접 진입 ──▶ idle (빈 화면)
```

- **재생성 중 이전 결과**: `loading` 동안 화면은 분석 중 상태를 보인다(design 14절). 새 결과가 성공하면 교체하고 "새로 생성한 결과로 바꿨어요…" 알림을 보인다(FR-024, US5-2). 실패하면 이전 결과는 **표시하지 않는다**. 이전 입력과 새 입력의 결과를 혼동하지 않기 위해서이다(US5-2).
- 한 번에 요청은 하나만 보낸다. 진행 중에는 "결과 생성하기"와 "다시 생성하기"가 비활성이다. 분석 중 화면에는 제출 수단이 없다.
- **분석 중 뒤로 가기·화면 이탈**: 진행 중 요청을 `AbortController`로 중단하고 `status`를 `idle`로 되돌린다. `input`은 유지하고 `result`는 표시하지 않는다.
- **타이머**: 30초와 120초는 요청을 보낸 시점부터 센다. "다시 시도"하면 0초부터 다시 센다. 서버가 120초 전에 `TIMEOUT`을 반환해도 같은 "시간 초과" 상태이다.
- **다른 탭**: 상태는 탭마다 독립이며 공유하지 않는다.

---

## 4. 모델에 입력 전달 형식 (프롬프트 주입 방어)

서버는 `ModelInput`을 `JSON.stringify`한 문자열로 사용자 메시지에 넣는다. 구분자 안에 있는 모든 값은 **데이터**이며 지시가 아니라고 시스템 프롬프트가 명시한다.
JSON 직렬화는 따옴표와 줄바꿈을 이스케이프하므로, 입력이 구분자를 닫고 새 지시를 시작하는 방식의 공격이 어렵다. 자세한 문구는 `prompts/system-prompt.md`.

---

## 5. 출력 검증 규칙 `validate-output`

`ModelOutput`을 Zod로 구조 검증한 **뒤** 다음 의미 검증을 한다. 하나라도 실패하면 응답 전체를 거부하고(부분 결과 금지, FR-020) 재요청 대상으로 센다.

| # | 규칙 | 근거 |
|---|------|------|
| V1 | `jobs`와 `keywords`가 각각 정확히 3개 | FR-012, FR-014, SC-002 |
| V2 | 추천 직업 `title` 중복 없음 | FR-012 |
| V3 | 모든 `InputRef`가 실제 입력에 존재(필드와 번호 범위, `intern`은 `has=true`, `career`는 `noCareer=false`일 때만) | FR-013, SC-003, 원칙 II |
| V4 | `jobs[i].linkedInputs`가 1개 이상, `keywords[i].linkedInputs`가 1개 이상이며 `strength` 참조 포함 | FR-013, 원칙 II |
| V5 | `keywords[*].strengthIndex`가 {0,1,2}를 정확히 한 번씩 | FR-015, 원칙 III |
| V6 | `keywords[i].linkedJobIndex`가 0~2 | FR-014 |
| V7 | `keywords[i].linkedInputs`가 `strength` 참조뿐이면 `mismatchNote`가 비어 있지 않고, 객관 항목(전공, 경력, 인턴, 자격증, 교육이수, 학력)이 있으면 `mismatchNote`는 `null` | FR-015, 원칙 III |
| V8 | **수치 금지**: 모든 문장에서 `%`, `퍼센트`, 숫자 + `원`/`만원`/`억`, `연봉`, `취업률`, `경쟁률`, 숫자 + `건`(공고), `채용 공고 수` 패턴 탐지. 입력에 있던 숫자(예: "2급", "3개월")가 원문에서 그대로 인용된 경우는 통과 | FR-017, SC-004, 원칙 IV |
| V9 | **부정·배제 표현 금지 목록** 탐지(나이, 공백, 이력 부재를 이유로 한 표현). 목록은 `shared/guard/banned-phrases.ts`에 두고 테스트로 관리 | FR-018, SC-005, 원칙 V |
| V10 | **단정 표현 금지**("반드시", "확실히", "보장", "합격", "확정") | 원칙 I |
| V11 | **나이 언급 금지**: 모델은 나이를 받지 않으므로 "숫자 + 세/살", "나이", "연령", "중장년", "청년", "고령" 등 연령 표현이 나오면 거부("세심"처럼 다른 단어에 든 글자는 오탐이므로 단어 단위로 검사) | FR-004, FR-018, 원칙 V |
| V12 | 문장 길이 한도와 필드 길이 한도(2.1절) | 화면·인쇄 A4 한 장, FR-022 |
| V13 | 모델 출력에 JSON 이외 텍스트가 있으면 거부(앞뒤 코드 블록 표시는 제거 후 파싱) | 원칙 VIII |
| V14 | `noCareer=false`이면 추천 직업 3개 중 1개 이상의 `linkedInputs`에 `career`가 있음 | spec Edge Cases(중장년), FR-013 |
| V15 | `description`은 2~3문장, `rationale`은 1~3문장, 각 문장 120자 이하(spec FR-012, FR-014의 한도) | FR-012, FR-014 |

V8~V11의 탐지 목록과 판단 기준은 `prompts/banned-phrases.md`가 기준이다(단어 단위 탐지, 입력 인용 예외 포함). 탐지는 완전하지 않으므로(표현을 사전으로 모두 막을 수 없다) 사람이 하는 페르소나 점검(`test-personas.md`, spec SC-013)이 보완한다.

**A4 한 장 근거(추정, 확인 필요)**: 한도를 모두 채우면 추천 직업 1개당 직업명 30 + 보조 40 + 근거 3×120 + 확인할 점 120 + 연결 항목 태그 6개 = 약 600자 안팎, 키워드 1개당 키워드 20 + 설명 3×120 + 강점·연결 직업 약 200 + 불일치 안내 약 150 = 약 750자이다. 합계는 약 4,000자이다. A4 한 장(여백 14mm, 9.5pt, 줄 간격 1.45)에 이 분량과 항목 상자가 들어가는지는 **측정하지 않았다**. 한 장을 넘으면 문장 한도(120자)를 줄인다(spec FR-022). `page.pdf` 테스트로 확인한다(CP 2).
검증이 실패해도 **실패한 응답의 본문은 로그에 남기지 않는다**(구직자 정보가 섞여 있을 수 있음). 규칙 번호(V1~V13)와 필드 경로만 기록한다.

---

## 6. design.md 13절과의 대응 요약

| design 13절 | 데이터 필드 |
|-------------|-------------|
| 13.1 참고용 안내문 두 줄 | `ResultPayload.notice` (서버 고정 문구) |
| 13.2 입력 정보 요약 | 클라이언트 `SessionState.input` (서버에서 받지 않음) |
| 13.3 추천 직업 카드: 번호, 직업명, 보조 설명 | 배열 위치 + `jobs[i].title`, `subtitle` |
| 13.3 표준 분류 확인 필요 배지 | `jobs[i].isStandardName === false` |
| 13.3 추천 근거 | `jobs[i].rationale[]` |
| 13.3 연결된 입력 항목 태그 | `jobs[i].linkedInputs[]` (`label: value`) |
| 13.3 상담에서 함께 확인할 점 | `jobs[i].checkPoint` |
| 13.4 키워드 카드: 번호, 키워드 | 배열 위치 + `keywords[i].keyword` |
| 13.4 연결 강점 / 연결 직업 | `strengthText` / `linkedJobTitle` |
| 13.4 연결된 입력 항목 Tag (제안) | `keywords[i].linkedInputs` 중 `field !== 'strength'`인 항목의 `label: value`. 없으면 영역 생략 |
| 13.4 설명 | `keywords[i].description[]` |
| 13.5 확인 필요 | `Sentence.needsConfirmation` |
| 13.7 불일치 안내, "상담에서 함께 보강해요" 태그 | `keywords[i].mismatchNote !== null` |
