import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'

/**
 * GET /api/companies/[id] — 기업 상세.
 * 사양: docs/API.md §3.3 (기업 + 활동 + 최신 분석 1개 요약 포함).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const { id } = await params
    const company = await db.company.findUnique({
      where: { id },
      include: {
        activities: { orderBy: { createdAt: 'asc' } },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, createdAt: true },
        },
      },
    })

    if (!company) {
      throw new ApiError('NOT_FOUND', `Company not found: ${id}`, 404)
    }

    const { analyses, ...rest } = company
    return {
      ...rest,
      latestAnalysis: analyses[0] ?? null,
    }
  })
}
