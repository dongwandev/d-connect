import { describe, expect, it } from 'vitest'
import { formatPhone } from './phone'

describe('formatPhone', () => {
  it('휴대폰 11자리 완성형 3-4-4', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678')
  })

  it('10자리는 3-3-4 (옛 휴대폰·지역번호)', () => {
    expect(formatPhone('0101234567')).toBe('010-123-4567')
    expect(formatPhone('0421234567')).toBe('042-123-4567')
  })

  it('서울 02는 지역번호 2자리', () => {
    expect(formatPhone('021234567')).toBe('02-123-4567')
    expect(formatPhone('0212345678')).toBe('02-1234-5678')
  })

  it('타이핑 중간 단계 — 하이픈이 점진적으로 붙는다', () => {
    expect(formatPhone('010')).toBe('010')
    expect(formatPhone('0101')).toBe('010-1')
    expect(formatPhone('010123')).toBe('010-123')
    expect(formatPhone('0101234')).toBe('010-123-4')
    expect(formatPhone('0101234567')).toBe('010-123-4567')
    // 11자리째에서 3-3-4 → 3-4-4 재배치
    expect(formatPhone('01012345678')).toBe('010-1234-5678')
  })

  it('숫자 외 문자는 제거', () => {
    expect(formatPhone('010-1234-5678')).toBe('010-1234-5678')
    expect(formatPhone('010 1234 5678')).toBe('010-1234-5678')
    expect(formatPhone('010.1234.abcd5678')).toBe('010-1234-5678')
  })

  it('최대 자릿수 초과분은 잘린다', () => {
    expect(formatPhone('010123456789999')).toBe('010-1234-5678')
    expect(formatPhone('02123456789999')).toBe('02-1234-5678')
  })

  it('빈 입력은 빈 문자열', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone('-')).toBe('')
  })
})
