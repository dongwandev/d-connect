import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import {
  msSinceLastToken,
  sendPasswordResetEmail,
  sendSocialOnlyNoticeEmail,
} from '@/server/verification'
import { ForgotPasswordSchema, type ForgotPasswordResult } from './schemas'

/** 시연 계정 보호 — prisma/seed.ts의 DEMO_EMAIL과 동일 값 */
const DEMO_EMAIL = 'demo@d-connect.kr'

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  google: '구글',
}

/** 재요청 최소 간격 — 메일 폭주(타인 메일함 공격 포함) 방지 */
const RESEND_COOLDOWN_MS = 60_000

/**
 * POST /api/auth/forgot-password — 비밀번호 재설정 링크 요청.
 *
 * 계정 존재 여부를 노출하지 않는다 — 가입 안 된 이메일이어도 동일하게
 * { sent: true }로 응답 (enumeration 방어). 실제 분기는 메일로 전달:
 *   - 비밀번호 계정 → 재설정 링크 메일 (1시간 유효)
 *   - 간편 로그인 전용 계정 → 간편 로그인 안내 메일
 *   - 미가입 / demo 계정 → 발송 없음
 *
 * SMTP 미설정 시(mock) 링크·안내를 응답에 직접 담아 화면에 표시 (dev 전용).
 * 운영 단계 과제: IP 기반 rate limit (쿨다운 429가 계정 존재를 약하게 노출).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = ForgotPasswordSchema.parse(await req.json())
    const ok: ForgotPasswordResult = { sent: true }

    // README에 공개된 시연 계정 — 재설정 메일 자체를 발급하지 않는다
    if (body.email === DEMO_EMAIL) return ok

    const user = await db.user.findUnique({
      where: { email: body.email },
      select: {
        password: true,
        accounts: { select: { provider: true } },
      },
    })
    if (!user) return ok

    if ((await msSinceLastToken(body.email, 'reset')) < RESEND_COOLDOWN_MS) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '잠시 후 다시 시도해 주세요. (재발송은 1분에 한 번)',
        429,
      )
    }

    if (!user.password) {
      const labels = [
        ...new Set(
          user.accounts.map((a) => PROVIDER_LABEL[a.provider] ?? a.provider),
        ),
      ]
      const r = await sendSocialOnlyNoticeEmail(body.email, labels)
      return r.mocked ? { ...ok, mocked: true, socialOnly: labels } : ok
    }

    const r = await sendPasswordResetEmail(body.email)
    return r.mocked ? { ...ok, mocked: true, verifyUrl: r.verifyUrl } : ok
  })
}
