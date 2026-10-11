import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { INPUT_PAGE, MAIN, NOTICE_LINES, AI_TRANSMISSION_NOTICE, PRIVACY_NOTICE, RESULT_PAGE } from '@shared/messages'
import { Hero } from '../../../src/components/main/Hero'
import { ResumeFragments } from '../../../src/components/main/ResumeFragments'
import { FlowSteps } from '../../../src/components/main/FlowSteps'
import { NoticeSection } from '../../../src/components/main/NoticeSection'
import { Footer } from '../../../src/components/main/Footer'
import { BottomBar } from '../../../src/components/input/BottomBar'
import { SectionNav } from '../../../src/components/input/SectionNav'
import { FormSection } from '../../../src/components/input/MobileAccordion'
import { BasicInfoSection } from '../../../src/components/input/BasicInfoSection'
import { CareerSection } from '../../../src/components/input/CareerSection'
import { InternSection } from '../../../src/components/input/InternSection'
import { CertTrainingSection } from '../../../src/components/input/CertTrainingSection'
import { StrengthsSection } from '../../../src/components/input/StrengthsSection'
import { emptyDraft, type InputDraft } from '../../../src/state/draft'
import { sectionInfos } from '../../../src/state/sectionStatus'
import { JobCard } from '../../../src/components/result/JobCard'
import { KeywordCard } from '../../../src/components/result/KeywordCard'
import { InputSummary } from '../../../src/components/result/InputSummary'
import { NoticeBar, NoticeBox } from '../../../src/components/result/NoticeBar'
import { ActionBar } from '../../../src/components/result/ActionBar'
import { MOCK_RESULTS } from '../../../src/mock/results'
import { applicantToDraft } from '../../../src/state/draft'
import { PERSONAS } from '../../../src/mock/personas'

const tag = (text: string) => (_: string, el: Element | null) => el?.classList.contains('tag') === true && el.textContent === text

const inRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('메인 (T042~T044)', () => {
  it('Hero: 문구, CTA 2개, 안내문 두 줄, 개인정보·AI 전송 안내가 있다', () => {
    inRouter(<Hero />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('이력을 강점으로, 강점을 직무로.')
    expect(screen.getByText(MAIN.kicker)).toBeInTheDocument()
    expect(screen.getByText(MAIN.subtitle)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /상담 시작하기/ })).toHaveAttribute('href', '/input')
    expect(screen.getByRole('link', { name: '이용 방법 보기' })).toHaveAttribute('href', '/#flow')
    for (const line of NOTICE_LINES) expect(screen.getByText(line)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(PRIVACY_NOTICE.slice(0, 20)))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(AI_TRANSMISSION_NOTICE.slice(0, 20)))).toBeInTheDocument()
  })

  it('Hero H1은 "강점", "직무"만 강조한다', () => {
    inRouter(<Hero />)
    const emphasized = [...screen.getByRole('heading', { level: 1 }).querySelectorAll('em')].map((e) => e.textContent)
    expect(emphasized).toEqual(['강점', '강점', '직무'])
  })

  it('이력 조각 시각 요소는 aria-hidden이고 "가상 예시" 표시가 있다', () => {
    const { container } = render(<ResumeFragments />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.textContent).toContain('추천 직업 · 가상 예시')
    expect(container.querySelectorAll('.rf__card')).toHaveLength(4)
    expect(container.querySelectorAll('path')).toHaveLength(4)
  })

  it('이용 흐름 4단계와 #flow 섹션, 안내 섹션, 푸터', () => {
    inRouter(
      <>
        <FlowSteps />
        <NoticeSection />
        <Footer />
      </>,
    )
    expect(document.getElementById('flow')).not.toBeNull()
    expect(screen.getByRole('heading', { name: MAIN.flowTitle })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    for (const step of MAIN.flowSteps) expect(screen.getByText(step)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: MAIN.noticeTitle })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /상담 시작하기/ })).toHaveAttribute('href', '/input')
    expect(screen.getByText('저장하기를 누르기 전에는 저장되지 않습니다.')).toBeInTheDocument()
  })
})

