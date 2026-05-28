import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { CompanyFormSkeleton } from '@/components/skeleton/CompanyFormSkeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <CompanyFormSkeleton />
    </AppShellSkeleton>
  )
}
