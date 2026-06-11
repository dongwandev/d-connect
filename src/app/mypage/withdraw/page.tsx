import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'
import { WithdrawForm } from '@/components/WithdrawForm'
import { db } from '@/server/db'

/** prisma/seed.ts의 DEMO_EMAIL과 동일 값 — 시연 계정은 탈퇴 UI 자체를 막는다 */
const DEMO_EMAIL = 'demo@d-connect.kr'

/**
 * 회원탈퇴 페이지 (#90).
 *
 * 삭제될 데이터를 수치로 보여주고 본인 확인(비밀번호 또는 확인 문구) 후
 * 탈퇴를 진행한다. 복구 불가 — 경고 톤을 명확히.
 */
export const dynamic = 'force-dynamic'

export default async function WithdrawPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, password: true },
  })
  if (!user) redirect('/login')

  const userId = session.user.id
  const [companies, analyses, contents] = await Promise.all([
    db.company.count({ where: { userId } }),
    db.sdgAnalysis.count({ where: { company: { userId } } }),
    db.generatedContent.count({ where: { analysis: { company: { userId } } } }),
  ])

  return (
    <AppShell
      title="회원탈퇴"
      description="계정과 모든 데이터를 영구적으로 삭제합니다."
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <nav>
          <BackLink href="/mypage" label="마이페이지" />
        </nav>

        <section className="space-y-5 rounded-xl border border-red-200 bg-surface p-6">
          <header className="space-y-1">
            <h2 className="text-lg font-bold text-gray-900">
              정말 탈퇴하시겠어요?
            </h2>
            <p className="text-sm text-gray-600">
              탈퇴하면 아래 데이터가 모두 삭제되며{' '}
              <strong className="text-red-600">복구할 수 없습니다.</strong>
            </p>
          </header>

          <ul className="space-y-1.5 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <li>• 등록한 기업 {companies}개</li>
            <li>• SDGs 분석 이력 {analyses}건</li>
            <li>• 생성한 홍보 콘텐츠 {contents}건</li>
            <li>• 계정 정보·소셜 로그인 연동·문의 내역</li>
          </ul>

          {user.email === DEMO_EMAIL ? (
            <p className="rounded border border-purple-200 bg-purple-50 p-3 text-sm text-purple-800">
              🔒 시연용 demo 계정은 탈퇴할 수 없습니다.
            </p>
          ) : (
            <WithdrawForm hasPassword={user.password !== null} />
          )}
        </section>
      </div>
    </AppShell>
  )
}
