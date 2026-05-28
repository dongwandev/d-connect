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
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <nav className="space-x-3 text-sm">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← 대시보드
        </Link>
        <Link
          href={`/companies/${content.analysis.company.id}`}
          className="text-blue-600 hover:underline"
        >
          {content.analysis.company.name}
        </Link>
        <Link
          href={`/sdg-analysis/${content.analysis.id}`}
          className="text-blue-600 hover:underline"
        >
          분석 결과
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {CONTENT_TYPE_LABEL[content.type as ContentType]} 편집
          {content.editedByUser && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-800">
              편집됨
            </span>
          )}
        </h1>
        <p className="text-xs text-gray-400">
          생성: {content.createdAt.toLocaleString('ko-KR')} · 최종 수정:{' '}
          {content.updatedAt.toLocaleString('ko-KR')}
        </p>
      </header>

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
