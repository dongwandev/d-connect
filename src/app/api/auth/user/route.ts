import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { requireUserId } from '@/server/auth-guard'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { verifyPassword } from '@/server/password'
import {
  UpdateUserSchema,
  WithdrawSchema,
  WITHDRAW_CONFIRM_PHRASE,
} from './schemas'

/** 시연 계정 보호 — prisma/seed.ts의 DEMO_EMAIL과 동일 값 */
const DEMO_EMAIL = 'demo@d-connect.kr'

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

/**
 * DELETE /api/auth/user — 회원탈퇴 (#90).
 *
 * User 삭제 한 번으로 스키마 cascade가 Account·Session·Company →
 * SdgAnalysis → SdgMatch·GeneratedContent까지 일괄 정리한다.
 *
 * 본인 확인:
 *   - 비밀번호 계정 → 비밀번호 재입력
 *   - 소셜 전용 계정 → 확인 문구('회원탈퇴') 입력
 *
 * 응답: { data: { ok: true } } — 클라이언트가 signOut 후 /login 이동.
 * 에러: UNAUTHORIZED (403 demo) / VALIDATION_ERROR (400 확인 실패)
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const userId = await requireUserId()
    const body = WithdrawSchema.parse(await req.json())

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    })
    if (!user) {
      throw new ApiError('NOT_FOUND', '계정을 찾을 수 없습니다.', 404)
    }

    // README에 공개된 시연 계정 — 시연 데이터가 통째로 사라지므로 차단
    if (user.email === DEMO_EMAIL) {
      throw new ApiError(
        'UNAUTHORIZED',
        '시연용 demo 계정은 탈퇴할 수 없습니다.',
        403,
      )
    }

    if (user.password) {
      if (
        !body.password ||
        !(await verifyPassword(body.password, user.password))
      ) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '비밀번호가 올바르지 않습니다.',
          400,
        )
      }
    } else if (body.confirmPhrase !== WITHDRAW_CONFIRM_PHRASE) {
      throw new ApiError(
        'VALIDATION_ERROR',
        `확인 문구를 정확히 입력해 주세요. ("${WITHDRAW_CONFIRM_PHRASE}")`,
        400,
      )
    }

    // VerificationToken은 User와 FK가 없어(이메일 키) cascade되지 않는다 —
    // 같은 이메일 재가입 시 이전 계정의 토큰이 남지 않도록 함께 정리
    await db.$transaction([
      ...(user.email
        ? [
            db.verificationToken.deleteMany({
              where: {
                identifier: {
                  in: [`verify:${user.email}`, `reset:${user.email}`],
                },
              },
            }),
          ]
        : []),
      db.user.delete({ where: { id: user.id } }),
    ])
    return { ok: true }
  })
}
