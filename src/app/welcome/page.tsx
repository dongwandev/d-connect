import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { OnboardingForm } from '@/components/OnboardingForm'
import { db } from '@/server/db'

/**
 * 소셜 가입 완료 페이지 (D8).
 *
 * 소셜 첫 로그인으로 자동 생성된 사용자는 acceptedTermsAt이 없다 —
 * AppShell 게이트가 모든 셸 페이지에서 이곳으로 보낸다.
 * 추가 정보 + 약관 동의 제출 → acceptedTermsAt 기록 → 대시보드 진입.
 *
 * 셸(사이드바/상단바) 없이 로그인 페이지와 같은 단독 레이아웃 —
 * 가입을 완료하기 전에는 서비스 화면을 보여주지 않는다.
 */
export const dynamic = 'force-dynamic'

export default async function WelcomePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, acceptedTermsAt: true },
  })
  if (!user) redirect('/login')
  // 이미 가입 완료 → 서비스로
  if (user.acceptedTermsAt) redirect('/dashboard')

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            거의 다 왔어요!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {user.name ? (
              <>
                <strong className="text-gray-700">{user.name}</strong>님,
                환영합니다.
                <br />
              </>
            ) : null}
            서비스 이용을 위해 가입을 완료해 주세요.
          </p>
        </header>

        <OnboardingForm initialDisplayName={user.name} />
      </div>
    </main>
  )
}
