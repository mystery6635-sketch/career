import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ButtonVariant = 'mint' | 'ghost' | 'teal' | 'outline' | 'danger' | 'add'
export type ButtonSize = 'lg' | 'sm'
export type IconPosition = 'start' | 'end'

/** 화살표(→)는 글자 뒤에, 나머지 장식 아이콘(⧉ ⎙ ▤ ✎ ↻ +)은 글자 앞에 둔다(design §20, §2의 "상담 시작하기 →"). */
export function defaultIconPosition(icon: ReactNode): IconPosition {
  return icon === '→' ? 'end' : 'start'
}

interface ContentProps {
  icon?: ReactNode
  iconPosition?: IconPosition
  children: ReactNode
}

// Button과 ButtonLink가 같은 내용 배치를 쓴다.
function ButtonContent({ icon, iconPosition, children }: ContentProps) {
  const iconEl = icon ? (
    <span className="btn__icon" aria-hidden="true">
      {icon}
    </span>
  ) : null
  const position = iconPosition ?? defaultIconPosition(icon)
  return (
    <>
      {position === 'start' ? iconEl : null}
      {children}
      {position === 'end' ? iconEl : null}
    </>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 모바일에서 전체 너비. */
  block?: boolean
  /** 장식 글리프. 화면 낭독기에서는 숨긴다. */
  icon?: ReactNode
  iconPosition?: IconPosition
  /** 비활성일 때 이유를 글자로 보인다(design §20). 이 값이 있으면 버튼은 포커스를 받아 이유를 읽을 수 있다. */
  disabledReason?: string
}

export function Button({
  variant = 'teal',
  size = 'lg',
  block = false,
  icon,
  iconPosition,
  disabledReason,
  disabled,
  onClick,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const reasonId = useId()
  // 사유가 있는 비활성 버튼은 native disabled 대신 aria-disabled를 써서 키보드 포커스와 낭독 대상으로 남긴다.
  const explained = Boolean(disabled && disabledReason)
  const button = (
    <button
      {...rest}
      type={type}
      className="btn"
      data-variant={variant}
      data-size={size}
      data-block={block}
      disabled={disabled && !explained}
      aria-disabled={explained || undefined}
      aria-describedby={explained ? reasonId : rest['aria-describedby']}
      onClick={explained ? (e) => e.preventDefault() : onClick}
    >
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </button>
  )
  if (!explained) return button
  return (
    <span className="btn-wrap">
      {button}
      <span className="btn-wrap__reason" id={reasonId}>
        {disabledReason}
      </span>
    </span>
  )
}

interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  icon?: ReactNode
  iconPosition?: IconPosition
  children: ReactNode
}

/** 화면 이동 링크를 버튼 모양으로 보인다. 실제 요소는 a이다(design §22). */
export function ButtonLink({ to, variant = 'teal', size = 'lg', block = false, icon, iconPosition, children }: ButtonLinkProps) {
  return (
    <Link className="btn" to={to} data-variant={variant} data-size={size} data-block={block}>
      <ButtonContent icon={icon} iconPosition={iconPosition}>
        {children}
      </ButtonContent>
    </Link>
  )
}
