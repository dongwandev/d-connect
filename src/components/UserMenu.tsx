'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

interface UserMenuProps {
  userName: string | null
  userEmail: string | null
}

/**
 * 사이드바 하단 사용자 영역 — 계정명 클릭 시 펼침 메뉴.
 *
 * - 계정 정보 → /account
 * - 로그아웃 → next-auth/react signOut
 *
 * Server action으로 signOut을 호출하려면 사이드바 자체를 server로 두고
 * form action에서 처리해야 한다. 펼침 인터랙션이 필요한 점을 고려해
 * 클라이언트 컴포넌트로 분리하고 signOut을 next-auth/react로 호출한다.
 */
export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 자동 닫힘
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const initial =
    (userName ?? userEmail ?? '?').trim().slice(0, 1).toUpperCase() || '?'

  return (
    <div ref={wrapRef} className="relative">
      {/* 사용자 클릭 영역 — 아바타 + 표시명/이메일 + 드롭다운 화살표.
          명확한 button 형태(테두리·hover·▾)로 클릭 가능함을 시각적으로 알림. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface px-2 py-2 text-left transition-colors hover:border-brand-500 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700"
          aria-hidden
        >
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">
            {userName ?? '사용자'}
          </p>
          {userEmail && (
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          )}
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-xs text-gray-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 right-0 mb-2 space-y-1 rounded-lg border border-border bg-surface p-2 shadow-lg"
        >
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            role="menuitem"
            className="block rounded px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            👤 계정 정보
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="block w-full rounded px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            ↪ 로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
