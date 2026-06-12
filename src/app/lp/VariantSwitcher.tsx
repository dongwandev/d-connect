import Link from 'next/link'

/**
 * 시안 비교용 플로팅 스위처 (#119 임시).
 * 시안 선택이 끝나면 /lp 라우트와 함께 삭제한다.
 */
export function VariantSwitcher({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-gray-300 bg-white/95 px-2 py-1.5 text-sm shadow-lg backdrop-blur">
      <span className="px-2 text-xs font-medium text-gray-500">시안</span>
      {([1, 2, 3] as const).map((n) => (
        <Link
          key={n}
          href={`/lp/${n}`}
          className={
            n === current
              ? 'rounded-full bg-gray-900 px-3 py-1 font-semibold text-white'
              : 'rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100'
          }
        >
          {n}
        </Link>
      ))}
      <span className="mx-1 h-4 w-px bg-gray-200" />
      <Link
        href="/"
        className="rounded-full px-3 py-1 text-gray-600 hover:bg-gray-100"
      >
        현재 버전
      </Link>
    </div>
  )
}
