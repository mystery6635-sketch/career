// 페르소나별 Mock 결과(data-model 2.2 형태). 수치·부정 표현·연령 표현을 쓰지 않는다.
// 표시용 label/value는 실제 입력에서 만든다(서버가 하는 일과 같은 규칙).
import { FIELD_LABELS, INPUT_PAGE, NOTICE_LINES } from '@shared/messages'
import type {
  ApplicantInput,
  InputField,
  LinkedInput,
  ResultJob,
  ResultKeyword,
  ResultPayload,
  Sentence,
} from '@shared/schema'
import { PERSONAS, type PersonaId } from './personas'

type Ref = [InputField, number?]

const levelLabel = (v: string) => INPUT_PAGE.levelOptions.find((o) => o.value === v)?.label ?? v
const statusLabel = (v: string) => INPUT_PAGE.statusOptions.find((o) => o.value === v)?.label ?? v

export function resolveLink(input: ApplicantInput, [field, index = 0]: Ref): LinkedInput {
  const label = FIELD_LABELS[field]
  switch (field) {
    case 'education':
      return { field, label, value: `${levelLabel(input.education.level)} ${statusLabel(input.education.status)}` }
    case 'major':
      return { field, index, label, value: input.majors[index] }
    case 'career': {
      const c = input.careers[index]
      return { field, index, label, value: `${c.jobTitle} · ${c.industry} · ${c.period}` }
    }
    case 'intern':
      return { field, label, value: `${input.intern.content} (${input.intern.period})` }
    case 'certification':
      return { field, index, label, value: input.certifications[index] }
    case 'training': {
      const t = input.trainings[index]
      return { field, index, label, value: `${t.courseName} · ${t.period}` }
    }
    case 'strength':
      return { field, index, label, value: input.strengths[index] }
  }
}

const s = (text: string, needsConfirmation = false): Sentence => ({ text, needsConfirmation })

interface JobSpec {
  title: string
  subtitle: string
  standard?: boolean
  rationale: Sentence[]
  links: Ref[]
  checkPoint: Sentence
}

interface KeywordSpec {
  keyword: string
  strength: 0 | 1 | 2
  job: 0 | 1 | 2
  description: Sentence[]
  links: Ref[]
  mismatchNote?: string
}

export function buildResult(input: ApplicantInput, jobs: JobSpec[], keywords: KeywordSpec[]): ResultPayload {
  const builtJobs = jobs.map(
    (j): ResultJob => ({
      title: j.title,
      subtitle: j.subtitle,
      isStandardName: j.standard ?? true,
      rationale: j.rationale,
      linkedInputs: j.links.map((r) => resolveLink(input, r)),
      checkPoint: j.checkPoint,
    }),
  ) as ResultPayload['jobs']
  const builtKeywords = keywords.map(
    (k): ResultKeyword => ({
      keyword: k.keyword,
      strengthIndex: k.strength,
      linkedJobIndex: k.job,
      description: k.description,
      linkedInputs: [{ ...resolveLink(input, ['strength', k.strength]) }, ...k.links.map((r) => resolveLink(input, r))],
      mismatchNote: k.mismatchNote ?? null,
      strengthText: input.strengths[k.strength],
      linkedJobTitle: builtJobs[k.job].title,
    }),
  ) as ResultPayload['keywords']
  return {
    jobs: builtJobs,
    keywords: builtKeywords,
    notice: [NOTICE_LINES[0], NOTICE_LINES[1]],
    generatedAt: '2026-10-11T00:00:00.000Z',
  }
}

const MISMATCH =
  '이 강점은 지금 입력된 이력만으로는 뒷받침하는 내용이 아직 적어요. 상담에서 직접 경험했던 장면을 함께 떠올려 보면 좋은 근거가 될 수 있어요.'

const p1 = PERSONAS.P1
const p2 = PERSONAS.P2
const p3 = PERSONAS.P3
const p4 = PERSONAS.P4
const p5 = PERSONAS.P5

