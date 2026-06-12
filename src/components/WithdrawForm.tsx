'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { WITHDRAW_CONFIRM_PHRASE } from '@/app/api/auth/user/schemas'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }

/**
 * 회원탈퇴 확인 폼 (#90).
 *
 * 본인 확인: 비밀번호 계정은 비밀번호, 소셜 전용은 확인 문구 입력.
 * 동의 체크 + 본인 확인이 모두 채워져야 버튼이 활성화된다.
 * 성공 시 signOut 후 /login?withdrawn=1 — 서버 리다이렉트 대신 클라이언트
 * 상대 경로 이동 (ngrok origin 이슈 #78과 동일 패턴).
 */
export function WithdrawForm({ hasPassword }: { hasPassword: boolean }) {
  const [agreed, setAgreed] = useState(false)
  const [secret, setSecret] = useState('')
  const [state, setState] = useState<State>({ kind: 'idle' })

  const ready = agreed && secret.trim().length > 0

  async function onWithdraw() {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/auth/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          hasPassword ? { password: secret } : { confirmPhrase: secret },
        ),
      })
      const json = (await res.json()) as
        | { data: { ok: true } }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        setState({
          kind: 'error',
          message: 'error' in json ? json.error.message : `HTTP ${res.status}`,
        })
        return
      }

      await signOut({ redirect: false })
      window.location.href = '/login?withdrawn=1'
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  return (
    <div className="space-y-4">
      {hasPassword ? (
        <div className="space-y-1">
          <label
            htmlFor="withdraw-secret"
            className="block text-sm font-medium text-gray-700"
          >
            본인 확인을 위해 비밀번호를 입력해 주세요
          </label>
          <input
            id="withdraw-secret"
            type="password"
            autoComplete="current-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <label
            htmlFor="withdraw-secret"
            className="block text-sm font-medium text-gray-700"
          >
            간편 로그인 계정입니다 — 확인을 위해{' '}
            <strong className="text-red-600">{WITHDRAW_CONFIRM_PHRASE}</strong>
            를 입력해 주세요
          </label>
          <input
            id="withdraw-secret"
            type="text"
            autoComplete="off"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            placeholder={WITHDRAW_CONFIRM_PHRASE}
          />
        </div>
      )}

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1"
        />
        <span>
          위 내용을 확인했으며, 모든 데이터가 영구 삭제되는 것에 동의합니다.
        </span>
      </label>

      <button
        type="button"
        onClick={onWithdraw}
        disabled={!ready || state.kind === 'submitting'}
        className="w-full rounded bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:bg-gray-400"
      >
        {state.kind === 'submitting' ? '탈퇴 처리 중...' : '회원탈퇴'}
      </button>

      {state.kind === 'error' && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          ❌ {state.message}
        </p>
      )}
    </div>
  )
}
