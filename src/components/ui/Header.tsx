import { Link } from 'react-router-dom'
import { SERVICE_NAME, COMMON } from '@shared/messages'

interface HeaderProps {
  /** 메인에서는 Hero 위에 투명하게 겹치고, 내부 화면에서는 단색 막대이다. */
  variant?: 'overlay' | 'solid'
}

// 로그인·회원 영역은 없다(design §7). 메뉴는 "이용 방법" 링크 하나뿐이다.
export function Header({ variant = 'solid' }: HeaderProps) {
  return (
    <header className="header" data-variant={variant} data-surface="dark">
      <div className="header__inner">
        <Link className="header__brand" to="/">
          <svg className="header__mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
            <rect x="1" y="1" width="26" height="26" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M8 15l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" />
          </svg>
          <span>{SERVICE_NAME}</span>
        </Link>
        <nav aria-label="주요 링크">
          <Link className="header__link" to="/#flow">
            {COMMON.howToUse}
          </Link>
        </nav>
      </div>
    </header>
  )
}
