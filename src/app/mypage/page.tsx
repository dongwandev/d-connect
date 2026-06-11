import Link from 'next/link'
import { redirect } from 'next/navigation'
import { type ReactNode } from 'react'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import {
  IconChat,
  IconChevronRight,
  IconCreditCard,
  IconShield,
  IconUser,
} from '@/components/icons'
import { db } from '@/server/db'

/**
 * 마이페이지 허브 (D7 IA 개편).
 *
 * 설정들을 한 페이지에 몰아넣지 않고 계정 요약 + 각 설정 페이지로
 * 이동하는 링크 카드로 구성:
 *   - 프로필·개인정보 수정 → /mypage/profile
 *   - 구독 관리            → /mypage/subscription
 *   - 보안 설정            → /mypage/security
 *   - 내 문의사항          → /inquiries (1:1 문의 게시판)
 */
export const dynamic = 'force-dynamic'

const MENU: Array<{
  href: string
  icon: ReactNode
  iconBg: string
  title: string
  description: string
}> = [
  {
    href: '/mypage/profile',
    icon: <IconUser className="h-5 w-5" />,
    iconBg: 'bg-accent-500/10 text-accent-600',
    title: '프로필 · 개인정보 수정',
    description: '표시명, 실명, 연락처, 소속, 마케팅 수신 동의를 관리합니다.',
  },
  {
    href: '/mypage/subscription',
    icon: <IconCreditCard className="h-5 w-5" />,
    iconBg: 'bg-emerald-100 text-emerald-700',
    title: '구독 관리',
    description: '현재 이용 중인 플랜과 결제 정보를 확인합니다.',
  },
  {
    href: '/mypage/security',
    icon: <IconShield className="h-5 w-5" />,
    iconBg: 'bg-purple-100 text-purple-700',
    title: '보안 설정',
    description: '비밀번호 변경과 간편 로그인 연동을 관리합니다.',
  },
  {
    href: '/inquiries',
    icon: <IconChat className="h-5 w-5" />,
    iconBg: 'bg-amber-100 text-amber-700',
    title: '내 문의사항',
    description: '1:1 문의를 남기고 접수 내역을 확인합니다.',
  },
]

export default async function MyPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, organization: true, createdAt: true },
  })
  if (!user) redirect('/login')

  const initial =
    (user.name ?? user.email ?? '?').trim().slice(0, 1).toUpperCase() || '?'

  return (
    <AppShell
      title="마이페이지"
      description="계정과 서비스 설정을 관리합니다."
    >
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {/* 계정 요약 카드 */}
        <section className="flex items-center gap-4 rounded-xl border border-border bg-surface p-6">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-500/10 text-xl font-bold text-accent-600"
            aria-hidden
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-gray-900">
              {user.name ?? '사용자'}
            </p>
            <p className="truncate text-sm text-gray-500">
              {user.email ?? '—'}
              {user.organization && ` · ${user.organization}`}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              가입일: {user.createdAt.toLocaleDateString('ko-KR')}
            </p>
          </div>
        </section>

        {/* 설정 메뉴 카드 */}
        <section>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="group flex h-full items-start gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                >
                  <span
                    aria-hidden
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.iconBg}`}
                  >
                    {m.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {m.title}
                      </span>
                      <IconChevronRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-500"
                      />
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-600">
                      {m.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 회원탈퇴 — 파괴적 동작이므로 메뉴 카드가 아닌 하단에 차분하게 */}
        <p className="text-center text-sm text-gray-500">
          서비스를 더 이상 이용하지 않으시나요?{' '}
          <Link
            href="/mypage/withdraw"
            className="text-gray-500 underline hover:text-red-600"
          >
            회원탈퇴
          </Link>
        </p>
      </div>
    </AppShell>
  )
}
