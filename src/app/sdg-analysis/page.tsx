import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { db } from '@/server/db'
import { SDG_COLOR, type SdgGoal } from '@/lib/enums'

/**
 * 내 SDGs 분석 보기 페이지 (D7 IA — 사이드바 '내 SDGs 분석 보기').
 *
 * 모든 기업에 걸친 분석 이력을 모아 본다. 같은 기업을 재분석하면
 * 이력이 여러 건 쌓이므로 시점·기업별로 구분해 표시한다.
 * 권한 (ADR-0005): company.userId 경유로 본인 것만.
 */
export const dynamic = 'force-dynamic'

const SDG_NUMBER: Record<SdgGoal, number> = {
  SDG_8: 8,
  SDG_11: 11,
  SDG_12: 12,
  SDG_17: 17,
}

export default async function SdgAnalysisListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const analyses = await db.sdgAnalysis.findMany({
    where: { company: { userId: session.user.id } },
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
      description={`실행한 모든 SDGs 분석 이력입니다. (총 ${analyses.length}건)`}
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        {analyses.length === 0 ? (
          <EmptyState
            icon="📊"
            title="아직 실행한 분석이 없어요"
            description="기업 상세 페이지에서 'SDGs 분석 실행'을 누르면 AI가 활동을 분석해 SDGs를 추천합니다."
            action={
              <Link
                href="/companies"
                className="inline-flex items-center gap-1 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                기업 관리로 이동
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

                <div className="mt-4 border-t border-border pt-4">
                  <Link
                    href={`/sdg-analysis/${a.id}`}
                    className="block rounded-lg bg-accent-500 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                  >
                    분석 결과 보기
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
