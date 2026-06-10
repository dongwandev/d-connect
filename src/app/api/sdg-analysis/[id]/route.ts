import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/sdg-analysis/[id] — 분석 삭제 (D7 사용자 요청).
 *
 * 잘못 실행한 분석을 정리하는 용도. 본인 소유 검증 후 hard delete.
 * schema의 onDelete: Cascade로 하위 SdgMatch·GeneratedContent도 함께
 * 삭제된다 — 클라이언트 confirm에서 콘텐츠 동반 삭제를 경고할 것.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    // 본인 소유 검증: SdgAnalysis → Company.userId (ADR-0005 — 비소유는 404)
    const existing = await db.sdgAnalysis.findFirst({
      where: { id, company: { userId } },
      select: { id: true },
    })
    if (!existing) {
      throw new ApiError('NOT_FOUND', `Analysis not found: ${id}`, 404)
    }

    await db.sdgAnalysis.delete({ where: { id } })
    return { id }
  })
}
