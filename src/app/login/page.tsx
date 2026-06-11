import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { auth, enabledProviders, signIn } from '@/auth'
import { EmailLoginForm } from '@/components/EmailLoginForm'

/**
 * 로그인 페이지.
 *
 * 1순위: 이메일/패스워드 (Credentials)
 * 2순위: Kakao / Google (간편 로그인 — env 미설정 시 자동 숨김)
 * dev: 데모 계정 자동 로그인 (production에서는 자동 숨김)
 */
export const dynamic = 'force-dynamic'

/**
 * NextAuth v5가 로그인(signIn) 단계 실패 시 /login?error=<code>로 되돌려보낸다.
 * 코드별 한글 안내 — 미정의 코드는 generic 메시지.
 *
 * 키는 @auth/core v5의 실제 client-safe 에러 타입 기준
 * (v4 코드명 OAuthSignin/OAuthCallback은 v5에서 사용되지 않음):
 *   - OAuthAccountNotLinked — 같은 이메일의 기존 계정 존재
 *   - OAuthCallbackError    — provider가 콜백에 에러 반환
 *                              (예: 구글 테스트 사용자 미등록 access_denied)
 *   - Configuration         — 서버 설정 오류 (client-safe 마스킹 포함)
 */
const AUTH_ERROR_MESSAGE: Record<string, string> = {
  OAuthAccountNotLinked:
    '이 소셜 계정 또는 이메일은 이미 다른 계정과 연결되어 있습니다. 처음 가입했던 방법으로 로그인해 주세요.',
  OAuthCallbackError:
    '소셜 로그인 처리 중 오류가 발생했습니다. 로그인 동의를 취소했거나 접근 권한이 없는 계정일 수 있어요. 잠시 후 다시 시도해 주세요.',
  Configuration:
    '로그인 설정에 문제가 있습니다. 관리자에게 문의해 주세요.',
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const { error } = await searchParams

  if (session?.user) {
    // 로그인 상태에서 OAuth 에러와 함께 돌아온 경우 = 보안 설정의 소셜
    // 연동 시도 실패 (예: 이미 다른 계정에 연동된 소셜 계정).
    // 여기서 대시보드로 그냥 보내면 안내가 증발하므로 보안 설정에 전달.
    if (error) redirect(`/mypage/security?error=${encodeURIComponent(error)}`)
    redirect('/dashboard')
  }

  const providers = enabledProviders()
  const errorMessage = error
    ? (AUTH_ERROR_MESSAGE[error] ??
      '로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    : null

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">D-Connect</h1>
          <p className="mt-1 text-sm text-gray-500">
            로그인하고 우리 기업의 SDGs 콘텐츠를 만들어 보세요.
          </p>
        </header>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
          >
            {errorMessage}
          </p>
        )}

        {/* 이메일/패스워드 — searchParams 사용을 위해 Suspense로 감싼다 */}
        <Suspense fallback={<div className="h-48" />}>
          <EmailLoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:underline"
          >
            회원가입
          </Link>
        </p>

        {(providers.kakao || providers.google) && (
          <>
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">또는 간편 로그인</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <div className="space-y-2">
              {providers.kakao && (
                <form
                  action={async () => {
                    'use server'
                    await signIn('kakao', { redirectTo: '/dashboard' })
                  }}
                >
                  <button
                    type="submit"
                    className="w-full rounded bg-[#FEE500] px-4 py-3 font-medium text-[#191919] hover:brightness-95"
                  >
                    카카오로 시작하기
                  </button>
                </form>
              )}

              {providers.google && (
                <form
                  action={async () => {
                    'use server'
                    await signIn('google', { redirectTo: '/dashboard' })
                  }}
                >
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Google로 시작하기
                  </button>
                </form>
              )}
            </div>
          </>
        )}

        {providers.demo && (
          <>
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-500">DEV ONLY</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <form
              action={async () => {
                'use server'
                await signIn('demo', { redirectTo: '/dashboard' })
              }}
            >
              <button
                type="submit"
                className="w-full rounded border border-dashed border-purple-300 bg-purple-50 px-4 py-3 text-sm text-purple-800 hover:bg-purple-100"
              >
                데모 계정으로 로그인 (demo@d-connect.kr)
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
