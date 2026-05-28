'use client'

import { useEffect } from 'react'
import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { ErrorState } from '@/components/ErrorState'

export default function CompanyDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Company detail error:', error)
  }, [error])

  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorState
          title="기업 정보를 불러올 수 없어요"
          message="잠시 후 다시 시도해 주세요. 기업을 찾지 못한 경우 대시보드로 돌아가 확인해 주세요."
          digest={error.digest}
          onReset={reset}
        />
      </div>
    </AppShellSkeleton>
  )
}
