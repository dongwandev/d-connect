'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_LABEL,
  GENERATABLE_CONTENT_TYPES,
  SDG_COLOR,
  SDG_GOAL_LABEL,
  type ContentType,
  type SdgGoal,
} from '@/lib/enums'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting'; type: ContentType }
  | { kind: 'error'; message: string }

/**
 * 콘텐츠 생성 위젯 (#92 파이프라인): ① 홍보할 SDG 단일 선택 → ② 유형 선택.
 *
 * matches는 분석 페이지가 점수 내림차순으로 전달 — 기본 선택은 최고점 SDG.
 * 클릭 → POST /api/sdg-analysis/[id]/content { type, focusSdg } → refresh.
 */
export function ContentGenerationButtons({
  analysisId,
  matches,
}: {
  analysisId: string
  matches: ReadonlyArray<{ sdg: SdgGoal; score: number }>
}) {
  const router = useRouter()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [focusSdg, setFocusSdg] = useState<SdgGoal | null>(
    matches[0]?.sdg ?? null,
  )

  async function generate(type: ContentType) {
    if (!focusSdg) return
    setState({ kind: 'submitting', type })
    try {
      const res = await fetch(`/api/sdg-analysis/${analysisId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, focusSdg }),
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
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-gray-900">
          1. 홍보할 SDGs 분야
        </legend>
        <div className="flex flex-wrap gap-2">
          {matches.map((m) => {
            const active = focusSdg === m.sdg
            return (
              <button
                key={m.sdg}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setFocusSdg(m.sdg)}
                disabled={submitting}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                  active
                    ? 'border-transparent text-white'
                    : 'border-border bg-white text-gray-700 hover:border-gray-400'
                }`}
                style={active ? { backgroundColor: SDG_COLOR[m.sdg] } : undefined}
              >
                <span>{SDG_GOAL_LABEL[m.sdg]}</span>
                <span className={active ? 'opacity-80' : 'text-gray-400'}>
                  {m.score}점
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-gray-900">
          2. 콘텐츠 종류
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {GENERATABLE_CONTENT_TYPES.map((t) => {
            const active = state.kind === 'submitting' && state.type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => generate(t)}
                disabled={submitting || !focusSdg}
                className="rounded border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="block text-sm font-medium text-gray-800">
                  {active ? '생성 중...' : `+ ${CONTENT_TYPE_LABEL[t]}`}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                  {CONTENT_TYPE_HINT[t]}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {state.kind === 'error' && (
        <p className="text-sm text-red-600">❌ {state.message}</p>
      )}
      <p className="text-xs text-gray-500">
        선택한 SDGs 분야를 중심 메시지로 콘텐츠 1건을 생성합니다 (최대 30초).
        다른 분야로도 만들고 싶으면 분야를 바꿔 다시 생성하세요.
      </p>
    </div>
  )
}
