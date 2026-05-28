import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { parseJsonArray, serializeJsonArray } from '@/lib/json-array'
import { UpdateContentSchema } from './schemas'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/contents/[id] — 콘텐츠 삭제.
 * D6 사용자 요청. 본인 소유 검증 후 hard delete.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params

    const existing = await db.generatedContent.findFirst({
      where: { id, analysis: { company: { userId } } },
      select: { id: true },
    })
    if (!existing) {
      throw new ApiError('NOT_FOUND', `Content not found: ${id}`, 404)
    }

    await db.generatedContent.delete({ where: { id } })
    return { id }
  })
}

/**
 * PATCH /api/contents/[id] — 콘텐츠 초안 수정.
 * 사양: docs/API.md §5.3, ADR-0005
 *
 * editedByUser는 사용자가 직접 수정한 적이 있는지 플래그(true로 설정).
 */
export async function PATCH(
  req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { id } = await params
    const body = UpdateContentSchema.parse(await req.json())

    // 본인 소유 검증: GeneratedContent → SdgAnalysis → Company.userId
    const existing = await db.generatedContent.findFirst({
      where: { id, analysis: { company: { userId } } },
    })
    if (!existing) {
      throw new ApiError('NOT_FOUND', `Content not found: ${id}`, 404)
    }

    const updated = await db.generatedContent.update({
      where: { id },
      data: {
        body: body.body ?? undefined,
        hashtags:
          body.hashtags !== undefined
            ? serializeJsonArray(body.hashtags)
            : undefined,
        // null은 명시적으로 비우는 의미. undefined는 변경 없음.
        imagePrompt:
          body.imagePrompt !== undefined ? body.imagePrompt : undefined,
        editedByUser: true,
      },
    })

    return {
      id: updated.id,
      analysisId: updated.analysisId,
      type: updated.type,
      body: updated.body,
      hashtags: parseJsonArray<string>(updated.hashtags),
      imagePrompt: updated.imagePrompt,
      editedByUser: updated.editedByUser,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    }
  })
}
