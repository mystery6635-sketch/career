// 사용자에게 보이는 문구의 단일 원천(원칙 XII, data-model 1.5절). 문구를 코드 곳곳에 쓰지 않는다.
// 이 파일은 클라이언트와 서버가 함께 쓴다. 이후 Phase에서 입력 오류 문구 등을 이어서 추가한다.

/** 정식 이름 확정 전 가칭(design §2). 확정 시 이 상수만 바꾼다. */
export const SERVICE_NAME = '초기상담 도우미'

export const NOTICE_LINES = [
  '결과는 참고용이며, 상담사와 함께 검토해 활용합니다.',
  '입력하신 이력과의 적합도를 기준으로 한 결과이며, 채용 수요나 취업을 보장하지 않습니다.',
] as const

export const COMMON = {
  skipToMain: '본문 바로가기',
  howToUse: '이용 방법',
  required: '(필수)',
  optional: '(선택)',
  retry: '다시 시도',
  editInput: '입력 수정하기',
  goInput: '구직자 정보 입력하러 가기',
  inputKept: '입력하신 내용은 그대로 남아 있습니다.',
  remove: '삭제',
  clear: '비우기',
  chipA: 'A',
  chipB: 'B',
} as const

export const needsConfirmLabel = '확인 필요'
export const standardNameConfirmLabel = '표준 분류 확인 필요'

/** "n / 최대 N자". 한도에 닿으면 "(최대)"를 붙인다(design §11). */
export function charCount(current: number, max: number): string {
  return `${current} / 최대 ${max}자${current >= max ? ' (최대)' : ''}`
}

export function maxItemsReached(max: number): string {
  return `최대 ${max}개까지 입력할 수 있어요`
}

/** "없음" 선택 시 연결 입력이 비활성이 되는 이유(글자로 알림). */
export function noneSelectedReason(label: string): string {
  return `선택됨: ${label}. 아래 입력은 사용하지 않아요.`
}

export const ANALYSIS_STEPS = [
  '입력 내용을 확인하고 있어요',
  '입력 항목과 잘 맞는 직업을 찾고 있어요',
  '자기소개서 키워드를 정리하고 있어요',
  '결과를 마무리하고 있어요',
] as const

export const STEP_STATE_LABEL = { done: '완료', active: '진행 중', waiting: '대기' } as const

export type StatusVariant =
  | 'analyzing'
  | 'empty'
  | 'failed'
  | 'invalid-output'
  | 'timeout'
  | 'rate-limited'

export type StatusBadgeKind = 'progress' | 'error' | 'warning' | 'info'

export const STATUS_SCREENS: Record<
  StatusVariant,
  { badge: string; badgeKind: StatusBadgeKind; title: string; body: string; actions: ('retry' | 'edit' | 'goInput')[] }
> = {
  analyzing: {
    badge: '분석 중',
    badgeKind: 'progress',
    title: '입력하신 내용을 살펴보고 있어요',
    body: '잠시만 기다려 주세요. 입력 내용은 그대로 유지됩니다.',
    actions: [],
  },
  empty: {
    badge: '입력 필요',
    badgeKind: 'info',
    title: '아직 입력된 정보가 없어요',
    body: '결과는 구직자 정보를 입력한 뒤에 확인할 수 있어요. 입력 페이지에서 정보를 입력해 주세요.',
    actions: ['goInput'],
  },
  failed: {
    badge: '생성 실패',
    badgeKind: 'error',
    title: '결과를 만들지 못했어요',
    body: '연결이 원활하지 않았어요. 입력하신 내용은 그대로 남아 있습니다. 다시 시도해 주세요.',
    actions: ['retry', 'edit'],
  },
  'invalid-output': {
    badge: '생성 실패',
    badgeKind: 'error',
    title: '결과를 만들지 못했어요',
    body: '결과 형식이 맞지 않아 보여드릴 수 없어요. 입력하신 내용은 그대로 남아 있습니다. 다시 시도해 주세요.',
    actions: ['retry', 'edit'],
  },
  timeout: {
    badge: '시간 초과 · 생성 중단',
    badgeKind: 'error',
    title: '시간이 너무 오래 걸려 중단했어요',
    body: '시간이 너무 오래 걸려 멈췄어요. 입력하신 내용은 그대로 남아 있습니다. 다시 시도해 주세요.',
    actions: ['retry', 'edit'],
  },
  'rate-limited': {
    badge: '요청 제한',
    badgeKind: 'warning',
    title: '요청이 잠시 많아요',
    body: '짧은 시간에 요청이 너무 많았어요. 잠시 기다린 뒤 다시 시도해 주세요. 입력하신 내용은 그대로 남아 있습니다.',
    actions: ['retry', 'edit'],
  },
}

