import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AuthShell } from '@/components/AuthShell'
import { SignupForm } from '@/components/SignupForm'

/**
 * 회원가입 페이지.
 *
 * 이미 로그인된 경우 /dashboard로 리다이렉트.
 * 가입 성공 시 자동 로그인 → /dashboard로 이동 (SignupForm 내부에서 처리).
 */
export const dynamic = 'force-dynamic'

export default async function SignupPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <AuthShell>
      <div className="w-full max-w-md space-y-6 rounded-3xl border-2 border-green-100 bg-white p-8 shadow-sm">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-1 text-sm text-gray-500">
            D-Connect에서 우리 기업의 SDGs 콘텐츠를 만들어 보세요.
          </p>
        </header>

        <SignupForm />

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
