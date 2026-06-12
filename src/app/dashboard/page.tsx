import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { SdgDonut } from '@/components/dashboard/SdgDonut'
import { StatCard } from '@/components/dashboard/StatCard'
import { TypeProgressList } from '@/components/dashboard/TypeProgressList'
import { EmptyState } from '@/components/EmptyState'
import {
  IconBuilding,
  IconChart,
  IconEdit,
  IconSparkles,
} from '@/components/icons'
import { db } from '@/server/db'
import { GENERATABLE_CONTENT_TYPES, type ContentType, type SdgGoal } from '@/lib/enums'

/**
 * 대시보드 (디자인 D4) — 본인 데이터에 기반한 통계 + SDGs donut + 콘텐츠 유형 progress.
 *
 * 통계 4종:
 *   - 내 기업 수
 *   - SDGs 분석 수
 *   - 생성 콘텐츠 수
 *   - 편집된 콘텐츠 수 (editedByUser=true)
 *
 * 차트:
 *   - SDGs 분포 (sdgMatch group by sdg, 본인 분석 한정)
 *   - 콘텐츠 유형별 생성 수 (groupBy by type)
 */
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const [
    companies,
    analysisCount,
    contentCount,
    editedCount,
    sdgRaw,
    typeRaw,
  ] = await Promise.all([
    db.company.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        industryCategory: true,
        sido: true,
        createdAt: true,
      },
    }),
    db.sdgAnalysis.count({ where: { company: { userId } } }),
    db.generatedContent.count({
      where: { analysis: { company: { userId } } },
    }),
    db.generatedContent.count({
      where: { analysis: { company: { userId } }, editedByUser: true },
    }),
    db.sdgMatch.groupBy({
      by: ['sdg'],
      where: { analysis: { company: { userId } } },
      _count: { _all: true },
    }),
    db.generatedContent.groupBy({
      by: ['type'],
      where: { analysis: { company: { userId } } },
      _count: { _all: true },
    }),
  ])

  const sdgData = sdgRaw
    .map((r) => ({ sdg: r.sdg as SdgGoal, count: r._count._all }))
    .sort((a, b) => b.count - a.count)

  // 콘텐츠 유형은 4종 모두 표시 (0건도 포함하면 진행률 비교 직관)
  const typeCounts = new Map<ContentType, number>(
    typeRaw.map((r) => [r.type as ContentType, r._count._all]),
  )
  const typeData = GENERATABLE_CONTENT_TYPES.map((t) => ({
    type: t,
    count: typeCounts.get(t) ?? 0,
  }))

  return (
    <AppShell
      title="대시보드"
      description={`${session.user.name ?? session.user.email ?? '사용자'}님, 환영합니다.`}
    >
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {/* 통계 카드 4종 */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<IconBuilding className="h-5 w-5" />}
            label="내 기업"
            value={companies.length}
            accent="green"
          />
          <StatCard
            icon={<IconChart className="h-5 w-5" />}
            label="SDGs 분석"
            value={analysisCount}
            hint={analysisCount > 0 ? '누적 분석 건' : '아직 분석 없음'}
            accent="blue"
          />
          <StatCard
            icon={<IconSparkles className="h-5 w-5" />}
            label="생성된 콘텐츠"
            value={contentCount}
            hint={
              contentCount > 0
                ? `유형 ${typeData.filter((t) => t.count > 0).length}종`
                : '아직 콘텐츠 없음'
            }
            accent="purple"
          />
          <StatCard
            icon={<IconEdit className="h-5 w-5" />}
            label="편집한 콘텐츠"
            value={editedCount}
            hint={
              contentCount > 0
                ? `전체 대비 ${Math.round(
                    (editedCount / contentCount) * 100,
                  )}%`
                : '—'
            }
            accent="amber"
          />
        </section>

        {/* 좌 — 기업 목록 / 우 — 차트 2종. 양쪽 grid item이 stretch + 내부 flex로 높이 정렬 */}
        <section className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <div className="flex flex-col rounded-lg border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                내 기업 ({companies.length})
              </h2>
            </div>
            {companies.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  icon="🏢"
                  title="아직 등록된 기업이 없어요"
                  description="첫 기업을 등록하면 SDGs 분석과 콘텐츠 생성이 시작됩니다."
                  action={
                    <Link
                      href="/companies/new"
                      className="inline-flex items-center gap-1 rounded bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      <span aria-hidden>➕</span>
                      <span>첫 기업 등록하기</span>
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
                {companies.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border bg-surface-muted p-3 transition-colors hover:border-accent-500"
                  >
                    <Link
                      href={`/companies/${c.id}`}
                      className="block text-accent-500 hover:underline"
                    >
                      <span className="font-medium">{c.name}</span>
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">
                      {c.createdAt.toLocaleString('ko-KR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <SdgDonut data={sdgData} />
            <TypeProgressList data={typeData} />
          </div>
        </section>
      </div>
    </AppShell>
  )
}
