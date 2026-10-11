import { useEffect, useId, useRef } from 'react'
import { Badge } from '../ui/Badge'
import { Alert } from '../ui/Alert'
import { Button } from '../ui/Button'
import {
  ANALYSIS_STEPS,
  COMMON,
  DELAY_NOTICE,
  STATUS_SCREENS,
  STEP_STATE_LABEL,
  type StatusVariant,
} from '@shared/messages'

interface StatusScreenProps {
  variant: StatusVariant
  /** 분석 중일 때 진행 중인 단계(0~3). 표시용이며 실제 진행률이 아니다. */
  activeStep?: number
  /** 30초 지연 안내(분석 중에만). */
  delayed?: boolean
  onRetry?: () => void
  onEdit?: () => void
  onGoInput?: () => void
  /** 화면 전환 시 H1로 포커스를 옮긴다. 갤러리처럼 여러 개를 나란히 보일 때만 끈다. */
  focusOnMount?: boolean
  /** 화면의 제목이면 h1, 갤러리처럼 한 페이지에 여럿이면 h2. */
  headingLevel?: 1 | 2
}

const ALERT_VARIANTS: StatusVariant[] = ['failed', 'invalid-output', 'timeout', 'rate-limited']

// 최대 폭 680px 카드: 상태 배지 + H1 + 설명 + 행동 버튼. 진행률 숫자·막대는 쓰지 않는다.
export function StatusScreen({ variant, activeStep = 0, delayed = false, onRetry, onEdit, onGoInput, focusOnMount = true, headingLevel = 1 }: StatusScreenProps) {
  const def = STATUS_SCREENS[variant]
  const h1 = useRef<HTMLHeadingElement>(null)
  const titleId = useId()
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  useEffect(() => {
    if (focusOnMount) h1.current?.focus()
  }, [variant, focusOnMount])

  const actions = {
    // 수정안 H-5: ↻는 글자 뒤, 입력 수정하기는 아이콘 없음.
    retry: { label: COMMON.retry, icon: '↻', iconPosition: 'end' as const, run: onRetry, kind: 'teal' as const },
    edit: { label: COMMON.editInput, icon: undefined, iconPosition: undefined, run: onEdit, kind: 'outline' as const },
    goInput: { label: COMMON.goInput, icon: '→', iconPosition: undefined, run: onGoInput, kind: 'teal' as const },
  }

  return (
    <section
      className="status-card"
      role={ALERT_VARIANTS.includes(variant) ? 'alert' : undefined}
      aria-labelledby={titleId}
    >
      <Badge variant={def.badgeKind}>{def.badge}</Badge>
      <Heading className="status-card__title" id={titleId} tabIndex={-1} ref={h1}>
        {def.title}
      </Heading>
      <p>{def.body}</p>

      {variant === 'analyzing' ? (
        <>
          {/* 낭독기에는 단계가 바뀔 때 현재 단계 한 줄만 알린다(카드 전체를 다시 읽지 않도록). */}
          <p className="sr-only" role="status">
            {STEP_STATE_LABEL.active}: {ANALYSIS_STEPS[Math.min(activeStep, ANALYSIS_STEPS.length - 1)]}
          </p>
          <ol className="steps">
            {ANALYSIS_STEPS.map((text, i) => {
              const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'waiting'
              return (
                <li className="steps__item" key={text}>
                  <span className={state === 'active' ? 'steps__icon motion-spin' : 'steps__icon'} aria-hidden="true">
                    {state === 'done' ? '✓' : state === 'active' ? '↻' : '·'}
                  </span>
                  <span>{text}</span>
                  <span className="steps__state">{STEP_STATE_LABEL[state]}</span>
                </li>
              )
            })}
          </ol>
          {delayed ? <Alert variant="warning">{DELAY_NOTICE}</Alert> : null}
        </>
      ) : null}

      {def.actions.length > 0 ? (
        <div className="status-card__actions">
          {def.actions.map((key) => (
            <Button key={key} variant={actions[key].kind} icon={actions[key].icon} iconPosition={actions[key].iconPosition} onClick={actions[key].run}>
              {actions[key].label}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  )
}
