// 화면에서는 긴 라벨, 인쇄에서는 굵은 짧은 라벨("근거 · ")을 보인다(contracts/copy-and-print.md 2절).
export function Label({ screen, print }: { screen: string; print: string }) {
  return (
    <h4 className="label">
      <span className="label__screen">{screen}</span>
      <span className="label__print">{print} · </span>
    </h4>
  )
}
