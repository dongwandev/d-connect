import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'
import { EmptyState } from '@/components/EmptyState'
import { DeleteAnalysisButton } from '@/components/sdg/DeleteAnalysisButton'
import { db } from '@/server/db'
import { SDG_COLOR, type SdgGoal } from '@/lib/enums'

interface PageProps {
  searchParams: Promise<{ company?: string }>
}

/**
 * 내 SDGs 분석 보기 페이지 (D7 IA — 사이드바 '내 SDGs 분석 보기').
 *
 * 모든 기업에 걸친 분석 이력을 모아 본다. 같은 기업을 재분석하면
 * 이력이 여러 건 쌓이므로 시점·기업별로 구분해 표시한다.
 *
 * ?company={id} — 특정 기업의 분석만 필터 (기업 상세 '분석 결과 보기' 진입).
 * 본인 소유가 아니거나 없는 id는 필터를 조용히 무시한다 (ADR-0005 —
 * 존재 여부를 노출하지 않음).
 */
export const dynamic = 'force-dynamic'

const SDG_NUMBER: Record<SdgGoal, number> = {
  SDG_8: 8,
  SDG_11: 11,
  SDG_12: 12,
  SDG_17: 17,
}

export default async function SdgAnalysisListPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { company: companyParam } = await searchParams

  // 필터 대상 기업 — 본인 소유일 때만 유효
  const filterCompany = companyParam
    ? await db.company.findFirst({
        where: { id: companyParam, userId: session.user.id },
        select: { id: true, name: true },
      })
    : null

  const analyses = await db.sdgAnalysis.findMany({
    where: {
      company: { userId: session.user.id },
      ...(filterCompany ? { companyId: filterCompany.id } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { id: true, name: true } },
      matches: {
        orderBy: { score: 'desc' },
        select: { id: true, sdg: true, score: true },
      },
      _count: { select: { contents: true } },
    },
  })

  return (
    <AppShell
      title="내 SDGs 분석"
      description={
        filterCompany
          ? `${filterCompany.name}의 분석 이력입니다. (총 ${analyses.length}건)`
          : `실행한 모든 SDGs 분석 이력입니다. (총 ${analyses.length}건)`
      }
    >
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {filterCompany && (
          <nav className="flex flex-wrap items-center gap-2">
            <BackLink
              href={`/companies/${filterCompany.id}`}
              label={`${filterCompany.name} 상세`}
            />
            <Link
              href="/sdg-analysis"
              className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-accent-500 hover:bg-accent-500/5 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              전체 분석 보기
            </Link>
          </nav>
        )}
        {analyses.length === 0 ? (
          <EmptyState
            icon="📊"
            title={
              filterCompany
                ? '이 기업의 분석이 아직 없어요'
                : '아직 실행한 분석이 없어요'
            }
            description="기업 상세 페이지에서 'SDGs 분석 실행'을 누르면 AI가 활동을 분석해 SDGs를 추천합니다."
            action={
              <Link
                href={
                  filterCompany
                    ? `/companies/${filterCompany.id}`
                    : '/companies'
                }
                className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                {filterCompany
                  ? `${filterCompany.name} 상세로 이동`
                  : '기업 관리로 이동'}
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {analyses.map((a) => (
              <li
                key={a.id}
                className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-500"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/companies/${a.company.id}`}
                      className="truncate font-semibold text-gray-900 hover:text-accent-600 hover:underline"
                    >
                      {a.company.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      분석 일시: {a.createdAt.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-gray-600">
                    콘텐츠 {a._count.contents}건
                  </span>
                </div>

                {/* 매칭 SDG 칩 — UN 공식 컬러 */}
                <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
                  {a.matches.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: SDG_COLOR[m.sdg as SdgGoal] }}
                    >
                      SDG {SDG_NUMBER[m.sdg as SdgGoal]}
                      <span className="font-normal opacity-90">{m.score}점</span>
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex gap-2 border-t border-border pt-4">
                  <Link
                    href={`/sdg-analysis/${a.id}`}
                    className="flex-1 rounded-full bg-accent-500 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    분석 결과 보기
                  </Link>
                  <DeleteAnalysisButton
                    analysisId={a.id}
                    companyName={a.company.name}
                    contentCount={a._count.contents}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
