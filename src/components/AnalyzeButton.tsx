'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }

export function AnalyzeButton({ companyId }: { companyId: string }) {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onClick() {
    setState({ kind: 'submitting' })
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
        setState({ kind: 'error', message })
        return
      }

      router.push(`/sdg-analysis/${json.data.id}`)
      router.refresh()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={state.kind === 'submitting'}
        className="rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {state.kind === 'submitting'
          ? 'AI 분석 중... (최대 30초)'
          : 'SDGs 분석 실행'}
      </button>
      {state.kind === 'error' && (
        <p className="text-sm text-red-600">❌ {state.message}</p>
      )}
    </div>
  )
}
