/**
 * 이메일 마스킹 — 계정 찾기 결과 노출용.
 *
 * 로컬 파트 앞 1~2자만 남기고 '*'로 가린다. 별표 개수는 최소 2개로 고정해
 * 짧은 주소의 실제 길이를 유추하기 어렵게 한다. 도메인은 그대로 노출
 * (사용자가 본인 메일 서비스를 알아봐야 하므로).
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const visible = local.slice(0, local.length > 2 ? 2 : 1)
  const stars = '*'.repeat(Math.max(2, local.length - visible.length))
  return `${visible}${stars}@${domain}`
}
