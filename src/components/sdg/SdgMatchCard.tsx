import { SDG_COLOR, SDG_GOAL_LABEL, type SdgGoal } from '@/lib/enums'

/**
 * SDG 매칭 카드 — UN 공식 컬러 + 번호 + 라벨 + 점수 + 키워드 + 근거.
 * 디자인 이미지 1의 SDG 카드 패턴.
 */

interface SdgMatchData {
  sdg: SdgGoal
  score: number
  keywords: string[]
  rationale: string
}

const SDG_NUMBER: Record<SdgGoal, number> = {
  SDG_8: 8,
  SDG_11: 11,
  SDG_12: 12,
  SDG_17: 17,
}

const SDG_TITLE: Record<SdgGoal, string> = {
  SDG_8: '양질의 일자리와 경제성장',
  SDG_11: '지속가능한 도시와 공동체',
  SDG_12: '책임 있는 소비와 생산',
  SDG_17: '목표 달성을 위한 파트너십',
}

function scoreLabel(score: number): string {
  if (score >= 80) return '매우 관련'
  if (score >= 50) return '관련'
  return '약한 관련'
}

export function SdgMatchCard({ match }: { match: SdgMatchData }) {
  const color = SDG_COLOR[match.sdg]
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* 컬러 헤더 — UN 공식 톤 */}
      <header
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: color }}
      >
        <div>
          <p className="text-3xl font-bold leading-none">
            {SDG_NUMBER[match.sdg]}
          </p>
          <p className="mt-1 text-xs font-medium leading-tight">
            {SDG_TITLE[match.sdg]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold leading-none">{match.score}</p>
          <p className="mt-1 text-[10px]">{scoreLabel(match.score)}</p>
        </div>
      </header>

      {/* 본문 */}
      <div className="space-y-2 p-4">
        <ul className="flex flex-wrap gap-1">
          {match.keywords.map((k, i) => (
            <li
              key={`${match.sdg}-${i}`}
              className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              #{k}
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-gray-600">
          {match.rationale}
        </p>
      </div>

      <p className="sr-only">
        {SDG_GOAL_LABEL[match.sdg]} — 점수 {match.score}
      </p>
    </article>
  )
}
