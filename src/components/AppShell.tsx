import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Sidebar } from './Sidebar'

/**
 * 로그인된 페이지의 공통 셸 — 좌측 사이드바 + 메인.
 *
 * 사용처: /dashboard, /companies/new, /companies/[id], /sdg-analysis/[id], /contents/[id]
 * 미사용처: /, /login, /signup (전체 화면)
 *
 * 인증 가드도 여기서 일관 처리 — 페이지에서 별도 auth() 호출 불필요.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar
        userName={session.user.name ?? null}
        userEmail={session.user.email ?? null}
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
