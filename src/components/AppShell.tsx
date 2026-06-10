import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'
import { auth } from '@/auth'
import { db } from '@/server/db'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  /** TopBar에 표시할 페이지 제목 */
  title?: string
  /** TopBar 제목 아래 한 줄 설명 */
  description?: string
  /** TopBar 우측 페이지 액션 (예: '+ 새 기업 등록' 버튼) */
  actions?: ReactNode
  /** URL에 기업 id가 없는 페이지에서 사이드바 활성 기업 지정 */
  activeCompanyId?: string
  children: ReactNode
}

/**
 * 로그인된 페이지의 공통 셸 (디자인 디벨롭 — 목업 정합).
 *
 * 구조: 사이드바 | (상단 네비게이션 바 + 메인)
 *   - 사이드바: 브랜드 + 메뉴 + 기업 목록 + 홍보 카드
 *   - TopBar: 페이지 제목/설명 + 알림/도움말 + 사용자 드롭다운
 *
 * 사이드바 기업 목록을 위해 여기서 미리 조회한다 (D6).
 */
export async function AppShell({
  title = 'D-Connect',
  description,
  actions,
  activeCompanyId,
  children,
}: AppShellProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const companies = await db.company.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  })

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <Sidebar companies={companies} activeCompanyId={activeCompanyId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          description={description}
          actions={actions}
          userName={session.user.name ?? null}
          userEmail={session.user.email ?? null}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
