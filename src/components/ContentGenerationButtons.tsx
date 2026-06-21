'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
import {
  AspectRatioSchema,
  BODY_LENGTH_LABEL,
  BodyLengthSchema,
  CARD_DENSITY_LABEL,
  CONTENT_TYPE_HINT,
  CONTENT_TYPE_LABEL,
  CardDensitySchema,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_SCENE_COUNT,
  DEFAULT_SLIDE_COUNT,
  DEFAULT_VIDEO_DURATION,
  GENERATABLE_CONTENT_TYPES,
  IMAGE_STYLE_LABEL,
  ImageStyleSchema,
  POSTER_TEXT_AMOUNT_LABEL,
  POSTER_USAGE_LABEL,
  POST_TONE_LABEL,
  PostToneSchema,
  PosterTextAmountSchema,
  PosterUsageSchema,
  SCENE_COUNT_RANGE,
  SDG_COLOR,
  SDG_GOAL_LABEL,
  SLIDE_COUNT_RANGE,
  SNS_PLATFORM_LABEL,
  SnsPlatformSchema,
  VIDEO_DURATION_RANGE,
  VIDEO_MOOD_LABEL,
  VideoMoodSchema,
  type GenerationOptionsStored,
  type SdgGoal,
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

type GeneratableType = (typeof GENERATABLE_CONTENT_TYPES)[number]

/** 옵션 enum 라벨 Record를 (값→라벨) 함수로. 미지 값은 그대로 표시(방어) */
function fromRecord<K extends string>(
  rec: Record<K, string>,
): (v: string) => string {
  return (v) => (rec as Record<string, string>)[v] ?? v
}

/**
 * 콘텐츠 유형별 세부 설정 필드 정의 (#123) — "어떤 옵션을 그릴지"를 데이터로 선언하고,
 * "어떻게 그릴지"는 renderField의 kind별 분기가 담당한다 (TS strict 마찰 최소화).
 */
type Field =
  | {
      kind: 'chips'
      key: keyof GenerationOptionsStored
      label: string
      choices: readonly string[]
      labelOf?: (v: string) => string
      visibleWhen?: (o: GenerationOptionsStored) => boolean
    }
  | {
      kind: 'num'
      key: keyof GenerationOptionsStored
      label: string
      choices: readonly number[]
      suffix: string
      visibleWhen?: (o: GenerationOptionsStored) => boolean
    }
  | {
      kind: 'toggle'
      key: keyof GenerationOptionsStored
      label: string
      on: string
      off: string
      visibleWhen?: (o: GenerationOptionsStored) => boolean
    }

type ChipsField = Extract<Field, { kind: 'chips' }>

// 여러 유형이 공유하는 필드 (비율·이미지 스타일)
const ASPECT_FIELD: ChipsField = {
  kind: 'chips',
  key: 'aspectRatio',
  label: '비율',
  choices: AspectRatioSchema.options,
}
const IMAGE_STYLE_FIELD: ChipsField = {
  kind: 'chips',
  key: 'imageStyle',
  label: '이미지 스타일',
  choices: ImageStyleSchema.options,
  labelOf: fromRecord(IMAGE_STYLE_LABEL),
}

/** 유형별 노출 필드 (추가 요청은 모든 유형 공통이라 별도로 렌더) */
const FIELDS: Record<GeneratableType, Field[]> = {
  SNS_POST: [
    {
      kind: 'chips',
      key: 'platform',
      label: '대상 SNS',
      choices: SnsPlatformSchema.options,
      labelOf: fromRecord(SNS_PLATFORM_LABEL),
    },
    {
      kind: 'chips',
      key: 'bodyLength',
      label: '본문 길이',
      choices: BodyLengthSchema.options,
      labelOf: fromRecord(BODY_LENGTH_LABEL),
    },
    {
      kind: 'chips',
      key: 'tone',
      label: '어조',
      choices: PostToneSchema.options,
      labelOf: fromRecord(POST_TONE_LABEL),
    },
    { kind: 'toggle', key: 'withImage', label: '곁들일 이미지', on: '포함', off: '없음' },
    { ...ASPECT_FIELD, visibleWhen: (o) => o.withImage === true },
    { ...IMAGE_STYLE_FIELD, visibleWhen: (o) => o.withImage === true },
  ],
  CARD_NEWS: [
    { kind: 'num', key: 'slideCount', label: '카드 수', choices: SLIDE_COUNT_RANGE, suffix: '장' },
    ASPECT_FIELD,
    IMAGE_STYLE_FIELD,
    {
      kind: 'chips',
      key: 'density',
      label: '정보 밀도',
      choices: CardDensitySchema.options,
      labelOf: fromRecord(CARD_DENSITY_LABEL),
    },
    { kind: 'toggle', key: 'closingCard', label: '마무리 장(출처·문의)', on: '추가', off: '없음' },
  ],
  SHORT_VIDEO_SCRIPT: [
    {
      kind: 'chips',
      key: 'platform',
      label: '대상 SNS',
      choices: SnsPlatformSchema.options,
      labelOf: fromRecord(SNS_PLATFORM_LABEL),
    },
    ASPECT_FIELD,
    { ...IMAGE_STYLE_FIELD, label: '영상 스타일' },
    { kind: 'num', key: 'videoDuration', label: '영상 길이', choices: VIDEO_DURATION_RANGE, suffix: '초' },
    { kind: 'num', key: 'sceneCount', label: '씬 수', choices: SCENE_COUNT_RANGE, suffix: '개' },
    { kind: 'toggle', key: 'subtitles', label: '자막', on: '포함', off: '없음' },
    {
      kind: 'chips',
      key: 'mood',
      label: '영상 분위기',
      choices: VideoMoodSchema.options,
      labelOf: fromRecord(VIDEO_MOOD_LABEL),
    },
  ],
  POSTER: [
    ASPECT_FIELD,
    IMAGE_STYLE_FIELD,
    {
      kind: 'chips',
      key: 'usage',
      label: '포스터 용도',
      choices: PosterUsageSchema.options,
      labelOf: fromRecord(POSTER_USAGE_LABEL),
    },
    {
      kind: 'chips',
      key: 'textAmount',
      label: '텍스트 양',
      choices: PosterTextAmountSchema.options,
      labelOf: fromRecord(POSTER_TEXT_AMOUNT_LABEL),
    },
  ],
}

/** 유형 선택 시 통째로 교체할 기본 옵션 (추천 비율·기본값 반영) */
const DEFAULT_OPTIONS: Record<GeneratableType, GenerationOptionsStored> = {
  SNS_POST: {
    platform: 'INSTAGRAM',
    bodyLength: 'NORMAL',
    tone: 'CASUAL',
    withImage: false,
    aspectRatio: DEFAULT_ASPECT_RATIO.SNS_POST,
    imageStyle: 'ILLUSTRATION',
    extraRequest: '',
  },
  CARD_NEWS: {
    aspectRatio: DEFAULT_ASPECT_RATIO.CARD_NEWS,
    imageStyle: 'ILLUSTRATION',
    slideCount: DEFAULT_SLIDE_COUNT,
    density: 'SUMMARY',
    closingCard: true,
    extraRequest: '',
  },
  SHORT_VIDEO_SCRIPT: {
    platform: 'INSTAGRAM',
    aspectRatio: DEFAULT_ASPECT_RATIO.SHORT_VIDEO_SCRIPT,
    imageStyle: 'ILLUSTRATION',
    videoDuration: DEFAULT_VIDEO_DURATION,
    sceneCount: DEFAULT_SCENE_COUNT,
    subtitles: true,
    mood: 'BRIGHT',
    extraRequest: '',
  },
  POSTER: {
    aspectRatio: DEFAULT_ASPECT_RATIO.POSTER,
    imageStyle: 'ILLUSTRATION',
    usage: 'ONLINE',
    textAmount: 'STANDARD',
    extraRequest: '',
  },
}

/**
 * 콘텐츠 생성 위젯 (#92→#104→#123):
 * ① 홍보할 SDG 단일 선택 → ② 유형 선택 → ③ 유형별 특화 세부 설정 → 생성하기.
 *
 * 세부 설정은 유형마다 다르다 (FIELDS 레지스트리). 유형 선택 시 DEFAULT_OPTIONS로
 * 옵션을 통째 리셋한다.
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
  const [type, setType] = useState<GeneratableType | null>(null)
  const [options, setOptions] = useState<GenerationOptionsStored | null>(null)

  const submitting = state.kind === 'submitting'

  // 경과 시간 — submitting 동안 1초마다 증가 (초기화는 generate()에서)
  useEffect(() => {
    if (!submitting) return
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [submitting])

  function selectType(t: GeneratableType) {
    setType(t)
    setOptions(DEFAULT_OPTIONS[t]) // 유형별 기본 옵션으로 통째 리셋
  }

  // 단일 setter — 컴퓨티드 키는 strict TS에서 좁히기 어려워 결과를 단언한다 (런타임 안전: 값은 해당 필드 선택지에서만 옴)
  function setOpt(
    key: keyof GenerationOptionsStored,
    value: string | number | boolean,
  ) {
    setOptions((o) =>
      o ? ({ ...o, [key]: value } as GenerationOptionsStored) : o,
    )
  }

  function renderField(f: Field, o: GenerationOptionsStored) {
    if (f.visibleWhen && !f.visibleWhen(o)) return null
    switch (f.kind) {
      case 'chips':
        return (
          <OptionRow key={f.key} label={f.label}>
            {f.choices.map((c) => (
              <Chip
                key={c}
                label={f.labelOf ? f.labelOf(c) : c}
                active={o[f.key] === c}
                disabled={submitting}
                onClick={() => setOpt(f.key, c)}
              />
            ))}
          </OptionRow>
        )
      case 'num':
        return (
          <OptionRow key={f.key} label={f.label}>
            {f.choices.map((n) => (
              <Chip
                key={n}
                label={`${n}${f.suffix}`}
                active={o[f.key] === n}
                disabled={submitting}
                onClick={() => setOpt(f.key, n)}
              />
            ))}
          </OptionRow>
        )
      case 'toggle':
        return (
          <OptionRow key={f.key} label={f.label}>
            <Chip
              label={f.on}
              active={o[f.key] === true}
              disabled={submitting}
              onClick={() => setOpt(f.key, true)}
            />
            <Chip
              label={f.off}
              active={o[f.key] === false}
              disabled={submitting}
              onClick={() => setOpt(f.key, false)}
            />
          </OptionRow>
        )
    }
  }

  async function generate() {
    if (!focusSdg || !type || !options) return
    setState({ kind: 'submitting' })
    setElapsed(0)
    try {
      const res = await fetch(`/api/sdg-analysis/${analysisId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, focusSdg, ...options }),
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
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
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
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                    : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
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

      {type && options && (
        <fieldset className="space-y-3 rounded-md border border-gray-200 bg-gray-50/60 p-3">
          <legend className="px-1 text-sm font-semibold text-gray-900">
            3. 세부 설정
          </legend>

          {FIELDS[type].map((f) => renderField(f, options))}

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
              value={options.extraRequest ?? ''}
              onChange={(e) => setOpt('extraRequest', e.target.value)}
              disabled={submitting}
              placeholder='예: "주말 클래스 일정을 강조해줘"'
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={submitting || !focusSdg}
            className="w-full rounded-full bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
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
            className="h-1.5 w-full overflow-hidden rounded-full bg-green-100"
            role="progressbar"
            aria-label="콘텐츠 생성 진행 중"
          >
            <div className="indeterminate-bar h-full rounded-full bg-green-500" />
          </div>
          <p className="text-xs text-gray-600">
            ✨ {progressMessage}
            <span className="ml-2 tabular-nums text-gray-400">
              {elapsed}초 경과 · 최대 30초
            </span>
          </p>

          {/* 결과가 도착할 자리의 스켈레톤 카드 */}
          <div className="animate-pulse space-y-2 rounded-lg border border-green-100 bg-green-50/50 p-4">
            <div className="flex items-center gap-2">
              <span className="rounded bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
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
            <div className="h-3 w-3/4 rounded bg-green-100" />
            <div className="h-3 w-full rounded bg-green-100" />
            <div className="h-3 w-2/3 rounded bg-green-100" />
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
          ? 'border-green-500 bg-green-500 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
      }`}
    >
      {label}
    </button>
  )
}
