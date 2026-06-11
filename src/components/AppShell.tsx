import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'
import { auth } from '@/auth'
import { db } from '@/server/db'
import { EmailVerifyBanner } from './EmailVerifyBanner'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  /** TopBar에 표시할 페이지 제목 */
  title?: string
  /** TopBar 제목 아래 한 줄 설명 */
  description?: string
  /** TopBar 우측 페이지 액션 (예: '+ 새 기업 등록' 버튼) */
  actions?: ReactNode
  /**
   * URL만으로 사이드바 활성 메뉴를 정할 수 없는 페이지(예: /sdg-analysis/[id])에서
   * 활성 메뉴 href를 명시적으로 지정.
   */
  activeNavHref?: string
  children: ReactNode
}

/**
 * 로그인된 페이지의 공통 셸 (디자인 디벨롭 — 목업 정합).
 *
 * 구조: 사이드바 | (상단 네비게이션 바 + 메인)
 *   - 사이드바: 브랜드 + 고정 메뉴 6항목 + 홍보 카드
 *   - TopBar: 페이지 제목/설명 + 알림/도움말 + 사용자 드롭다운
 */
export async function AppShell({
  title = 'D-Connect',
  description,
  actions,
  activeNavHref,
  children,
}: AppShellProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // 가입 완료 게이트 (D8) — 소셜 첫 로그인으로 자동 생성된 사용자는
  // acceptedTermsAt이 없으므로 /welcome(가입 완료)으로 보낸다.
  // user가 없으면 삭제된 계정의 잔여 세션 → 재로그인 유도.
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { acceptedTermsAt: true, email: true, emailVerified: true },
  })
  if (!me) redirect('/login')
  if (!me.acceptedTermsAt) redirect('/welcome')

  // 이메일 미인증 안내 (#86) — 이용은 막지 않고 배너로만 알린다
  const needsEmailVerify = Boolean(me.email && !me.emailVerified)

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar activeHref={activeNavHref} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          description={description}
          actions={actions}
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? null}
        />
        {needsEmailVerify && me.email && (
          <EmailVerifyBanner email={me.email} />
        )}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
