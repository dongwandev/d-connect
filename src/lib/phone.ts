/**
 * 전화번호 입력 자동 하이픈 포맷 (한국 번호).
 *
 * 순수 함수 — 입력값에서 숫자만 추려 커서가 끝에 있는 타이핑 흐름 기준으로
 * 하이픈을 삽입한다. zod 검증 패턴(0\d{1,2}-\d{3,4}-\d{4})과 짝을 이룬다.
 *
 * 휴대폰·일반 지역번호(3자리): 10자리 3-3-4, 11자리 3-4-4
 * 서울(02, 2자리): 9자리 2-3-4, 10자리 2-4-4
 * 중간 그룹은 마지막 자리가 다 찰 때까지 3자리 기준으로 끊고,
 * 최대 자릿수에 도달하면 3→4자리로 재배치된다 (국내 서비스 통용 방식).
 */
export function formatPhone(value: string): string {
  const all = value.replace(/\D/g, '')
  const area = all.startsWith('02') ? 2 : 3
  const d = all.slice(0, area + 8) // 지역번호 + 국번(최대 4) + 4

  if (d.length <= area) return d
  if (d.length <= area + 3) return `${d.slice(0, area)}-${d.slice(area)}`
  if (d.length <= area + 7) {
    return `${d.slice(0, area)}-${d.slice(area, area + 3)}-${d.slice(area + 3)}`
  }
  return `${d.slice(0, area)}-${d.slice(area, area + 4)}-${d.slice(area + 4)}`
}
