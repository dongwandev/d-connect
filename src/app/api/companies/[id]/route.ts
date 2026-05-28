import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'

/**
 * GET /api/companies/[id] — 본인 기업 상세 (활동 + 최신 분석 1개).
 * 사양: docs/API.md §3.3, ADR-0005 (본인 소유 아님 → 404)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const company = await db.company.findFirst({
      where: { id, userId },
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
