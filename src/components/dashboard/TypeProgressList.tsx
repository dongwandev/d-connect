import { CONTENT_TYPE_LABEL, type ContentType } from '@/lib/enums'

interface Datum {
  type: ContentType
  count: number
}

const TYPE_COLOR: Record<ContentType, string> = {
  SNS_POST: 'bg-pink-500',
  CARD_NEWS: 'bg-blue-500',
  SHORT_VIDEO_SCRIPT: 'bg-amber-500',
  CAMPAIGN_SLOGAN: 'bg-emerald-500',
}

export function TypeProgressList({ data }: { data: Datum[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">
        콘텐츠 유형별 생성 수
      </h3>

      {total === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          아직 생성된 콘텐츠가 없습니다.
        </p>
      ) : (
        <ul className="space-y-3 text-xs">
          {data.map((d) => {
            const pct = total === 0 ? 0 : Math.round((d.count / total) * 100)
            return (
              <li key={d.type}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    {CONTENT_TYPE_LABEL[d.type]}
                  </span>
                  <span className="text-gray-500">
                    {d.count}건 ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full ${TYPE_COLOR[d.type]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
