'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from '@/app/api/auth/reset-password/schemas'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

/** 새 비밀번호 설정 폼 (/reset-password — 메일 링크 도착지). */
export function ResetPasswordForm({ token }: { token: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { token, newPassword: '', newPasswordConfirm: '' },
  })
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(values: ResetPasswordInput) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
      setState({ kind: 'done' })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  if (state.kind === 'done') {
    return (
      <div className="space-y-3 rounded border border-green-300 bg-green-50 p-4 text-center">
        <p className="text-sm font-medium text-green-800">
          ✅ 비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          로그인하러 가기
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input type="hidden" {...register('token')} />

      <Field label="새 비밀번호 (8자 이상)" error={errors.newPassword?.message}>
        <input
          type="password"
          autoComplete="new-password"
          {...register('newPassword')}
          className={INPUT_CLS}
        />
      </Field>

      <Field
        label="새 비밀번호 확인"
        error={errors.newPasswordConfirm?.message}
      >
        <input
          type="password"
          autoComplete="new-password"
          {...register('newPasswordConfirm')}
          className={INPUT_CLS}
        />
      </Field>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="w-full rounded-full bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
      >
        {state.kind === 'submitting' ? '재설정 중...' : '비밀번호 재설정'}
      </button>

      {state.kind === 'error' && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          ❌ {state.message}
        </p>
      )}
    </form>
  )
}

const INPUT_CLS = 'w-full rounded-lg border border-gray-300 px-3 py-2'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
