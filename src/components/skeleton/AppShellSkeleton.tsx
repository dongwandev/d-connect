import { type ReactNode } from 'react'
import { Skeleton } from './Skeleton'

/**
 * AppShell의 시각적 placeholder — auth/DB 호출 없이 사이드바·메인 영역 골격만 렌더한다.
 *
 * 진짜 AppShell은 server component + async라서 loading.tsx/error.tsx에서 직접 호출하면
 * Suspense 경계가 흐려지거나(loading) client 컴포넌트에서 import 불가(error)다.
 * 이 컴포넌트는 단순 sync function이므로 server/client 양쪽에서 안전하게 쓸 수 있다.
 */
export function AppShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside
        className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block"
        aria-hidden
      >
        <div className="space-y-3 p-4">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </div>
          <div className="space-y-2 pt-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
