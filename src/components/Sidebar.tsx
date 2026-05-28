import Link from 'next/link'
import { signOut } from '@/auth'

interface SidebarProps {
  userName: string | null
  userEmail: string | null
}

/**
 * 좌측 고정 사이드바 (디자인 레퍼런스 기반).
 *
 * 메뉴는 현재 구현된 페이지만 노출:
 *   - 대시보드 (/dashboard)
 *   - 새 기업 등록 (/companies/new)
 *
 * 추후 항목(SDGs 가이드 / 분석 리포트 / 설정 등)은 D4, D5 단계에서 점진 추가.
 */
export function Sidebar({ userName, userEmail }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      {/* 로고 / 브랜드 */}
      <div className="border-b border-border px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
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
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavItem href="/dashboard" icon="🏠" label="대시보드" />
        <NavItem href="/companies/new" icon="➕" label="새 기업 등록" />
      </nav>

      {/* 사용자 영역 */}
      <div className="space-y-2 border-t border-border px-4 py-4">
        <div className="overflow-hidden">
          <p className="truncate text-sm font-medium text-gray-900">
            {userName ?? '사용자'}
          </p>
          {userEmail && (
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          )}
        </div>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button
            type="submit"
            className="w-full rounded border border-border bg-surface px-3 py-1.5 text-xs text-gray-600 hover:bg-surface-muted hover:text-gray-900"
          >
            로그아웃 →
          </button>
        </form>
      </div>
    </aside>
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
      className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700"
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
