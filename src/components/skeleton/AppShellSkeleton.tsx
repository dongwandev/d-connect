import { type ReactNode } from 'react'
import { Skeleton } from './Skeleton'

/**
 * AppShell의 시각적 placeholder — auth/DB 호출 없이 사이드바 + TopBar + 메인
 * 골격만 렌더한다 (디자인 디벨롭 구조 반영).
 *
 * 진짜 AppShell은 server component + async라서 loading.tsx/error.tsx에서 직접
 * 호출하면 Suspense 경계가 흐려지거나(loading) client 컴포넌트에서 import
 * 불가(error)다. 이 컴포넌트는 단순 sync function이므로 양쪽에서 안전.
 */
export function AppShellSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-muted">
      {/* 사이드바 placeholder */}
      <aside
        className="hidden w-64 shrink-0 border-r border-border bg-surface md:block"
        aria-hidden
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-2 pt-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-5/6 rounded-lg" />
            <Skeleton className="h-8 w-4/5 rounded-lg" />
          </div>
        </div>
      </aside>

      {/* TopBar + 메인 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className="flex min-h-16 items-center justify-between border-b border-border bg-surface py-3 pl-16 pr-4 md:px-6"
          aria-hidden
        >
          <Skeleton className="h-6 w-36" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
