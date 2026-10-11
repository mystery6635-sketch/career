# 디자인 구조 검사 결과

위반 합계: 0건 (허용 목록 제외)

## 1. 하드코딩된 색(#hex, rgb(, hsl() — tokens.css 밖: 0건

- 없음

## 2. 하드코딩된 간격·글자 크기(px 리터럴, 1px·0px 제외) — 토큰 밖: 0건

- 없음

## 3. 공통 컴포넌트를 거치지 않은 직접 요소: 0건

- 없음

## 4. 토큰 이름·값 불일치(design §16): 0건

- 없음

## 허용 목록(audit-design.mjs `ALLOW`)

- component src/components/input/MobileAccordion.tsx: 아코디언 머리글은 aria-expanded를 가진 전용 토글 버튼이라 .btn(Button)과 모양·역할이 다르다. 스타일은 .form-section__toggle.
- token-use --motion-delay: 요소마다 인라인으로 정하는 애니메이션 지연 값이라 tokens.css에 없다.
