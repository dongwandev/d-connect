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

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  const providers = enabledProviders()

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">D-Connect</h1>
          <p className="mt-1 text-sm text-gray-500">
            로그인하고 우리 기업의 SDGs 콘텐츠를 만들어 보세요.
          </p>
        </header>

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
