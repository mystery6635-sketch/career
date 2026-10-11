import '@testing-library/jest-dom/vitest'

// jsdom은 scrollTo를 구현하지 않는다(화면 전환 시 맨 위로 이동하는 코드가 호출한다).
window.scrollTo = () => undefined
