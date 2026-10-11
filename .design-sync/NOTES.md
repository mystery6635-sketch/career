# design-sync 메모

## 구성 (이 저장소는 앱이라서 라이브러리 빌드를 따로 둔다)

- 진입점: `src/design-system.ts`(앱 컴포넌트 `src/components/ui/*` 15종을 내보냄). 앱(`main.tsx`)은 이 파일을 쓰지 않는다.
- 빌드: `npm run build:lib` = `vite build -c vite.lib.config.ts`(JS와 `style.css`) + `tsc -p tsconfig.lib.json`(`.d.ts`, `dist-lib/types/src/design-system.d.ts`). `package.json`의 `module`/`types`가 이 결과를 가리킨다.
- 변환기 실행(저장소 루트에서): `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist-lib/index.es.js --out ./ds-bundle [--remote .design-sync/.cache/remote-sync.json]`. 재동기화 전에 스킬의 스크립트를 `.ds-sync/`로 다시 복사한다(`package-build.mjs`, `package-validate.mjs`, `package-capture.mjs`, `resync.mjs`, `lib`, `storybook`).
- 대상 프로젝트: `초기상담 도우미 디자인 시스템` (`config.json`의 `projectId`).
- 컴포넌트 17개: Alert, Badge, Button, ButtonLink, Card, Checkbox, Field, Header, Input, NeedsConfirmBadge, PageHeader, Radio, Select, SkipLink, StandardNameBadge, Tag, Textarea. 미리보기는 `.design-sync/previews/`에 직접 작성했고 전부 good으로 평가했다.

## 글꼴

- 라이브러리 모드(vite)는 CSS의 글꼴을 base64로 끼워 넣어 `style.css`가 12MB가 된다. 그래서 `src/design-system.ts`에서 `@fontsource`를 불러오지 않고 `config.json`의 `extraFonts`(`.design-sync/fonts.css`)로 싣는다.
- `.design-sync/fonts.css`는 `node scripts/make-design-fonts.mjs`로 만든다(@fontsource CSS에서 woff2만 가리키게 바꿈). 글꼴을 추가하거나 가중치를 바꾸면 다시 만든다. 업로드되는 글꼴 파일은 382개(약 5.6MB)다.

## 알아 둘 점

- `Header`와 `ButtonLink`는 `Link`를 쓰므로 `MemoryRouter`가 필요하다. `config.json`의 `provider`가 이를 감싸고 `extraEntries: ["react-router-dom"]`가 번들에 넣는다.
- README의 컴포넌트 한 줄 설명은 JSDoc의 한글이 걸러져서 비어 보인다(`ButtonLink`만 JSDoc이 있어 깨진 글자가 남음). 필요하면 컴포넌트에 영문 JSDoc 첫 줄을 추가한다.
- Tailwind preflight가 `h1`~`h3`의 굵기를 상속으로 바꾼다. 미리보기에서 제목을 직접 쓸 때는 `fontWeight: 700`을 지정한다(Card 미리보기에서 겪음).
- `data-surface="dark"`를 붙인 영역 안에서는 포커스 윤곽선이 노란색이 된다. 어두운 배경 위 미리보기에는 이 속성을 쓴다.
- Windows에서 Bash 작업 디렉터리가 `ds-bundle` 안에 있으면 변환기가 `rmSync`에서 EPERM으로 실패한다. 작업 디렉터리를 저장소 루트로 돌리고 다시 실행한다.
- 업로드 도구는 파일마다 `localPath`가 필요하다(`path`만으로는 거부됨). 파일이 많은 `fonts/`는 96개씩 나눠 올렸다.

## Re-sync risks

- `src/components/ui/*`나 `src/styles/*`가 바뀌면 `dist-lib`를 먼저 다시 빌드(`npm run build:lib`)해야 한다. 안 하면 변환기가 이전 빌드를 올린다.
- `.design-sync/conventions.md`는 토큰·컴포넌트 이름을 직접 적었다. 토큰(`--space-*` 등)이나 컴포넌트 props가 바뀌면 다시 검증해야 한다(이름이 없어지면 디자인 에이전트가 잘못된 이름을 쓴다).
- 그라데이션 위 글자 대비는 자동 검사에서 계산되지 않는다(design.md §22). 사람이 확인해야 한다.
- 앱 화면(메인·입력·결과)과 시안 v3의 화면 단위 비교는 이 동기화의 범위가 아니다. 컴포넌트 단위 미리보기만 검증했다.
- 렌더 검사는 playwright(저장소의 `@playwright/test` 1.64, chromium-headless-shell 1248)로 했다.
