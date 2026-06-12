import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AuthShell } from '@/components/AuthShell'
import { FindAccountForm } from '@/components/FindAccountForm'

/**
 * 계정 찾기 페이지 — 이메일(아이디) 찾기 + 비밀번호 재설정.
 *
 * 로그인 페이지에서 진입. 이미 로그인된 경우 /dashboard로 리다이렉트.
 */
export const dynamic = 'force-dynamic'

export default async function FindAccountPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <AuthShell>
      <div className="w-full max-w-md space-y-6 rounded-3xl border-2 border-green-100 bg-white p-8 shadow-sm">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">계정 찾기</h1>
          <p className="mt-1 text-sm text-gray-500">
            이메일(아이디)이나 비밀번호를 잊으셨나요?
          </p>
        </header>

        <FindAccountForm />

        <p className="text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="font-medium text-green-600 hover:underline"
          >
            ← 로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}
