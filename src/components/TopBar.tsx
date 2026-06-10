'use client'

import Link from 'next/link'
import { type ReactNode } from 'react'
import { NotificationBell } from './NotificationBell'
import { UserMenu } from './UserMenu'
import { IconHelp } from './icons'

interface TopBarProps {
  title: string
  description?: string
  /** 우측 사용자 영역 왼쪽에 들어갈 페이지 액션 (예: '+ 새 기업 등록' 버튼) */
  actions?: ReactNode
  userName: string | null
  userEmail: string | null
}

/**
 * 상단 네비게이션 바 (디자인 디벨롭 — 목업 정합).
 *
 * 좌측: 페이지 제목 + 한 줄 설명 (AppShell이 페이지별로 주입)
 * 우측: 페이지 액션 · 알림 벨(NotificationBell) · 도움말(SDGs 가이드) ·
 *       사용자 드롭다운
 *
 * 모바일에서는 좌측 fixed 햄버거(Sidebar 소유)와 겹치지 않게 pl-16.
 */
export function TopBar({
  title,
  description,
  actions,
  userName,
  userEmail,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-surface py-2.5 pl-16 pr-3 md:px-6">
      {/* 제목/설명 — 모바일에서도 정보 손실 없이 두 줄로 표시, 길면 truncate */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold text-gray-900 md:text-xl">
          {title}
        </h1>
        {description && (
          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {actions && <div className="mr-1">{actions}</div>}

        <NotificationBell />

        <Link
          href="/sdg-guide"
          aria-label="도움말 — SDGs 가이드"
          title="SDGs 가이드"
          className="hidden rounded-full p-2 text-gray-500 transition-colors hover:bg-surface-muted hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 sm:block"
        >
          <IconHelp className="h-5 w-5" />
        </Link>

        <div className="ml-1 border-l border-border pl-2.5">
          <UserMenu userName={userName} userEmail={userEmail} />
        </div>
      </div>
    </header>
  )
}
