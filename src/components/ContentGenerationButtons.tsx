'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import {
  AspectRatioSchema,
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_LABEL,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_SLIDE_COUNT,
  GENERATABLE_CONTENT_TYPES,
  IMAGE_STYLE_LABEL,
  ImageStyleSchema,
  SDG_COLOR,
  SDG_GOAL_LABEL,
  SLIDE_COUNT_RANGE,
  SNS_PLATFORM_LABEL,
  SnsPlatformSchema,
  type AspectRatio,
  type ContentType,
  type ImageStyle,
  type SdgGoal,
  type SnsPlatform,
} from '@/lib/enums'

type State = { kind: 'idle' } | { kind: 'submitting' }

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
 * 콘텐츠 생성 위젯 (#92→#104):
 * ① 홍보할 SDG 단일 선택 → ② 유형 선택 → ③ 세부 설정 → 생성하기.
 *
 * 세부 설정: 대상 SNS·비율·이미지 스타일(공통), 카드 수(카드뉴스),
 * 추가 요청(자유). 유형 선택 시 추천 비율이 자동 적용된다.
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
  const [type, setType] = useState<ContentType | null>(null)
  const [platform, setPlatform] = useState<SnsPlatform>('INSTAGRAM')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1')
  const [imageStyle, setImageStyle] = useState<ImageStyle>('ILLUSTRATION')
  const [slideCount, setSlideCount] = useState<number>(DEFAULT_SLIDE_COUNT)
  const [extraRequest, setExtraRequest] = useState('')

  const submitting = state.kind === 'submitting'

  // 경과 시간 — submitting 동안 1초마다 증가 (초기화는 generate()에서)
  useEffect(() => {
    if (!submitting) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [submitting])

  function selectType(t: ContentType) {
    setType(t)
    setAspectRatio(DEFAULT_ASPECT_RATIO[t]) // 유형별 추천 비율로 리셋
  }

  async function generate() {
    if (!focusSdg || !type) return
    setState({ kind: 'submitting' })
    setElapsed(0)
    try {
      const res = await fetch(`/api/sdg-analysis/${analysisId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          focusSdg,
          platform,
          aspectRatio,
          imageStyle,
          ...(type === 'CARD_NEWS' ? { slideCount } : {}),
          ...(extraRequest.trim() ? { extraRequest: extraRequest.trim() } : {}),
        }),
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
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectType(t)}
                disabled={submitting}
                className={`rounded border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <span className="block text-sm font-medium text-gray-800">
                  {CONTENT_TYPE_LABEL[t]}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                  {CONTENT_TYPE_HINT[t]}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      {type && (
        <fieldset className="space-y-3 rounded-md border border-gray-200 bg-gray-50/60 p-3">
          <legend className="px-1 text-sm font-semibold text-gray-900">
            3. 세부 설정
          </legend>

          <OptionRow label="대상 SNS">
            {SnsPlatformSchema.options.map((p) => (
              <Chip
                key={p}
                label={SNS_PLATFORM_LABEL[p]}
                active={platform === p}
                disabled={submitting}
                onClick={() => setPlatform(p)}
              />
            ))}
          </OptionRow>

          <OptionRow label="비율">
            {AspectRatioSchema.options.map((r) => (
              <Chip
                key={r}
                label={
                  r === DEFAULT_ASPECT_RATIO[type] ? `${r} (추천)` : r
                }
                active={aspectRatio === r}
                disabled={submitting}
                onClick={() => setAspectRatio(r)}
              />
            ))}
          </OptionRow>

          {type === 'CARD_NEWS' && (
            <OptionRow label="카드 수">
              {SLIDE_COUNT_RANGE.map((n) => (
                <Chip
                  key={n}
                  label={`${n}장`}
                  active={slideCount === n}
                  disabled={submitting}
                  onClick={() => setSlideCount(n)}
                />
              ))}
            </OptionRow>
          )}

          <OptionRow label="이미지 스타일">
            {ImageStyleSchema.options.map((st) => (
              <Chip
                key={st}
                label={IMAGE_STYLE_LABEL[st]}
                active={imageStyle === st}
                disabled={submitting}
                onClick={() => setImageStyle(st)}
              />
            ))}
          </OptionRow>

          <div className="space-y-1">
            <label
              htmlFor="extra-request"
              className="block text-xs font-medium text-gray-600"
            >
              추가 요청 (선택)
            </label>
            <input
              id="extra-request"
              type="text"
              maxLength={200}
              value={extraRequest}
              onChange={(e) => setExtraRequest(e.target.value)}
              disabled={submitting}
              placeholder='예: "주말 클래스 일정을 강조해줘"'
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={submitting || !focusSdg}
            className="w-full rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {submitting
              ? '생성 중...'
              : `✨ ${CONTENT_TYPE_LABEL[type]} 생성하기`}
          </button>
        </fieldset>
      )}

      {state.kind === 'submitting' && type ? (
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
                {CONTENT_TYPE_LABEL[type]}
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
        !type && (
          <p className="text-xs text-gray-500">
            콘텐츠 종류를 선택하면 세부 설정이 열립니다. 선택한 SDGs 분야를
            중심 메시지로 콘텐츠 1건을 생성합니다 (최대 30초).
          </p>
        )
      )}
    </div>
  )
}

function OptionRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
        active
          ? 'border-blue-500 bg-blue-500 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400'
      }`}
    >
      {label}
    </button>
  )
}
