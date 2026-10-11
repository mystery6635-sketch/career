import { RESULT_PAGE } from '@shared/messages'

// 강점이 객관 이력과 연결되지 않을 때의 안내(design §13.7). 복사·인쇄에서는 "함께 이야기 나눠 볼 점"으로 유지된다.
export function MismatchNote({ note }: { note: string }) {
  return (
    <div className="mismatch">
      <span className="mismatch__icon" aria-hidden="true">
        ※
      </span>
      <div>
        <p className="mismatch__title">
          <span className="label__screen">{RESULT_PAGE.keyword.mismatchTitle}</span>
          <span className="label__print">{RESULT_PAGE.keyword.mismatchPrintLabel} · </span>
        </p>
        <p className="mismatch__text">{note}</p>
      </div>
    </div>
  )
}
