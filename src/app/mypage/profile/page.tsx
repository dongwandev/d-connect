import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AccountForm } from '@/components/AccountForm'
import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'
import { db } from '@/server/db'

/**
 * 프로필 · 개인정보 수정 페이지 (마이페이지 허브 분리 — D7 IA).
 *
 * 이메일은 표시만, 비밀번호 변경은 보안 설정(준비 중)에서.
 */
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
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
    <AppShell
      title="프로필 · 개인정보 수정"
      description="표시명, 실명, 연락처, 소속 정보를 수정할 수 있습니다."
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <nav>
          <BackLink href="/mypage" label="마이페이지" />
        </nav>

        <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <div className="space-y-2 border-b border-border pb-4">
            <p className="text-xs font-medium text-gray-500">이메일</p>
            <p className="text-sm text-gray-900">{user.email ?? '—'}</p>
            <p className="text-xs text-gray-500">
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
