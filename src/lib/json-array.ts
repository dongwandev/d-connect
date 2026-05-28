/**
 * SQLite의 배열 미지원을 보완하는 JSON-string 직렬화 헬퍼.
 *
 * 사용처:
 *   - `SdgAnalysis.socialFunctions: SocialCategory[]` → `String` 컬럼
 *   - `SdgMatch.keywords: string[]` → `String` 컬럼
 *   - `GeneratedContent.hashtags: string[]` → `String` 컬럼
 *
 * 정책: 손상되거나 형식 오류인 문자열은 빈 배열로 안전하게 폴백한다
 * (시연 안정성 우선 — DB 레거시 데이터로 인해 페이지 전체가 깨지지 않게).
 */

export function serializeJsonArray<T>(arr: ReadonlyArray<T>): string {
  return JSON.stringify(arr)
}

export function parseJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}
