import Link from 'next/link'
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
 * 좌측 고정 사이드바.
 *
 * D6 변경:
 *   - 대시보드 메뉴 아래에 본인 기업 목록 (클릭 시 /companies/[id])
 *   - 사용자 영역은 UserMenu (클릭 시 계정 정보 / 로그아웃 메뉴)
 */
export function Sidebar({ userName, userEmail, companies }: SidebarProps) {
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
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NavItem href="/dashboard" icon="🏠" label="대시보드" />

        {companies.length > 0 && (
          <div className="pt-3">
            <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              내 기업 ({companies.length})
            </p>
            <ul className="space-y-0.5">
              {companies.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/companies/${c.id}`}
                    className="flex items-center gap-2 truncate rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
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
