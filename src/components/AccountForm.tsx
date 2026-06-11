'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useToast } from '@/components/Toast'
import {
  UpdateUserSchema,
  type UpdateUserInput,
} from '@/app/api/auth/user/schemas'
import { formatPhone } from '@/lib/phone'

interface Props {
  initial: {
    name: string | null
    realName: string | null
    phone: string | null
    organization: string | null
    marketingOptIn: boolean
  }
}

type State = { kind: 'idle' } | { kind: 'submitting' }

export function AccountForm({ initial }: Props) {
  const router = useRouter()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(UpdateUserSchema),
    defaultValues: {
      name: initial.name ?? '',
      realName: initial.realName ?? '',
      phone: initial.phone ?? '',
      organization: initial.organization ?? '',
      marketingOptIn: initial.marketingOptIn,
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

  async function onSubmit(values: UpdateUserInput) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/auth/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = (await res.json()) as
        | { data: unknown }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        const message =
          'error' in json ? json.error.message : `HTTP ${res.status}`
        toast.error('저장 실패', message)
        setState({ kind: 'idle' })
        return
      }

      toast.success('저장되었습니다')
      setState({ kind: 'idle' })
      router.refresh()
    } catch (e) {
      toast.error(
        '저장 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
      setState({ kind: 'idle' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Field label="표시명 (닉네임)" error={errors.name?.message}>
        <input
          {...register('name')}
          className={INPUT_CLS}
          placeholder="콘텐츠·댓글 등에 노출되는 이름"
        />
      </Field>

      <Field label="실명" error={errors.realName?.message}>
        <input {...register('realName')} className={INPUT_CLS} />
      </Field>

      <Field
        label="연락처"
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
        label="소속 단체/회사"
        error={errors.organization?.message}
      >
        <input {...register('organization')} className={INPUT_CLS} />
      </Field>

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          {...register('marketingOptIn')}
          className="mt-1"
        />
        <span>마케팅 정보 수신에 동의합니다.</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state.kind === 'submitting'}
          className="rounded bg-accent-500 px-4 py-2 font-medium text-white hover:bg-accent-600 disabled:bg-gray-400"
        >
          {state.kind === 'submitting' ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}

const INPUT_CLS = 'w-full rounded border border-gray-300 px-3 py-2'

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
