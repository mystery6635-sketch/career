import { describe, expect, it } from 'vitest'
import { isBlank, normalizeLine, normalizeMultiline } from '../../shared/schema/normalize'

describe('문자열 정규화', () => {
  it('한 줄 입력: 앞뒤 공백 제거, 줄바꿈·연속 공백은 공백 하나', () => {
    expect(normalizeLine('  가   나\n다\t라  ')).toBe('가 나 다 라')
  })

  it('여러 줄 입력: 줄바꿈은 허용하되 연속 줄바꿈은 하나', () => {
    expect(normalizeMultiline('가  나\r\n\r\n\r\n다 \n 라')).toBe('가 나\n다\n라')
  })

  it('공백만 있는 값은 비어 있음', () => {
    expect(normalizeLine(' \n\t ')).toBe('')
    expect(normalizeMultiline(' \n \n')).toBe('')
    expect(isBlank('   ')).toBe(true)
    expect(isBlank(' a ')).toBe(false)
  })
})
