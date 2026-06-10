import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
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
      activeCompanyId={content.analysis.company.id}
    >
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav className="space-x-3 text-sm">
            <Link
              href={`/sdg-analysis/${content.analysis.id}`}
              className="text-accent-500 hover:underline"
            >
              ← 분석 결과
            </Link>
            <Link
              href={`/companies/${content.analysis.company.id}`}
              className="text-accent-500 hover:underline"
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
