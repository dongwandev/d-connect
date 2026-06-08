/**
 * 대시보드 통계 카드 (디자인 레퍼런스 이미지 3 패턴).
 *
 * Tailwind 기본 + 브랜드 토큰만 사용. 차트 라이브러리 미사용.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = 'blue',
}: {
  label: string
  value: number | string
  hint?: string
  icon: string
  accent?: 'blue' | 'green' | 'amber' | 'purple'
}) {
  const accentClass = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  }[accent]

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${accentClass}`}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  )
}
