// design §21 분기. CSS 미디어 쿼리는 변수를 쓸 수 없어 tokens.css에 같은 값을 직접 적는다.
export const BREAKPOINTS = { wide: 1199, desktop: 1100, tablet: 1023, mobile: 767 } as const
