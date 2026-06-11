import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { hashPassword } from '@/server/password'
import { ResetPasswordSchema } from './schemas'

/** 시연 계정 보호 — prisma/seed.ts의 DEMO_EMAIL과 동일 값 */
const DEMO_EMAIL = 'demo@d-connect.kr'

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  google: '구글',
}

/**
 * POST /api/auth/reset-password — 비밀번호 재설정 (MVP).
 *
 * 이메일 + 실명 일치로 본인 확인 후 즉시 새 비밀번호를 저장한다.
 * 운영 단계에서는 이메일 인증 링크(토큰) 방식으로 교체 예정 — 가입의
 * emailVerified 자동 통과(MVP)와 같은 정책 단계.
 *
 * 응답: { data: { ok: true } }
 * 에러: UNAUTHORIZED (403 demo 계정) / NOT_FOUND (404) / VALIDATION_ERROR (400 소셜 전용)
 *
 * 보안:
 *   - 이메일/실명 중 무엇이 틀렸는지 노출하지 않는다 (동일 메시지)
 *   - 운영 단계 과제: rate limit + 재설정 시 기존 세션 무효화
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = ResetPasswordSchema.parse(await req.json())

    // README에 공개된 시연 계정 — 누구나 정보를 알고 있으므로 변경 차단
    if (body.email === DEMO_EMAIL) {
      throw new ApiError(
        'UNAUTHORIZED',
        '시연용 demo 계정의 비밀번호는 변경할 수 없습니다.',
        403,
      )
    }

    const user = await db.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        password: true,
        realName: true,
        accounts: { select: { provider: true } },
      },
    })

    if (!user || !user.realName || user.realName !== body.realName.trim()) {
      throw new ApiError(
        'NOT_FOUND',
        '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.',
        404,
      )
    }

    if (!user.password) {
      const names = [
        ...new Set(
          user.accounts.map((a) => PROVIDER_LABEL[a.provider] ?? a.provider),
        ),
      ]
      throw new ApiError(
        'VALIDATION_ERROR',
        `비밀번호가 설정되지 않은 간편 로그인 계정입니다. ${
          names.length > 0 ? `${names.join('·')} 로그인을` : '간편 로그인을'
        } 이용해 주세요.`,
        400,
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(body.newPassword) },
    })
    return { ok: true }
  })
}
