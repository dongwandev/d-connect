import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { withErrorHandler } from '@/server/errors'
import { UpdateUserSchema } from './schemas'

/**
 * PATCH /api/auth/user — 본인 프로필 수정 (D6).
 *
 * 빈 문자열은 NULL로 정규화. email/password 변경은 별도 흐름.
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const body = UpdateUserSchema.parse(await req.json())

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        name: body.name?.trim() || undefined,
        realName: body.realName?.trim() || undefined,
        phone:
          body.phone === undefined
            ? undefined
            : body.phone.trim() === ''
              ? null
              : body.phone.trim(),
        organization:
          body.organization === undefined
            ? undefined
            : body.organization.trim() === ''
              ? null
              : body.organization.trim(),
        marketingOptIn: body.marketingOptIn,
      },
      select: {
        id: true,
        email: true,
        name: true,
        realName: true,
        phone: true,
        organization: true,
        marketingOptIn: true,
      },
    })
    return updated
  })
}

/**
 * GET /api/auth/user — 본인 프로필 (계정 정보 페이지 초기값).
 */
export async function GET(): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        realName: true,
        phone: true,
        organization: true,
        marketingOptIn: true,
        createdAt: true,
      },
    })
    return user
  })
}
