import { type ReactNode } from 'react'

interface EmptyStateProps {
  /** 큰 emoji 아이콘. 의미 전달은 title이 담당하므로 aria-hidden 처리. */
  icon?: string
  title: string
  description?: string
  /** CTA 버튼/링크. 보통 Link 또는 button. */
  action?: ReactNode
  className?: string
}

/**
 * 공통 빈 상태 표시 컴포넌트.
 *
 * 적용 위치: 대시보드 기업 0건, 분석 결과 콘텐츠 0건, 사이드바 기업 0건 등.
 * 빈 상태마다 다른 스타일이 흩어져 있던 것을 한 컴포넌트로 통일한다.
 */
export function EmptyState({
  icon = '✨',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center ${className}`}
    >
      <div className="text-4xl" aria-hidden>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-gray-600">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
