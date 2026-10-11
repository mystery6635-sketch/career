// 테스트 공용 가상 데이터(실제 사람의 정보가 아니다). contracts/generate-api.md 5절 예시와 같다.
import type { GenerateRequest } from '../../shared/schema/request.js'

export function validRequest(): GenerateRequest {
  return {
    education: { level: 'bachelor', status: 'graduated' },
    majors: ['사회복지학'],
    noCareer: false,
    careers: [{ jobTitle: '생활지도 교사', industry: '지역아동센터', period: '2년' }],
    intern: { has: false },
    certifications: ['사회복지사 2급'],
    trainings: [],
    strengths: ['상대의 이야기를 끝까지 듣는다', '맡은 일은 계획을 세워 끝까지 마무리한다', '처음 보는 사람과도 대화를 편하게 이끈다'],
  }
}

/** validRequest()에 맞는, 검증을 통과하는 모델 출력(JSON 객체). */
export function validModelOutput() {
  const sentence = (text: string, needsConfirmation = false) => ({ text, needsConfirmation })
  const job = (title: string, extra: { field: string; index?: number }[]) => ({
    title,
    subtitle: '입력 이력과 이어지는 업무',
    isStandardName: true,
    rationale: [sentence('사회복지학을 전공했고 사회복지사 2급 자격증이 있어요.')],
    linkedInputs: [{ field: 'major', index: 0 }, ...extra],
    checkPoint: sentence('업무 범위는 상담에서 함께 이야기 나누며 확인해 보면 좋아요.'),
  })
  const keyword = (name: string, i: number) => ({
    keyword: name,
    strengthIndex: i,
    linkedJobIndex: i,
    description: [
      sentence('자기소개서에서 이 강점을 구체적인 장면과 함께 쓰면 좋아요.'),
      sentence('경력과 연결해 한두 문장으로 풀어 보세요.'),
    ],
    linkedInputs: [{ field: 'strength', index: i }, { field: 'career', index: 0 }],
    mismatchNote: null,
  })
  return {
    jobs: [
      job('사회복지사', [{ field: 'career', index: 0 }]),
      job('상담 지원 담당자', [{ field: 'certification', index: 0 }]),
      job('아동 돌봄 코디네이터', [{ field: 'strength', index: 0 }]),
    ],
    keywords: [keyword('경청', 0), keyword('계획성', 1), keyword('소통', 2)],
  }
}

export function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
