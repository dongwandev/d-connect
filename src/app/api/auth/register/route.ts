import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { hashPassword } from '@/server/password'
import { sendVerificationEmail } from '@/server/verification'
import { SignupSchema } from './schemas'

/**
 * POST /api/auth/register — 이메일/패스워드 회원가입.
 *
 * 응답: { data: { id, email } }
 * 에러: VALIDATION_ERROR (400) / VALIDATION_ERROR (409 이메일 중복)
 *
 * 보안:
 *   - 비밀번호는 bcrypt 해시로만 저장 (평문 절대 X)
 *
 * 이메일 인증 (ADR-0004 후속 — #86):
 *   - 가입 시 인증 메일 발송, 링크 클릭 시 emailVerified 갱신 (/verify-email).
 *   - 미인증이어도 로그인·서비스 이용 가능 — 셸 배너로만 안내 (시연 안전 우선).
 *   - SMTP 미설정/발송 실패 시 mock fallback — 배너의 재발송이 링크를 직접 보여준다.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = SignupSchema.parse(await req.json())

    const existing = await db.user.findUnique({
      where: { email: body.email },
      select: { id: true },
    })
    if (existing) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '이미 가입된 이메일입니다.',
        409,
      )
    }

    // 빈 문자열은 NULL로 정규화 (선택 항목)
    const display = body.displayName?.trim() || null
    const phone = body.phone?.trim() || null
    const organization = body.organization?.trim() || null

    const passwordHash = await hashPassword(body.password)
    const user = await db.user.create({
      data: {
        email: body.email,
        password: passwordHash,
        realName: body.realName,
        // 표시명을 입력하지 않으면 실명을 그대로 사용 (UI·콘텐츠에 노출)
        name: display ?? body.realName,
        phone,
        organization,
        acceptedTermsAt: new Date(),
        marketingOptIn: body.marketingOptIn ?? false,
      },
      select: { id: true, email: true },
    })

    // 인증 메일 발송 — 실패해도 가입은 성공 (내부에서 mock fallback 처리)
    if (user.email) await sendVerificationEmail(user.email)

    return user
  })
}
