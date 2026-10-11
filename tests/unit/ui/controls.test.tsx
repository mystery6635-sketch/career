import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Button } from '../../../src/components/ui/Button'
import { Input } from '../../../src/components/ui/Input'
import { Textarea } from '../../../src/components/ui/Textarea'
import { Select } from '../../../src/components/ui/Select'
import { Radio } from '../../../src/components/ui/Radio'
import { Checkbox } from '../../../src/components/ui/Checkbox'

describe('Button (T020)', () => {
  it('비활성이면 사유 텍스트가 접근 가능한 설명으로 연결되고 클릭이 막힌다', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled disabledReason="최대 3개까지 입력할 수 있어요" onClick={onClick}>
        추가
      </Button>,
    )
    const button = screen.getByRole('button', { name: '추가' })
    // 사유가 있는 비활성 버튼은 aria-disabled로 포커스를 받아 사유를 읽을 수 있다.
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toBeDisabled()
    expect(button).toHaveAccessibleDescription('최대 3개까지 입력할 수 있어요')
    button.focus()
    expect(button).toHaveFocus()
    expect(screen.getByText('최대 3개까지 입력할 수 있어요')).toBeVisible()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('활성 버튼은 클릭되고 아이콘은 낭독기에서 숨겨진다', async () => {
    const onClick = vi.fn()
    render(
      <Button icon="→" onClick={onClick}>
        시작
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: '시작' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByText('→')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Button 아이콘 위치 (T020)', () => {
  it('화살표(→)는 글자 뒤, 나머지 아이콘은 글자 앞이다', () => {
    render(
      <>
        <Button icon="→">다음</Button>
        <Button icon="↻">다시</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: /다음/ }).textContent).toBe('다음→')
    expect(screen.getByRole('button', { name: /다시/ }).textContent).toBe('↻다시')
  })

  it('사유가 없는 비활성 버튼은 native disabled이다', () => {
    render(<Button disabled>잠금</Button>)
    expect(screen.getByRole('button', { name: '잠금' })).toBeDisabled()
  })
})

describe('Input (T021)', () => {
  it('필수 텍스트, 글자 수, 오류가 aria-describedby로 힌트 → 글자 수 → 오류 순으로 연결된다', () => {
    render(
      <Input label="전공" required hint="주전공" maxLength={10} value="가나다" onChange={() => {}} error="오류 문구" />,
    )
    const input = screen.getByLabelText(/전공/)
    expect(screen.getByText('(필수)')).toBeInTheDocument()
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const ids = input.getAttribute('aria-describedby')!.split(' ')
    const texts = ids.map((id) => document.getElementById(id)!.textContent)
    expect(texts[0]).toBe('주전공')
    expect(texts[1]).toBe('3 / 최대 10자')
    expect(texts[2]).toContain('오류 문구')
  })

  it('한도에 닿으면 글자 수 안내에 (최대)가 붙는다', () => {
    render(<Input label="강점" maxLength={3} value="가나다" onChange={() => {}} />)
    expect(screen.getByText('3 / 최대 3자 (최대)')).toBeInTheDocument()
  })

  it('선택 항목은 (선택)을 표시하고 오류가 없으면 aria-invalid가 false이다', () => {
    render(<Input label="자격증" required={false} value="" onChange={() => {}} />)
    expect(screen.getByText('(선택)')).toBeInTheDocument()
    expect(screen.getByLabelText(/자격증/)).toHaveAttribute('aria-invalid', 'false')
  })

  it('경고는 오류와 별도 텍스트로 연결된다', () => {
    render(<Input label="강점 2" value="x" onChange={() => {}} warning="강점 1과 같아요" />)
    const input = screen.getByLabelText(/강점 2/)
    expect(input).toHaveAttribute('aria-invalid', 'false')
    expect(input).toHaveAccessibleDescription(/강점 1과 같아요/)
  })
})

describe('Textarea (T022)', () => {
  it('Input과 같은 라벨·글자 수·오류 규칙을 따른다', () => {
    render(<Textarea label="인턴 내용" required maxLength={500} value="가" onChange={() => {}} error="필요해요" />)
    const area = screen.getByLabelText(/인턴 내용/)
    expect(area).toHaveAttribute('aria-invalid', 'true')
    expect(area).toHaveAccessibleDescription(/1 \/ 최대 500자/)
    expect(screen.getByText('(필수)')).toBeInTheDocument()
  })
})

describe('Select (T023)', () => {
  it('키보드만으로 선택된다', async () => {
    function Wrapper() {
      const [v, setV] = useState('')
      return (
        <Select
          label="최종학력"
          required
          placeholder="선택해 주세요"
          value={v}
          onChange={(e) => setV(e.target.value)}
          options={[
            { value: 'hs', label: '고졸 이하' },
            { value: 'bs', label: '대졸' },
          ]}
        />
      )
    }
    render(<Wrapper />)
    await userEvent.tab()
    expect(screen.getByLabelText(/최종학력/)).toHaveFocus()
    // jsdom은 select의 화살표 키 동작을 흉내 내지 못해 선택은 selectOptions로 확인한다(실제 키 조작은 E2E).
    await userEvent.selectOptions(screen.getByLabelText(/최종학력/), 'hs')
    expect((screen.getByLabelText(/최종학력/) as HTMLSelectElement).value).toBe('hs')
  })
})

describe('Radio · Checkbox (T024)', () => {
  it('Checkbox는 Space로 조작되고 체크 표지가 있다', async () => {
    render(<Checkbox label="자격증 없음" />)
    const box = screen.getByRole('checkbox', { name: /자격증 없음/ })
    await userEvent.tab()
    expect(box).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(box).toBeChecked()
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('Radio는 화살표 키로 같은 그룹의 선택이 바뀐다', async () => {
    render(
      <>
        <Radio name="intern" label="있음" defaultChecked />
        <Radio name="intern" label="없음" />
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: /있음/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: /없음/ })).toBeChecked()
  })
})
