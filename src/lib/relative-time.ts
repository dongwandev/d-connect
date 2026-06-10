/**
 * 알림·목록용 상대 시간 포맷 (한국어).
 *
 * 순수 함수 — now를 주입받아 테스트 가능. 미래 시각은 '방금 전'으로 처리
 * (클라이언트-서버 시계 오차 방어).
 */
export function formatRelativeTime(
  date: Date | string,
  now: Date = new Date(),
): string {
  const t = typeof date === 'string' ? new Date(date) : date
  const diffMs = Math.max(0, now.getTime() - t.getTime())

  const min = Math.floor(diffMs / 60_000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`

  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`

  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`

  return t.toLocaleDateString('ko-KR')
}
