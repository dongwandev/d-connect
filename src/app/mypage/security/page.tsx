import { redirect } from 'next/navigation'
import { auth, enabledProviders, signIn } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'
import { UnlinkProviderButton } from '@/components/UnlinkProviderButton'
import { db } from '@/server/db'

/**
 * 보안 설정 페이지 (마이페이지 허브 분리 — D7 IA).
 *
 * 간편 로그인 연동 (D8 소셜 로그인 정의):
 *   - 로그인 상태에서 signIn(provider) 실행 → Auth.js v5가 현재 사용자에
 *     계정을 연동한다 (JWT 세션에서도 동작 — handle-login이 토큰의 사용자를
 *     해석해 linkAccount 수행)
 *   - 연동 해제는 DELETE /api/auth/accounts/[provider] (마지막 로그인 수단
 *     잠금 방지 가드 포함)
 *   - 비밀번호 변경/설정은 준비 중 placeholder 유지
 */
export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [user, accounts] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    }),
    db.account.findMany({
      where: { userId: session.user.id },
      select: { provider: true },
    }),
  ])

  const providers = enabledProviders()
  const linked = new Set(accounts.map((a) => a.provider))
  const hasPassword = Boolean(user?.password)

  const socialRows = [
    {
      id: 'kakao',
      label: '카카오',
      enabled: providers.kakao,
      buttonClass:
        'rounded-lg bg-[#FEE500] px-3.5 py-2 text-sm font-medium text-[#191919] transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
    },
    {
      id: 'google',
      label: 'Google',
      enabled: providers.google,
      buttonClass:
        'rounded-lg border border-gray-300 bg-surface px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
    },
  ].filter((r) => r.enabled)

  return (
    <AppShell
      title="보안 설정"
      description="비밀번호와 로그인 연동을 관리합니다."
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <nav>
          <BackLink href="/mypage" label="마이페이지" />
        </nav>

        {/* 간편 로그인 연동 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">
            간편 로그인 연동
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            소셜 계정을 연동하면 다음부터 클릭 한 번으로 로그인할 수 있어요.
          </p>

          <ul className="mt-3 divide-y divide-border">
            {socialRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {row.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {linked.has(row.id) ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <span aria-hidden>✓</span> 연동됨
                      </span>
                    ) : (
                      '미연동'
                    )}
                  </p>
                </div>

                {linked.has(row.id) ? (
                  <UnlinkProviderButton provider={row.id} />
                ) : (
                  <form
                    action={async () => {
                      'use server'
                      await signIn(row.id, {
                        redirectTo: '/mypage/security',
                      })
                    }}
                  >
                    <button type="submit" className={row.buttonClass}>
                      {row.label} 연동하기
                    </button>
                  </form>
                )}
              </li>
            ))}
            {socialRows.length === 0 && (
              <li className="py-3 text-sm text-gray-500">
                사용 가능한 소셜 로그인이 없습니다 (서버 환경변수 미설정).
              </li>
            )}
          </ul>
        </section>

        {/* 로그인 보안 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">로그인 보안</h2>
          <ul className="mt-3 divide-y divide-border">
            <li className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  이메일 · 비밀번호
                </p>
                <p className="text-xs text-gray-500">
                  {hasPassword
                    ? '사용 중 — 이메일과 비밀번호로 로그인할 수 있어요.'
                    : '미설정 — 소셜 간편 로그인 전용 계정입니다.'}
                </p>
              </div>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-gray-400"
                title={
                  hasPassword
                    ? '비밀번호 변경 기능은 준비 중입니다'
                    : '비밀번호 설정 기능은 준비 중입니다'
                }
              >
                {hasPassword ? '변경 (준비 중)' : '설정 (준비 중)'}
              </button>
            </li>
          </ul>
        </section>

        {/* 보안 안내 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">보안 안내</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>
                비밀번호는 bcrypt 해시로만 저장되며 평문으로 보관하지
                않습니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>
                마지막 남은 로그인 수단은 해제할 수 없어요 — 계정 접근 불능을
                방지합니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>
                등록한 기업·분석·콘텐츠는 본인 계정에서만 조회할 수 있습니다.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
