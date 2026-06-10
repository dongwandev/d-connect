import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'
import { ContentEditForm } from '@/components/ContentEditForm'
import { db } from '@/server/db'
import { CONTENT_TYPE_LABEL, type ContentType } from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 콘텐츠 편집 페이지 (PRD §3.5).
 *
 * 권한 (ADR-0005): GeneratedContent → SdgAnalysis → Company.userId 검증.
 */
export const dynamic = 'force-dynamic'

export default async function ContentEditPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params

  const content = await db.generatedContent.findFirst({
    where: { id, analysis: { company: { userId: session.user.id } } },
    include: {
      analysis: {
        select: {
          id: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!content) notFound()

  const hashtags = parseJsonArray<string>(content.hashtags)

  return (
    <AppShell
      title={`${CONTENT_TYPE_LABEL[content.type as ContentType]} 편집`}
      description={`${content.analysis.company.name} · 최종 수정 ${content.updatedAt.toLocaleString('ko-KR')}`}
    >
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-2">
            <BackLink
              href={`/sdg-analysis/${content.analysis.id}`}
              label="분석 결과"
            />
            <Link
              href={`/companies/${content.analysis.company.id}`}
              className="inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:border-accent-500 hover:bg-accent-500/5 hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {content.analysis.company.name}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {content.editedByUser && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                편집됨
              </span>
            )}
            <span className="text-xs text-gray-500">
              생성 {content.createdAt.toLocaleString('ko-KR')} · 수정{' '}
              {content.updatedAt.toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        <ContentEditForm
          contentId={content.id}
          initial={{
            body: content.body,
            hashtags,
            imagePrompt: content.imagePrompt,
          }}
        />
      </div>
    </AppShell>
  )
}
