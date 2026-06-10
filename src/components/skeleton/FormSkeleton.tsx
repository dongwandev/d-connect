import { Skeleton } from './Skeleton'

/**
 * 단순 폼 로딩 골격 — /contents/[id], /account 같은 짧은 폼 페이지에 공용.
 *
 * D7부터 페이지 제목이 TopBar로 이동:
 *   - /account: 본문이 카드로 바로 시작 (기본값)
 *   - /contents/[id]: 브레드크럼 한 줄 후 폼 (withNav + wide)
 *
 * @param rows 입력 필드 수 (default 5)
 * @param withNav 상단 브레드크럼 placeholder 표시
 * @param wide max-w-3xl 컨테이너 (/contents/[id] 폭)
 */
export function FormSkeleton({
  rows = 5,
  withNav = false,
  wide = false,
}: {
  rows?: number
  withNav?: boolean
  wide?: boolean
}) {
  return (
    <div
      className={`mx-auto space-y-6 px-6 py-8 ${wide ? 'max-w-3xl' : 'max-w-2xl'}`}
    >
      {withNav && <Skeleton className="h-9 w-48 rounded-lg" />}

      <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        <div className="flex justify-end gap-2 border-t border-border pt-5">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  )
}
