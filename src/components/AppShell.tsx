import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/server/db'
import { Sidebar } from './Sidebar'

/**
 * 로그인된 페이지의 공통 셸 — 좌측 사이드바 + 메인.
 *
 * 사이드바에 본인 기업 목록을 노출하기 위해 여기서 미리 조회한다 (D6).
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const companies = await db.company.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  })

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar
        userName={session.user.name ?? null}
        userEmail={session.user.email ?? null}
        companies={companies}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
