// "항목명: 값" 형식의 연결 항목 표시(design §20).
export function Tag({ name, value }: { name: string; value: string }) {
  return (
    <span className="tag">
      <span className="tag__name">{name}:</span> <span className="tag__value">{value}</span>
    </span>
  )
}
