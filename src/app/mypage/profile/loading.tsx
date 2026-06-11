import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { FormSkeleton } from '@/components/skeleton/FormSkeleton'

export default function Loading() {
  return (
    <AppShellSkeleton>
      <FormSkeleton rows={5} withNav />
    </AppShellSkeleton>
  )
}
