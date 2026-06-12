import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/inquiries/[id] — 문의 삭제.
 * 사양: docs/API.md §8.3
 *
 * 본인 소유 검증 후 hard delete (ADR-0005 — 비소유는 404).
 * 답변 완료된 문의도 삭제 가능 — 본인 데이터 정리 권한 우선.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const existing = await db.inquiry.findFirst({
      where: { id, userId },
      select: { id: true },
    })
    if (!existing) {
      throw new ApiError('NOT_FOUND', `Inquiry not found: ${id}`, 404)
    }

    await db.inquiry.delete({ where: { id } })
    return { id }
  })
}
