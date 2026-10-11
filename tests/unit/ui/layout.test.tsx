import { render, screen } from '@testing-library/react'
import { resetInitialLoad, useRouteFocus } from '../../../src/hooks/useRouteFocus'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Header } from '../../../src/components/ui/Header'
import { PageHeader } from '../../../src/components/ui/PageHeader'
import { SkipLink } from '../../../src/components/ui/SkipLink'
import { SERVICE_NAME } from '@shared/messages'

describe('Header (T018)', () => {
  it('서비스 이름 홈 링크와 "이용 방법" 링크만 있고 로그인 요소가 없다', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(screen.getByRole('link', { name: SERVICE_NAME })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '이용 방법' })).toHaveAttribute('href', '/#flow')
    expect(screen.queryByText(/로그인|회원/)).toBeNull()
  })

  it('Tab 순서는 서비스 이름 → 이용 방법이다', async () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    )
    await userEvent.tab()
    expect(screen.getByRole('link', { name: SERVICE_NAME })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('link', { name: '이용 방법' })).toHaveFocus()
  })
})

describe('PageHeader (T019)', () => {
  it('kicker, H1, 부제를 렌더하고 H1에 프로그램으로 포커스를 줄 수 있다', () => {
    resetInitialLoad(false)
    function Page() {
      const ref = useRouteFocus('구직자 정보 입력')
      return <PageHeader kicker="INPUT" title="구직자 정보 입력" subtitle="부제" headingRef={ref} />
    }
    render(<Page />)
    expect(screen.getByText('INPUT')).toBeInTheDocument()
    const h1 = screen.getByRole('heading', { level: 1, name: '구직자 정보 입력' })
    expect(h1).toHaveAttribute('tabindex', '-1')
    expect(h1).toHaveFocus()
    expect(screen.getByText('부제')).toBeInTheDocument()
  })
})

describe('useRouteFocus (T035)', () => {
  function Page({ title }: { title: string }) {
    const ref = useRouteFocus(title)
    return <h1 ref={ref} tabIndex={-1}>{title}</h1>
  }

  it('처음 열었을 때는 포커스를 옮기지 않아 첫 Tab이 본문 바로가기에 닿는다', () => {
    resetInitialLoad(true)
    render(<Page title="메인 화면" />)
    expect(screen.getByRole('heading')).not.toHaveFocus()
    expect(document.title).toBe('메인 화면 · 초기상담 도우미')
  })

  it('화면 전환 때는 H1로 포커스가 옮겨지고 문서 제목이 바뀐다', () => {
    resetInitialLoad(false)
    const { rerender } = render(<Page title="구직자 정보 입력" />)
    expect(screen.getByRole('heading')).toHaveFocus()
    expect(document.title).toBe('구직자 정보 입력 · 초기상담 도우미')
    rerender(<Page title="상담 참고 결과" />)
    expect(document.title).toBe('상담 참고 결과 · 초기상담 도우미')
  })
})

describe('SkipLink (T015)', () => {
  it('본문 바로가기 링크가 #main을 가리킨다', () => {
    render(<SkipLink />)
    expect(screen.getByRole('link', { name: '본문 바로가기' })).toHaveAttribute('href', '#main')
  })
})
