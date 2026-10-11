import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { RESULT_PAGE, STATUS_SCREENS } from '@shared/messages'
import { useAnalysisStep } from '../hooks/useAnalysisStep'
import { useCopyFeedback } from '../hooks/useCopyFeedback'
import { useGenerate } from '../hooks/useGenerate'
import { useRouteFocus } from '../hooks/useRouteFocus'
import { buildCopyText } from '../lib/copyText'
import { errorToVariant } from '../state/errorVariant'
import { useSession } from '../state/session'
import { Header } from '../components/ui/Header'
import { PageHeader } from '../components/ui/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Card } from '../components/ui/Card'
import { NeedsConfirmBadge } from '../components/ui/Badge'
import { ActionBar } from '../components/result/ActionBar'
import { InputSummary } from '../components/result/InputSummary'
import { JobCard } from '../components/result/JobCard'
import { KeywordCard } from '../components/result/KeywordCard'
import { NoticeBar, NoticeBox, NoticeLines } from '../components/result/NoticeBar'
import { StatusScreen } from '../components/result/StatusScreen'

export default function ResultPage() {
  const navigate = useNavigate()
  const { state } = useSession()
  const { start, abort, busy } = useGenerate()
  const { status, result } = state

  const variant =
    status === 'idle' ? 'empty' : status === 'error' ? errorToVariant(state.error?.code) : 'analyzing'
  const showResult = status === 'success' && result !== null
  const title = showResult ? RESULT_PAGE.title : STATUS_SCREENS[variant].title
  const h1 = useRouteFocus(title, { focus: showResult })
  const step = useAnalysisStep(busy)

  // 분석 중에 화면을 떠나면(뒤로 가기 등) 요청을 중단하고 결과를 폐기한다. 입력은 유지된다(design §5).
  // 개발 모드의 StrictMode가 일으키는 가짜 정리(곧바로 다시 마운트)에는 반응하지 않도록 한 틱 미룬다.
  const busyRef = useRef(busy)
  useEffect(() => {
    busyRef.current = busy
  })
  const leave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearTimeout(leave.current)
    return () => {
      leave.current = setTimeout(() => {
        if (busyRef.current) abort()
      }, 0)
    }
  }, [abort])

  const { status: copyStatus, buttonDone, copy } = useCopyFeedback(
    async () => {
      if (!result) throw new Error('no result')
      await navigator.clipboard.writeText(buildCopyText(result))
    },
  )

  if (!showResult) {
    return (
      <>
        <Header />
        <main id="main" className="status-page">
          <div className="page-wrap">
            <StatusScreen
              variant={variant}
              activeStep={step}
              delayed={status === 'slow'}
              onRetry={() => void start()}
              onEdit={() => navigate('/input')}
              onGoInput={() => navigate('/input')}
            />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Header />
      <NoticeBar lines={result.notice} />
      <main id="main" className="result-page">
        <div className="page-wrap">
          <PageHeader kicker={RESULT_PAGE.kicker} title={RESULT_PAGE.title} headingRef={h1} />
          {/* 인쇄에서만 보이는 안내 상자(제목 바로 아래). 화면에서는 상단 고정 바가 같은 문구를 보인다. */}
          <div className="print-notice" role="note">
            <NoticeLines result={result.notice} />
          </div>
          {state.regenerated ? (
            <div className="no-print regen-notice">
              <Alert variant="info">{RESULT_PAGE.regenerated}</Alert>
            </div>
          ) : null}
          <ActionBar
            copyStatus={copyStatus}
            copied={buttonDone}
            busy={busy}
            onCopy={() => void copy()}
            onPrint={() => window.print()}
            onEdit={() => navigate('/input')}
            onRegenerate={() => void start()}
          />
          <InputSummary input={state.input} />

          <Card variant="areaA" as="section">
            <h2 className="area-title">{RESULT_PAGE.areaATitle}</h2>
            <p className="area-sub">{RESULT_PAGE.areaASubtitle}</p>
            <div className="card-grid">
              {result.jobs.map((job, i) => (
                <JobCard key={i} job={job} index={i} />
              ))}
            </div>
          </Card>

          <Card variant="areaB" as="section">
            <h2 className="area-title">{RESULT_PAGE.areaBTitle}</h2>
            <div className="card-grid">
              {result.keywords.map((k, i) => (
                <KeywordCard key={i} keyword={k} index={i} />
              ))}
            </div>
          </Card>

          <p className="legend">
            <span className="legend__badge">
              <NeedsConfirmBadge />
            </span>{' '}
            <span className="legend__screen">{RESULT_PAGE.legend}</span>
            <span className="legend__print">{RESULT_PAGE.print.legend}</span>
          </p>
          <NoticeBox lines={result.notice} />
        </div>
      </main>
    </>
  )
}

