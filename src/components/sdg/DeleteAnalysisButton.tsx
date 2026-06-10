'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

interface Props {
  analysisId: string
  companyName: string
  /** 함께 삭제될 생성 콘텐츠 수 — confirm 경고 문구에 사용 */
  contentCount: number
}

/**
 * 분석 삭제 버튼 (D7 사용자 요청 — 잘못 실행한 분석 정리).
 *
 * 분석을 삭제하면 schema cascade로 생성 콘텐츠도 함께 사라지므로
 * confirm에서 콘텐츠 동반 삭제를 명시적으로 경고한다.
 * 결과 알림은 Toast로 통일 (P2 패턴).
 */
export function DeleteAnalysisButton({
  analysisId,
  companyName,
  contentCount,
}: Props) {
  const router = useRouter()
  const toast = useToast()
  const [deleting, setDeleting] = useState(false)

  async function onDelete() {
    const warning =
      contentCount > 0
        ? `${companyName}의 이 분석을 삭제하시겠습니까?\n\n⚠️ 이 분석으로 생성된 콘텐츠 ${contentCount}건도 함께 삭제되며 복구할 수 없습니다.`
        : `${companyName}의 이 분석을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.`
    if (!confirm(warning)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/sdg-analysis/${analysisId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string }
        }
        toast.error('삭제 실패', json.error?.message ?? `HTTP ${res.status}`)
        return
      }
      toast.success('분석이 삭제되었습니다')
      router.refresh()
    } catch (e) {
      toast.error(
        '삭제 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleting}
      className="rounded-lg border border-red-200 bg-surface px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {deleting ? '삭제 중...' : '삭제'}
    </button>
  )
}
