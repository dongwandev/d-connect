import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { sendVerificationEmail } from '@/server/verification'
import { OnboardingSchema } from './schemas'

/**
 * POST /api/auth/onboarding — 소셜 가입 완료 (D8).
 *
 * 소셜 첫 로그인으로 자동 생성된 사용자가 추가 정보(실명·연락처·소속)와
 * 약관 동의를 제출하면 acceptedTermsAt을 기록한다.
 * AppShell이 acceptedTermsAt IS NULL 사용자를 /welcome으로 보내는
 * 게이트와 한 쌍 — 이 호출이 성공해야 서비스 진입 가능.
 *
 * 멱등: 이미 완료한 사용자가 다시 호출해도 정보만 갱신된다.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const body = OnboardingSchema.parse(await req.json())

    const me = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    // 이메일 처리 (D8): provider가 이메일을 안 준 계정(카카오)은 직접 입력
    // 필수. 이미 이메일이 있는 계정(구글)은 입력값을 무시 — provider 제공
    // 이메일을 사용자가 임의 변경하지 못하게 한다.
    let email: string | undefined
    if (!me?.email) {
      const input = body.email?.trim()
      if (!input) {
        throw new ApiError('VALIDATION_ERROR', '이메일을 입력해주세요.', 400)
      }
      const taken = await db.user.findUnique({
        where: { email: input },
        select: { id: true },
      })
      if (taken && taken.id !== userId) {
        throw new ApiError('VALIDATION_ERROR', '이미 가입된 이메일입니다.', 409)
      }
      email = input
    }

    const display = body.displayName?.trim() || null
    const phone = body.phone?.trim() || null
    const organization = body.organization?.trim() || null

    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(email ? { email } : {}),
        realName: body.realName,
        // 표시명 미입력 시 실명 사용 (이메일 가입과 동일 정책).
        // 소셜 프로필 닉네임이 이미 name에 있을 수 있으나, 온보딩 입력을
        // 명시적 의사로 보고 우선한다.
        name: display ?? body.realName,
        phone,
        organization,
        acceptedTermsAt: new Date(),
        marketingOptIn: body.marketingOptIn ?? false,
      },
      select: { id: true, name: true },
    })

    // 직접 입력한 이메일(카카오)은 소유 확인이 안 됐으므로 인증 메일 발송 (#86).
    // provider 제공 이메일(구글)도 emailVerified가 비어 있으면 셸 배너의
    // 재발송으로 인증 가능 — 여기서는 새로 입력된 이메일만 발송한다.
    if (email) await sendVerificationEmail(email)

    return user
  })
}
