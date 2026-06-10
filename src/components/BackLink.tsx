import Link from 'next/link'
import { IconArrowLeft } from './icons'

/**
 * 페이지 상단 뒤로가기 링크 (D7 셸 디자인 정합).
 *
 * 기존 맨살 텍스트 링크(text-sm + underline)를 칩/버튼 형태로 통일 —
 * 흰 배경 + 테두리 + 화살표 아이콘, hover 시 액센트 컬러.
 * 분석 결과·콘텐츠 편집·기업 수정 등 상세 페이지에서 사용.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-accent-500 hover:bg-accent-500/5 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
    >
      <IconArrowLeft className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}