export const DELAY_NOTICE =
  '평소보다 오래 걸리고 있어요. 입력하신 내용은 그대로 유지됩니다. 조금만 더 기다려 주세요.'

export const COPY_MESSAGES = {
  success: '결과를 복사했어요. 구직자 입력 정보는 포함되지 않아요.',
  error: '복사하지 못했어요. 결과를 직접 선택해 복사해 주세요.',
  buttonDone: '✓ 복사했어요',
} as const

// ---------- 화면 문구 (design §2, §3, §11, §13) ----------

export const PRIVACY_NOTICE =
  '이름·연락처 등 개인 식별 정보는 입력받지 않으며, 저장하기를 누르기 전에는 입력 내용이 저장되지 않습니다.'

/** FR-039. 입력 제목 아래와 메인에 보인다. */
export const AI_TRANSMISSION_NOTICE =
  '입력하신 이력은 결과를 만들기 위해 AI 서비스로 전송됩니다. 이름·연락처·나이는 전송하지 않습니다.'

export const FOOTER_NOTICE = '저장하기를 누르기 전에는 저장되지 않습니다.'

export const MAIN = {
  title: SERVICE_NAME,
  kicker: '직업상담사를 위한 초기상담 도구',
  /** "강점", "직무"만 강조한다(em). */
  h1: [
    { t: '이력을 ' },
    { t: '강점', em: true },
    { t: '으로, ' },
    { t: '강점', em: true },
    { t: '을 ' },
    { t: '직무', em: true },
    { t: '로.' },
  ],
  subtitle:
    '구직자의 이력과 강점을 입력하면, 잘 맞는 직업 3개와 자기소개서 키워드 3개를 함께 정리해드립니다.',
  startCta: '상담 시작하기',
  howCta: '이용 방법 보기',
  flowTitle: '상담 중 이렇게 이용해요',
  flowSubtitle: '입력부터 검토까지, 상담 흐름을 끊지 않는 네 단계입니다.',
  flowSteps: ['구직자 정보 입력', 'AI 분석', '결과 확인', '상담사와 함께 검토'],
  // 수정안 H-6: 단계별 아이콘 글리프와 설명(시안 v3 문구).
  flowDetails: [
    { icon: '✎', desc: '학력, 경력, 자격증, 구직자가 생각하는 강점 3개 등 상담 중 확인한 내용을 입력합니다.' },
    { icon: '↻', desc: '입력한 항목을 근거로 잘 맞는 직업과 자기소개서 키워드를 정리합니다.' },
    { icon: '✓', desc: '추천 직업과 키워드를 연결 근거와 함께 확인합니다.' },
    { icon: '◆', desc: '결과는 참고용입니다. 구직자와 이야기 나누며 활용합니다.' },
  ],
  noticeTitle: '시작하기 전에 확인해 주세요',
  heroExample: {
    cards: [
      { label: '학력', value: '사회복지학 전공, 대졸' },
      { label: '경력', value: '지역아동센터 생활지도' },
      { label: '자격증', value: '사회복지사 2급' },
      { label: '강점', value: '상대의 이야기를 끝까지 듣는다' },
    ],
    jobTag: '추천 직업 · 가상 예시',
    jobTitle: '사회복지사',
    jobSubtitle: '복지기관 사례 관리',
    connect: '연결',
  },
} as const

