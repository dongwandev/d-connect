import { AppShell } from '@/components/AppShell'
import { BackLink } from '@/components/BackLink'

/**
 * 구독 관리 페이지 (마이페이지 허브 분리 — D7 IA).
 *
 * 프로토타입 단계 — 무료 플랜 고정, 결제·플랜 변경은 준비 중 placeholder.
 */
export const dynamic = 'force-dynamic'

export default function SubscriptionPage() {
  return (
    <AppShell
      title="구독 관리"
      description="이용 중인 플랜과 결제 정보를 확인합니다."
    >
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-8">
        <nav>
          <BackLink href="/mypage" label="마이페이지" />
        </nav>

        {/* 현재 플랜 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">현재 플랜</h2>
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

        {/* 플랜 안내 */}
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-base font-bold text-gray-900">플랜 안내</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span aria-hidden>✓</span>
              <span>기업 등록·SDGs 분석·콘텐츠 생성 무제한</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>✓</span>
              <span>SNS·카드뉴스·숏폼·슬로건 4종 콘텐츠 유형</span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden>✓</span>
              <span>분석 이력·콘텐츠 보관</span>
            </li>
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-xs text-gray-500">
            유료 플랜(팀 협업·대량 생성·우선 지원)은 정식 서비스 전환 시
            안내됩니다.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
