import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { analyzeSdg, toCompanyInput } from '@/server/ai'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import type { SocialCategory } from '@/lib/enums'
import { parseJsonArray, serializeJsonArray } from '@/lib/json-array'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * POST /api/companies/[id]/sdg-analysis — 본인 기업의 SDGs 분석 요청 (AI).
 * 사양: docs/API.md §4.1, ADR-0005
 *
 * 응답에 usedFallback은 노출하지 않는다 (API.md §6 — DB에만 저장).
 */
export async function POST(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const company = await db.company.findFirst({
      where: { id, userId },
      include: { activities: { orderBy: { createdAt: 'asc' } } },
    })
    if (!company) {
      throw new ApiError('NOT_FOUND', `Company not found: ${id}`, 404)
    }
    if (company.activities.length === 0) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '분석할 활동이 없습니다. 먼저 활동을 1개 이상 입력해주세요.',
        400,
      )
    }

    const { result, usedFallback } = await analyzeSdg(toCompanyInput(company))

    const created = await db.sdgAnalysis.create({
      data: {
        companyId: company.id,
        socialFunctions: serializeJsonArray(result.socialFunctions),
        publicMeaning: result.publicMeaning,
        usedFallback,
        matches: {
          create: result.matches.map((m) => ({
            sdg: m.sdg,
            score: m.score,
            keywords: serializeJsonArray(m.keywords),
            rationale: m.rationale,
          })),
        },
      },
      include: { matches: { orderBy: { score: 'desc' } } },
    })

    return {
      id: created.id,
      companyId: created.companyId,
      socialFunctions: parseJsonArray<SocialCategory>(created.socialFunctions),
      publicMeaning: created.publicMeaning,
      matches: created.matches.map((m) => ({
        id: m.id,
        sdg: m.sdg,
        score: m.score,
        keywords: parseJsonArray<string>(m.keywords),
        rationale: m.rationale,
      })),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    }
  })
}

/**
 * GET /api/companies/[id]/sdg-analysis — 본인 기업의 분석 이력 요약.
 * 사양: docs/API.md §4.2, ADR-0005
 */
export async function GET(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const exists = await db.company.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    if (!exists) {
      throw new ApiError('NOT_FOUND', `Company not found: ${id}`, 404)
    }

    const analyses = await db.sdgAnalysis.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true },
    })
    return analyses
  })
}
