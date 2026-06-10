import { Skeleton } from './Skeleton'

/**
 * 카드 grid 로딩 골격 — /companies(기업 관리), /contents(내 콘텐츠) 공용.
 * 실제 페이지의 max-w-5xl + 2열 카드 grid와 정렬.
 */
export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2 border-t border-border pt-4">
              <Skeleton className="h-9 flex-1 rounded-lg" />
              <Skeleton className="h-9 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