export const INPUT_PAGE = {
  title: '구직자 정보 입력',
  kicker: 'STEP 01 · 입력',
  generate: '결과 생성하기',
  sections: ['기본 정보', '경력', '인턴 경험', '자격증·교육이수', '강점 3개'],
  ageLabel: '나이',
  subtitle:
    '상담 중 확인한 내용을 입력해 주세요. (필수) 항목은 꼭 채워야 결과를 만들 수 있습니다. 이름·연락처는 입력하지 않으며, 저장하기를 누르기 전에는 입력 내용이 저장되지 않습니다.',
  ageHint: '숫자만 입력해 주세요. 15~99 사이로 입력합니다. 나이는 추천 결과를 만드는 데 사용되지 않아요.',
  agePlaceholder: '예: 34',
  careerHint: '경력이 없다면 아래 “경력 없음”을 선택해 주세요. 있다면 직무명·업종·기간을 입력합니다. 최대 20개.',
  certHint: '최대 20개, 각 100자 이내. 없으면 “없음”을 선택해 주세요.',
  trainingHint: '과정명과 기간을 입력합니다. 최대 20개. 없으면 “없음”을 선택해 주세요.',
  careerPlaceholders: { jobTitle: '예: 생활지도원', industry: '예: 사회복지시설', period: '예: 1년 2개월' },
  trainingPlaceholders: { courseName: '예: 사무 프로그램 활용 과정', period: '예: 2개월' },
  levelLabel: '최종학력',
  statusLabel: '학력 상태',
  majorLabel: '전공',
  majorHint: '주전공과 복수·부전공을 입력합니다. 최대 6개. 고졸 이하는 비워 두어도 됩니다.',
  majorAdd: '전공 추가',
  noCareer: '경력 없음',
  careerRow: '경력',
  careerAdd: '경력 추가',
  careerFields: { jobTitle: '직무명', industry: '업종', period: '기간' },
  internHas: '인턴 경험 있음',
  internNone: '인턴 경험 없음',
  internGroup: '인턴 경험',
  internContent: '인턴 내용',
  internPeriod: '인턴 기간',
  certLabel: '자격증',
  certAdd: '자격증 추가',
  noCert: '자격증 없음',
  trainingRow: '교육이수',
  trainingAdd: '교육이수 추가',
  noTraining: '교육이수 없음',
  trainingFields: { courseName: '과정명', period: '기간' },
  strengthsTitle: '강점 3개',
  strengthsBadge: '(필수 · 정확히 3개)',
  strengthsHint: '구직자가 스스로 떠올린 강점을 짧은 문장으로 3개 적어 주세요. 각 100자 이내.',
  strengthPlaceholders: [
    '처음 보는 사람과도 대화를 편하게 이끈다',
    '맡은 일은 계획을 세워 끝까지 마무리한다',
    '상대의 이야기를 끝까지 듣는다',
  ],
  select: '선택해 주세요',
  levelOptions: [
    { value: 'highschool_or_below', label: '고졸 이하' },
    { value: 'college', label: '전문대' },
    { value: 'bachelor', label: '대졸' },
    { value: 'master', label: '석사' },
    { value: 'doctor', label: '박사' },
  ],
  statusOptions: [
    { value: 'graduated', label: '졸업' },
    { value: 'enrolled', label: '재학' },
    { value: 'leave', label: '휴학' },
    { value: 'dropout', label: '중퇴' },
    { value: 'expected', label: '졸업예정' },
  ],
  sectionState: { empty: '미입력', done: '✓ 입력됨', check: '! 확인 필요', optional: '선택' },
  tocLabel: '입력 섹션 목차',
} as const

export function requiredProgress(done: number, total: number): string {
  return `필수 항목 ${done}/${total}개 입력됨 · ${FOOTER_NOTICE}`
}

export const RESULT_PAGE = {
  title: '상담 참고 결과',
  kicker: 'STEP 03 · 결과 확인',
  regenerated: '새로 생성한 결과로 바꿨어요. 이전 결과는 더 이상 표시되지 않습니다.',
  areaATitle: '취업 가능성이 높은 추천 직업 3개',
  areaASubtitle: '입력하신 이력과의 적합도를 기준으로 골랐고, 연결된 근거와 함께 보여드려요.',
  areaBTitle: '자기소개서 키워드 3개',
  legend: '이 표시가 붙은 문장은 상담에서 직접 확인이 필요한 내용이에요.',
  actions: {
    copy: '결과 복사하기',
    copied: COPY_MESSAGES.buttonDone,
    print: '인쇄하기',
    save: '상담 이력으로 저장',
    saveDisabled: '상담 이력 저장은 아직 준비 중이에요',
    edit: '입력 수정하기',
    regenerate: '다시 생성하기',
  },
  summary: {
    title: '입력 정보 요약',
    age: '나이',
    education: '최종학력',
    majors: '전공',
    careers: '경력',
    intern: '인턴 경험',
    certifications: '자격증',
    trainings: '교육이수',
    strengths: '강점',
    none: '없음',
    empty: '입력 없음',
  },
  job: {
    label: '추천 직업',
    rationale: '추천 근거',
    linked: '연결된 입력 항목',
    checkPoint: '상담에서 함께 확인할 점',
  },
  keyword: {
    label: '키워드',
    strength: '연결 강점',
    job: '연결 직업',
    linked: '연결된 입력 항목',
    description: '설명',
    reinforceTag: '※ 상담에서 함께 보강해요',
    mismatchTitle: '이야기를 더 나눠 보면 좋아요',
    mismatchPrintLabel: '함께 이야기 나눠 볼 점',
  },
  /** 인쇄에서 쓰는 짧은 굵은 라벨(contracts/copy-and-print.md 2절). */
  print: {
    rationale: '근거',
    linked: '연결 항목',
    checkPoint: '상담에서 함께 확인할 점',
    confirmTag: '[확인 필요]',
    legend: '[확인 필요] 표시가 붙은 문장은 상담에서 직접 확인이 필요한 내용입니다.',
  },
} as const

