import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AI_TRANSMISSION_NOTICE, INPUT_PAGE } from '@shared/messages'
import { useGenerate } from '../hooks/useGenerate'
import { useActiveSection } from '../hooks/useActiveSection'
import { useIsMobile } from '../hooks/useIsMobile'
import { useRouteFocus } from '../hooks/useRouteFocus'
import { useSession } from '../state/session'
import { requiredDoneCount, sectionInfos } from '../state/sectionStatus'
import type { InputDraft } from '../state/draft'
import { Header } from '../components/ui/Header'
import { PageHeader } from '../components/ui/PageHeader'
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
  const { state, setInput } = useSession()
  const { start, busy } = useGenerate()
  const mobile = useIsMobile()
  const activeId = useActiveSection(SECTION_IDS)
  const h1 = useRouteFocus(INPUT_PAGE.title)
  const [open, setOpen] = useState<boolean[]>([true, false, false, false, false])

  const infos = sectionInfos(state.input)
  const { done, total } = requiredDoneCount(state.input)
  const onChange = (patch: Partial<InputDraft>) => setInput({ ...state.input, ...patch })

  // Phase 3에서는 검증 없이 요청을 시작한다(검증은 Phase 5).
  const generate = () => {
    void start()
    navigate('/result')
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
          <div className="error-summary-slot" />
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
                  <Section draft={state.input} onChange={onChange} />
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
