'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  FindEmailSchema,
  type FindEmailInput,
  type FindEmailMatch,
} from '@/app/api/auth/find-email/schemas'
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
  type ForgotPasswordResult,
} from '@/app/api/auth/forgot-password/schemas'
import { formatPhone } from '@/lib/phone'

type Tab = 'email' | 'password'

/**
 * 계정 찾기 폼 (/find-account).
 *
 * 탭 1 — 이메일 찾기: 실명 + 연락처 → 마스킹된 이메일 + 가입 방법 안내
 * 탭 2 — 비밀번호 재설정: 이메일로 재설정 링크 발송 (#88 — 메일 인증 기반)
 */
export function FindAccountForm() {
  const [tab, setTab] = useState<Tab>('email')

  return (
    <div className="space-y-5">
      <div role="tablist" className="grid grid-cols-2 rounded-lg bg-gray-100 p-1">
        <TabButton
          active={tab === 'email'}
          onClick={() => setTab('email')}
          label="이메일 찾기"
        />
        <TabButton
          active={tab === 'password'}
          onClick={() => setTab('password')}
          label="비밀번호 재설정"
        />
      </div>

      {tab === 'email' ? <FindEmailTab /> : <ResetPasswordTab />}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}

// --- 탭 1: 이메일 찾기 -----------------------------------------------------

type FindState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'done'; matches: FindEmailMatch[] }
  | { kind: 'error'; message: string }

function FindEmailTab() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindEmailInput>({
    resolver: zodResolver(FindEmailSchema),
    defaultValues: { realName: '', phone: '' },
  })
  const [state, setState] = useState<FindState>({ kind: 'idle' })

  // 숫자만 입력해도 하이픈 자동 삽입 (회원가입과 동일 패턴)
  const phoneField = register('phone')
  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = formatPhone(e.target.value)
    void phoneField.onChange(e)
  }

  async function onSubmit(values: FindEmailInput) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = (await res.json()) as
        | { data: { matches: FindEmailMatch[] } }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        setState({
          kind: 'error',
          message: 'error' in json ? json.error.message : `HTTP ${res.status}`,
        })
        return
      }
      setState({ kind: 'done', matches: json.data.matches })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-sm text-gray-500">
        가입 시 입력한 실명과 연락처로 이메일(아이디)을 찾아 드려요.
      </p>

      <Field label="실명" error={errors.realName?.message}>
        <input
          autoComplete="name"
          {...register('realName')}
          className={INPUT_CLS}
          placeholder="홍길동"
        />
      </Field>

      <Field label="연락처" error={errors.phone?.message}>
        <input
          type="tel"
          autoComplete="tel"
          {...phoneField}
          onChange={onPhoneChange}
          className={INPUT_CLS}
          placeholder="010-1234-5678"
        />
      </Field>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className={SUBMIT_CLS}
      >
        {state.kind === 'submitting' ? '조회 중...' : '이메일 찾기'}
      </button>

      {state.kind === 'done' && (
        <div className="space-y-2 rounded border border-green-300 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            ✅ 일치하는 계정을 찾았습니다.
          </p>
          <ul className="space-y-1">
            {state.matches.map((m) => (
              <li key={m.maskedEmail} className="text-sm text-green-800">
                <span className="font-mono font-semibold">{m.maskedEmail}</span>
                <span className="ml-2 text-xs text-green-700">
                  {loginHint(m)}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            로그인하러 가기 →
          </Link>
        </div>
      )}

      {state.kind === 'error' && <ErrorBox message={state.message} />}
    </form>
  )
}

/** 가입 방법 안내 문구 — 비밀번호 유무와 연동된 소셜 provider 기준 */
function loginHint(m: FindEmailMatch): string {
  const social = m.providers
    .map((p) => ({ kakao: '카카오', google: '구글' })[p] ?? p)
  const methods = [
    ...(m.hasPassword ? ['이메일 로그인'] : []),
    ...social.map((s) => `${s} 간편 로그인`),
  ]
  return methods.length > 0 ? `(${methods.join(' · ')})` : ''
}

// --- 탭 2: 비밀번호 재설정 (메일 링크 발송) ---------------------------------

type ResetState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'sent'; result: ForgotPasswordResult }
  | { kind: 'error'; message: string }

function ResetPasswordTab() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' },
  })
  const [state, setState] = useState<ResetState>({ kind: 'idle' })

  async function onSubmit(values: ForgotPasswordInput) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = (await res.json()) as
        | { data: ForgotPasswordResult }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        setState({
          kind: 'error',
          message: 'error' in json ? json.error.message : `HTTP ${res.status}`,
        })
        return
      }
      setState({ kind: 'sent', result: json.data })
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  if (state.kind === 'sent') {
    const { mocked, verifyUrl, socialOnly } = state.result
    return (
      <div className="space-y-3 rounded border border-green-300 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          ✅ 가입된 이메일이라면 비밀번호 재설정 링크를 보냈습니다.
        </p>
        <p className="text-xs leading-relaxed text-green-700">
          메일함(스팸함 포함)을 확인해 주세요. 링크는 1시간 동안 유효합니다.
        </p>
        {mocked && verifyUrl && (
          <p className="text-xs text-green-800">
            🔧 메일 서버 미설정(MVP) —{' '}
            <a
              href={verifyUrl}
              className="font-medium text-blue-700 underline"
            >
              이 링크로 바로 재설정
            </a>
            할 수 있어요.
          </p>
        )}
        {mocked && socialOnly && (
          <p className="text-xs text-green-800">
            🔧 메일 서버 미설정(MVP) — 이 계정은 비밀번호가 없는{' '}
            {socialOnly.join('·')} 간편 로그인 계정입니다.
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-sm text-gray-500">
        가입한 이메일로 비밀번호 재설정 링크를 보내드려요.
      </p>

      <Field label="이메일" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          {...register('email')}
          className={INPUT_CLS}
          placeholder="you@example.com"
        />
      </Field>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className={SUBMIT_CLS}
      >
        {state.kind === 'submitting' ? '발송 중...' : '재설정 링크 받기'}
      </button>

      {state.kind === 'error' && <ErrorBox message={state.message} />}
    </form>
  )
}

// --- helpers -------------------------------------------------------------

const INPUT_CLS = 'w-full rounded border border-gray-300 px-3 py-2'
const SUBMIT_CLS =
  'w-full rounded bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400'

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

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
      ❌ {message}
    </p>
  )
}
