import { SDG_GOAL_LABEL, type SdgGoal } from '@/lib/enums'

interface Datum {
  sdg: SdgGoal
  count: number
}

/**
 * SDGs 분포 donut chart — 차트 라이브러리 없이 SVG로 그린다.
 * SDG별 UN 공식 컬러 사용 (https://www.un.org/sustainabledevelopment/news/communications-material/).
 */
const SDG_COLOR: Record<SdgGoal, string> = {
  SDG_8: '#A21942', // 마룬
  SDG_11: '#FD9D24', // 오렌지
  SDG_12: '#BF8B2E', // 브라운
  SDG_17: '#19486A', // 다크 블루
}

export function SdgDonut({ data }: { data: Datum[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-border bg-surface p-6 text-sm text-gray-500">
        분석 결과가 누적되면 SDGs 분포가 표시됩니다.
      </div>
    )
  }

  const r = 60
  const c = 2 * Math.PI * r

  // reduce로 누적 오프셋 계산 — render 중 mutate 회피 (React 컴파일러 친화)
  const segments = data.reduce<
    {
      sdg: SdgGoal
      count: number
      length: number
      offset: number
      color: string
    }[]
  >((acc, d) => {
    const length = (d.count / total) * c
    const offset = acc.reduce((sum, s) => sum + s.length, 0)
    acc.push({
      sdg: d.sdg,
      count: d.count,
      length,
      offset,
      color: SDG_COLOR[d.sdg],
    })
    return acc
  }, [])

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">SDGs 분포</h3>
      <div className="flex items-center gap-5">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* 배경 트랙 */}
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="20"
          />
          {/* 세그먼트들 */}
          {segments.map((s) => (
            <circle
              key={s.sdg}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeDasharray={`${s.length} ${c}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 80 80)"
            />
          ))}
          {/* 중앙 총합 */}
          <text
            x="80"
            y="76"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="#111827"
          >
            {total}
          </text>
          <text
            x="80"
            y="94"
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            매칭 건
          </text>
        </svg>

        {/* 범례 */}
        <ul className="flex-1 space-y-1.5 text-xs">
          {segments.map((s) => (
            <li key={s.sdg} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="flex-1 truncate text-gray-700">
                {SDG_GOAL_LABEL[s.sdg]}
              </span>
              <span className="text-gray-500">{s.count}</span>
              <span className="w-10 text-right text-gray-500">
                {Math.round((s.count / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
