import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { CompanyDetailSkeleton } from '@/components/skeleton/CompanyDetailSkeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <CompanyDetailSkeleton />
    </AppShellSkeleton>
  )
}
