import { Skeleton } from './Skeleton'

/**
 * 단순 폼 로딩 골격 — /contents/[id], /account 같은 짧은 폼 페이지에 공용.
 *
 * @param rows 입력 필드 수 (default 5)
 */
export function FormSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <Skeleton className="h-4 w-32" />

      <header className="space-y-2 px-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </header>

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
