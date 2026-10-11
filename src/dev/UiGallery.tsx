import { useState } from 'react'
import { Header } from '../components/ui/Header'
import { PageHeader } from '../components/ui/PageHeader'
import { Button, type ButtonVariant } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Radio } from '../components/ui/Radio'
import { Checkbox } from '../components/ui/Checkbox'
import { Badge, NeedsConfirmBadge, StandardNameBadge } from '../components/ui/Badge'
import { Tag } from '../components/ui/Tag'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'
import { RepeatableRows } from '../components/input/RepeatableRows'
import { NoneChoice } from '../components/input/NoneChoice'
import { StatusScreen } from '../components/result/StatusScreen'
import { CopyNotice } from '../components/result/CopyNotice'
import type { StatusVariant } from '@shared/messages'

const BUTTONS: ButtonVariant[] = ['mint', 'ghost', 'teal', 'outline', 'danger', 'add']
const STATUSES: StatusVariant[] = ['analyzing', 'empty', 'failed', 'invalid-output', 'timeout', 'rate-limited']

// 개발 전용 컴포넌트 갤러리(/dev/ui). 프로덕션 번들에는 들어가지 않는다.
export default function UiGallery() {
  const [text, setText] = useState('사회복지학')
  const [none, setNone] = useState(false)
  const [rows, setRows] = useState([{ v: '' }])

  return (
    <>
      <Header />
      <main id="main" className="gallery">
        <PageHeader kicker="DEV · UI" title="공통 컴포넌트 갤러리" subtitle="개발 서버에서만 열립니다." />

        <section aria-labelledby="g-btn">
          <h2 id="g-btn">Button</h2>
          <div className="gallery__row gallery__dark" data-surface="dark">
            <Button variant="mint" icon="→">상담 시작하기</Button>
            <Button variant="ghost">이용 방법 보기</Button>
          </div>
          <div className="gallery__row">
            {BUTTONS.map((v) => (
              <Button key={v} variant={v}>{v}</Button>
            ))}
            <Button variant="teal" size="sm">작은 버튼</Button>
            <Button variant="teal" disabled disabledReason="최대 3개까지 입력할 수 있어요">비활성</Button>
          </div>
        </section>

        <section aria-labelledby="g-form">
          <h2 id="g-form">Input · Textarea · Select · Radio · Checkbox</h2>
          <div className="gallery__stack gallery__stack--form">
            <Input label="전공" required hint="주전공을 적어 주세요." maxLength={100} value={text} onChange={(e) => setText(e.target.value)} />
            <Input label="나이" required value="abc" readOnly error="나이는 숫자로 입력해 주세요." />
            <Input label="강점 2" required value="성실함" readOnly warning="강점 2가 강점 1과 같아요. 서로 다른 강점을 적어 주세요." />
            <Textarea label="인턴 내용" required maxLength={500} value="" onChange={() => {}} />
            <Select label="최종학력" required placeholder="선택해 주세요" options={[{ value: 'hs', label: '고졸 이하' }, { value: 'bs', label: '대졸' }]} />
            <Radio name="intern" label="인턴 경험 있음" defaultChecked />
            <Radio name="intern" label="인턴 경험 없음" />
            <Checkbox label="자격증 없음" />
          </div>
        </section>

        <section aria-labelledby="g-rows">
          <h2 id="g-rows">RepeatableRows · NoneChoice</h2>
          <div className="gallery__stack gallery__stack--form">
            <NoneChoice label="경력 없음" checked={none} onChange={setNone}>
              {({ disabled, disabledReason }) => (
                <RepeatableRows
                  rowLabel="경력"
                  addLabel="경력 추가"
                  items={rows}
                  onChange={setRows}
                  createEmpty={() => ({ v: '' })}
                  max={3}
                  disabled={disabled}
                  disabledReason={disabledReason}
                  renderRow={(item, _i, update) => (
                    <Input label="직무명" value={item.v} onChange={(e) => update({ v: e.target.value })} />
                  )}
                />
              )}
            </NoneChoice>
          </div>
        </section>

        <section aria-labelledby="g-badge">
          <h2 id="g-badge">Badge · Tag · Alert · Card</h2>
          <div className="gallery__row">
            <Badge variant="progress">분석 중</Badge>
            <Badge variant="error">생성 실패</Badge>
            <Badge variant="warning">요청 제한</Badge>
            <Badge variant="info">입력 필요</Badge>
            <NeedsConfirmBadge />
            <StandardNameBadge />
          </div>
          <div className="gallery__row">
            <Tag name="전공" value="사회복지학" />
            <Tag name="자격증" value="사회복지사 2급" />
          </div>
          <div className="gallery__stack">
            <Alert variant="info">참고용 안내문 예시입니다.</Alert>
            <Alert variant="warning">평소보다 오래 걸리고 있어요.</Alert>
            <Alert variant="error">입력을 확인해 주세요.</Alert>
            <Alert variant="success">결과를 복사했어요.</Alert>
          </div>
          <div className="gallery__cards">
            <Card variant="areaA"><p>영역 A 카드</p></Card>
            <Card variant="areaB"><p>영역 B 카드</p></Card>
            <Card variant="inset"><p>직업 카드(영역 A 안)</p></Card>
          </div>
        </section>

        <section aria-labelledby="g-status">
          <h2 id="g-status">StatusScreen · CopyNotice</h2>
          <div className="gallery__stack gallery__stack--wide">
            {STATUSES.map((v) => (
              <StatusScreen key={v} variant={v} activeStep={1} delayed={v === 'analyzing'} focusOnMount={false} headingLevel={2} />
            ))}
          </div>
          <CopyNotice status="success" />
          <CopyNotice status="error" />
        </section>
      </main>
    </>
  )
}
