import Link from 'next/link'
import { peekVerificationToken } from '@/server/verification'
import { AuthShell } from '@/components/AuthShell'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'

/**
 * 비밀번호 재설정 페이지 — 재설정 메일의 링크 도착지 (#88).
 *
 * 토큰이 유효할 때만 새 비밀번호 폼을 보여준다 (peek — 소비는 제출 시).
 * 로그인 여부와 무관하게 동작한다 (메일은 다른 기기에서 열 수 있음).
 */
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams
  const valid = token ? await peekVerificationToken(token, 'reset') : false

  return (
    <AuthShell>
      <div className="w-full max-w-md space-y-6 rounded-3xl border-2 border-green-100 bg-white p-8 shadow-sm">
        {valid && token ? (
          <>
            <header className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                새 비밀번호 설정
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                사용할 새 비밀번호를 입력해 주세요.
              </p>
            </header>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <div className="space-y-5 text-center">
            <p className="text-4xl">⚠️</p>
            <h1 className="text-xl font-bold text-gray-900">
              재설정 링크가 유효하지 않습니다
            </h1>
            <p className="text-sm leading-relaxed text-gray-500">
              이미 사용했거나, 링크가 만료(1시간)되었거나, 새 재설정 메일이
              발송되어 이전 링크가 무효화되었을 수 있어요.
            </p>
            <Link
              href="/find-account"
              className="inline-block rounded-full bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700"
            >
              재설정 다시 요청하기
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
