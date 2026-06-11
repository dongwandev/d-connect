import 'server-only'
import { type NextRequest, type NextResponse } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { withErrorHandler } from '@/server/errors'
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

    const display = body.displayName?.trim() || null
    const phone = body.phone?.trim() || null
    const organization = body.organization?.trim() || null

    const user = await db.user.update({
      where: { id: userId },
      data: {
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
    return user
  })
}
