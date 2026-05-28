import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { db } from '@/server/db'

/**
 * 대시보드 — 로그인 사용자의 본인 기업 목록 (ADR-0005).
 *
 * 디자인 폴리시 단계에서 통계 카드 / 차트 / 사이드바 레이아웃으로 확장 예정.
 * 본 PR은 최소 기능: 본인 기업 목록 + 새 기업 등록 CTA + 로그아웃.
 */
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const companies = await db.company.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      industry: true,
      region: true,
      createdAt: true,
    },
  })

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">
            {session.user.name ?? session.user.email ?? '사용자'}님, 환영합니다.
          </p>
        </header>

        <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            내 기업 ({companies.length})
          </h2>
          <Link
            href="/companies/new"
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            + 새 기업 등록
          </Link>
        </div>

        {companies.length === 0 ? (
          <div className="rounded border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-sm text-gray-600">
              아직 등록된 기업이 없습니다.
            </p>
            <Link
              href="/companies/new"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              첫 기업 등록하기 →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {companies.map((c) => (
              <li
                key={c.id}
                className="rounded border border-gray-200 bg-white p-3"
              >
                <Link
                  href={`/companies/${c.id}`}
                  className="block text-blue-700 hover:underline"
                >
                  <span className="font-medium">{c.name}</span>
                  {(c.industry || c.region) && (
                    <span className="ml-2 text-sm text-gray-500">
                      {c.industry ?? ''}
                      {c.industry && c.region ? ' · ' : ''}
                      {c.region ?? ''}
                    </span>
                  )}
                </Link>
                <p className="mt-1 text-xs text-gray-400">
                  {c.createdAt.toLocaleString('ko-KR')}
                </p>
              </li>
            ))}
          </ul>
        )}
        </section>
      </div>
    </AppShell>
  )
}
