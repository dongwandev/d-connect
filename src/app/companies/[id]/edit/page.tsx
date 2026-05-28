import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { CompanyForm } from '@/components/CompanyForm'
import { db } from '@/server/db'
import type {
  IndustryCategory,
  PromoGoal,
  Sido,
  SocialCategory,
  TargetAudience,
  BusinessType,
} from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 기업 정보 수정 페이지 (D6 사용자 요청).
 *
 * 권한 (ADR-0005):
 *   - 비로그인 → /login
 *   - 본인 소유 아니면 404
 *
 * 폼은 CompanyForm을 edit 모드로 재사용. 활동은 전체 replace.
 */
export const dynamic = 'force-dynamic'

export default async function EditCompanyPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const company = await db.company.findFirst({
    where: { id, userId: session.user.id },
    include: {
      activities: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!company) notFound()

  const initial = {
    name: company.name,
    foundedYear: company.foundedYear ?? undefined,
    businessType: (company.businessType ?? undefined) as
      | BusinessType
      | undefined,
    sido: (company.sido ?? undefined) as Sido | undefined,
    sigungu: company.sigungu ?? undefined,
    industryCategory: (company.industryCategory ?? undefined) as
      | IndustryCategory
      | undefined,
    product: company.product ?? undefined,
    targetAudiences: parseJsonArray<TargetAudience>(company.targetAudiences),
    promoGoals: parseJsonArray<PromoGoal>(company.promoGoals),
    activities: company.activities.map((a) => ({
      category: a.category as SocialCategory,
      title: a.title,
      description: a.description,
    })),
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
        <nav className="space-x-3 text-sm">
          <Link
            href="/dashboard"
            className="text-accent-500 hover:underline"
          >
            ← 대시보드
          </Link>
          <Link
            href={`/companies/${company.id}`}
            className="text-accent-500 hover:underline"
          >
            {company.name}
          </Link>
        </nav>

        <header className="px-2">
          <h1 className="text-2xl font-bold text-gray-900">
            기업 정보 수정
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            변경된 정보를 저장하면 기업 상세 페이지로 돌아갑니다.
            <br />
            <span className="text-xs text-amber-700">
              ⚠️ 활동을 수정해도 기존 분석·콘텐츠는 그대로 유지됩니다 (재실행 시 새 분석 추가).
            </span>
          </p>
        </header>

        <CompanyForm mode="edit" companyId={company.id} initial={initial} />
      </div>
    </AppShell>
  )
}
