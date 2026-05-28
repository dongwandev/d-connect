import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AccountForm } from '@/components/AccountForm'
import { AppShell } from '@/components/AppShell'
import { db } from '@/server/db'

/**
 * 계정 정보 페이지 (D6 사용자 요청).
 *
 * 사이드바 UserMenu → 계정 정보 → 이 페이지.
 * 이메일은 표시만, 비밀번호 변경은 후속.
 */
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      realName: true,
      phone: true,
      organization: true,
      marketingOptIn: true,
      createdAt: true,
    },
  })
  if (!user) redirect('/login')

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">계정 정보</h1>
          <p className="mt-1 text-sm text-gray-500">
            본인의 프로필 정보를 수정할 수 있습니다.
          </p>
        </header>

        <section className="space-y-4 rounded-lg border border-border bg-surface p-6">
          <div className="space-y-2 border-b border-border pb-4">
            <p className="text-xs font-medium text-gray-500">이메일</p>
            <p className="text-sm text-gray-900">{user.email ?? '—'}</p>
            <p className="text-xs text-gray-400">
              가입일: {user.createdAt.toLocaleString('ko-KR')}
            </p>
          </div>

          <AccountForm
            initial={{
              name: user.name,
              realName: user.realName,
              phone: user.phone,
              organization: user.organization,
              marketingOptIn: user.marketingOptIn,
            }}
          />
        </section>
      </div>
    </AppShell>
  )
}
