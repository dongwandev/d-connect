'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  CONTENT_TYPE_LABEL,
  ContentTypeSchema,
  type ContentType,
} from '@/lib/enums'

export interface ContentItem {
  id: string
  type: ContentType
  body: string
  hashtags: string[]
  imagePrompt: string | null
  editedByUser: boolean
  createdAt: string // ISO string (serializable from server component)
}

type TabKey = 'ALL' | ContentType

const TYPES = ContentTypeSchema.options

/**
 * 콘텐츠 유형별 탭 (디자인 이미지 1 패턴).
 *
 * 입력: 분석 페이지의 server component가 contents를 props로 전달 (ISO string).
 * 동작: tab 클릭으로 type 필터링. 0건이면 안내 메시지.
 */
export function ContentTabs({ contents }: { contents: ContentItem[] }) {
  const router = useRouter()
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
        alert(`삭제 실패: ${json.error?.message ?? `HTTP ${res.status}`}`)
        return
      }
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
        <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {tab === 'ALL'
            ? '아직 생성된 콘텐츠가 없습니다. 위 버튼으로 유형을 선택해 생성해 보세요.'
            : `${CONTENT_TYPE_LABEL[tab as ContentType]} 콘텐츠가 없습니다.`}
        </div>
      ) : (
        <ul className="space-y-3 pt-2">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="space-y-2 rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">
                  {CONTENT_TYPE_LABEL[c.type]}
                  {c.editedByUser && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      편집됨
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/contents/${c.id}`}
                    className="rounded border border-border bg-white px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-accent-500 hover:bg-accent-500/5 hover:text-accent-500"
                  >
                    편집
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteContent(c.id)}
                    disabled={pending || deletingId === c.id}
                    className="rounded border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === c.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                {c.body}
              </p>
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
              {c.imagePrompt && (
                <p className="border-l-2 border-purple-200 pl-3 text-xs italic text-gray-500">
                  이미지 프롬프트: {c.imagePrompt}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString('ko-KR')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
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
      <span className="ml-1 text-xs text-gray-400">({count})</span>
    </button>
  )
}
