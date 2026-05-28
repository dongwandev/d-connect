'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  LoginSchema,
  type LoginInput,
} from '@/app/api/auth/register/schemas'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }

export function EmailLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
  const justRegistered = params.get('registered') === '1'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(values: LoginInput) {
    setState({ kind: 'submitting' })
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (res?.error) {
      setState({
        kind: 'error',
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      })
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      {justRegistered && (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm text-green-800">
          ✅ 가입이 완료되었습니다. 로그인해 주세요.
        </p>
      )}

      <Field label="이메일" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="you@example.com"
        />
      </Field>

      <Field label="비밀번호" error={errors.password?.message}>
        <input
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </Field>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="w-full rounded bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {state.kind === 'submitting' ? '로그인 중...' : '로그인'}
      </button>

      {state.kind === 'error' && (
        <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-800">
          ❌ {state.message}
        </p>
      )}
    </form>
  )
}

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
