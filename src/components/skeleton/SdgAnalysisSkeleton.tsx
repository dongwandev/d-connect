import { Skeleton } from './Skeleton'

/**
 * /sdg-analysis/[id] 로딩 골격 — 브레드크럼 + SDG 카드 grid + 콘텐츠 탭/리스트.
 * D7부터 페이지 제목이 TopBar로 이동해 본문은 nav 한 줄로 시작한다.
 */
export function SdgAnalysisSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <Skeleton className="h-9 w-44 rounded-lg" />

      {/* SDG 카드 grid */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg bg-gray-300" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        ))}
      </section>

      {/* 콘텐츠 탭 */}
      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <div className="flex gap-2 border-b border-border pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="space-y-3 pt-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-border bg-surface-muted p-4"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-44 rounded-lg" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-14" />
                  <Skeleton className="h-7 w-14" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
