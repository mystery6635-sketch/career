import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AI_TRANSMISSION_NOTICE, INPUT_PAGE } from '@shared/messages'
import { useGenerate } from '../hooks/useGenerate'
import { useActiveSection } from '../hooks/useActiveSection'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFormValidation } from '../hooks/useFormValidation'
import { useRouteFocus } from '../hooks/useRouteFocus'
import { useSession } from '../state/session'
import { requiredDoneCount, sectionInfos } from '../state/sectionStatus'
import type { InputDraft } from '../state/draft'
import { serverErrorItems, type SummaryItem } from '../state/validation'
import { Header } from '../components/ui/Header'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorSummary } from '../components/input/ErrorSummary'
import { SectionNav } from '../components/input/SectionNav'
import { BottomBar } from '../components/input/BottomBar'
import { FormSection } from '../components/input/MobileAccordion'
import { BasicInfoSection } from '../components/input/BasicInfoSection'
import { CareerSection } from '../components/input/CareerSection'
import { InternSection } from '../components/input/InternSection'
import { CertTrainingSection } from '../components/input/CertTrainingSection'
import { StrengthsSection } from '../components/input/StrengthsSection'

const SECTION_IDS = ['sec-basic', 'sec-career', 'sec-intern', 'sec-cert', 'sec-strengths']
const BADGES = ['(필수)', '(필수)', '(필수)', '(선택)', INPUT_PAGE.strengthsBadge]
const SECTIONS = [BasicInfoSection, CareerSection, InternSection, CertTrainingSection, StrengthsSection]

export default function InputPage() {
  const navigate = useNavigate()
  const { state, dispatch, setInput } = useSession()
  const { start, busy } = useGenerate()
  const mobile = useIsMobile()
  const activeId = useActiveSection(SECTION_IDS)
  // 서버가 입력을 거부해 돌아온 경우(VALIDATION_FAILED·PII_DETECTED) 그 항목을 오류로 보인다(T108).
  const [serverItems] = useState<SummaryItem[]>(() =>
    state.status === 'error' && state.error && (state.error.code === 'VALIDATION_FAILED' || state.error.code === 'PII_DETECTED')
      ? serverErrorItems(state.error)
      : [],
  )
  const h1 = useRouteFocus(INPUT_PAGE.title, { focus: serverItems.length === 0 })
  const [open, setOpen] = useState<boolean[]>(() => {
    const sections = new Set(serverItems.map((i) => i.section))
    return [true, false, false, false, false].map((v, i) => v || sections.has(i))
  })
  useEffect(() => {
    if (serverItems.length > 0) dispatch({ type: 'discard' })
  }, [serverItems, dispatch])

  const validation = useFormValidation(state.input, serverItems)
  const infos = sectionInfos(state.input, validation.errorSections)
  const { done, total } = requiredDoneCount(state.input)
  const onChange = (patch: Partial<InputDraft>) => {
    validation.clearServerItems()
    setInput({ ...state.input, ...patch })
  }

  // 제출 시 입력 스키마로 검증한다. 오류가 있으면 생성하지 않고 입력은 그대로 둔다(T085~T087).
  const generate = () => {
    const errors = validation.submit()
    if (errors.length > 0) {
      // 모바일에서는 오류가 있는 섹션을 자동으로 연다.
      const sections = new Set(errors.map((e) => e.section))
      setOpen((o) => o.map((v, i) => v || sections.has(i)))
      return
    }
    void start()
    navigate('/result')
  }

  // 오류 요약 링크: 접힌 섹션을 열고, 해당 입력창으로 스크롤한 뒤 포커스를 준다.
  const jumpTo = (item: SummaryItem) => {
    flushSync(() => setOpen((o) => o.map((v, i) => v || i === item.section)))
    const target = document.querySelector<HTMLElement>(`[data-field="${item.key}"]`)
    target?.scrollIntoView({ block: 'center' })
    target?.focus({ preventScroll: true })
  }

  return (
    <>
      <Header />
      <main id="main" className="input-page">
        <div className="page-wrap">
          <PageHeader kicker={INPUT_PAGE.kicker} title={INPUT_PAGE.title} subtitle={INPUT_PAGE.subtitle} headingRef={h1} />
          <p className="ai-notice">
            <span aria-hidden="true">▣</span> {AI_TRANSMISSION_NOTICE}
          </p>
          <ErrorSummary items={validation.items} focusTick={validation.focusTick} onJump={jumpTo} />
          <div className="input-layout">
            {mobile ? null : <SectionNav infos={infos} ids={SECTION_IDS} activeId={activeId} />}
            <form className="input-form" onSubmit={(e) => e.preventDefault()} noValidate>
              {SECTIONS.map((Section, i) => (
                <FormSection
                  key={SECTION_IDS[i]}
                  id={SECTION_IDS[i]}
                  title={INPUT_PAGE.sections[i]}
                  badge={BADGES[i]}
                  status={infos[i].status}
                  accordion={mobile}
                  open={open[i]}
                  onToggle={() => setOpen((o) => o.map((v, j) => (j === i ? !v : v)))}
                >
                  <Section draft={state.input} onChange={onChange} feedback={validation.feedback} />
                </FormSection>
              ))}
            </form>
          </div>
        </div>
      </main>
      <BottomBar done={done} total={total} busy={busy} onGenerate={generate} />
    </>
  )
}
