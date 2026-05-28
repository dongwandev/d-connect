import 'server-only'
import { auth } from '@/auth'
import { ApiError } from './errors'

/**
 * Route Handler용 인증 가드.
 *
 * - 세션 없으면 ApiError(UNAUTHORIZED, 401) throw
 * - 있으면 user.id (string) 반환 — 비즈니스 로직에서 그대로 사용
 *
 * 사용 예:
 *   const userId = await requireUserId()
 *   const company = await db.company.create({ data: { ...body, userId }, ... })
 */
export async function requireUserId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new ApiError(
      'UNAUTHORIZED',
      '로그인이 필요합니다.',
      401,
    )
  }
  return session.user.id
}
