import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert } from '../../../src/components/ui/Alert'
import { CopyNotice } from '../../../src/components/result/CopyNotice'
import { StatusScreen } from '../../../src/components/result/StatusScreen'
import { SectionNav } from '../../../src/components/input/SectionNav'
import { Radio } from '../../../src/components/ui/Radio'
import { Checkbox } from '../../../src/components/ui/Checkbox'
import { Input } from '../../../src/components/ui/Input'
import { Textarea } from '../../../src/components/ui/Textarea'
import { emptyDraft } from '../../../src/state/draft'
import { sectionInfos } from '../../../src/state/sectionStatus'
import { ANALYSIS_STEPS } from '@shared/messages'

describe('낭독 중복 방지', () => {
  it('Alert는 기본으로 스스로 알리고(announce), announce=false이면 role·aria-live가 없다', () => {
    const { rerender } = render(<Alert variant="success">알림</Alert>)
    expect(screen.getByRole('status')).toBeInTheDocument()
    rerender(
      <Alert variant="success" announce={false}>
        알림
      </Alert>,
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('복사 알림은 바깥 aria-live=polite 하나뿐이고 안쪽에 다른 live 영역이 없다', () => {
    const { container, rerender } = render(<CopyNotice status="success" />)
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1)
    expect(container.querySelector('[role="status"], [role="alert"]')).toBeNull()
    rerender(<CopyNotice status="error" />)
    expect(container.querySelectorAll('[aria-live]')).toHaveLength(1)
    expect(container.querySelector('[role="status"], [role="alert"]')).toBeNull()
    expect(screen.getByText('복사하지 못했어요. 결과를 직접 선택해 복사해 주세요.')).toBeInTheDocument()
  })

  it('분석 중: role=status는 현재 단계 한 줄뿐이고 카드 전체가 live 영역이 아니다', () => {
    const { container } = render(<StatusScreen variant="analyzing" activeStep={2} />)
    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(1)
    expect(statuses[0]).toHaveTextContent(`진행 중: ${ANALYSIS_STEPS[2]}`)
    expect(statuses[0]).toHaveClass('sr-only')
    expect(container.querySelector('section')).not.toHaveAttribute('role')
  })

  it('실패 계열 카드는 role=alert 하나이다', () => {
    render(<StatusScreen variant="failed" />)
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })
})

describe('목차 현재 위치', () => {
  it('activeId인 링크만 aria-current=location이다', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    render(<SectionNav infos={sectionInfos(emptyDraft())} ids={ids} activeId="c" />)
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.getAttribute('aria-current'))).toEqual([null, null, 'location', null, null])
  })
})

describe('공통 컴포넌트 통합 후 동작', () => {
  it('Radio와 Checkbox는 같은 Choice 구조이고 type만 다르다', () => {
    const { container } = render(
      <>
        <Radio name="x" label="가" />
        <Checkbox label="나" />
      </>,
    )
    const inputs = [...container.querySelectorAll('input.choice__input')]
    expect(inputs.map((i) => i.getAttribute('type'))).toEqual(['radio', 'checkbox'])
    expect(container.querySelectorAll('.choice__mark')).toHaveLength(2)
  })

  it('Input과 Textarea는 같은 TextField를 통해 같은 라벨·글자 수 연결을 만든다', () => {
    render(
      <>
        <Input label="한 줄" maxLength={5} value="가나" onChange={() => {}} />
        <Textarea label="여러 줄" maxLength={9} value="가나다" onChange={() => {}} />
      </>,
    )
    expect(screen.getByLabelText('한 줄')).toHaveAccessibleDescription('2 / 최대 5자')
    expect(screen.getByLabelText('여러 줄')).toHaveAccessibleDescription('3 / 최대 9자')
    expect(screen.getByLabelText('한 줄').tagName).toBe('INPUT')
    expect(screen.getByLabelText('여러 줄').tagName).toBe('TEXTAREA')
  })
})
