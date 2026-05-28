import Link from 'next/link'
import { CompanyForm } from '@/components/CompanyForm'
import { db } from '@/server/db'

/**
 * 첫 화면 — 기업 정보 입력 폼 + 최근 등록 기업 목록.
 *
 * PRD §3.1 + API.md §3.1 / §3.2 + ARCHITECTURE §3 (3-layer).
 * 페이지(server component)가 DB를 직접 호출하고, 인터랙션이 필요한 폼은
 * client component leaf로 분리한다.
 */
export default async function Home() {
  const recentCompanies = await db.company.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      industry: true,
      region: true,
      createdAt: true,
    },
  })

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <CompanyForm />

      <section className="mx-auto mt-12 max-w-2xl space-y-3 px-6">
        <h2 className="text-lg font-semibold">최근 등록 기업</h2>
        {recentCompanies.length === 0 ? (
          <p className="text-sm text-gray-500">
            아직 등록된 기업이 없습니다. 위 폼으로 첫 기업을 등록해 주세요.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentCompanies.map((c) => (
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
    </main>
  )
}
