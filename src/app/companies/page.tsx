import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { db } from '@/server/db'
import {
  BUSINESS_TYPE_LABEL,
  INDUSTRY_CATEGORY_LABEL,
  SIDO_LABEL,
  type BusinessType,
  type IndustryCategory,
  type Sido,
} from '@/lib/enums'

/**
 * 기업 관리 페이지 (D7 IA — 사이드바 '기업 관리').
 *
 * 본인 기업 목록 + 활동/분석 수 + 상세·수정 진입.
 * 사이드바에서 기업 목록이 빠지면서 이 페이지가 기업 허브 역할을 맡는다.
 */
export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const companies = await db.company.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { activities: true, analyses: true } },
    },
  })

  return (
    <AppShell
      title="기업 관리"
      description="등록된 기업을 관리하고 SDGs 분석을 시작합니다."
      actions={
        <Link
          href="/companies/new"
          className="rounded-full bg-accent-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          + 새 기업 등록
        </Link>
      }
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        {companies.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="아직 등록된 기업이 없어요"
            description="첫 기업을 등록하면 SDGs 분석과 콘텐츠 생성이 시작됩니다."
            action={
              <Link
                href="/companies/new"
                className="inline-flex items-center gap-1 rounded-full bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <span aria-hidden>➕</span>
                <span>첫 기업 등록하기</span>
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {companies.map((c) => {
              const meta = [
                c.industryCategory
                  ? INDUSTRY_CATEGORY_LABEL[
                      c.industryCategory as IndustryCategory
                    ]
                  : null,
                c.sido
                  ? `${SIDO_LABEL[c.sido as Sido]}${c.sigungu ? ` ${c.sigungu}` : ''}`
                  : null,
              ].filter(Boolean)

              return (
                <li
                  key={c.id}
                  className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-500"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white"
                      aria-hidden
                    >
                      {c.name.slice(0, 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-gray-900">
                        {c.name}
                      </h2>
                      <p className="truncate text-xs text-gray-500">
                        {meta.length > 0 ? meta.join(' · ') : '정보 미입력'}
                      </p>
                    </div>
                    {c.businessType && (
                      <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-gray-600">
                        {BUSINESS_TYPE_LABEL[c.businessType as BusinessType]}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                    <span>활동 {c._count.activities}</span>
                    <span>분석 {c._count.analyses}</span>
                    <span>등록 {c.createdAt.toLocaleDateString('ko-KR')}</span>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-border pt-4">
                    <Link
                      href={`/companies/${c.id}`}
                      className="flex-1 rounded-full bg-accent-500 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      상세 보기
                    </Link>
                    <Link
                      href={`/companies/${c.id}/edit`}
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:border-accent-500 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                    >
                      정보 수정
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
