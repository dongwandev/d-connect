import { describe, expect, it } from 'vitest'
import { maskEmail } from './mask-email'

describe('maskEmail', () => {
  it('앞 2자 노출 + 나머지 마스킹', () => {
    expect(maskEmail('demo@d-connect.kr')).toBe('de**@d-connect.kr')
    expect(maskEmail('hongildong@gmail.com')).toBe('ho********@gmail.com')
  })

  it('짧은 로컬 파트는 1자만 노출, 별표는 최소 2개', () => {
    expect(maskEmail('ab@x.kr')).toBe('a**@x.kr')
    expect(maskEmail('a@x.kr')).toBe('a**@x.kr')
  })

  it('@ 없는 비정상 입력은 그대로 반환', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email')
  })
})
