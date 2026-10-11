import { useEffect, useState } from 'react'

/** 화면 위쪽에 가장 가까이 보이는 입력 섹션의 id. 데스크톱 목차의 "현재 위치" 표시에 쓴다(design §11, §26의 12번). */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0])
  const key = ids.join('|')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    // 화면 위쪽 1/3 지점을 지나는 섹션을 현재 섹션으로 본다.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-10% 0px -60% 0px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key])

  return active
}
