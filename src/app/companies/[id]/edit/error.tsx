'use client'

import { useEffect } from 'react'
import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { ErrorState } from '@/components/ErrorState'

export default function CompanyEditError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Company edit error:', error)
  }, [error])

  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorState
          title="기업 정보 수정 페이지를 불러올 수 없어요"
          digest={error.digest}
          onReset={reset}
        />
      </div>
    </AppShellSkeleton>
  )
}
