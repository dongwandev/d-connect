'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import {
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_LABEL,
  GENERATABLE_CONTENT_TYPES,
  SDG_COLOR,
  SDG_GOAL_LABEL,
  type ContentType,
  type SdgGoal,
} from '@/lib/enums'

type State = { kind: 'idle' } | { kind: 'submitting'; type: ContentType }

/**
 * 생성 대기 중 단계 안내 — 단일 API 호출이라 실제 진행률은 알 수 없으므로
 * 경과 시간 기준으로 메시지를 회전시켜 '진행 중' 인지를 돕는다 (#94).
 */
const PROGRESS_MESSAGES = [
  '기업 정보와 분석 결과를 모으고 있어요',
  '선택한 SDGs 분야에 맞춰 메시지를 구성하고 있어요',
  '공공홍보 톤에 맞게 문구를 다듬고 있어요',
  '마무리 중이에요 — 조금만 기다려 주세요',
]

/**
 * 콘텐츠 생성 위젯 (#92 파이프라인): ① 홍보할 SDG 단일 선택 → ② 유형 선택.
 *
 * 생성은 최대 30초 — 진행 바·단계 메시지·경과 시간·스켈레톤 카드로
 * 진행 중임을 명확히 알린다 (#94). 결과/실패 알림은 Toast로 통일
 * (AnalyzeButton과 동일 체계).
 */
export function ContentGenerationButtons({
  analysisId,
  matches,
}: {
  analysisId: string
  matches: ReadonlyArray<{ sdg: SdgGoal; score: number }>
}) {
  const router = useRouter()
  const toast = useToast()
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [elapsed, setElapsed] = useState(0)
  const [focusSdg, setFocusSdg] = useState<SdgGoal | null>(
    matches[0]?.sdg ?? null,
  )

  const submitting = state.kind === 'submitting'

  // 경과 시간 — submitting 동안 1초마다 증가 (초기화는 generate()에서)
  useEffect(() => {
    if (!submitting) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [submitting])

  async function generate(type: ContentType) {
    if (!focusSdg) return
    setState({ kind: 'submitting', type })
    setElapsed(0)
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
        toast.error('생성 실패', message)
        setState({ kind: 'idle' })
        return
      }

      toast.success(
        `${CONTENT_TYPE_LABEL[type]} 생성 완료`,
        '아래 콘텐츠 목록에 추가되었습니다.',
      )
      setState({ kind: 'idle' })
      router.refresh() // 분석 페이지의 콘텐츠 카드 목록 재로드
    } catch (e) {
      toast.error(
        '생성 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
      setState({ kind: 'idle' })
    }
  }

  const progressMessage =
    PROGRESS_MESSAGES[
      Math.min(Math.floor(elapsed / 6), PROGRESS_MESSAGES.length - 1)
    ]

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
                className={`rounded border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed ${
                  active
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  {active && (
                    <span
                      aria-hidden
                      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
                    />
                  )}
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

      {state.kind === 'submitting' ? (
        <div className="space-y-3" role="status" aria-live="polite">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100"
            role="progressbar"
            aria-label="콘텐츠 생성 진행 중"
          >
            <div className="indeterminate-bar h-full rounded-full bg-blue-500" />
          </div>
          <p className="text-xs text-gray-600">
            ✨ {progressMessage}
            <span className="ml-2 tabular-nums text-gray-400">
              {elapsed}초 경과 · 최대 30초
            </span>
          </p>

          {/* 결과가 도착할 자리의 스켈레톤 카드 */}
          <div className="animate-pulse space-y-2 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-200 px-2 py-0.5 text-xs font-medium text-blue-800">
                {CONTENT_TYPE_LABEL[state.type]}
              </span>
              {focusSdg && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white opacity-70"
                  style={{ backgroundColor: SDG_COLOR[focusSdg] }}
                >
                  {SDG_GOAL_LABEL[focusSdg]}
                </span>
              )}
            </div>
            <div className="h-3 w-3/4 rounded bg-blue-100" />
            <div className="h-3 w-full rounded bg-blue-100" />
            <div className="h-3 w-2/3 rounded bg-blue-100" />
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          선택한 SDGs 분야를 중심 메시지로 콘텐츠 1건을 생성합니다 (최대 30초).
          다른 분야로도 만들고 싶으면 분야를 바꿔 다시 생성하세요.
        </p>
      )}
    </div>
  )
}
