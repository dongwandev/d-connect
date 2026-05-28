'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CONTENT_TYPE_LABEL,
  ContentTypeSchema,
  type ContentType,
} from '@/lib/enums'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting'; type: ContentType }
  | { kind: 'error'; message: string }

const TYPES = ContentTypeSchema.options

/**
 * 분석 결과 페이지에 노출되는 4유형 콘텐츠 생성 버튼.
 * 클릭 → POST /api/sdg-analysis/[id]/content → router.refresh()로 목록 갱신.
 */
export function ContentGenerationButtons({
  analysisId,
}: {
  analysisId: string
}) {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function generate(type: ContentType) {
    setState({ kind: 'submitting', type })
    try {
      const res = await fetch(`/api/sdg-analysis/${analysisId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const json = (await res.json()) as
        | { data: unknown }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        const message =
          'error' in json
            ? `[${json.error.code}] ${json.error.message}`
            : `HTTP ${res.status}`
        setState({ kind: 'error', message })
        return
      }

      setState({ kind: 'idle' })
      router.refresh() // 분석 페이지의 콘텐츠 카드 목록 재로드
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  const submitting = state.kind === 'submitting'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TYPES.map((t) => {
          const active = state.kind === 'submitting' && state.type === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => generate(t)}
              disabled={submitting}
              className="rounded border border-gray-200 bg-white px-3 py-3 text-sm font-medium text-gray-800 hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {active ? '생성 중...' : `+ ${CONTENT_TYPE_LABEL[t]}`}
            </button>
          )
        })}
      </div>
      {state.kind === 'error' && (
        <p className="text-sm text-red-600">❌ {state.message}</p>
      )}
      <p className="text-xs text-gray-500">
        유형을 선택하면 AI가 콘텐츠 1건을 생성합니다 (최대 30초).
      </p>
    </div>
  )
}
