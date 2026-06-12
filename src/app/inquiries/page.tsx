import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from '@/components/AppShell'
import { InquiryBoard, type InquiryItem } from '@/components/InquiryBoard'
import { db } from '@/server/db'

/**
 * 1:1 문의 게시판 (D7 IA — 사이드바 '1:1 문의').
 *
 * 문의 작성 + 내 문의 내역. #116에서 localStorage 프로토타입 → DB 저장으로
 * 전환 — 서버에서 본인 문의를 조회해 내려주고, 작성·삭제는 /api/inquiries.
 * 마이페이지의 '내 문의사항'도 이 페이지로 연결.
 */
export const dynamic = 'force-dynamic'

export default async function InquiriesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const inquiries = await db.inquiry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  // Date → ISO string (클라이언트 컴포넌트 직렬화 경계)
  const items: InquiryItem[] = inquiries.map((q) => ({
    id: q.id,
    type: q.type,
    title: q.title,
    body: q.body,
    status: q.status,
    answer: q.answer,
    answeredAt: q.answeredAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  }))

  return (
    <AppShell
      title="1:1 문의"
      description="서비스 이용 중 궁금한 점이나 불편한 점을 알려주세요."
    >
      <div className="mx-auto max-w-3xl px-6 py-8">
        <InquiryBoard items={items} />
      </div>
    </AppShell>
  )
}
