'use client'

import { useEffect } from 'react'
import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { ErrorState } from '@/components/ErrorState'

/**
 * /dashboard route-level error boundary.
 * 페이지 진입·렌더 중 throw된 에러는 여기서 잡혀 앱 전체가 깨지지 않도록 격리한다.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 서버 로그(Next.js)에 이미 보고됐을 가능성이 높지만 클라이언트에서도 콘솔 보강
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorState
          title="대시보드를 불러올 수 없어요"
          digest={error.digest}
          onReset={reset}
        />
      </div>
    </AppShellSkeleton>
  )
}
