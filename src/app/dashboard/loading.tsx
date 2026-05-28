import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton'

/**
 * /dashboard 진입 시 Suspense fallback.
 * Next.js App Router는 같은 폴더의 loading.tsx를 자동으로 페이지의 Suspense fallback으로 연결한다.
 */
export default function Loading() {
  return (
    <AppShellSkeleton>
      <DashboardSkeleton />
    </AppShellSkeleton>
  )
}