/** 입력 요약과 Tag에 쓰는 항목명. */
export const FIELD_LABELS = {
  education: '학력',
  major: '전공',
  career: '경력',
  intern: '인턴',
  certification: '자격증',
  training: '교육이수',
  strength: '강점',
} as const

// ---------- 입력 검증 문구 (design §12 확정 문구 + data-model 1.1, 1.3) ----------

export const INPUT_ERRORS = {
  ageNotNumber: '나이를 숫자로 입력해 주세요.',
  ageRange: '나이는 15~99 사이의 숫자로 입력해 주세요.',
  level: '최종학력을 선택해 주세요.',
  status: '학력 상태를 선택해 주세요.',
  careerRequired: '경력을 입력하거나 “경력 없음”을 선택해 주세요.',
  careerFields: '경력의 직무명·업종·기간을 모두 입력해 주세요. 비어 있는 칸이 있어요.',
  careerExclusive: '“경력 없음”을 선택하면 경력을 입력할 수 없어요.',
  internChoice: '인턴 경험이 있는지 선택해 주세요.',
  internContent: '인턴 내용을 입력해 주세요.',
  internPeriod: '인턴 기간을 입력해 주세요.',
  majorRequired: '전공을 입력해 주세요.',
  certRequired: '자격증 이름을 입력해 주세요.',
  certExclusive: '“자격증 없음”을 선택하면 자격증을 입력할 수 없어요.',
  trainingFields: '교육이수의 과정명과 기간을 모두 입력해 주세요. 비어 있는 칸이 있어요.',
  trainingExclusive: '“교육이수 없음”을 선택하면 교육이수를 입력할 수 없어요.',
  strengthsCount: '강점은 정확히 3개가 필요해요.',
  pii: '이름·연락처 같은 개인 식별 정보는 입력하지 않아요. 해당 부분을 지워 주세요.',
  injection: 'AI에게 내리는 지시문처럼 보이는 내용이 있어요. 구직자의 이력만 적어 주세요.',
  bodyInvalid: '요청 형식이 올바르지 않아요.',
  serverRecheck: '이 항목을 다시 확인해 주세요.',
} as const

/** 오류 요약 제목(design §12). */
export function errorSummaryTitle(count: number): string {
  return `입력 내용을 확인해 주세요. 고칠 항목이 ${count}개 있어요.`
}

// 강점 번호(1~3)에 붙는 조사. 받침 유무: 1(일)·3(삼)은 있고 2(이)는 없다.
const hasBatchim = (n: number): boolean => n !== 2

export function strengthRequired(n: number): string {
  return `강점 ${n}${hasBatchim(n) ? '을' : '를'} 입력해 주세요. 강점은 정확히 3개가 필요해요.`
}

export function strengthTooShort(n: number): string {
  return `강점 ${n}${hasBatchim(n) ? '을' : '를'} 2자 이상 적어 주세요.`
}

export function strengthDuplicate(n: number, m: number): string {
  return `강점 ${n}${hasBatchim(n) ? '이' : '가'} 강점 ${m}${hasBatchim(m) ? '과' : '와'} 같아요. 서로 다른 강점을 적어 주세요.`
}

export function maxChars(max: number): string {
  return `최대 ${max}자까지 입력할 수 있어요.`
}
