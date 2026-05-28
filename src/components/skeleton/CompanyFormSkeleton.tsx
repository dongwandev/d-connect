import { Skeleton } from './Skeleton'

/**
 * /companies/new + /companies/[id]/edit 로딩 골격 — 긴 폼 (기본 정보 + 다중 선택 + 활동 목록).
 */
export function CompanyFormSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Skeleton className="h-4 w-32" />

      <header className="space-y-2 px-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </header>

      <div className="space-y-5 rounded-xl border border-border bg-surface p-6">
        {/* 기본 정보 그룹 */}
        <section className="space-y-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </section>

        {/* 다중 선택 그룹 (타겟·홍보 목표) */}
        <section className="space-y-3 border-t border-border pt-5">
          <Skeleton className="h-5 w-28" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))}
          </div>
        </section>

        {/* 활동 목록 */}
        <section className="space-y-3 border-t border-border pt-5">
          <Skeleton className="h-5 w-20" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-border bg-surface-muted p-4"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </section>

        <div className="flex justify-end gap-2 border-t border-border pt-5">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  )
}
