import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { Skeleton } from '@/components/skeleton/Skeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </AppShellSkeleton>
  )
}