export const MOCK_RESULTS: Record<PersonaId, ResultPayload> = {
  P1: buildResult(
    p1,
    [
      {
        title: '콘텐츠 에디터',
        subtitle: '글과 자료를 다듬는 편집 업무',
        rationale: [s('국어국문학 전공과 글을 읽고 핵심을 정리하는 강점이 글을 다듬는 업무와 이어져요.')],
        links: [['major', 0], ['strength', 0]],
        checkPoint: s('관심 있는 콘텐츠 분야를 상담에서 함께 이야기해 보면 좋아요.'),
      },
      {
        title: '문서 관리 담당',
        subtitle: '사무 지원 · 기록 정리',
        standard: false,
        rationale: [s('약속한 기한을 지키는 강점이 문서를 정해진 때까지 정리하는 일과 닿아 있어요.')],
        links: [['strength', 2], ['education']],
        checkPoint: s('이 직무에서 요구하는 자격이나 프로그램 사용 범위는 확인이 필요해요.', true),
      },
      {
        title: '자료 조사원',
        subtitle: '리서치 지원',
        rationale: [
          s('모르는 것은 끝까지 찾아보는 강점이 자료를 찾고 정리하는 일과 이어져요.'),
          s('국어국문학 전공에서 쌓은 글 읽기 경험도 함께 활용할 수 있어요.'),
        ],
        links: [['strength', 1], ['major', 0], ['education']],
        checkPoint: s('관심 있는 조사 분야를 상담에서 함께 좁혀 보면 좋아요.'),
      },
    ],
    [
      {
        keyword: '핵심 정리',
        strength: 0,
        job: 0,
        description: [
          s('긴 글에서 중요한 내용을 골라 간단히 정리하는 힘을 보여 주는 키워드예요.'),
          s('자기소개서에서는 전공 공부에서 글을 요약했던 장면과 함께 쓸 수 있어요.'),
        ],
        links: [['major', 0]],
      },
      {
        keyword: '끝까지 찾아보는 태도',
        strength: 1,
        job: 2,
        description: [
          s('모르는 내용을 스스로 찾아 확인하는 태도를 직무 언어로 바꾼 키워드예요.'),
          s('자료 조사 업무와 연결해 설명할 수 있어요.'),
        ],
        links: [],
        mismatchNote: MISMATCH,
      },
      {
        keyword: '기한 준수',
        strength: 2,
        job: 1,
        description: [
          s('맡은 일을 정해진 때까지 마무리하는 모습을 보여 주는 키워드예요.'),
          s('문서를 제때 정리하는 업무와 이어서 이야기할 수 있어요.'),
        ],
        links: [['education']],
      },
    ],
  ),

  P2: buildResult(
    p2,
    [
      {
        title: '사무 행정원',
        subtitle: '문서 · 일정 · 자료 관리',
        rationale: [
          s('사무 보조로 일한 경력과 컴퓨터활용능력 2급이 사무 행정 업무와 바로 이어져요.'),
          s('사무행정 전공도 같은 방향의 근거가 돼요.'),
        ],
        links: [['career', 0], ['certification', 0], ['major', 0]],
        checkPoint: s('이전 업무에서 가장 자신 있었던 일을 상담에서 함께 이야기해 보면 좋아요.'),
      },
      {
        title: '고객 상담 담당',
        subtitle: '문의 응대 · 안내',
        rationale: [s('고객 응대 상담원으로 일한 경력과 고객의 말을 끝까지 듣는 강점이 상담 업무와 이어져요.')],
        links: [['career', 1], ['strength', 1]],
        checkPoint: s('응대했던 문의의 종류를 상담에서 함께 정리해 보면 좋아요.'),
      },
      {
        title: '회계 사무원',
        subtitle: '전표 정리 · 장부 관리',
        standard: false,
        rationale: [
          s('전산회계 2급과 꼼꼼하게 숫자를 맞추는 강점이 장부를 다루는 일과 이어져요.'),
          s('엑셀 데이터 정리 과정을 마친 경험도 자료를 다루는 데 도움이 돼요.'),
        ],
        links: [['certification', 1], ['strength', 0], ['training', 0]],
        checkPoint: s('실제 회계 업무의 범위와 필요한 자격은 확인이 필요해요.', true),
      },
    ],
    [
      {
        keyword: '정확한 숫자 관리',
        strength: 0,
        job: 2,
        description: [
          s('숫자를 꼼꼼히 맞추는 강점을 직무 언어로 바꾼 키워드예요.'),
          s('전산회계 2급 공부와 함께 구체적으로 설명할 수 있어요.'),
        ],
        links: [['certification', 1]],
      },
      {
        keyword: '경청하는 응대',
        strength: 1,
        job: 1,
        description: [
          s('고객의 말을 끝까지 듣고 필요한 내용을 파악하는 모습을 보여 주는 키워드예요.'),
          s('고객 응대 상담원으로 일한 경험과 이어 쓸 수 있어요.'),
        ],
        links: [['career', 1]],
      },
      {
        keyword: '빠른 습득력',
        strength: 2,
        job: 0,
        description: [
          s('새로운 프로그램을 빨리 익히는 모습을 보여 주는 키워드예요.'),
          s('엑셀 데이터 정리 과정을 들은 경험과 함께 설명할 수 있어요.'),
        ],
        links: [['training', 0]],
      },
    ],
  ),

  P3: buildResult(
    p3,
    [
      {
        title: '품질관리 전문가',
        subtitle: '제조 품질 점검 · 개선',
        rationale: [
          s('품질 검사원 6년과 생산 관리 팀장 18년의 경력, 품질경영기사 자격이 품질관리 업무와 이어져요.'),
          s('기계공학 전공도 같은 방향의 근거가 돼요.'),
        ],
        links: [['career', 0], ['career', 1], ['certification', 0], ['major', 0]],
        checkPoint: s('관심 있는 산업 분야를 상담에서 함께 이야기해 보면 좋아요.'),
      },
      {
        title: '안전관리자',
        subtitle: '현장 안전 점검 · 교육',
        rationale: [
          s('안전관리자 양성 과정을 마친 경험과 안전 규칙을 끝까지 지키는 강점이 안전 관리 업무와 이어져요.'),
        ],
        links: [['training', 0], ['strength', 2], ['career', 0]],
        checkPoint: s('안전관리자로 일하는 데 필요한 자격 요건은 확인이 필요해요.', true),
      },
      {
        title: '생산 현장 멘토',
        subtitle: '후배 지도 · 업무 전수',
        standard: false,
        rationale: [
          s('후배에게 일을 차근히 알려 주는 강점과 오랜 생산 관리 경력이 현장 지도 업무와 이어져요.'),
        ],
        links: [['strength', 1], ['career', 0]],
        checkPoint: s('지도 경험이 있는 장면을 상담에서 함께 떠올려 보면 좋아요.'),
      },
    ],
    [
      {
        keyword: '현장 문제 발견',
        strength: 0,
        job: 0,
        description: [
          s('현장에서 문제를 빠르게 찾아내는 힘을 보여 주는 키워드예요.'),
          s('품질 검사원으로 일한 경험과 함께 구체적인 사례를 붙일 수 있어요.'),
        ],
        links: [['career', 1]],
      },
      {
        keyword: '차근한 업무 전수',
        strength: 1,
        job: 2,
        description: [
          s('후배에게 일을 차근히 알려 주는 모습을 보여 주는 키워드예요.'),
          s('생산 관리 팀장으로 일한 경험과 이어 쓸 수 있어요.'),
          s('가르쳤던 장면을 한두 가지 골라 두면 더 좋아요.'),
        ],
        links: [['career', 0]],
      },
      {
        keyword: '안전 규칙 준수',
        strength: 2,
        job: 1,
        description: [
          s('안전 규칙을 끝까지 지키는 태도를 직무 언어로 바꾼 키워드예요.'),
          s('안전관리자 양성 과정을 마친 경험과 함께 설명할 수 있어요.'),
        ],
        links: [['training', 0]],
      },
    ],
  ),

  P4: buildResult(
    p4,
    [
      {
        title: '식품 위생 관리원',
        subtitle: '위생 점검 · 기록 관리',
        rationale: [
          s('식품영양학 전공과 위생사 자격이 위생 점검 업무와 바로 이어져요.'),
        ],
        links: [['major', 0], ['certification', 0]],
        checkPoint: s('관심 있는 식품 분야를 상담에서 함께 이야기해 보면 좋아요.'),
      },
      {
        title: '급식 · 식단 관리 담당',
        subtitle: '식단 구성 · 급식 운영 지원',
        standard: false,
        rationale: [s('식품영양학 전공이 식단을 구성하고 관리하는 일과 이어져요.')],
        links: [['major', 0]],
        checkPoint: s('실제 담당 업무의 범위와 필요한 자격은 확인이 필요해요.', true),
      },
      {
        title: '매장 운영 담당',
        subtitle: '고객 응대 · 매장 관리',
        rationale: [
          s('카페 매장에서 일한 경험이 고객을 응대하고 매장을 운영하는 일과 이어져요.'),
          s('사람들과 잘 지내는 강점도 함께 쓸 수 있어요.'),
        ],
        links: [['career', 0], ['strength', 2]],
        checkPoint: s('카페에서 맡았던 역할을 상담에서 함께 정리해 보면 좋아요.'),
      },
    ],
    [
      {
        keyword: '꾸준한 책임감',
        strength: 0,
        job: 0,
        description: [
          s('성실함을 정해진 절차를 매번 지키는 일처럼 구체적인 직무 언어로 바꾼 키워드예요.'),
          s('위생사 자격과 함께 위생 점검 업무에 연결해 설명할 수 있어요.'),
        ],
        links: [['certification', 0]],
      },
      {
        keyword: '팀을 이끄는 힘',
        strength: 1,
        job: 2,
        description: [
          s('리더십을 역할을 나누고 함께 일하는 모습으로 풀어 쓸 수 있는 키워드예요.'),
          s('상담에서 구체적인 장면을 떠올려 보면 설명이 더 쉬워져요.'),
        ],
        links: [],
        mismatchNote:
          '이 강점은 지금 입력된 이력만으로는 뒷받침하는 내용이 아직 적어요. 상담에서 팀을 이끌거나 역할을 맡았던 경험을 함께 떠올려 보면 좋은 근거가 될 수 있어요.',
      },
      {
        keyword: '원만한 소통',
        strength: 2,
        job: 2,
        description: [
          s('사람들과 편하게 지내는 모습을 고객 응대 언어로 바꾼 키워드예요.'),
          s('카페 매장에서 일한 경험과 이어 쓸 수 있어요.'),
        ],
        links: [['career', 0]],
      },
    ],
  ),

  P5: buildResult(
    p5,
    [
      {
        title: '영업 관리 담당',
        subtitle: '영업 계획 · 고객 관리',
        rationale: [
          s('IT 서비스 영업 사원으로 일한 경력과 경영학 전공이 영업 관리 업무와 이어져요.'),
        ],
        links: [['career', 0], ['major', 0]],
        checkPoint: s('관심 있는 영업 분야를 상담에서 함께 이야기해 보면 좋아요.'),
      },
      {
        title: '법인 영업 담당',
        subtitle: '기업 고객 제안 · 협상',
        rationale: [
          s('고객 요구를 정확히 파악하는 강점과 협상을 차분하게 이어 가는 강점이 기업 영업과 이어져요.'),
        ],
        links: [['strength', 0], ['strength', 2], ['career', 0]],
        checkPoint: s('담당했던 고객의 종류를 상담에서 함께 정리해 보면 좋아요.'),
      },
      {
        title: '고객 성공 매니저',
        subtitle: '고객 도입 지원 · 관계 관리',
        standard: false,
        rationale: [
          s('영업 사원 경력과 인턴 경험이 고객을 돕고 관계를 이어 가는 일과 닿아 있어요.'),
        ],
        links: [['career', 0], ['intern']],
        checkPoint: s('이 직무가 맡는 업무 범위는 확인이 필요해요.', true),
      },
    ],
    [
      {
        keyword: '고객 요구 파악',
        strength: 0,
        job: 0,
        description: [
          s('고객이 필요한 내용을 정확히 알아내는 힘을 보여 주는 키워드예요.'),
          s('영업 사원으로 일한 경험과 함께 사례를 붙일 수 있어요.'),
        ],
        links: [['career', 0]],
      },
      {
        keyword: '강점 다시 정리하기',
        strength: 1,
        job: 2,
        description: [
          s('입력된 문장은 이력과 연결할 내용이 없어 그대로 쓰기 어려워요.'),
          s('상담에서 이 강점을 어떤 말로 풀면 좋을지 함께 정리해 보면 좋아요.'),
        ],
        links: [],
        mismatchNote:
          '이 강점은 지금 입력된 이력만으로는 뒷받침하는 내용이 아직 적어요. 상담에서 이 강점을 보여 줄 수 있는 경험을 함께 떠올려 보면 좋은 근거가 될 수 있어요.',
      },
      {
        keyword: '차분한 협상',
        strength: 2,
        job: 1,
        description: [
          s('협상을 차분하게 이어 가는 모습을 보여 주는 키워드예요.'),
          s('영업 경력과 이어서 설명할 수 있어요.'),
        ],
        links: [['career', 0]],
      },
    ],
  ),
}

