import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'

interface Params {
  params: Promise<{ provider: string }>
}

const UNLINKABLE_PROVIDERS = ['kakao', 'google'] as const

/**
 * DELETE /api/auth/accounts/[provider] — 소셜 계정 연동 해제.
 *
 * 마이페이지 > 보안 설정의 간편 로그인 연동 관리 (D8 소셜 로그인 정의).
 *
 * 잠금 방지 가드: 비밀번호도 없고 다른 소셜 연동도 없으면
 * 마지막 로그인 수단이므로 해제를 거부한다 (계정 접근 불능 방지).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: Params,
): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const { provider } = await params

    if (!UNLINKABLE_PROVIDERS.includes(provider as never)) {
      throw new ApiError(
        'VALIDATION_ERROR',
        `해제할 수 없는 provider입니다: ${provider}`,
        400,
      )
    }

    const [user, accounts] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { password: true },
      }),
      db.account.findMany({
        where: { userId },
        select: { provider: true },
      }),
    ])

    const hasTarget = accounts.some((a) => a.provider === provider)
    if (!hasTarget) {
      throw new ApiError(
        'NOT_FOUND',
        `연동된 ${provider} 계정이 없습니다.`,
        404,
      )
    }

    const remainingMethods =
      (user?.password ? 1 : 0) +
      accounts.filter((a) => a.provider !== provider).length
    if (remainingMethods === 0) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '마지막 남은 로그인 수단은 해제할 수 없습니다. 비밀번호를 설정하거나 다른 소셜 계정을 먼저 연동해 주세요.',
        400,
      )
    }

    await db.account.deleteMany({ where: { userId, provider } })
    return { provider }
  })
}
