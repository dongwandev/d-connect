import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'

/**
 * 보안 설정 페이지 (마이페이지 허브 분리 — D7 IA).
 *
 * 프로토타입 단계 — 비밀번호 변경·간편 로그인 연동 관리는 준비 중 placeholder.
 */
export const dynamic = 'force-dynamic'

export default function SecurityPage() {
  return (
    <AppShell
      title="보안 설정"
      description="비밀번호와 로그인 연동을 관리합니다."
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <nav>
          <BackLink href="/mypage" label="마이페이지" />
        </nav>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">로그인 보안</h2>
          <ul className="mt-3 divide-y divide-border">
            <li className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  비밀번호 변경
                </p>
                <p className="text-xs text-gray-500">
                  이메일 가입 계정의 비밀번호를 변경합니다.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-gray-400"
                title="비밀번호 변경 기능은 준비 중입니다"
              >
                변경 (준비 중)
              </button>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  간편 로그인 연동
                </p>
                <p className="text-xs text-gray-500">
                  카카오·구글 계정 연동 상태를 관리합니다.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-gray-400"
                title="연동 관리 기능은 준비 중입니다"
              >
                관리 (준비 중)
              </button>
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">보안 안내</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>비밀번호는 bcrypt 해시로만 저장되며 평문으로 보관하지 않습니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>로그인 세션은 30일 후 자동 만료됩니다.</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>🔒</span>
              <span>등록한 기업·분석·콘텐츠는 본인 계정에서만 조회할 수 있습니다.</span>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
