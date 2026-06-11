import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { Skeleton } from '@/components/skeleton/Skeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-3xl space-y-3 px-6 py-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </AppShellSkeleton>
  )
}
