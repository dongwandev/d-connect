import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { CompanyForm } from '@/components/CompanyForm'

/**
 * 새 기업 등록 페이지.
 *
 * 등록 성공 시 CompanyForm이 /companies/[id]로 router.push.
 */
export const dynamic = 'force-dynamic'

export default async function NewCompanyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <AppShell
      title="새 기업 등록"
      description="기업 정보와 지역사회 기여 활동을 입력하면 SDGs 분석을 시작할 수 있습니다."
    >
      <div className="mx-auto max-w-2xl px-4 py-8">
        <CompanyForm />
      </div>
    </AppShell>
  )
}
