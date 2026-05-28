'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
  CreateCompanySchema,
  type CreateCompanyInput,
} from '@/app/api/companies/schemas'
import { SOCIAL_CATEGORY_LABEL, SocialCategorySchema } from '@/lib/enums'

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string; name: string }
  | { kind: 'error'; message: string }

const SOCIAL_CATEGORIES = SocialCategorySchema.options

export function CompanyForm() {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    resolver: zodResolver(CreateCompanySchema),
    defaultValues: {
      name: '',
      activities: [{ category: 'ENVIRONMENT', title: '', description: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'activities',
  })

  const [state, setState] = useState<SubmitState>({ kind: 'idle' })

  async function onSubmit(values: CreateCompanyInput) {
    setState({ kind: 'submitting' })
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = (await res.json()) as
        | { data: { id: string; name: string } }
        | { error: { code: string; message: string } }

      if (!res.ok || 'error' in json) {
        const message =
          'error' in json
            ? `[${json.error.code}] ${json.error.message}`
            : `HTTP ${res.status}`
        setState({ kind: 'error', message })
        return
      }

      setState({ kind: 'success', id: json.data.id, name: json.data.name })
      reset()
      // 등록 직후 기업 상세로 이동 — 사용자가 바로 SDGs 분석 단계로 진입 가능
      router.push(`/companies/${json.data.id}`)
      router.refresh()
    } catch (e) {
      setState({
        kind: 'error',
        message: e instanceof Error ? e.message : '알 수 없는 오류',
      })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-2xl space-y-6 p-6"
      noValidate
    >
      <h1 className="text-2xl font-bold">기업 등록</h1>

      <Field label="기업명 *" error={errors.name?.message}>
        <input
          {...register('name')}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="예: 동네 친환경 카페"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="업종" error={errors.industry?.message}>
          <input
            {...register('industry')}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="예: 카페·음료"
          />
        </Field>

        <Field label="소재 지역" error={errors.region?.message}>
          <input
            {...register('region')}
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="예: 대전"
          />
        </Field>
      </div>

      <Field label="제품·서비스" error={errors.product?.message}>
        <input
          {...register('product')}
          className="w-full rounded border border-gray-300 px-3 py-2"
          placeholder="예: 원두 직배전 커피"
        />
      </Field>

      <Field label="홍보 목적" error={errors.purpose?.message}>
        <textarea
          {...register('purpose')}
          className="w-full rounded border border-gray-300 px-3 py-2"
          rows={2}
          placeholder="예: 지역상생 캠페인 자료에 활용"
        />
      </Field>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">활동 *</h2>
          <button
            type="button"
            onClick={() =>
              append({
                category: 'ENVIRONMENT',
                title: '',
                description: '',
              })
            }
            className="rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
          >
            + 활동 추가
          </button>
        </div>
        {(errors.activities?.message ||
          errors.activities?.root?.message) && (
          <p className="text-sm text-red-600">
            {errors.activities?.message ?? errors.activities?.root?.message}
          </p>
        )}

        {fields.map((field, idx) => (
          <div
            key={field.id}
            className="space-y-2 rounded border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">활동 {idx + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-sm text-red-600 hover:underline"
                >
                  삭제
                </button>
              )}
            </div>

            <Field
              label="카테고리"
              error={errors.activities?.[idx]?.category?.message}
            >
              <select
                {...register(`activities.${idx}.category` as const)}
                className="w-full rounded border border-gray-300 px-3 py-2"
              >
                {SOCIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {SOCIAL_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="활동 제목"
              error={errors.activities?.[idx]?.title?.message}
            >
              <input
                {...register(`activities.${idx}.title` as const)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="예: 다회용 컵 캠페인"
              />
            </Field>

            <Field
              label="설명"
              error={errors.activities?.[idx]?.description?.message}
            >
              <textarea
                {...register(`activities.${idx}.description` as const)}
                className="w-full rounded border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="활동 내용을 자유롭게 적어주세요."
              />
            </Field>
          </div>
        ))}
      </section>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="w-full rounded bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400"
      >
        {state.kind === 'submitting' ? '저장 중...' : '기업 등록'}
      </button>

      {state.kind === 'success' && (
        <div className="space-y-2 rounded border border-green-300 bg-green-50 p-4 text-green-800">
          <p>
            ✅ 등록 완료 — <strong>{state.name}</strong>
          </p>
          <p>
            <a
              href={`/companies/${state.id}`}
              className="font-medium text-green-900 underline hover:text-green-700"
            >
              상세 보기 →
            </a>
          </p>
          <p className="text-xs text-green-700">
            <code>id: {state.id}</code>
          </p>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-800">
          ❌ {state.message}
        </div>
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
