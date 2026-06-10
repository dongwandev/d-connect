import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { db } from '@/server/db'
import { CONTENT_TYPE_LABEL, type ContentType } from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'

/**
 * 내 콘텐츠 보기 페이지 (D7 IA — 사이드바 '내 콘텐츠 보기').
 *
 * 모든 기업·분석에 걸친 생성 콘텐츠를 한곳에서 모아 본다.
 * 권한 (ADR-0005): analysis → company.userId 경유로 본인 것만.
 */
export const dynamic = 'force-dynamic'

const TYPE_BADGE: Record<ContentType, string> = {
  SNS_POST: 'bg-pink-100 text-pink-800',
  CARD_NEWS: 'bg-blue-100 text-blue-800',
  SHORT_VIDEO_SCRIPT: 'bg-purple-100 text-purple-800',
  CAMPAIGN_SLOGAN: 'bg-emerald-100 text-emerald-800',
}

export default async function ContentsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const contents = await db.generatedContent.findMany({
    where: { analysis: { company: { userId: session.user.id } } },
    orderBy: { createdAt: 'desc' },
    include: {
      analysis: {
        select: {
          id: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  })

  return (
    <AppShell
      title="내 콘텐츠"
      description={`생성된 모든 홍보 콘텐츠를 한곳에서 관리합니다. (총 ${contents.length}건)`}
    >
      <div className="mx-auto max-w-5xl px-6 py-8">
        {contents.length === 0 ? (
          <EmptyState
            icon="✨"
            title="아직 생성된 콘텐츠가 없어요"
            description="기업을 등록하고 SDGs 분석을 실행하면 SNS·카드뉴스·숏폼·슬로건 콘텐츠를 만들 수 있습니다."
            action={
              <Link
                href="/companies"
                className="inline-flex items-center gap-1 rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                기업 관리로 이동
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {contents.map((c) => {
              const hashtags = parseJsonArray<string>(c.hashtags)
              return (
                <li
                  key={c.id}
                  className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-500"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${TYPE_BADGE[c.type as ContentType]}`}
                      >
                        {CONTENT_TYPE_LABEL[c.type as ContentType]}
                      </span>
                      {c.editedByUser && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-800">
                          편집됨
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/companies/${c.analysis.company.id}`}
                      className="truncate text-xs text-gray-500 hover:text-accent-600 hover:underline"
                    >
                      {c.analysis.company.name}
                    </Link>
                  </div>

                  <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {c.body}
                  </p>

                  {hashtags.length > 0 && (
                    <p className="mt-2 truncate text-xs text-accent-600">
                      {hashtags.map((h) => `#${h}`).join(' ')}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-gray-500">
                      {c.createdAt.toLocaleString('ko-KR')}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`/sdg-analysis/${c.analysis.id}`}
                        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-accent-500 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                      >
                        분석 보기
                      </Link>
                      <Link
                        href={`/contents/${c.id}`}
                        className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                      >
                        편집
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
