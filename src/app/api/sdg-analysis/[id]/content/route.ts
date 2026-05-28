import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { generateContent } from '@/server/ai'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import type { SocialCategory } from '@/lib/enums'
import { parseJsonArray, serializeJsonArray } from '@/lib/json-array'
import { CreateContentSchema } from './schemas'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/sdg-analysis/[id]/content — 콘텐츠 생성 (AI).
 * 사양: docs/API.md §5.2, ADR-0005
 *
 * 흐름:
 *   1) 본인 소유 분석 + 기업·활동 조회
 *   2) generateContent (Anthropic, mock fallback)
 *   3) GeneratedContent 저장 + usedFallback 플래그
 *   4) JSON-string(hashtags)을 배열로 풀어서 반환
 */
export async function POST(
  req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params
    const body = CreateContentSchema.parse(await req.json())

    const analysis = await db.sdgAnalysis.findFirst({
      where: { id, company: { userId } },
      include: {
        company: { include: { activities: { orderBy: { createdAt: 'asc' } } } },
        matches: { orderBy: { score: 'desc' } },
      },
    })
    if (!analysis) {
      throw new ApiError('NOT_FOUND', `Analysis not found: ${id}`, 404)
    }

    const company = analysis.company
    const { result, usedFallback } = await generateContent(
      {
        name: company.name,
        industry: company.industry,
        region: company.region,
        product: company.product,
        activities: company.activities.map((a) => ({
          title: a.title,
          description: a.description,
        })),
      },
      {
        matches: analysis.matches.map((m) => ({
          sdg: m.sdg,
          score: m.score,
          keywords: parseJsonArray<string>(m.keywords),
          rationale: m.rationale,
        })),
        socialFunctions: parseJsonArray<SocialCategory>(
          analysis.socialFunctions,
        ),
        publicMeaning: analysis.publicMeaning,
      },
      body.type,
    )

    const created = await db.generatedContent.create({
      data: {
        analysisId: analysis.id,
        type: result.type,
        body: result.body,
        hashtags: serializeJsonArray(result.hashtags),
        imagePrompt: result.imagePrompt ?? null,
        usedFallback,
      },
    })

    return {
      id: created.id,
      analysisId: created.analysisId,
      type: created.type,
      body: created.body,
      hashtags: parseJsonArray<string>(created.hashtags),
      imagePrompt: created.imagePrompt,
      editedByUser: created.editedByUser,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }
  })
}

/**
 * GET /api/sdg-analysis/[id]/contents — 분석에 속한 콘텐츠 목록 (본문 포함).
 * 사양: docs/API.md §5.1
 */
export async function GET(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const analysis = await db.sdgAnalysis.findFirst({
      where: { id, company: { userId } },
      select: { id: true },
    })
    if (!analysis) {
      throw new ApiError('NOT_FOUND', `Analysis not found: ${id}`, 404)
    }

    const contents = await db.generatedContent.findMany({
      where: { analysisId: id },
      orderBy: { createdAt: 'desc' },
    })

    return contents.map((c) => ({
      id: c.id,
      type: c.type,
      body: c.body,
      hashtags: parseJsonArray<string>(c.hashtags),
      imagePrompt: c.imagePrompt,
      editedByUser: c.editedByUser,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  })
}
