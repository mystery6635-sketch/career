import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { RepeatableRows } from '../../../src/components/input/RepeatableRows'
import { NoneChoice } from '../../../src/components/input/NoneChoice'
import { StatusScreen } from '../../../src/components/result/StatusScreen'
import { CopyNotice } from '../../../src/components/result/CopyNotice'
import { useCopyFeedback } from '../../../src/hooks/useCopyFeedback'
import { ANALYSIS_STEPS, STATUS_SCREENS, type StatusVariant } from '@shared/messages'

function Rows({ max = 3, disabled = false, reason }: { max?: number; disabled?: boolean; reason?: string }) {
  const [items, setItems] = useState([{ v: '' }])
  return (
    <RepeatableRows
      rowLabel="경력"
      addLabel="경력 추가"
      items={items}
      onChange={setItems}
      createEmpty={() => ({ v: '' })}
      max={max}
      disabled={disabled}
      disabledReason={reason}
      renderRow={(item, i, update) => (
        <input aria-label={`값 ${i + 1}`} value={item.v} onChange={(e) => update({ v: e.target.value })} />
      )}
    />
  )
}

describe('RepeatableRows (T029)', () => {
  it('행 번호 라벨과 마지막 한 행의 "비우기"가 보인다', () => {
    render(<Rows />)
    expect(screen.getByText('경력 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '경력 1 비우기' })).toBeInTheDocument()
  })

  it('비우기는 행을 지우지 않고 내용만 비운다', async () => {
    render(<Rows />)
    await userEvent.type(screen.getByLabelText('값 1'), '간호사')
    await userEvent.click(screen.getByRole('button', { name: '경력 1 비우기' }))
    expect(screen.getByLabelText('값 1')).toHaveValue('')
    expect(screen.getAllByLabelText(/값 \d/)).toHaveLength(1)
  })

  it('최대 개수에서 추가가 막히고 안내 문구로 바뀐다', async () => {
    render(<Rows max={2} />)
    await userEvent.click(screen.getByRole('button', { name: /경력 추가/ }))
    expect(screen.getAllByLabelText(/값 \d/)).toHaveLength(2)
    const addButton = screen.getByRole('button', { name: '최대 2개까지 입력할 수 있어요' })
    expect(addButton).toBeDisabled()
  })

  it('키보드만으로 추가·삭제가 된다', async () => {
    render(<Rows />)
    const add = screen.getByRole('button', { name: /경력 추가/ })
    add.focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getAllByLabelText(/값 \d/)).toHaveLength(2)
    screen.getByRole('button', { name: '경력 2 삭제' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getAllByLabelText(/값 \d/)).toHaveLength(1)
  })

  it('외부에서 비활성화하면 입력이 막히고 사유가 글자로 보인다', () => {
    render(<Rows disabled reason="선택됨: 경력 없음." />)
    expect(screen.getByLabelText('값 1')).toBeDisabled()
    expect(screen.getByText('선택됨: 경력 없음.')).toBeVisible()
  })
})

describe('NoneChoice (T030)', () => {
  it('선택하면 연결 입력이 비활성이 되고 이유가 글자로 보인다', async () => {
    function Wrapper() {
      const [none, setNone] = useState(false)
      return (
        <NoneChoice label="경력 없음" checked={none} onChange={setNone}>
          {({ disabled, disabledReason }) => <Rows disabled={disabled} reason={disabledReason} />}
        </NoneChoice>
      )
    }
    render(<Wrapper />)
    expect(screen.getByLabelText('값 1')).toBeEnabled()
    await userEvent.click(screen.getByRole('checkbox', { name: /경력 없음/ }))
    expect(screen.getByLabelText('값 1')).toBeDisabled()
    expect(screen.getByText(/선택됨: 경력 없음/)).toBeVisible()
  })
})

describe('StatusScreen (T031)', () => {
  const variants = Object.keys(STATUS_SCREENS) as StatusVariant[]

  it('7개 변형(분석 중의 지연 포함) 가운데 6개 화면 변형이 모두 있다', () => {
    expect(variants).toHaveLength(6)
  })

  it.each(variants)('%s: 문구와 행동 버튼이 design §14와 같다', (variant) => {
    const def = STATUS_SCREENS[variant]
    render(<StatusScreen variant={variant} />)
    expect(screen.getByRole('heading', { level: 1, name: def.title })).toHaveFocus()
    expect(screen.getByText(def.body)).toBeInTheDocument()
    expect(screen.getByText(def.badge)).toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(def.actions.length)
  })

  it.each(['failed', 'invalid-output', 'timeout', 'rate-limited'] as StatusVariant[])(
    '%s: role=alert이고 "입력하신 내용은 그대로 남아 있습니다"가 있다',
    (variant) => {
      render(<StatusScreen variant={variant} />)
      expect(screen.getByRole('alert')).toHaveTextContent('입력하신 내용은 그대로 남아 있습니다')
    },
  )

  it('분석 중: 단계 4개에 완료/진행 중/대기 텍스트가 있고 진행률 숫자·막대가 없다', () => {
    const { container } = render(<StatusScreen variant="analyzing" activeStep={1} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    for (const step of ANALYSIS_STEPS) expect(screen.getByText(step)).toBeInTheDocument()
    expect(screen.getAllByText('완료')).toHaveLength(1)
    expect(screen.getAllByText('진행 중')).toHaveLength(1)
    expect(screen.getAllByText('대기')).toHaveLength(2)
    expect(container.querySelector('progress, [role="progressbar"]')).toBeNull()
    expect(container.textContent).not.toMatch(/\d+\s*%/)
  })

  it('30초 지연 안내는 delayed일 때만 role=status로 보인다', () => {
    const { rerender } = render(<StatusScreen variant="analyzing" />)
    expect(screen.queryByText(/평소보다 오래 걸리고 있어요/)).toBeNull()
    rerender(<StatusScreen variant="analyzing" delayed />)
    expect(screen.getByText(/평소보다 오래 걸리고 있어요/)).toBeInTheDocument()
  })

  it('다시 시도·입력 수정하기 버튼이 콜백을 호출한다', async () => {
    const onRetry = vi.fn()
    const onEdit = vi.fn()
    render(<StatusScreen variant="failed" onRetry={onRetry} onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /다시 시도/ }))
    await userEvent.click(screen.getByRole('button', { name: /입력 수정하기/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})

describe('CopyNotice와 useCopyFeedback (T032)', () => {
  it('live region(aria-live=polite)이 항상 있고 성공·실패 문구가 텍스트로 나타난다', () => {
    const { container, rerender } = render(<CopyNotice status="idle" />)
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull()
    rerender(<CopyNotice status="success" />)
    expect(screen.getByText('결과를 복사했어요. 구직자 입력 정보는 포함되지 않아요.')).toBeInTheDocument()
    rerender(<CopyNotice status="error" />)
    expect(screen.getByText('복사하지 못했어요. 결과를 직접 선택해 복사해 주세요.')).toBeInTheDocument()
  })

  it('버튼 완료 표시는 2.5초 뒤 복귀하고 알림은 남는다', async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCopyFeedback(() => Promise.resolve()))
    await act(async () => {
      await result.current.copy()
    })
    expect(result.current.status).toBe('success')
    expect(result.current.buttonDone).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2499)
    })
    expect(result.current.buttonDone).toBe(true)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.buttonDone).toBe(false)
    expect(result.current.status).toBe('success')
    vi.useRealTimers()
  })

  it('복사에 실패하면 error 상태가 된다', async () => {
    const { result } = renderHook(() => useCopyFeedback(() => Promise.reject(new Error('x'))))
    await act(async () => {
      await result.current.copy()
    })
    expect(result.current.status).toBe('error')
    expect(result.current.buttonDone).toBe(false)
  })
})
