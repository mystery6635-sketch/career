import { test, expect } from '@playwright/test'

test('앱이 열리고 한국어 문서 제목을 가진다', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('초기상담 도우미')
})

// 서버는 구현되어 있다(Phase 6). 개발 서버는 같은 핸들러를 쓰고 LLM은 mock 공급자이다.
// 요청 제한(10분 20회)에 걸리지 않도록 POST는 뷰포트당 한 번만 보낸다. 검증 오류 경로는 tests/contract에서 확인한다.
test('/api/generate: GET은 405 ApiError(JSON)', async ({ request }) => {
  const res = await request.get('/api/generate')
  expect(res.status()).toBe(405)
  expect(res.headers()['allow']).toBe('POST')
  const body = await res.json()
  expect(body.ok).toBe(false)
  expect(body.error.code).toBe('VALIDATION_FAILED')
  expect(body.error.requestId).toMatch(/^r_/)
})

test('/api/generate: 정상 요청은 계약대로 결과를 돌려준다(mock 공급자)', async ({ request }) => {
  const res = await request.post('/api/generate', {
    data: {
      education: { level: 'bachelor', status: 'graduated' },
      majors: ['식품영양학'],
      noCareer: false,
      careers: [{ jobTitle: '매장 직원', industry: '카페', period: '1년 6개월' }],
      intern: { has: false },
      certifications: ['위생사'],
      trainings: [],
      strengths: ['성실함', '리더십이 있다', '사람들과 잘 지낸다'],
    },
  })
  const body = await res.json()
  expect(res.status(), JSON.stringify(body)).toBe(200)
  expect(body.ok).toBe(true)
  expect(body.result.jobs).toHaveLength(3)
  expect(body.result.keywords).toHaveLength(3)
})
