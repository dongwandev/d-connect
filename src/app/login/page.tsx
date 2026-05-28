import { redirect } from 'next/navigation'
import { auth, enabledProviders, signIn } from '@/auth'

/**
 * 로그인 페이지.
 *
 * - 이미 로그인된 경우 /dashboard로 즉시 리다이렉트.
 * - 활성화된 provider만 버튼으로 노출 (env 미설정 → 자동 숨김).
 * - Magic Link는 더미 버튼 (1-B2 결정에 따라 후속 PR에서 SMTP 연동).
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
            로그인하고 우리 기업의 SDGs 콘텐츠를 만들어보세요.
          </p>
        </header>

        <div className="space-y-3">
          {providers.kakao ? (
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
          ) : (
            <DisabledButton label="카카오로 시작하기" reason="키 미설정" />
          )}

          {providers.google ? (
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
          ) : (
            <DisabledButton label="Google로 시작하기" reason="키 미설정" />
          )}

          <DisabledButton
            label="이메일 매직 링크로 시작하기"
            reason="준비 중 (SMTP 호스팅 결정 후 활성화)"
          />
        </div>

        {!providers.kakao && !providers.google && (
          <p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-800">
            ⚠️ Provider 환경 변수가 설정되지 않았습니다. <br />
            <code>.env.example</code>의 <code>KAKAO_*</code> 또는{' '}
            <code>GOOGLE_*</code>를 채운 뒤 서버를 재시작하세요.
          </p>
        )}

        <p className="text-center text-xs text-gray-400">
          본인 등록 기업·콘텐츠만 조회·수정할 수 있습니다.
        </p>
      </div>
    </main>
  )
}

function DisabledButton({ label, reason }: { label: string; reason: string }) {
  return (
    <button
      type="button"
      disabled
      title={reason}
      className="w-full cursor-not-allowed rounded border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-gray-400"
    >
      {label}{' '}
      <span className="ml-1 text-xs text-gray-400">({reason})</span>
    </button>
  )
}
