import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { Skeleton } from '@/components/skeleton/Skeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-6">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </AppShellSkeleton>
  )
}
