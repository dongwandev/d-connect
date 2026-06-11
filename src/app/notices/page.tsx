import { AppShell } from '@/components/AppShell'
import { NOTICES, type NoticeCategory } from '@/lib/notices'

/**
 * 공지사항 페이지 (D7 IA — 사이드바 '공지사항').
 *
 * 서비스 공지·업데이트·점검 소식. 프로토타입 단계라 정적 데이터
 * (src/lib/notices.ts) 기반 — 각 항목은 <details>로 펼침/접힘 (JS 불필요).
 */
export const dynamic = 'force-dynamic'

const CATEGORY_BADGE: Record<NoticeCategory, string> = {
  공지: 'bg-accent-500/10 text-accent-600',
  업데이트: 'bg-emerald-100 text-emerald-700',
  점검: 'bg-amber-100 text-amber-700',
}

export default function NoticesPage() {
  return (
    <AppShell
      title="공지사항"
      description="D-Connect의 새 소식과 안내를 확인하세요."
    >
      <div className="mx-auto max-w-3xl space-y-3 px-6 py-8">
        {NOTICES.map((n) => (
          <details
            key={n.id}
            open={n.pinned}
            className="group overflow-hidden rounded-xl border border-border bg-surface"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE[n.category]}`}
              >
                {n.category}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  {n.pinned && (
                    <span
                      aria-label="고정된 공지"
                      title="고정된 공지"
                      className="shrink-0 text-xs"
                    >
                      📌
                    </span>
                  )}
                  <span className="truncate text-sm font-semibold text-gray-900">
                    {n.title}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {n.date}
                </span>
              </span>
              <span
                aria-hidden
                className="shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>
            <div className="border-t border-border bg-surface-muted/50 px-5 py-4">
              {n.body.split('\n').map((line, i) =>
                line === '' ? (
                  <br key={i} />
                ) : (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-gray-700"
                  >
                    {line}
                  </p>
                ),
              )}
            </div>
          </details>
        ))}

        <p className="pt-2 text-xs text-gray-500">
          문의가 필요하시면 사이드바의 <strong>1:1 문의</strong>를 이용해
          주세요.
        </p>
      </div>
    </AppShell>
  )
}
