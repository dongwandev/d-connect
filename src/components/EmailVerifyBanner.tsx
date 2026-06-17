'use client'

import { useState } from 'react'

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'mocked'; verifyUrl: string }
  | { kind: 'error'; message: string }

/**
 * 미인증 이메일 안내 배너 (AppShell — TopBar 아래).
 *
 * 미인증이어도 서비스 이용은 막지 않는다 — 안내 + 재발송만 제공.
 * SMTP 미설정/발송 실패 시(mock fallback) 인증 링크를 배너에 직접 표시.
 */
export function EmailVerifyBanner({ email }: { email: string }) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function resend() {
    setState({ kind: 'sending' })
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
      })
      const json = (await res.json()) as
        | { data: { mocked: boolean; verifyUrl?: string } }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        setState({
          kind: 'error',
          message: 'error' in json ? json.error.message : `HTTP ${res.status}`,
        })
        return
      }
      if (json.data.mocked && json.data.verifyUrl) {
        setState({ kind: 'mocked', verifyUrl: json.data.verifyUrl })
      } else {
        setState({ kind: 'sent' })
      }
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-amber-800">
        <span>
          📧 <strong>{email}</strong> 인증이 완료되지 않았습니다. 메일함(스팸함
          포함)의 인증 링크를 확인해 주세요.
        </span>
        <button
          type="button"
          onClick={resend}
          disabled={state.kind === 'sending'}
          className="rounded-full border border-amber-300 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          {state.kind === 'sending' ? '발송 중...' : '인증 메일 재발송'}
        </button>

        {state.kind === 'sent' && (
          <span className="text-xs text-green-700">
            ✅ 발송했습니다. 메일함을 확인해 주세요.
          </span>
        )}
        {state.kind === 'mocked' && (
          <span className="text-xs">
            🔧 메일 서버 미설정(MVP) —{' '}
            <a
              href={state.verifyUrl}
              className="font-medium text-green-700 underline"
            >
              이 링크로 바로 인증
            </a>
            할 수 있어요.
          </span>
        )}
        {state.kind === 'error' && (
          <span className="text-xs text-red-700">❌ {state.message}</span>
        )}
      </div>
    </div>
  )
}
