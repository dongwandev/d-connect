import { Skeleton } from './Skeleton'

/**
 * /dashboard 로딩 골격 — 통계 4카드 + 좌(기업)/우(차트 2종) grid.
 * D7부터 페이지 제목/CTA가 TopBar로 이동해 본문은 통계 grid로 바로 시작한다.
 * 실제 페이지 레이아웃과 클래스를 맞춰 깜빡임을 최소화한다.
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border bg-surface p-5"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </section>
    </div>
  )
}
