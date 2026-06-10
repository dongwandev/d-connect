import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './relative-time'

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-10T12:00:00+09:00')

  it('1분 미만은 방금 전', () => {
    expect(formatRelativeTime(new Date('2026-06-10T11:59:30+09:00'), now)).toBe(
      '방금 전',
    )
  })

  it('미래 시각도 방금 전 (시계 오차 방어)', () => {
    expect(formatRelativeTime(new Date('2026-06-10T12:05:00+09:00'), now)).toBe(
      '방금 전',
    )
  })

  it('분 단위', () => {
    expect(formatRelativeTime(new Date('2026-06-10T11:15:00+09:00'), now)).toBe(
      '45분 전',
    )
  })

  it('시간 단위', () => {
    expect(formatRelativeTime(new Date('2026-06-10T05:00:00+09:00'), now)).toBe(
      '7시간 전',
    )
  })

  it('일 단위 (7일 미만)', () => {
    expect(formatRelativeTime(new Date('2026-06-07T12:00:00+09:00'), now)).toBe(
      '3일 전',
    )
  })

  it('7일 이상은 절대 날짜', () => {
    const old = new Date('2026-05-20T12:00:00+09:00')
    expect(formatRelativeTime(old, now)).toBe(old.toLocaleDateString('ko-KR'))
  })

  it('ISO string 입력 지원', () => {
    expect(formatRelativeTime('2026-06-10T11:00:00+09:00', now)).toBe(
      '1시간 전',
    )
  })
})
