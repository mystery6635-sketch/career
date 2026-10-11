import { MAIN } from '@shared/messages'

// Hero의 장식 시각 요소. 같은 정보는 결과 미리보기에 텍스트로 있으므로 낭독기에서는 숨긴다.
// 데스크톱: 카드 4장이 어긋나게 쌓이고 오른쪽 직업 카드로 선이 이어진다. 모바일: 2×2 카드 + "연결" 구분선 + 직업 카드.
const LINES = [
  'M210 56 C 280 56, 290 200, 340 200',
  'M250 156 C 300 156, 310 200, 340 200',
  'M210 256 C 280 256, 290 200, 340 200',
  'M250 356 C 300 356, 310 200, 340 200',
]

export function ResumeFragments() {
  const ex = MAIN.heroExample
  return (
    <div className="rf" aria-hidden="true">
      <svg className="rf__lines" viewBox="0 0 560 420" focusable="false">
        {LINES.map((d) => (
          <path key={d} d={d} className="rf__line motion-dash-flow" />
        ))}
      </svg>
      <div className="rf__cards">
        {ex.cards.map((c, i) => (
          <div className="rf__card motion-float-in" style={{ ['--motion-delay' as string]: `${0.1 + i * 0.1}s` }} key={c.label}>
            <span className="rf__label">{c.label}</span>
            <span className="rf__value">{c.value}</span>
          </div>
        ))}
      </div>
      <div className="rf__connect">{ex.connect}</div>
      <div className="rf__job motion-float-in" style={{ ['--motion-delay' as string]: '0.45s' }}>
        <span className="rf__job-tag">{ex.jobTag}</span>
        <strong className="rf__job-title">{ex.jobTitle}</strong>
        <span className="rf__job-sub">{ex.jobSubtitle}</span>
      </div>
    </div>
  )
}
