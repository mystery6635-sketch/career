## 사용 규칙 (먼저 읽기)

직업상담사가 구직자 정보를 입력하고 AI 추천 결과를 함께 확인하는 도구의 디자인 시스템이다. 화면은 한국어이며, 상태는 색만으로 전하지 않고 **아이콘 + 글자**를 함께 쓴다.

### 감싸기와 설정

- `Header`와 `ButtonLink`는 화면 이동 링크를 쓰므로 반드시 `MemoryRouter`(번들이 `window.CounselingUi.MemoryRouter`로 내보냄) 안에 둔다. 없으면 렌더가 실패한다.
- 스타일은 `styles.css` 한 파일을 불러오면 모두 들어온다. 글꼴은 IBM Plex Sans KR(본문)과 IBM Plex Mono(kicker)이며 같은 파일에서 불러온다.
- 어두운 배경(`--navy-950`) 위에 올릴 때는 그 영역에 `data-surface="dark"`를 붙인다. 포커스 윤곽선이 노란색(`--focus-dark`)으로 바뀐다.

```jsx
const { MemoryRouter, Header, PageHeader, Field, Button } = window.CounselingUi;
<MemoryRouter>
  <Header variant="solid" />
  <main style={{ maxWidth: 1176, margin: '0 auto', padding: 'var(--space-40) var(--gutter)' }}>
    <PageHeader kicker="STEP 01 · 입력" title="구직자 정보 입력" />
    <Field label="업종" required hint="근무한 업종을 적어 주세요.">
      {(p) => <input className="control" {...p} />}
    </Field>
    <Button variant="teal" icon="→">결과 생성하기</Button>
  </main>
</MemoryRouter>
```

### 스타일 방식: 컴포넌트 + CSS 변수

- 이 시스템에는 유틸리티 클래스 체계가 없다. 레이아웃 접착(간격, 정렬)만 인라인 `style`로 쓰고, **색·간격·글자 크기는 항상 `var(--…)` 토큰**으로 쓴다. 새 hex 색이나 임의의 px는 만들지 않는다.
- 색: `--navy-950` `--navy-900` `--navy-800`(어두운 면), `--teal-700` `--teal-800`(주 행동·링크), `--mint` `--mint-ink`(어두운 배경 위 강조), `--surface` `--card` `--ink` `--muted` `--rule` `--field`, 오류 `--err` `--err-bg`, 확인 필요·경고 `--need-bg` `--need-bd` `--need-ink`, 정보 `--soft-bg` `--soft-bd` `--soft-ink`, 성공 `--success`.
- 간격: 값으로 이름 붙인 `--space-2` `--space-4` `--space-6` `--space-8` `--space-10` `--space-12` `--space-14` `--space-16` `--space-20` `--space-24` `--space-32` `--space-40` `--space-64`. 카드 안쪽 `--card-pad`, 카드 사이 `--card-gap`, 폼 항목 사이 `--form-item-gap`, 좌우 여백 `--gutter`, 콘텐츠 최대 폭 `--content-max`(1176px).
- 반경은 `--radius`(6px) `--radius-sm`(4px) `--radius-xs`(3px)뿐이다. 그림자는 쓰지 않는다(카드에 그림자 금지). 숫자 게이지·진행률 막대·이모지도 쓰지 않는다.
- 입력 요소 모양이 필요하면 `Input`/`Textarea`/`Select`를 쓰고, 다른 요소를 `Field`로 감쌀 때만 `className="control"`을 붙인다.

### 컴포넌트 고르기

- 버튼: `Button`(동작), `ButtonLink`(이동). `variant`는 `mint`·`ghost`(어두운 배경용), `teal`(주), `outline`(보조), `danger`, `add`. 화살표 아이콘(`icon="→"`)은 글자 뒤에 나온다. 비활성 사유는 `disabledReason`에 글자로 쓴다.
- 폼: `Input`·`Textarea`·`Select`는 `label`, `required`(true=필수, false=선택), `hint`, `maxLength`(글자 수 안내 자동), `error`, `warning`을 받는다. 선택지는 `Radio`·`Checkbox`.
- 상태: `Alert`(`info`·`warning`·`error`·`success`), `Badge`(`progress`·`error`·`warning`·`info`), `NeedsConfirmBadge`, `StandardNameBadge`. 연결 항목은 `Tag name="전공" value="…"`.
- 면: `Card`(`default`·`inset`, 영역 구분용 `areaA`·`areaB`). 화면 머리: `Header`, `PageHeader`, 본문 바로가기 `SkipLink`.

### 더 자세히 볼 곳

`styles.css`(와 `_ds_bundle.css`)에 모든 토큰과 컴포넌트 스타일이 있고, 컴포넌트마다 `components/general/<Name>/<Name>.prompt.md`와 `<Name>.d.ts`가 있다. 스타일을 쓰기 전에 이 파일들을 먼저 확인한다.
