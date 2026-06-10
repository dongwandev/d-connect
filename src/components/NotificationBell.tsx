'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { formatRelativeTime } from '@/lib/relative-time'
import { IconBell, IconBuilding, IconChart, IconSparkles } from './icons'

interface NotificationItem {
  id: string
  kind: 'ANALYSIS_DONE' | 'CONTENT_DONE' | 'COMPANY_CREATED'
  tone: 'success' | 'warning' | 'info'
  title: string
  body: string
  link: string
  createdAt: string
}

/** 읽음 기준 시각 — 브라우저별 localStorage (프로토타입. DB 모델은 별도 단계) */
const LAST_SEEN_KEY = 'dconnect.notifications.lastSeenAt'

const KIND_ICON = {
  ANALYSIS_DONE: IconChart,
  CONTENT_DONE: IconSparkles,
  COMPANY_CREATED: IconBuilding,
} as const

const TONE_STYLE = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
} as const

/**
 * 상단바 알림 벨 (D7 사용자 요청).
 *
 * - GET /api/notifications에서 본인 이벤트(분석/콘텐츠/기업 + mock 경고) 조회
 * - 마지막 확인 시각(localStorage) 이후 항목 수를 빨간 배지로 표시
 * - 드롭다운에서 항목 클릭 시 해당 페이지로 이동, '모두 읽음'으로 배지 해제
 * - 열 때마다 재조회 — 분석/콘텐츠 생성 직후 열면 최신 반영
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  // SSR에는 localStorage가 없어 0으로 시작 — 초기 렌더는 items가 빈 배열이라
  // 배지가 안 보이므로 hydration mismatch 없음
  const [lastSeen, setLastSeen] = useState<number>(() =>
    typeof window === 'undefined'
      ? 0
      : Number(window.localStorage.getItem(LAST_SEEN_KEY) ?? 0),
  )
  const wrapRef = useRef<HTMLDivElement>(null)

  function refetch() {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((json: { data?: NotificationItem[] }) => {
        if (Array.isArray(json.data)) setItems(json.data)
      })
      .catch(() => {
        // 알림은 보조 기능 — 조회 실패 시 조용히 무시 (콘솔만)
      })
      .finally(() => setLoading(false))
  }

  // 마운트 시 1회 조회 (배지 표시용)
  useEffect(() => {
    refetch()
  }, [])

  // 외부 클릭 + Esc 닫기 (UserMenu와 동일 패턴)
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const unread = items.filter(
    (i) => new Date(i.createdAt).getTime() > lastSeen,
  ).length

  function toggleOpen() {
    if (!open) refetch()
    setOpen((v) => !v)
  }

  function markAllRead() {
    const now = Date.now()
    window.localStorage.setItem(LAST_SEEN_KEY, String(now))
    setLastSeen(now)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={`알림${unread > 0 ? ` (읽지 않음 ${unread}개)` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-surface-muted hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <IconBell className="h-5 w-5" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold text-gray-900">알림</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded text-xs font-medium text-accent-600 transition-colors hover:text-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                불러오는 중...
              </p>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-600">새 알림이 없습니다.</p>
                <p className="mt-1 text-xs text-gray-500">
                  분석·콘텐츠 생성이 완료되면 여기에 표시돼요.
                </p>
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const Icon = KIND_ICON[n.kind]
                  const isUnread =
                    new Date(n.createdAt).getTime() > lastSeen
                  return (
                    <li key={n.id} className="border-b border-border last:border-b-0">
                      <Link
                        href={n.link}
                        role="menuitem"
                        onClick={() => setOpen(false)}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-500 ${
                          isUnread ? 'bg-accent-500/5' : ''
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${TONE_STYLE[n.tone]}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium text-gray-900">
                              {n.title}
                            </span>
                            {isUnread && (
                              <span
                                aria-hidden
                                className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                              />
                            )}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-gray-600">
                            {n.body}
                          </span>
                          <span className="mt-1 block text-[11px] text-gray-500">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
