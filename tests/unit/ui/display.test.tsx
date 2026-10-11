import { render, screen } from '@testing-library/react'
import { Badge, NeedsConfirmBadge, StandardNameBadge } from '../../../src/components/ui/Badge'
import { Tag } from '../../../src/components/ui/Tag'
import { Card } from '../../../src/components/ui/Card'
import { Alert, type AlertVariant } from '../../../src/components/ui/Alert'

describe('Badge (T025)', () => {
  it.each([
    ['progress', '↻'],
    ['error', '✕'],
    ['warning', '!'],
    ['info', 'i'],
  ] as const)('%s 변형에 아이콘과 텍스트가 함께 있다', (variant, icon) => {
    const { container } = render(<Badge variant={variant}>상태 텍스트</Badge>)
    expect(screen.getByText('상태 텍스트')).toBeInTheDocument()
    const chip = container.querySelector('.badge__chip')!
    expect(chip.textContent).toBe(icon)
    expect(chip).toHaveAttribute('aria-hidden', 'true')
  })

  it('확인 필요 배지 두 종류에 "?" 아이콘과 텍스트가 있다', () => {
    const { container } = render(
      <>
        <NeedsConfirmBadge />
        <StandardNameBadge />
      </>,
    )
    expect(screen.getByText('확인 필요')).toBeInTheDocument()
    expect(screen.getByText('표준 분류 확인 필요')).toBeInTheDocument()
    expect([...container.querySelectorAll('.badge__chip')].map((c) => c.textContent)).toEqual(['?', '?'])
  })
})

describe('Tag (T026)', () => {
  it('"항목명: 값" 형식으로 렌더된다', () => {
    const { container } = render(<Tag name="전공" value="사회복지학" />)
    expect(container.textContent).toBe('전공: 사회복지학')
  })
})

describe('Card (T027)', () => {
  it('영역 A/B는 칩 글자로 구분되고 그림자 클래스가 없다', () => {
    const { container } = render(
      <>
        <Card variant="areaA">A 내용</Card>
        <Card variant="areaB">B 내용</Card>
        <Card>기본</Card>
      </>,
    )
    const chips = [...container.querySelectorAll('.card__chip')].map((c) => c.textContent)
    expect(chips).toEqual(['A', 'B'])
    expect(container.innerHTML).not.toMatch(/shadow/)
  })
})

describe('Alert (T028)', () => {
  it.each([
    ['error', 'alert', '✕'],
    ['info', 'status', 'i'],
    ['warning', 'status', '!'],
    ['success', 'status', '✓'],
  ] as [AlertVariant, string, string][])('%s는 role=%s이고 아이콘 %s와 텍스트가 있다', (variant, role, icon) => {
    render(<Alert variant={variant}>안내 텍스트</Alert>)
    const el = screen.getByRole(role)
    expect(el).toHaveTextContent('안내 텍스트')
    expect(el.querySelector('.alert__icon')!.textContent).toBe(icon)
  })

  it('status 계열은 aria-live=polite이다', () => {
    render(<Alert variant="warning">지연</Alert>)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