describe('입력 페이지 구성 (T045~T051)', () => {
  it('하단 바: 필수 진행 텍스트와 결과 생성하기 버튼', async () => {
    const onGenerate = vi.fn()
    render(<BottomBar done={2} total={4} busy={false} onGenerate={onGenerate} />)
    expect(
      screen.getByText('필수 항목 2/4개 입력됨 · 저장하기를 누르기 전에는 저장되지 않습니다.'),
    ).toBeInTheDocument()
    expect(document.querySelector('progress, [role="progressbar"]')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /결과 생성하기/ }))
    expect(onGenerate).toHaveBeenCalled()
  })

  it('목차: 섹션 5개, 상태는 아이콘과 글자를 함께 보인다', () => {
    const infos = sectionInfos(emptyDraft())
    render(<SectionNav infos={infos} ids={['a', 'b', 'c', 'd', 'e']} />)
    expect(screen.getAllByRole('link')).toHaveLength(5)
    expect(screen.getAllByText(/\(필수\) · 미입력/)).toHaveLength(4)
    expect(screen.getByText(/\(선택\) · 선택/)).toBeInTheDocument()
  })

  function Harness({ children }: { children: (p: { draft: InputDraft; onChange: (patch: Partial<InputDraft>) => void }) => React.ReactNode }) {
    const [draft, setDraft] = useState(emptyDraft())
    return <>{children({ draft, onChange: (patch) => setDraft((d) => ({ ...d, ...patch })) })}</>
  }

  it('기본 정보: 나이 힌트, 최종학력 5개, 학력 상태 5개 옵션', () => {
    render(<Harness>{(p) => <BasicInfoSection {...p} />}</Harness>)
    expect(screen.getByText(/나이는 추천 결과를 만드는 데 사용되지 않아요/)).toBeInTheDocument()
    const level = screen.getByLabelText(/최종학력/) as HTMLSelectElement
    expect([...level.options].map((o) => o.text)).toEqual(['선택해 주세요', '고졸 이하', '전문대', '대졸', '석사', '박사'])
    const status = screen.getByLabelText(/학력 상태/) as HTMLSelectElement
    expect([...status.options].slice(1).map((o) => o.text)).toEqual(['졸업', '재학', '휴학', '중퇴', '졸업예정'])
    expect(screen.getAllByText('(필수)').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText(/고졸 이하는 비워 두어도 됩니다/)).toBeInTheDocument()
  })

  it('경력: "경력 없음"을 선택하면 행이 비활성이 되고 사유가 보인다', async () => {
    render(<Harness>{(p) => <CareerSection {...p} />}</Harness>)
    expect(screen.getByLabelText(/직무명/)).toBeEnabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /경력 없음/ }))
    expect(screen.getByLabelText(/직무명/)).toBeDisabled()
    expect(screen.getByText(/선택됨: 경력 없음/)).toBeVisible()
  })

  it('인턴: "있음"을 고르면 내용·기간이 나타난다', async () => {
    render(<Harness>{(p) => <InternSection {...p} />}</Harness>)
    expect(screen.queryByLabelText(/인턴 내용/)).toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: /인턴 경험 있음/ }))
    expect(screen.getByLabelText(/인턴 내용/)).toBeInTheDocument()
    expect(screen.getByLabelText(/인턴 기간/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /인턴 경험 없음/ }))
    expect(screen.queryByLabelText(/인턴 내용/)).toBeNull()
  })

  it('자격증·교육이수: 각각 "없음" 선택지가 있고 선택 시 입력이 비활성이다', async () => {
    render(<Harness>{(p) => <CertTrainingSection {...p} />}</Harness>)
    await userEvent.click(screen.getByRole('checkbox', { name: /자격증 없음/ }))
    await userEvent.click(screen.getByRole('checkbox', { name: /교육이수 없음/ }))
    expect(screen.getByLabelText('자격증 1')).toBeDisabled()
    expect(screen.getByLabelText(/과정명/)).toBeDisabled()
    expect(screen.getAllByText(/선택됨:/)).toHaveLength(2)
  })

  it('강점: 입력창이 정확히 3개이고 예시 placeholder가 있다', () => {
    render(<Harness>{(p) => <StrengthsSection {...p} />}</Harness>)
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(3)
    expect(inputs[0]).toHaveAttribute('placeholder', INPUT_PAGE.strengthPlaceholders[0])
  })

  it('모바일 접이식: 제목이 버튼이고 키보드로 열고 닫는다(aria-expanded)', async () => {
    function Wrapper() {
      const [open, setOpen] = useState(false)
      return (
        <FormSection id="s" title="경력" badge="(필수)" status="empty" accordion open={open} onToggle={() => setOpen(!open)}>
          <p>본문</p>
        </FormSection>
      )
    }
    render(<Wrapper />)
    const toggle = screen.getByRole('button', { name: /경력/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('본문')).not.toBeVisible()
    expect(within(toggle).getByText('미입력')).toBeInTheDocument()
    toggle.focus()
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('본문')).toBeVisible()
    await userEvent.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('결과 화면 구성 (T054~T057)', () => {
  const result = MOCK_RESULTS.P4

  it('안내문 두 줄: 상단 바와 하단 박스', () => {
    const { container } = render(
      <>
        <NoticeBar lines={result.notice} />
        <NoticeBox lines={result.notice} />
      </>,
    )
    for (const line of NOTICE_LINES) expect(screen.getAllByText(line)).toHaveLength(2)
    expect(container.querySelector('.notice-bar')).not.toBeNull()
  })

  it('입력 정보 요약은 기본 접힘이고 8개 항목과 강점 3개를 보인다', () => {
    const { container } = render(<InputSummary input={applicantToDraft(PERSONAS.P4)} />)
    const details = container.querySelector('details')!
    expect(details.open).toBe(false)
    expect(screen.getByText('입력 정보 요약')).toBeInTheDocument()
    for (const label of ['나이', '최종학력', '전공', '경력', '인턴 경험', '자격증', '교육이수', '강점 1', '강점 2', '강점 3'])
      expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText('29')).toBeInTheDocument()
  })

  it('직업 카드: 근거, 연결 항목 Tag, 확인할 점, 통용 직업명 배지', () => {
    render(<JobCard job={result.jobs[1]} index={1} />)
    expect(screen.getByText('추천 직업 2')).toBeInTheDocument()
    expect(screen.getByText('표준 분류 확인 필요')).toBeInTheDocument()
    expect(screen.getByText(tag('전공: 식품영양학'))).toBeInTheDocument()
    expect(screen.getByText('상담에서 함께 확인할 점')).toBeInTheDocument()
    // needsConfirmation 문장은 배지와 함께
    expect(screen.getByText('확인 필요')).toBeInTheDocument()
  })

  it('표준 직업명이면 배지가 없다', () => {
    render(<JobCard job={result.jobs[0]} index={0} />)
    expect(screen.queryByText('표준 분류 확인 필요')).toBeNull()
    expect(screen.queryByText('확인 필요')).toBeNull()
    expect(result.jobs[0].linkedInputs.length).toBeGreaterThanOrEqual(1)
  })

  it('키워드 카드: "연결 직업" 라벨, 객관 항목 Tag는 강점 제외', () => {
    render(<KeywordCard keyword={result.keywords[0]} index={0} />)
    expect(screen.getByText('연결 강점')).toBeInTheDocument()
    expect(screen.getByText('연결 직업')).toBeInTheDocument()
    expect(screen.queryByText('연결 직무')).toBeNull()
    expect(screen.getByText(tag('자격증: 위생사'))).toBeInTheDocument()
    expect(screen.queryByText((_, el) => el?.classList.contains('tag') === true && /^강점:/.test(el.textContent ?? ''))).toBeNull()
    expect(screen.queryByText('이야기를 더 나눠 보면 좋아요')).toBeNull()
  })

  it('불일치 키워드: 안내 상자와 "보강" 태그, 연결 항목 영역은 없다', () => {
    render(<KeywordCard keyword={result.keywords[1]} index={1} />)
    expect(screen.getByText('※ 상담에서 함께 보강해요')).toBeInTheDocument()
    expect(screen.getByText('이야기를 더 나눠 보면 좋아요')).toBeInTheDocument()
    expect(screen.getByText(result.keywords[1].mismatchNote!)).toBeInTheDocument()
    expect(screen.queryByText('연결된 입력 항목')).toBeNull()
  })

  it('행동 버튼: 5개, 저장은 비활성이고 사유가 글자로 보인다', async () => {
    const onCopy = vi.fn()
    render(
      <ActionBar copyStatus="idle" copied={false} busy={false} onCopy={onCopy} onPrint={vi.fn()} onEdit={vi.fn()} onRegenerate={vi.fn()} />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(5)
    const save = screen.getByRole('button', { name: new RegExp(RESULT_PAGE.actions.save) })
    expect(save).toHaveAttribute('aria-disabled', 'true')
    save.focus()
    expect(save).toHaveFocus()
    expect(screen.getByText('상담 이력 저장은 아직 준비 중이에요')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: /결과 복사하기/ }))
    expect(onCopy).toHaveBeenCalled()
  })

  it('복사 직후 버튼 글자는 "✓ 복사했어요"', () => {
    render(
      <ActionBar copyStatus="success" copied busy={false} onCopy={vi.fn()} onPrint={vi.fn()} onEdit={vi.fn()} onRegenerate={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /✓ 복사했어요/ })).toBeInTheDocument()
    expect(screen.getByText('결과를 복사했어요. 구직자 입력 정보는 포함되지 않아요.')).toBeInTheDocument()
  })

  it('진행 중에는 다시 생성하기가 비활성이다', () => {
    render(
      <ActionBar copyStatus="idle" copied={false} busy onCopy={vi.fn()} onPrint={vi.fn()} onEdit={vi.fn()} onRegenerate={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /다시 생성하기/ })).toBeDisabled()
  })
})
