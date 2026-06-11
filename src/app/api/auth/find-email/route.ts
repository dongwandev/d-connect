import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/server/db'
import { ApiError, withErrorHandler } from '@/server/errors'
import { maskEmail } from '@/lib/mask-email'
import { FindEmailSchema, type FindEmailMatch } from './schemas'

/**
 * POST /api/auth/find-email — 이메일(아이디) 찾기.
 *
 * 실명 + 연락처가 모두 일치하는 계정의 이메일을 마스킹해 반환한다.
 * 가입 방법(이메일 비밀번호 / 소셜)도 함께 알려 로그인 동선을 안내.
 *
 * 응답: { data: { matches: FindEmailMatch[] } }
 * 에러: NOT_FOUND (404 — 일치 계정 없음)
 *
 * 보안:
 *   - 이메일 전체는 절대 노출하지 않는다 (마스킹 필수)
 *   - 운영 단계 과제: rate limit (무차별 조회 방어)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withErrorHandler(async () => {
    const body = FindEmailSchema.parse(await req.json())

    const users = await db.user.findMany({
      where: { realName: body.realName.trim(), phone: body.phone },
      select: {
        email: true,
        password: true,
        accounts: { select: { provider: true } },
      },
    })

    const matches: FindEmailMatch[] = users
      .filter((u): u is typeof u & { email: string } => u.email !== null)
      .map((u) => ({
        maskedEmail: maskEmail(u.email),
        hasPassword: u.password !== null,
        providers: u.accounts.map((a) => a.provider),
      }))

    if (matches.length === 0) {
      throw new ApiError(
        'NOT_FOUND',
        '일치하는 계정을 찾을 수 없습니다. 가입 시 연락처를 등록하지 않았거나 입력 정보가 다를 수 있어요.',
        404,
      )
    }
    return { matches }
  })
}
