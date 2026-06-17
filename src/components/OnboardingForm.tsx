'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
} from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/Toast'
import {
  OnboardingSchema,
  OnboardingWithEmailSchema,
  type OnboardingInput,
} from '@/app/api/auth/onboarding/schemas'
import { formatPhone } from '@/lib/phone'

interface Props {
  /** 소셜 프로필에서 가져온 표시명 — prefill */
  initialDisplayName: string | null
  /**
   * 소셜 프로필에서 가져온 이메일.
   * 있으면(구글) 확인용 표시만, 없으면(카카오) 입력 필수.
   */
  initialEmail: string | null
}

/**
 * 소셜 가입 완료 폼 (/welcome — D8).
 *
 * 이메일 회원가입과 동일한 추가 정보·동의를 받는다 (이메일/비밀번호 제외).
 * 성공 시 acceptedTermsAt이 기록되어 AppShell 게이트를 통과하게 된다.
 */
export function OnboardingForm({ initialDisplayName, initialEmail }: Props) {
  const toast = useToast()
  const [submitting, setSubmitting] = useState(false)
  const needsEmail = !initialEmail
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingInput>({
    // 이메일이 없는 계정(카카오)은 이메일 필수 스키마로 검증
    resolver: zodResolver(
      needsEmail ? OnboardingWithEmailSchema : OnboardingSchema,
    ),
    defaultValues: {
      // 이메일 있는 계정(구글)은 입력칸을 렌더하지 않으므로 undefined —
      // ''로 두면 보이지 않는 필드가 .email() 검증에 걸려 제출이 조용히 막힌다
      email: needsEmail ? '' : undefined,
      realName: '',
      displayName: initialDisplayName ?? '',
      phone: '',
      organization: '',
      agreeTerms: false,
      agreePrivacy: false,
      marketingOptIn: false,
    },
  })

  // 숫자만 입력해도 하이픈 자동 삽입 — 포맷 후 RHF onChange에 전달해
  // 폼 상태와 화면 표시를 일치시킨다
  const phoneField = register('phone')
  function onPhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.value = formatPhone(e.target.value)
    void phoneField.onChange(e)
  }

  async function onSubmit(values: OnboardingInput) {
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = (await res.json()) as
        | { data: unknown }
        | { error: { message: string } }

      if (!res.ok || 'error' in json) {
        toast.error(
          '가입 완료 실패',
          'error' in json ? json.error.message : `HTTP ${res.status}`,
        )
        setSubmitting(false)
        return
      }

      toast.success('가입이 완료되었습니다', 'D-Connect에 오신 것을 환영해요!')
      // 풀 리로드 — 셸 게이트(acceptedTermsAt)가 새 상태로 재평가되도록.
      // (href 할당은 React Compiler immutability 룰에 걸려 assign 사용)
      window.location.assign('/dashboard')
    } catch (e) {
      toast.error(
        '가입 완료 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {needsEmail ? (
        <Field
          label="이메일 *"
          error={errors.email?.message}
          hint="알림·계정 안내에 사용할 이메일을 입력해 주세요."
        >
          <input
            type="email"
            {...register('email')}
            className={INPUT_CLS}
            placeholder="you@example.com"
          />
        </Field>
      ) : (
        <div className="space-y-1 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">이메일</p>
          <p className="text-sm text-gray-900">{initialEmail}</p>
          <p className="text-xs text-gray-500">
            소셜 계정에서 가져온 이메일입니다.
          </p>
        </div>
      )}

      <Field label="실명 *" error={errors.realName?.message}>
        <input
          {...register('realName')}
          className={INPUT_CLS}
          placeholder="홍길동"
        />
      </Field>

      <Field
        label="표시명 (닉네임)"
        error={errors.displayName?.message}
        hint="비워두면 실명이 표시명으로 사용됩니다."
      >
        <input {...register('displayName')} className={INPUT_CLS} />
      </Field>

      <Field
        label="연락처"
        error={errors.phone?.message}
        hint="형식: 010-1234-5678 (선택)"
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

      <Field label="소속 단체/회사 (선택)" error={errors.organization?.message}>
        <input {...register('organization')} className={INPUT_CLS} />
      </Field>

      <div className="space-y-2 rounded-lg bg-gray-50 p-4">
        <Check
          label="(필수) 이용약관에 동의합니다."
          error={errors.agreeTerms?.message}
          {...register('agreeTerms')}
        />
        <Check
          label="(필수) 개인정보 수집·이용에 동의합니다."
          error={errors.agreePrivacy?.message}
          {...register('agreePrivacy')}
        />
        <Check
          label="(선택) 마케팅 정보 수신에 동의합니다."
          {...register('marketingOptIn')}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-accent-500 px-4 py-3 font-medium text-white transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 disabled:bg-gray-400"
      >
        {submitting ? '처리 중...' : '가입 완료'}
      </button>
    </form>
  )
}

const INPUT_CLS =
  'w-full rounded-lg border border-gray-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500'

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

const Check = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function Check({ label, error, ...rest }, ref) {
  return (
    <div>
      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input ref={ref} type="checkbox" className="mt-1" {...rest} />
        <span>{label}</span>
      </label>
      {error && <p className="mt-0.5 pl-6 text-sm text-red-600">{error}</p>}
    </div>
  )
})
