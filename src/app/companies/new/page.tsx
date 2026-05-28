import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CompanyForm } from '@/components/CompanyForm'

/**
 * 새 기업 등록 페이지.
 *
 * 로그인 사용자만 접근. 폼은 client component(useFieldArray).
 * 등록 성공 시 CompanyForm이 자동으로 /companies/[id]로 router.push.
 */
export const dynamic = 'force-dynamic'

export default async function NewCompanyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <nav className="mx-auto max-w-2xl px-6 pb-4 text-sm">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← 대시보드
        </Link>
      </nav>
      <CompanyForm />
    </main>
  )
}
