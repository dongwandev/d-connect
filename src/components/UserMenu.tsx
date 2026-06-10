'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { IconChevronDown, IconLogout, IconUser } from './icons'

interface UserMenuProps {
  userName: string | null
  userEmail: string | null
}

/**
 * 상단 네비게이션 바 우측 사용자 영역 (디자인 디벨롭 — 목업 정합).
 *
 * 기존에는 사이드바 하단에서 위로 펼쳤지만, 목업처럼 TopBar 우측에서
 * 아래로 펼치는 드롭다운으로 이동.
 *
 * - 마이페이지 → /mypage
 * - 로그아웃 → next-auth/react signOut
 */
export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 + Esc 시 자동 닫힘
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

  const initial =
    (userName ?? userEmail ?? '?').trim().slice(0, 1).toUpperCase() || '?'

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${userName ?? '사용자'} 메뉴`}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-sm font-semibold text-accent-600"
          aria-hidden
        >
          {initial}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-gray-800 sm:block">
          {userName ?? '사용자'}
        </span>
        <IconChevronDown
          className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 space-y-1 rounded-xl border border-border bg-surface p-2 shadow-lg"
        >
          <div className="border-b border-border px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {userName ?? '사용자'}
            </p>
            {userEmail && (
              <p className="truncate text-xs text-gray-500">{userEmail}</p>
            )}
          </div>
          <Link
            href="/mypage"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-accent-500/5 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <IconUser className="h-4 w-4" />
            <span>마이페이지</span>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <IconLogout className="h-4 w-4" />
            <span>로그아웃</span>
          </button>
        </div>
      )}
    </div>
  )
}
