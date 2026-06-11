import { AppShell } from '@/components/AppShell'
import { InquiryBoard } from '@/components/InquiryBoard'

/**
 * 1:1 문의 게시판 (D7 IA — 사이드바 '1:1 문의').
 *
 * 문의 작성 + 내 문의 내역. 프로토타입 단계라 localStorage 저장
 * (InquiryBoard 참고). 마이페이지의 '내 문의사항'도 이 페이지로 연결.
 */
export const dynamic = 'force-dynamic'

export default function InquiriesPage() {
  return (
    <AppShell
      title="1:1 문의"
      description="서비스 이용 중 궁금한 점이나 불편한 점을 알려주세요."
    >
      <div className="mx-auto max-w-3xl px-6 py-8">
        <InquiryBoard />
      </div>
    </AppShell>
  )
}
