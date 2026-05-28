'use client'

import { useEffect } from 'react'
import { AppShellSkeleton } from '@/components/skeleton/AppShellSkeleton'
import { ErrorState } from '@/components/ErrorState'

export default function SdgAnalysisError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('SDG analysis error:', error)
  }, [error])

  return (
    <AppShellSkeleton>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <ErrorState
          title="SDGs 분석 결과를 불러올 수 없어요"
          message="AI 호출이 실패했거나 분석 데이터를 찾지 못했습니다. 잠시 후 다시 시도해 주세요."
          digest={error.digest}
          onReset={reset}
        />
      </div>
    </AppShellSkeleton>
  )
}
