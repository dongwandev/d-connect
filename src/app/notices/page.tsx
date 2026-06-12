import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { NOTICES, type Notice, type NoticeCategory } from '@/lib/notices'

/**
 * 공지사항 페이지 (D7 IA — 사이드바 '공지사항').
 *
 * 서비스 공지·업데이트·점검 소식. 프로토타입 단계라 정적 데이터
 * (src/lib/notices.ts) 기반 — 각 항목은 <details>로 펼침/접힘 (JS 불필요).
 * 카테고리 탭(#112)은 URL 쿼리(?category=) 기반이라 서버 컴포넌트 유지.
 */
export const dynamic = 'force-dynamic'

const CATEGORY_BADGE: Record<NoticeCategory, string> = {
  공지: 'bg-sky-100 text-sky-700',
  업데이트: 'bg-emerald-100 text-emerald-700',
  점검: 'bg-amber-100 text-amber-700',
}

const CATEGORIES: NoticeCategory[] = ['공지', '업데이트', '점검']

function isNoticeCategory(v: string | undefined): v is NoticeCategory {
  return CATEGORIES.includes(v as NoticeCategory)
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  // 잘못된 쿼리 값은 '전체'로 폴백
  const active = isNoticeCategory(category) ? category : null
  const filtered = active
    ? NOTICES.filter((n) => n.category === active)
    : NOTICES

  return (
    <AppShell
      title="공지사항"
      description="D-Connect의 새 소식과 안내를 확인하세요."
    >
      <div className="mx-auto max-w-3xl space-y-3 px-6 py-8">
        <nav
          aria-label="공지 카테고리"
          className="flex flex-wrap gap-1 border-b border-border"
        >
          <CategoryTab
            href="/notices"
            active={active === null}
            label="전체"
            count={NOTICES.length}
          />
          {CATEGORIES.map((c) => (
            <CategoryTab
              key={c}
              href={`/notices?category=${c}`}
              active={active === c}
              label={c}
              count={NOTICES.filter((n) => n.category === c).length}
            />
          ))}
        </nav>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            {active} 소식이 아직 없어요.
          </p>
        ) : (
          filtered.map((n) => <NoticeItem key={n.id} notice={n} />)
        )}

        <p className="pt-2 text-xs text-gray-500">
          문의가 필요하시면 사이드바의 <strong>1:1 문의</strong>를 이용해
          주세요.
        </p>
      </div>
    </AppShell>
  )
}

function CategoryTab({
  href,
  active,
  label,
  count,
}: {
  href: string
  active: boolean
  label: string
  count: number
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative -mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-accent-500 text-accent-500'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {label}
      <span className="ml-1 text-xs text-gray-500">({count})</span>
    </Link>
  )
}

function NoticeItem({ notice: n }: { notice: Notice }) {
  return (
    <details
      open={n.pinned}
      className="group overflow-hidden rounded-xl border border-border bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE[n.category]}`}
        >
          {n.category}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            {n.pinned && (
              <span
                aria-label="고정된 공지"
                title="고정된 공지"
                className="shrink-0 text-xs"
              >
                📌
              </span>
            )}
            <span className="truncate text-sm font-semibold text-gray-900">
              {n.title}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">{n.date}</span>
        </span>
        <span
          aria-hidden
          className="shrink-0 text-gray-400 transition-transform group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-border bg-surface-muted/50 px-5 py-4">
        {n.body.split('\n').map((line, i) =>
          line === '' ? (
            <br key={i} />
          ) : (
            <p key={i} className="text-sm leading-relaxed text-gray-700">
              {line}
            </p>
          ),
        )}
      </div>
    </details>
  )
}
