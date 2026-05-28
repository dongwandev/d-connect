import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/server/db'
import {
  SDG_GOAL_LABEL,
  SOCIAL_CATEGORY_LABEL,
  type SdgGoal,
  type SocialCategory,
} from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 분석 상세 페이지 (API.md §4.3 사양).
 *
 * 권한 (ADR-0005):
 *   - 비로그인 → /login
 *   - 본인 소유 기업의 분석이 아니면 → 404
 */
export const dynamic = 'force-dynamic'

export default async function AnalysisPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const analysis = await db.sdgAnalysis.findFirst({
    where: { id, company: { userId: session.user.id } },
    include: {
      company: { select: { id: true, name: true } },
      matches: { orderBy: { score: 'desc' } },
    },
  })

  if (!analysis) notFound()

  const socialFunctions = parseJsonArray<SocialCategory>(analysis.socialFunctions)

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <nav className="space-x-3 text-sm">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← 대시보드
        </Link>
        <Link
          href={`/companies/${analysis.company.id}`}
          className="text-blue-600 hover:underline"
        >
          {analysis.company.name} 상세
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">SDGs 분석 결과</h1>
        <p className="text-sm text-gray-500">
          {analysis.company.name} ·{' '}
          {analysis.createdAt.toLocaleString('ko-KR')}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">사회적 기능 분류</h2>
        <ul className="flex flex-wrap gap-2">
          {socialFunctions.map((sf) => (
            <li
              key={sf}
              className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
            >
              {SOCIAL_CATEGORY_LABEL[sf]}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">공공적 의미</h2>
        <p className="rounded border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
          {analysis.publicMeaning}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          SDGs 매칭 ({analysis.matches.length})
        </h2>
        <ul className="space-y-4">
          {analysis.matches.map((m) => {
            const keywords = parseJsonArray<string>(m.keywords)
            return (
              <li
                key={m.id}
                className="rounded border border-gray-200 p-4"
              >
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-blue-900">
                    {SDG_GOAL_LABEL[m.sdg as SdgGoal]}
                  </h3>
                  <span className="rounded bg-blue-600 px-2 py-0.5 text-sm font-medium text-white">
                    {m.score}
                  </span>
                </div>

                {keywords.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-1.5">
                    {keywords.map((k, i) => (
                      <li
                        key={`${m.id}-kw-${i}`}
                        className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-800"
                      >
                        #{k}
                      </li>
                    ))}
                  </ul>
                )}

                <p className="text-sm leading-relaxed text-gray-700">
                  {m.rationale}
                </p>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}
