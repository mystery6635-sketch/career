import { NOTICE_LINES } from '@shared/messages'

/** 참고용 안내문 두 줄. 같은 문구를 상단 고정 바(위)와 하단 박스(아래)에서 쓴다(FR-016). 인쇄에서는 안내 상자가 된다. */
export function NoticeLines({ result }: { result?: readonly [string, string] }) {
  const lines = result ?? NOTICE_LINES
  return (
    <>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </>
  )
}

export function NoticeBar({ lines }: { lines?: readonly [string, string] }) {
  return (
    <div className="notice-bar" role="note">
      <div className="notice-bar__inner">
        <NoticeLines result={lines} />
      </div>
    </div>
  )
}

export function NoticeBox({ lines }: { lines?: readonly [string, string] }) {
  return (
    <div className="notice-bottom" role="note">
      <NoticeLines result={lines} />
    </div>
  )
}
