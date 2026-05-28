'use client'

import Link from 'next/link'

interface ErrorStateProps {
  /** 카드 제목 */
  title?: string
  /** 사용자에게 보여줄 설명 */
  message?: string
  /** Next.js error.tsx의 `error.digest` — production 환경에서 generic 메시지와 함께 식별자로만 노출 */
  digest?: string
  /** error.tsx에서 주입되는 reset 함수 — 다시 렌더 시도 */
  onReset?: () => void
  /** 복귀 링크 (기본: 대시보드) */
  homeHref?: string
  /** 복귀 링크 라벨 */
  homeLabel?: string
}

/**
 * 페이지 단위 에러 표시 — error.tsx에서 공통으로 사용한다.
 *
 * 보안 (CLAUDE.md): production은 generic 메시지 + digest만 노출, 스택/secret 노출 금지.
 */
export function ErrorState({
  title = '문제가 발생했습니다',
  message = '잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 관리자에게 문의해 주세요.',
  digest,
  onReset,
  homeHref = '/dashboard',
  homeLabel = '대시보드로',
}: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
      <div className="text-4xl" aria-hidden>
        ⚠️
      </div>
      <h2 className="text-lg font-bold text-red-900">{title}</h2>
      <p className="text-sm text-red-700">{message}</p>
      {digest && (
        <p className="text-xs text-red-500/70">
          에러 ID: <code className="font-mono">{digest}</code>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            다시 시도
          </button>
        )}
        <Link
          href={homeHref}
          className="rounded border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
        >
          {homeLabel}
        </Link>
      </div>
    </div>
  )
}
