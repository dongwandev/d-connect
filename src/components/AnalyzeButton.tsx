'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

type State = 'idle' | 'submitting'

/**
 * SDGs 분석 트리거 버튼.
 *
 * 실제 Anthropic 호출은 최대 30초 소요 가능. 진행 중에 indeterminate progress bar로
 * '뭔가 진행 중'임을 명확히 알린다.
 *
 * 결과/실패 알림은 Toast 시스템으로 통일 (인라인 메시지 X).
 */
export function AnalyzeButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const toast = useToast()
  const [state, setState] = useState<State>('idle')

  async function onClick() {
    setState('submitting')
    toast.info('SDGs 분석 시작', '최대 30초가 소요될 수 있습니다.')
    try {
      const res = await fetch(`/api/companies/${companyId}/sdg-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const json = (await res.json()) as
        | { data: { id: string } }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        const message =
          'error' in json
            ? `[${json.error.code}] ${json.error.message}`
            : `HTTP ${res.status}`
        toast.error('분석 실패', message)
        setState('idle')
        return
      }

      toast.success('분석 완료')
      router.push(`/sdg-analysis/${json.data.id}`)
      router.refresh()
    } catch (e) {
      toast.error(
        '분석 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
      setState('idle')
    }
  }

  const isBusy = state === 'submitting'

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={isBusy}
        className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {isBusy ? 'AI 분석 중... (최대 30초)' : 'SDGs 분석 실행'}
      </button>

      {isBusy && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-brand-100"
          role="progressbar"
          aria-label="분석 진행 중"
        >
          <div className="indeterminate-bar h-full rounded-full bg-brand-500" />
        </div>
      )}
    </div>
  )
}
