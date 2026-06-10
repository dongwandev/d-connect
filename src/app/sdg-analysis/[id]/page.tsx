import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { ContentGenerationButtons } from '@/components/ContentGenerationButtons'
import {
  ContentTabs,
  type ContentItem,
} from '@/components/sdg/ContentTabs'
import { SdgMatchCard } from '@/components/sdg/SdgMatchCard'
import { db } from '@/server/db'
import {
  INDUSTRY_CATEGORY_LABEL,
  SOCIAL_CATEGORY_LABEL,
  SIDO_LABEL,
  type ContentType,
  type IndustryCategory,
  type SdgGoal,
  type Sido,
  type SocialCategory,
} from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 분석 결과 페이지 (D5 디자인 적용).
 *
 * 디자인 이미지 1 패턴:
 *   - 상단: 기업 정보 사이드 카드
 *   - 가운데: 추천 SDGs 카드 (UN 공식 컬러)
 *   - 하단: 콘텐츠 유형별 탭
 */
export const dynamic = 'force-dynamic'

export default async function AnalysisPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const analysis = await db.sdgAnalysis.findFirst({
    where: { id, company: { userId: session.user.id } },
    include: {
      company: true,
      matches: { orderBy: { score: 'desc' } },
      contents: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!analysis) notFound()

  const company = analysis.company
  const socialFunctions = parseJsonArray<SocialCategory>(
    analysis.socialFunctions,
  )

  // ANTHROPIC_API_KEY 미설정 시 모든 분석이 mock fallback으로 떨어진다 (server/ai/index.ts).
  // 사용자에게 'mock 결과'임을 명시해 결과 신뢰도 오해를 방지.
  // 향후 DB schema에 fromMock 컬럼을 추가하면 분석마다 정확히 판정 가능 (위험 작업).
  const usingMockFallback = !process.env.ANTHROPIC_API_KEY

  // ContentTabs는 client component — Date를 ISO string으로 직렬화해 전달
  const contentsForClient: ContentItem[] = analysis.contents.map((c) => ({
    id: c.id,
    type: c.type as ContentType,
    body: c.body,
    hashtags: parseJsonArray<string>(c.hashtags),
    imagePrompt: c.imagePrompt,
    editedByUser: c.editedByUser,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <AppShell
      title="SDGs 분석 결과"
      description={`${company.name} · ${analysis.createdAt.toLocaleString('ko-KR')}`}
      activeCompanyId={company.id}
    >
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <nav className="text-sm">
          <Link
            href={`/companies/${company.id}`}
            className="text-accent-500 hover:underline"
          >
            ← {company.name} 상세
          </Link>
        </nav>

        {usingMockFallback && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <span aria-hidden className="text-base">⚠️</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">API 키 미설정 — mock 결과입니다</p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90">
                서버에 <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">ANTHROPIC_API_KEY</code> 가 없어 AI 호출 대신 고정 mock 응답을 표시합니다. 실제 분석은 환경 변수 설정 후 다시 실행해 주세요.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* 좌측: 기업 정보 사이드 카드 (디자인 이미지 1 패턴) */}
          <aside className="space-y-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-brand-700">
                <span aria-hidden>🏢</span>
                <span>선택된 기업 정보</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {company.name}
              </h2>
              <dl className="mt-3 space-y-2 text-xs">
                {company.industryCategory && (
                  <FieldRow
                    label="업종"
                    value={
                      INDUSTRY_CATEGORY_LABEL[
                        company.industryCategory as IndustryCategory
                      ]
                    }
                  />
                )}
                {(company.sido || company.sigungu) && (
                  <FieldRow
                    label="지역"
                    value={[
                      company.sido ? SIDO_LABEL[company.sido as Sido] : null,
                      company.sigungu,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                )}
                {company.foundedYear && (
                  <FieldRow
                    label="설립연도"
                    value={`${company.foundedYear}년`}
                  />
                )}
                {company.product && (
                  <FieldRow label="제품·서비스" value={company.product} />
                )}
              </dl>
            </div>

            {/* 사회적 기능 */}
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-xs font-medium text-brand-700">
                사회적 기능 분류
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {socialFunctions.map((sf) => (
                  <li
                    key={sf}
                    className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs text-purple-800"
                  >
                    {SOCIAL_CATEGORY_LABEL[sf]}
                  </li>
                ))}
              </ul>
            </div>

            {/* 공공적 의미 */}
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-xs font-medium text-brand-700">
                공공적 의미
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-700">
                {analysis.publicMeaning}
              </p>
            </div>
          </aside>

          {/* 우측: SDG 카드 + 콘텐츠 */}
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                추천 SDGs 목표 ({analysis.matches.length})
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {analysis.matches.map((m) => (
                  <SdgMatchCard
                    key={m.id}
                    match={{
                      sdg: m.sdg as SdgGoal,
                      score: m.score,
                      keywords: parseJsonArray<string>(m.keywords),
                      rationale: m.rationale,
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                공공홍보 콘텐츠 ({analysis.contents.length})
              </h2>
              <ContentGenerationButtons analysisId={analysis.id} />
              <ContentTabs contents={contentsForClient} />
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-16 shrink-0 text-gray-500">{label}</dt>
      <dd className="text-gray-800">{value}</dd>
    </div>
  )
}
