import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AnalyzeButton } from '@/components/AnalyzeButton'
import { db } from '@/server/db'
import { SOCIAL_CATEGORY_LABEL, type SocialCategory } from '@/lib/enums'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 기업 상세 페이지.
 *
 * 권한 (ADR-0005):
 *   - 비로그인 → /login
 *   - 본인 소유가 아닌 기업 id → 404 (존재 자체를 노출하지 않음)
 *
 * Server component가 DB를 직접 호출 (ARCHITECTURE §3 3-layer).
 */
export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const company = await db.company.findFirst({
    where: { id, userId: session.user.id },
    include: {
      activities: { orderBy: { createdAt: 'asc' } },
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, createdAt: true },
      },
    },
  })

  if (!company) notFound()

  const latestAnalysis = company.analyses[0] ?? null

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <nav>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← 대시보드
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{company.name}</h1>
        <p className="text-sm text-gray-500">
          {company.industry ?? '업종 미입력'} · {company.region ?? '지역 미입력'}
        </p>
        <p className="text-xs text-gray-400">
          등록: {company.createdAt.toLocaleString('ko-KR')}
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">기본 정보</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-gray-500">제품·서비스</dt>
          <dd>{company.product ?? <span className="text-gray-400">—</span>}</dd>
          <dt className="text-gray-500">홍보 목적</dt>
          <dd>{company.purpose ?? <span className="text-gray-400">—</span>}</dd>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          활동 ({company.activities.length})
        </h2>
        <ul className="space-y-3">
          {company.activities.map((a) => (
            <li
              key={a.id}
              className="rounded border border-gray-200 p-4"
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                  {SOCIAL_CATEGORY_LABEL[a.category as SocialCategory]}
                </span>
                <h3 className="font-medium">{a.title}</h3>
              </div>
              <p className="text-sm text-gray-700">{a.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">SDGs 분석</h2>
        {latestAnalysis ? (
          <div className="space-y-3 rounded border border-green-300 bg-green-50 p-4">
            <p className="text-sm text-gray-700">
              최신 분석: {latestAnalysis.createdAt.toLocaleString('ko-KR')}
            </p>
            <Link
              href={`/sdg-analysis/${latestAnalysis.id}`}
              className="inline-block text-sm font-medium text-green-900 underline hover:text-green-700"
            >
              분석 결과 보기 →
            </Link>
            <div className="border-t border-green-200 pt-3">
              <AnalyzeButton companyId={company.id} />
              <p className="mt-2 text-xs text-gray-500">
                다시 실행하면 새로운 분석이 추가되고 위 목록이 갱신됩니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              아직 분석된 결과가 없습니다. 아래 버튼으로 SDGs 분석을
              시작해 보세요.
            </p>
            <AnalyzeButton companyId={company.id} />
          </div>
        )}
      </section>
    </main>
  )
}
