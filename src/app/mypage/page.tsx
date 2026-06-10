import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AccountForm } from '@/components/AccountForm'
import { AppShell } from '@/components/AppShell'
import { db } from '@/server/db'

/**
 * 마이페이지 (D7 IA — 사이드바 '마이페이지').
 *
 * 대시보드(데이터 현황)와 구분되는 개인 설정 허브:
 *   - 프로필·개인정보 수정 (기존 AccountForm 재사용)
 *   - 구독 관리 / 보안 설정 / 내 문의사항 — 프로토타입 단계 placeholder
 *
 * 기존 /account 경로는 이 페이지로 redirect.
 */
export const dynamic = 'force-dynamic'

export default async function MyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      name: true,
      realName: true,
      phone: true,
      organization: true,
      marketingOptIn: true,
      createdAt: true,
    },
  })
  if (!user) redirect('/login')

  return (
    <AppShell
      title="마이페이지"
      description="프로필·구독·보안 설정을 관리합니다."
    >
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {/* 프로필 · 개인정보 수정 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">
            프로필 · 개인정보 수정
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            표시명·실명·연락처·소속 정보를 수정할 수 있습니다.
          </p>

          <div className="mt-4 space-y-2 border-b border-border pb-4">
            <p className="text-xs font-medium text-gray-500">이메일</p>
            <p className="text-sm text-gray-900">{user.email ?? '—'}</p>
            <p className="text-xs text-gray-500">
              가입일: {user.createdAt.toLocaleString('ko-KR')}
            </p>
          </div>

          <div className="mt-4">
            <AccountForm
              initial={{
                name: user.name,
                realName: user.realName,
                phone: user.phone,
                organization: user.organization,
                marketingOptIn: user.marketingOptIn,
              }}
            />
          </div>
        </section>

        {/* 구독 관리 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">구독 관리</h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-muted p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                무료 플랜{' '}
                <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                  프로토타입
                </span>
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                SDGs 분석·콘텐츠 생성을 제한 없이 사용할 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-gray-400"
              title="유료 구독은 준비 중입니다"
            >
              플랜 변경 (준비 중)
            </button>
          </div>
        </section>

        {/* 보안 설정 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">보안 설정</h2>
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

        {/* 내 문의사항 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900">내 문의사항</h2>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-gray-400"
              title="문의하기 기능은 준비 중입니다"
            >
              문의하기 (준비 중)
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-surface-muted p-6 text-center">
            <p className="text-sm text-gray-600">접수된 문의가 없습니다.</p>
            <p className="mt-1 text-xs text-gray-500">
              문의 기능이 열리면 이곳에서 답변 현황을 확인할 수 있어요.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
