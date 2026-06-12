'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { useToast } from '@/components/Toast'
import {
  CONTENT_TYPE_LABEL,
  GENERATABLE_CONTENT_TYPES,
  IMAGE_STYLE_LABEL,
  SDG_COLOR,
  SDG_GOAL_LABEL,
  SNS_PLATFORM_LABEL,
  type ContentType,
  type GenerationOptions,
  type SdgGoal,
} from '@/lib/enums'
import { formatRelativeTime } from '@/lib/relative-time'

export interface ContentItem {
  id: string
  type: ContentType
  focusSdg: SdgGoal | null
  /** 생성 세부 설정 JSON (#104) — 구버전 행은 null */
  options: string | null
  body: string
  hashtags: string[]
  imagePrompt: string | null
  editedByUser: boolean
  createdAt: string // ISO string (serializable from server component)
}

type TabKey = 'ALL' | ContentType

// 정렬 탭은 신규 생성 가능 4종만 — CAMPAIGN_SLOGAN은 구버전 (#100)
const TYPES = GENERATABLE_CONTENT_TYPES

/** 본문이 이보다 길면 접어서 보여준다 (#102) */
const BODY_CLAMP_CHARS = 280
const BODY_CLAMP_LINES = 6

/**
 * 클립보드 복사 — Clipboard API 실패 시(웹뷰·권한 차단 환경)
 * execCommand 폴백으로 한 번 더 시도한다.
 */
