'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  IconBuilding,
  IconDocument,
  IconGlobe,
  IconHome,
  IconMenu,
  IconPlusCircle,
  IconSparkles,
  IconUser,
  IconX,
} from './icons'

interface SidebarProps {
  /**
   * URL만으로 메뉴를 정할 수 없는 페이지(예: /sdg-analysis/[id])에서
   * 활성 메뉴를 명시적으로 지정. NAV_ITEMS의 href와 일치해야 한다.
   */
  activeHref?: string
}

/**
 * 사이드바 메뉴 정의 — 사용자 확정 IA (D7).
 * isActive는 usePathname 결과로 판정한다.
 */
const NAV_ITEMS = [
  {
    href: '/companies/new',
    label: '새 기업 등록',
    Icon: IconPlusCircle,
    isActive: (p: string) => p === '/companies/new',
  },
  {
    href: '/dashboard',
    label: '대시보드',
    Icon: IconHome,
    isActive: (p: string) => p === '/dashboard',
  },
  {
    href: '/contents',
    label: '내 콘텐츠 보기',
    Icon: IconDocument,
    isActive: (p: string) => p.startsWith('/contents'),
  },
  {
    href: '/sdg-guide',
    label: 'SDGs 가이드',
    Icon: IconGlobe,
    isActive: (p: string) => p.startsWith('/sdg-guide'),
  },
  {
    href: '/mypage',
    label: '마이페이지',
    Icon: IconUser,
    isActive: (p: string) => p.startsWith('/mypage'),
  },
  {
    href: '/companies',
    label: '기업 관리',
    Icon: IconBuilding,
    isActive: (p: string) =>
      p === '/companies' ||
      (p.startsWith('/companies/') && p !== '/companies/new'),
  },
] as const

/**
 * 좌측 사이드바 (디자인 디벨롭 — 목업 정합).
 *
 * - 상단: 브랜드 로고 (그린 아이콘 + 이름 + 태그라인)
 * - 메뉴: 고정 6항목 (새 기업 등록 / 대시보드 / 내 콘텐츠 보기 /
 *   SDGs 가이드 / 마이페이지 / 기업 관리) — 활성 메뉴 파란 하이라이트
 * - 하단: 그라데이션 홍보 카드
 * - md 미만: 햄버거 토글 drawer + overlay (P3 동작 유지)
 */
export function Sidebar({ activeHref }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 사이드바 내부의 link 클릭 시 drawer 닫기 (모바일) — event delegation.
  // useEffect + usePathname 패턴은 React Compiler 룰(set-state-in-effect) 위반이라 회피.
  function handleSidebarClick(e: React.MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement | null
    if (target?.closest('a[href]')) setOpen(false)
  }

  // Esc로 drawer 닫기 (a11y)
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
      {/* 모바일 햄버거 — TopBar 좌측에 겹치도록 fixed (md 미만 전용) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-gray-700 shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 md:hidden"
      >
        <IconMenu className="h-5 w-5" />
      </button>

      {/* 모바일 overlay */}
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 ease-out md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        aria-label="주 메뉴"
      >
        {/* 브랜드 로고 + 모바일 닫기 */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
              aria-hidden
            >
              <IconSparkles className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-bold leading-tight text-gray-900">
                D-Connect
              </span>
              <span className="block text-[11px] leading-tight text-gray-500">
                SDGs 홍보 콘텐츠 플랫폼
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-muted hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 md:hidden"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {/* 메뉴 */}
        <nav
          className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 pt-1"
          aria-label="페이지 메뉴"
        >
          {NAV_ITEMS.map(({ href, label, Icon, isActive }) => {
            const active = activeHref ? href === activeHref : isActive(pathname)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                  active
                    ? 'bg-accent-500/10 font-semibold text-accent-600'
                    : 'text-gray-700 hover:bg-surface-muted hover:text-gray-900'
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 하단 홍보 카드 (목업 패턴) */}
        <div className="px-4 pb-5">
          <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-100/60 p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
              <span aria-hidden>🌱</span>
              <span>지역과 함께, 가치를 알리다</span>
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
              지속가능한 미래를 위한 우리 지역의 작은 실천을 더 많은
              사람들에게 전달해 보세요.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
