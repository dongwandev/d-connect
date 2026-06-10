'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'
import {
  IconBuilding,
  IconHome,
  IconMenu,
  IconPlusCircle,
  IconSparkles,
  IconUser,
  IconX,
} from './icons'

interface CompanySummary {
  id: string
  name: string
}

interface SidebarProps {
  companies: CompanySummary[]
  /**
   * URL에 기업 id가 없는 페이지(분석 결과·콘텐츠 편집)에서 사이드바의
   * 해당 기업을 활성 표시하기 위한 명시적 지정.
   */
  activeCompanyId?: string
}

/**
 * 좌측 사이드바 (디자인 디벨롭 — 목업 정합).
 *
 * - 상단: 브랜드 로고 (그린 아이콘 + 이름 + 태그라인)
 * - 메뉴: SVG 라인 아이콘 + usePathname 기반 활성 상태 (파란 하이라이트)
 * - 하단: 그라데이션 홍보 카드 (사용자 메뉴는 TopBar로 이동)
 * - md 미만: 햄버거 토글 drawer + overlay (P3 동작 유지)
 *
 * usePathname은 렌더 중 읽기만 하므로 React Compiler 룰에 안전.
 * drawer 자동 닫기는 set-state-in-effect 룰 회피를 위해 event delegation 유지.
 */
export function Sidebar({ companies, activeCompanyId }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 사이드바 내부의 link 클릭 시 drawer 닫기 (모바일) — event delegation
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
          aria-label="기업 및 페이지 메뉴"
        >
          <NavItem
            href="/dashboard"
            icon={<IconHome className="h-[18px] w-[18px]" />}
            label="대시보드"
            active={pathname === '/dashboard'}
          />
          <NavItem
            href="/companies/new"
            icon={<IconPlusCircle className="h-[18px] w-[18px]" />}
            label="새 기업 등록"
            active={pathname === '/companies/new'}
          />
          <NavItem
            href="/account"
            icon={<IconUser className="h-[18px] w-[18px]" />}
            label="계정 정보"
            active={pathname === '/account'}
          />

          <div className="pt-4">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              내 기업{companies.length > 0 && ` (${companies.length})`}
            </p>
            {companies.length > 0 ? (
              <ul className="space-y-0.5">
                {companies.map((c) => {
                  const active =
                    pathname.startsWith(`/companies/${c.id}`) ||
                    c.id === activeCompanyId
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/companies/${c.id}`}
                        title={c.name}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-2.5 truncate rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                          active
                            ? 'bg-accent-500/10 font-semibold text-accent-600'
                            : 'text-gray-600 hover:bg-surface-muted hover:text-gray-900'
                        }`}
                      >
                        <IconBuilding className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="px-3 text-xs leading-relaxed text-gray-500">
                등록된 기업이 없어요. 위의 &lsquo;새 기업 등록&rsquo;으로
                시작해 보세요.
              </p>
            )}
          </div>
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

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string
  icon: ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
        active
          ? 'bg-accent-500/10 font-semibold text-accent-600'
          : 'text-gray-700 hover:bg-surface-muted hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
