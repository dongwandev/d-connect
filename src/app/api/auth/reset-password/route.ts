import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { hashPassword } from '@/server/password'
import { consumeVerificationToken } from '@/server/verification'
import { ResetPasswordSchema } from './schemas'

/** 시연 계정 보호 — prisma/seed.ts의 DEMO_EMAIL과 동일 값 */
const DEMO_EMAIL = 'demo@d-connect.kr'

/**
 * POST /api/auth/reset-password — 비밀번호 재설정 완료 (이메일 링크 토큰).
 *
 * 토큰은 forgot-password가 메일로 보낸 1시간짜리 일회용 reset 토큰.
 * 성공 시 emailVerified도 갱신한다 — 메일 링크를 열었다는 것 자체가
 * 메일함 소유 증명이므로 (#86 가입 인증과 동일한 근거).
 *
 * 응답: { data: { ok: true } }
 * 에러: VALIDATION_ERROR (400 토큰 무효·만료) / UNAUTHORIZED (403 demo)
 *
 * 보안:
 *   - verify 용도 토큰은 여기서 거부된다 (purpose 네임스페이스 분리)
 *   - 운영 단계 과제: 재설정 시 기존 세션 무효화
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = ResetPasswordSchema.parse(await req.json())

    const email = await consumeVerificationToken(body.token, 'reset')
    if (!email) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '재설정 링크가 유효하지 않거나 만료되었습니다. 처음부터 다시 요청해 주세요.',
        400,
      )
    }

    // forgot-password가 demo에는 토큰을 발급하지 않지만, 심층 방어로 한 번 더
    if (email === DEMO_EMAIL) {
      throw new ApiError(
        'UNAUTHORIZED',
        '시연용 demo 계정의 비밀번호는 변경할 수 없습니다.',
        403,
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, emailVerified: true },
    })
    if (!user) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '계정을 찾을 수 없습니다. 처음부터 다시 요청해 주세요.',
        400,
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(body.newPassword),
        emailVerified: user.emailVerified ?? new Date(),
      },
    })
    return { ok: true }
  })
}