/** options JSON → "인스타그램 · 1:1 · 일러스트 · 4장" 메타 문자열 (#104) */
function formatOptions(raw: string | null): string | null {
  if (!raw) return null
  try {
    const o = JSON.parse(raw) as Partial<GenerationOptions>
    const parts = [
      o.platform ? SNS_PLATFORM_LABEL[o.platform] : null,
      o.aspectRatio ?? null,
      o.imageStyle ? IMAGE_STYLE_LABEL[o.imageStyle] : null,
      o.slideCount ? `${o.slideCount}장` : null,
    ].filter(Boolean)
    return parts.length ? parts.join(' · ') : null
  } catch {
    return null
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}

/**
 * 콘텐츠 유형별 탭 (디자인 이미지 1 패턴).
 *
 * 입력: 분석 페이지의 server component가 contents를 props로 전달 (ISO string).
 * 동작: tab 클릭으로 type 필터링. 0건이면 안내 메시지.
 * 카드 정리 (#102): 긴 본문 클램프, 생성 프롬프트 기본 접힘 + 복사,
 * 생성 시각은 헤더에 상대 시간으로.
 */
export function ContentTabs({ contents }: { contents: ContentItem[] }) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('ALL')
  const [pending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function deleteContent(id: string) {
    if (!confirm('이 콘텐츠를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.')) {
      return
    }
    setDeletingId(id)
    try {
      const res = await fetch(`/api/contents/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string }
        }
        toast.error(
          '삭제 실패',
          json.error?.message ?? `HTTP ${res.status}`,
        )
        return
      }
      toast.success('콘텐츠가 삭제되었습니다')
      startTransition(() => router.refresh())
    } finally {
      setDeletingId(null)
    }
  }

  const filtered =
    tab === 'ALL' ? contents : contents.filter((c) => c.type === tab)

  const countByType = (t: ContentType) =>
    contents.filter((c) => c.type === t).length

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 border-b border-border">
        <TabButton
          active={tab === 'ALL'}
          onClick={() => setTab('ALL')}
          label="전체"
          count={contents.length}
        />
        {TYPES.map((t) => (
          <TabButton
            key={t}
            active={tab === t}
            onClick={() => setTab(t)}
            label={CONTENT_TYPE_LABEL[t]}
            count={countByType(t)}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="✨"
          title={
            tab === 'ALL'
              ? '아직 생성된 콘텐츠가 없어요'
              : `${CONTENT_TYPE_LABEL[tab as ContentType]} 콘텐츠가 없어요`
          }
          description={
            tab === 'ALL'
              ? '위의 유형 버튼으로 SNS·카드뉴스·숏폼·포스터 콘텐츠를 생성할 수 있습니다.'
              : '다른 유형을 선택하거나, 위 콘텐츠 생성 버튼으로 새로 만들어 보세요.'
          }
        />
      ) : (
        <ul className="space-y-3 pt-2">
          {filtered.map((c) => (
            <ContentCard
              key={c.id}
              content={c}
              deleting={deletingId === c.id}
              deleteDisabled={pending || deletingId === c.id}
              onDelete={() => deleteContent(c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function ContentCard({
  content: c,
  deleting,
  deleteDisabled,
  onDelete,
}: {
  content: ContentItem
  deleting: boolean
  deleteDisabled: boolean
  onDelete: () => void
}) {
  const toast = useToast()
  const [bodyExpanded, setBodyExpanded] = useState(false)
  const [promptExpanded, setPromptExpanded] = useState(false)

  const isLongBody =
    c.body.length > BODY_CLAMP_CHARS ||
    c.body.split('\n').length > BODY_CLAMP_LINES

  const createdAt = new Date(c.createdAt)
  const optionsMeta = formatOptions(c.options)

  async function copyPrompt() {
    if (!c.imagePrompt) return
    if (await copyText(c.imagePrompt)) {
      toast.success(
        '프롬프트가 복사되었습니다',
        'ChatGPT 등 이미지 생성 AI에 붙여넣어 사용하세요.',
      )
    } else {
      toast.error('복사 실패', '브라우저에서 클립보드 권한을 확인해 주세요.')
    }
  }

  return (
    <li className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      {/* 헤더: 유형·뱃지 | 생성 시각·편집·삭제 */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3 className="flex flex-wrap items-center gap-2 font-semibold text-gray-900">
          {CONTENT_TYPE_LABEL[c.type]}
          {c.focusSdg && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: SDG_COLOR[c.focusSdg] }}
            >
              {SDG_GOAL_LABEL[c.focusSdg]}
            </span>
          )}
          {c.editedByUser && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-800">
              편집됨
            </span>
          )}
          {optionsMeta && (
            <span className="text-xs font-normal text-gray-400">
              {optionsMeta}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <time
            dateTime={c.createdAt}
            title={createdAt.toLocaleString('ko-KR')}
            suppressHydrationWarning
            className="text-xs text-gray-400"
          >
            {formatRelativeTime(createdAt)}
          </time>
          <span aria-hidden className="h-3 w-px bg-border" />
          <Link
            href={`/contents/${c.id}`}
            className="rounded border border-border bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-accent-500 hover:bg-accent-500/5 hover:text-accent-500"
          >
            편집
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteDisabled}
            className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>

      {/* 본문 — 길면 클램프 + 더 보기 */}
      <div>
        <p
          className={`whitespace-pre-wrap text-sm leading-relaxed text-gray-800 ${
            isLongBody && !bodyExpanded ? 'line-clamp-6' : ''
          }`}
        >
          {c.body}
        </p>
        {isLongBody && (
          <button
            type="button"
            onClick={() => setBodyExpanded((v) => !v)}
            className="mt-1 text-xs font-medium text-accent-500 hover:underline"
          >
            {bodyExpanded ? '접기 ↑' : '더 보기 ↓'}
          </button>
        )}
      </div>

      {c.hashtags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {c.hashtags.map((h, i) => (
            <li
              key={`${c.id}-h-${i}`}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              #{h}
            </li>
          ))}
        </ul>
      )}

      {/* 생성 AI 프롬프트 — 기본 접힘, 복사가 핵심 동작 (#102) */}
      {c.imagePrompt && (
        <div className="rounded-md border border-purple-100 bg-purple-50/40">
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => setPromptExpanded((v) => !v)}
              aria-expanded={promptExpanded}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-800 hover:text-purple-950"
            >
              <span
                aria-hidden
                className={`inline-block transition-transform ${promptExpanded ? 'rotate-90' : ''}`}
              >
                ▸
              </span>
              생성 AI 프롬프트
              <span className="font-normal text-purple-400">
                ({c.imagePrompt.length.toLocaleString()}자)
              </span>
            </button>
            <button
              type="button"
              onClick={copyPrompt}
              className="rounded border border-purple-200 bg-white px-2.5 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
            >
              📋 복사
            </button>
          </div>
          {promptExpanded && (
            <p className="whitespace-pre-wrap border-t border-purple-100 px-3 py-2 font-mono text-xs leading-relaxed text-gray-600">
              {c.imagePrompt}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-accent-500 text-accent-500'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
      <span className="ml-1 text-xs text-gray-500">({count})</span>
    </button>
  )
}
