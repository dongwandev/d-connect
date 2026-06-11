import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { Skeleton } from '@/components/skeleton/Skeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    </AppShellSkeleton>
  )
}
