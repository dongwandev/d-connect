'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오',
  google: 'Google',
}

/**
 * 소셜 계정 연동 해제 버튼 (마이페이지 > 보안 설정).
 *
 * DELETE /api/auth/accounts/[provider] 호출 — 서버에서 마지막 로그인
 * 수단 잠금 방지 가드를 수행하고, 거부 사유는 토스트로 안내한다.
 */
export function UnlinkProviderButton({ provider }: { provider: string }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function onUnlink() {
    const label = PROVIDER_LABEL[provider] ?? provider
    if (!confirm(`${label} 연동을 해제하시겠습니까?`)) return

    setBusy(true)
    try {
      const res = await fetch(`/api/auth/accounts/${provider}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string }
        }
        toast.error('연동 해제 실패', json.error?.message ?? `HTTP ${res.status}`)
        return
      }
      toast.success(`${label} 연동이 해제되었습니다`)
      router.refresh()
    } catch (e) {
      toast.error(
        '연동 해제 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onUnlink}
      disabled={busy}
      className="rounded-lg border border-red-200 bg-surface px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? '해제 중...' : '연동 해제'}
    </button>
  )
}
