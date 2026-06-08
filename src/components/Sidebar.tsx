'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { UserMenu } from './UserMenu'

interface CompanySummary {
  id: string
  name: string
}

interface SidebarProps {
  userName: string | null
  userEmail: string | null
  companies: CompanySummary[]
}

/**
 * 좌측 사이드바.
 *
 * - md 이상: 항상 노출되는 고정 컬럼
 * - md 미만: 햄버거 토글로 drawer + overlay (P3)
 *
 * Client component인 이유: 모바일 drawer open state + route 변경 시 자동 닫기.
 * 본인 기업 목록 등 데이터는 server에서 props로 받는다.
 */
export function Sidebar({ userName, userEmail, companies }: SidebarProps) {
  const [open, setOpen] = useState(false)

  // 사이드바 내부의 모든 link 클릭 시 drawer 닫기 (모바일).
  // useEffect + usePathname 패턴은 React Compiler 룰(react-hooks/set-state-in-effect)을 위반하므로
  // event delegation으로 처리. <a href> 만 잡아서 토글 버튼 등 다른 click은 영향 없음.
  function handleSidebarClick(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement | null
    if (target?.closest('a[href]')) setOpen(false)
  }

  // Esc로 drawer 닫기 (a11y) — addEventListener는 외부 시스템 동기화라 set-state-in-effect 룰 위반 아님
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {/* 모바일 햄버거 — md 미만에만 표시. fixed로 페이지 위 떠 있어 어디서나 접근 가능 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface text-gray-700 shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
      >
        <span aria-hidden className="text-xl">
          ☰
        </span>
      </button>

      {/* 모바일 overlay — drawer 열렸을 때 배경 어둡게 + 클릭으로 닫기 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* 사이드바 본체 */}
      <aside
        onClick={handleSidebarClick}
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="주 메뉴"
      >
        {/* 로고 / 브랜드 + 모바일 닫기 버튼 */}
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-lg"
              aria-hidden
            >
              🌱
            </span>
            <div>
              <p className="text-base font-bold text-gray-900">D-Connect</p>
              <p className="text-[10px] text-gray-500">
                SDGs 홍보 콘텐츠 플랫폼
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-surface-muted hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 md:hidden"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        {/* 메뉴 */}
        <nav
          className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
          aria-label="기업 및 페이지 메뉴"
        >
          <NavItem href="/dashboard" icon="🏠" label="대시보드" />

          {companies.length > 0 ? (
            <div className="pt-3">
              <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                내 기업 ({companies.length})
              </p>
              <ul className="space-y-0.5">
                {companies.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/companies/${c.id}`}
                      className="flex items-center gap-2 truncate rounded px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      title={c.name}
                    >
                      <span aria-hidden className="text-xs">
                        🏢
                      </span>
                      <span className="truncate">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="pt-3">
              <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                내 기업
              </p>
              <p className="px-3 text-xs leading-relaxed text-gray-500">
                등록된 기업이 없어요. 아래 버튼으로 첫 기업을 등록해 보세요.
              </p>
            </div>
          )}

          <div className="pt-3">
            <NavItem href="/companies/new" icon="➕" label="새 기업 등록" />
          </div>
        </nav>

        {/* 사용자 영역 — 클릭 시 펼침 메뉴 */}
        <div className="border-t border-border px-4 py-4">
          <UserMenu userName={userName} userEmail={userEmail} />
        </div>
      </aside>
    </>
  )
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
