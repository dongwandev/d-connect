import { Skeleton } from './Skeleton'

/**
 * /companies/[id] 로딩 골격 — 그라데이션 헤더 + CTA + 좌(기본정보·통계)/우(활동) grid.
 */
export function CompanyDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <Skeleton className="h-4 w-24" />

      <header className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-4 bg-gradient-to-br from-brand-50 to-blue-50 px-6 py-5">
          <Skeleton className="h-16 w-16 rounded-2xl bg-gray-300" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-7 w-24" />
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.3fr]">
        <section className="space-y-4">
          <div className="space-y-3 rounded-xl border border-border bg-surface p-5">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-7 w-10" />
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <Skeleton className="mb-3 h-4 w-40" />
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="space-y-2 rounded-lg border border-border bg-surface-muted p-4"
              >
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
