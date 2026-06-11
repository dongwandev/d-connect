import Link from 'next/link'
import { auth } from '@/auth'
import { db } from '@/server/db'
import { consumeVerificationToken } from '@/server/verification'

/**
 * 이메일 인증 완료 페이지 — 인증 메일의 링크 도착지.
 *
 * 토큰은 일회용 — 이미 사용·만료된 링크는 실패 안내 + 재발송 동선 제공.
 * 로그인 여부와 무관하게 동작한다 (메일은 다른 기기에서 열 수 있음).
 */
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams
  const session = await auth()

  let verified = false
  if (token) {
    const email = await consumeVerificationToken(token)
    if (email) {
      const updated = await db.user.updateMany({
        where: { email },
        data: { emailVerified: new Date() },
      })
      verified = updated.count > 0
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        {verified ? (
          <>
            <p className="text-4xl">✅</p>
            <h1 className="text-xl font-bold text-gray-900">
              이메일 인증이 완료되었습니다
            </h1>
            <p className="text-sm text-gray-500">
              이제 D-Connect의 모든 기능을 이용할 수 있어요.
            </p>
            <Link
              href={session?.user ? '/dashboard' : '/login'}
              className="inline-block rounded bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              {session?.user ? '대시보드로 가기' : '로그인하러 가기'}
            </Link>
          </>
        ) : (
          <>
            <p className="text-4xl">⚠️</p>
            <h1 className="text-xl font-bold text-gray-900">
              인증 링크가 유효하지 않습니다
            </h1>
            <p className="text-sm leading-relaxed text-gray-500">
              이미 인증을 완료했거나, 링크가 만료(24시간)되었거나,
              새 인증 메일이 발송되어 이전 링크가 무효화되었을 수 있어요.
              <br />
              로그인 후 상단 배너에서 인증 메일을 다시 받을 수 있습니다.
            </p>
            <Link
              href={session?.user ? '/dashboard' : '/login'}
              className="inline-block rounded bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              {session?.user ? '대시보드로 가기' : '로그인하러 가기'}
            </Link>
          </>
        )}
      </div>
    </main>
  )
}
