import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { CardGridSkeleton } from '@/components/skeleton/CardGridSkeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <CardGridSkeleton />
    </AppShellSkeleton>
  )
}
