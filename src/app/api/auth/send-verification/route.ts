import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { msSinceLastToken, sendVerificationEmail } from '@/server/verification'

/** 재발송 최소 간격 — 더블 클릭·연타로 인한 메일 폭주 방지 */
const RESEND_COOLDOWN_MS = 60_000

/**
 * POST /api/auth/send-verification — 인증 메일 재발송 (로그인 필요).
 *
 * 응답: { data: { mocked, verifyUrl? } } — SMTP 미설정/실패 시 링크 직접 반환 (MVP fallback)
 * 에러: VALIDATION_ERROR (400 이미 인증됨 / 429 쿨다운)
 */
export async function POST(_req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const me = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, emailVerified: true },
    })

    if (!me?.email) {
      throw new ApiError('VALIDATION_ERROR', '계정에 이메일이 없습니다.', 400)
    }
    if (me.emailVerified) {
      throw new ApiError('VALIDATION_ERROR', '이미 인증된 이메일입니다.', 400)
    }
    if ((await msSinceLastToken(me.email, 'verify')) < RESEND_COOLDOWN_MS) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잠시 후 다시 시도해 주세요. (재발송은 1분에 한 번)',
        429,
      )
    }

    return sendVerificationEmail(me.email)
  })
}
