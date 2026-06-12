'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import {
  SignupSchema,
  type SignupInput,
} from '@/app/api/auth/register/schemas'
import { formatPhone } from '@/lib/phone'

type State =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string }

export function SignupForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      email: '',
      password: '',
      passwordConfirm: '',
      realName: '',
      displayName: '',
      phone: '',
      organization: '',
      agreeTerms: false,
      agreePrivacy: false,
      marketingOptIn: false,
    },
  })
  const [state, setState] = useState<State>({ kind: 'idle' })

  // 숫자만 입력해도 하이픈 자동 삽입 — 포맷 후 RHF onChange에 전달해
  // 폼 상태와 화면 표시를 일치시킨다
  const phoneField = register('phone')
  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = formatPhone(e.target.value)
    void phoneField.onChange(e)
  }

  async function onSubmit(values: SignupInput) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = (await res.json()) as
        | { data: { id: string; email: string } }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        const message =
          'error' in json ? json.error.message : `HTTP ${res.status}`
        setState({ kind: 'error', message })
        return
      }

      // 가입 성공 → 자동 로그인 시도
      const signinRes = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      })

      if (signinRes?.error) {
        router.push('/login?registered=1')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Section title="계정">
        <Field label="이메일 *" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className={INPUT_CLS}
            placeholder="you@example.com"
          />
        </Field>

        <Field
          label="비밀번호 * (8자 이상)"
          error={errors.password?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={INPUT_CLS}
          />
        </Field>

        <Field
          label="비밀번호 확인 *"
          error={errors.passwordConfirm?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            {...register('passwordConfirm')}
            className={INPUT_CLS}
          />
        </Field>
      </Section>

      <Section title="개인 정보">
        <Field label="실명 *" error={errors.realName?.message}>
          <input
            autoComplete="name"
            {...register('realName')}
            className={INPUT_CLS}
            placeholder="홍길동"
          />
        </Field>

        <Field
          label="표시명 (선택)"
          error={errors.displayName?.message}
          hint="비워두면 실명이 사용됩니다. 콘텐츠·댓글 등에 노출되는 이름입니다."
        >
          <input
            {...register('displayName')}
            className={INPUT_CLS}
            placeholder="홍길동 또는 닉네임"
          />
        </Field>

        <Field
          label="연락처 (선택)"
          error={errors.phone?.message}
          hint="형식: 010-1234-5678"
        >
          <input
            type="tel"
            autoComplete="tel"
            {...phoneField}
            onChange={onPhoneChange}
            className={INPUT_CLS}
            placeholder="010-1234-5678"
          />
        </Field>

        <Field
          label="소속 단체/회사 (선택)"
          error={errors.organization?.message}
        >
          <input
            autoComplete="organization"
            {...register('organization')}
            className={INPUT_CLS}
            placeholder="예: 동네 친환경 카페"
          />
        </Field>
      </Section>

      <Section title="이메일 인증">
        <p className="rounded border border-green-200 bg-green-50 p-3 text-xs text-green-800">
          📧 가입하면 입력하신 이메일로 인증 링크가 발송됩니다.
          <br />
          인증 전에도 서비스를 이용할 수 있으며, 화면 상단 배너에서 인증
          메일을 다시 받을 수 있어요.
        </p>
      </Section>

      <Section title="약관 동의">
        <Checkbox
          label="(필수) 이용약관에 동의합니다."
          register={register('agreeTerms')}
          error={errors.agreeTerms?.message}
        />
        <Checkbox
          label="(필수) 개인정보 처리방침에 동의합니다."
          register={register('agreePrivacy')}
          error={errors.agreePrivacy?.message}
        />
        <Checkbox
          label="(선택) 마케팅 정보 수신에 동의합니다."
          register={register('marketingOptIn')}
        />
      </Section>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="w-full rounded-full bg-green-600 px-4 py-3 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
      >
        {state.kind === 'submitting' ? '가입 중...' : '회원가입'}
      </button>

      {state.kind === 'error' && (
        <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          ❌ {state.message}
        </p>
      )}
    </form>
  )
}

// --- helpers -------------------------------------------------------------

const INPUT_CLS = 'w-full rounded-lg border border-gray-300 px-3 py-2'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-3 rounded border border-gray-200 p-4">
      <legend className="px-1 text-sm font-semibold text-gray-700">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function Checkbox({
  label,
  register,
  error,
}: {
  label: string
  register: UseFormRegisterReturn
  error?: string
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input type="checkbox" {...register} className="mt-1" />
        <span>{label}</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
