import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AnalyzeButton } from '@/components/AnalyzeButton'
import { AppShell } from '@/components/AppShell'
import { db } from '@/server/db'
import {
  BUSINESS_TYPE_LABEL,
  INDUSTRY_CATEGORY_LABEL,
  PROMO_GOAL_LABEL,
  SIDO_LABEL,
  SOCIAL_CATEGORY_LABEL,
  TARGET_AUDIENCE_LABEL,
  type BusinessType,
  type IndustryCategory,
  type PromoGoal,
  type Sido,
  type SocialCategory,
  type TargetAudience,
} from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 기업 상세 페이지 (D6 디자인 보강).
 *
 * 권한 (ADR-0005):
 *   - 비로그인 → /login
 *   - 본인 소유 아니면 404 (존재 자체 숨김)
 */
export const dynamic = 'force-dynamic'

// 활동 카테고리별 컬러 클래스 (SocialCategory별 시각적 구분)
const CATEGORY_BADGE: Record<SocialCategory, string> = {
  EMPLOYMENT: 'bg-blue-100 text-blue-800',
  ENVIRONMENT: 'bg-emerald-100 text-emerald-800',
  LOCAL_ECONOMY: 'bg-amber-100 text-amber-800',
  COMMUNITY: 'bg-purple-100 text-purple-800',
  COOPERATION: 'bg-rose-100 text-rose-800',
}

const CATEGORY_ICON: Record<SocialCategory, string> = {
  EMPLOYMENT: '💼',
  ENVIRONMENT: '🌿',
  LOCAL_ECONOMY: '🏙️',
  COMMUNITY: '🤝',
  COOPERATION: '🔗',
}

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
        select: { id: true, createdAt: true },
      },
    },
  })

  if (!company) notFound()

  const latestAnalysis = company.analyses[0] ?? null
  const targets = parseJsonArray<TargetAudience>(company.targetAudiences)
  const goals = parseJsonArray<PromoGoal>(company.promoGoals)

  const headerMeta: string[] = []
  if (company.industryCategory) {
    headerMeta.push(
      INDUSTRY_CATEGORY_LABEL[company.industryCategory as IndustryCategory],
    )
  } else if (company.industry) {
    headerMeta.push(company.industry)
  }
  if (company.sido) {
    headerMeta.push(
      `${SIDO_LABEL[company.sido as Sido]}${company.sigungu ? ` ${company.sigungu}` : ''}`,
    )
  } else if (company.region) {
    headerMeta.push(company.region)
  }
  if (company.foundedYear) headerMeta.push(`${company.foundedYear}년 설립`)

  return (
    <AppShell
      title={company.name}
      description="기업 활동과 SDGs 분석 현황을 확인합니다."
    >
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* 헤더 카드 — 브랜드 그린 그라데이션 + 이니셜 아바타 */}
        <header className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center gap-4 bg-gradient-to-br from-brand-50 to-blue-50 px-6 py-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white shadow-sm"
              aria-hidden
            >
              {company.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {company.name}
              </h2>
              {headerMeta.length > 0 && (
                <p className="mt-1 text-sm text-gray-600">
                  {headerMeta.join(' · ')}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                등록: {company.createdAt.toLocaleString('ko-KR')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {company.businessType && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                  {BUSINESS_TYPE_LABEL[company.businessType as BusinessType]}
                </span>
              )}
              <Link
                href={`/companies/${company.id}/edit`}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                <span aria-hidden>✏️</span>
                <span>정보 수정</span>
              </Link>
            </div>
          </div>
        </header>

        {/* SDGs 분석 CTA 카드 — 가장 중요한 액션 영역, 상단 prominent */}
        {latestAnalysis ? (
          <section className="rounded-xl border border-brand-500 bg-gradient-to-r from-brand-50 to-emerald-50 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-brand-700">
                  SDGs 분석 완료
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  최신 분석: {latestAnalysis.createdAt.toLocaleString('ko-KR')}{' '}
                  · 총 {company.analyses.length}회
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* 재분석 시 이력이 여러 건이므로 단건 직행 대신 이 기업의 분석 목록으로 */}
                <Link
                  href={`/sdg-analysis?company=${company.id}`}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  분석 결과 보기 ({company.analyses.length}건)
                </Link>
                <AnalyzeButton companyId={company.id} />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border-2 border-dashed border-accent-500/40 bg-accent-500/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-accent-600">
                  SDGs 분석 대기 중
                </p>
                <p className="mt-1 text-sm text-gray-700">
                  활동 정보를 바탕으로 AI가 SDGs를 추천합니다 (최대 30초).
                </p>
              </div>
              <AnalyzeButton companyId={company.id} />
            </div>
          </section>
        )}

        {/* 2-column grid: 좌측 정보 + 우측 활동 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.3fr]">
          {/* 좌측: 기본 정보 카드들 */}
          <section className="space-y-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-brand-700">
                <span aria-hidden>📋</span>
                <span>기본 정보</span>
              </div>
              <dl className="space-y-3 text-sm">
                <InfoRow
                  label="제품·서비스"
                  value={company.product ?? null}
                />
                {targets.length > 0 && (
                  <InfoRow
                    label="주요 타겟 고객"
                    value={
                      <div className="flex flex-wrap gap-1">
                        {targets.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
                          >
                            {TARGET_AUDIENCE_LABEL[t]}
                          </span>
                        ))}
                      </div>
                    }
                  />
                )}
                {goals.length > 0 && (
                  <InfoRow
                    label="홍보 목표"
                    value={
                      <div className="flex flex-wrap gap-1">
                        {goals.map((g) => (
                          <span
                            key={g}
                            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
                          >
                            {PROMO_GOAL_LABEL[g]}
                          </span>
                        ))}
                      </div>
                    }
                  />
                )}
              </dl>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-gray-500">활동</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {company.activities.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-gray-500">분석 이력</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {company.analyses.length}
                </p>
              </div>
            </div>
          </section>

          {/* 우측: 활동 목록 */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-brand-700">
                <span aria-hidden>🌟</span>
                <span>지역사회 기여 활동 ({company.activities.length})</span>
              </div>
            </div>

            <ul className="space-y-3">
              {company.activities.map((a) => {
                const cat = a.category as SocialCategory
                return (
                  <li
                    key={a.id}
                    className="rounded-lg border border-border bg-surface-muted p-4 transition-colors hover:border-brand-500"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${CATEGORY_BADGE[cat]}`}
                      >
                        <span aria-hidden>{CATEGORY_ICON[cat]}</span>
                        {SOCIAL_CATEGORY_LABEL[cat]}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {a.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-700">
                      {a.description}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode | null
}) {
  return (
    <div>
      <dt className="mb-1 text-xs text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800">
        {value ?? <span className="text-gray-500">—</span>}
      </dd>
    </div>
  )
}
