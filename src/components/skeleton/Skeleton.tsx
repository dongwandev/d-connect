import { type HTMLAttributes } from 'react'

/**
 * 로딩 상태 placeholder primitive.
 *
 * className으로 크기·모양을 자유롭게 조정한다.
 * 디자인 토큰: animate-pulse + bg-gray-200 (gray-100보다 한 톤 진하게 — surface-muted 위에서 대비 확보)
 */
export function Skeleton({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      aria-hidden
      {...props}
    />
  )
}