// ---------- 최대 길이 결과(A4 한 장 확인용, data-model 2.1 한도) ----------

/** 정확히 `length`자(공백 포함)가 되도록 문장을 채운다. */
function sized(base: string, length: number): string {
  let text = base
  while ([...text].length < length) text += ` ${base}`
  return [...text].slice(0, length - 1).join('') + '.'
}

const long120 = (needs = false): Sentence => s(sized('품질 점검과 현장 지도를 함께 맡아 온 경험이 이 업무와 이어져요', 120), needs)

function maxLinks(): Ref[] {
  return [['education'], ['major', 0], ['career', 0], ['career', 1], ['certification', 0], ['training', 0]]
}

export const MAX_LENGTH_RESULT: ResultPayload = buildResult(
  p3,
  [0, 1, 2].map((i) => ({
    title: sized(`최대 길이 직업명 ${i + 1}`, 30),
    subtitle: sized(`최대 길이 보조 설명 ${i + 1}`, 40),
    standard: i !== 1,
    rationale: [long120(), long120(), long120(true)],
    links: maxLinks(),
    checkPoint: long120(i === 0),
  })),
  [0, 1, 2].map((i) => ({
    keyword: sized(`최대 길이 키워드 ${i + 1}`, 20),
    strength: i as 0 | 1 | 2,
    job: i as 0 | 1 | 2,
    description: [long120(), long120(), long120(i === 1)],
    links: i === 2 ? [] : maxLinks().slice(0, 5), // 강점 1개 + 5개 = 연결 항목 최대 6개
    mismatchNote: i === 2 ? sized(MISMATCH, 200) : undefined,
  })),
)
