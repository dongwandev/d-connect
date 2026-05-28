import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { SdgAnalysisSkeleton } from '@/components/skeleton/SdgAnalysisSkeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <SdgAnalysisSkeleton />
    </AppShellSkeleton>
  )
}
