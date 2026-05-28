'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
  CreateCompanySchema,
  type CreateCompanyInput,
} from '@/app/api/companies/schemas'
import {
  BUSINESS_TYPE_LABEL,
  BusinessTypeSchema,
  INDUSTRY_CATEGORY_ICON,
  INDUSTRY_CATEGORY_LABEL,
  IndustryCategorySchema,
  PROMO_GOAL_LABEL,
  PromoGoalSchema,
  SIDO_LABEL,
  SidoSchema,
  SOCIAL_CATEGORY_LABEL,
  SocialCategorySchema,
  TARGET_AUDIENCE_LABEL,
  TargetAudienceSchema,
  type IndustryCategory,
  type PromoGoal,
  type TargetAudience,
} from '@/lib/enums'

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; id: string; name: string }
  | { kind: 'error'; message: string }

const SOCIAL_CATEGORIES = SocialCategorySchema.options
const BUSINESS_TYPES = BusinessTypeSchema.options
const SIDOS = SidoSchema.options
const INDUSTRIES = IndustryCategorySchema.options
const TARGETS = TargetAudienceSchema.options
const PROMO_GOALS = PromoGoalSchema.options

export function CompanyForm() {
  const router = useRouter()
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
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

  // 단일 선택 카드 버튼용 watch 값
  const industryCategory = watch('industryCategory')
  const targetAudience = watch('targetAudience')
  const promoGoal = watch('promoGoal')

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
      className="mx-auto max-w-2xl space-y-5"
      noValidate
    >
      <Section title="기업 정보">
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Field label="기업명 / 단체명 *" error={errors.name?.message}>
            <input
              {...register('name')}
              className={INPUT_CLS}
              placeholder="예: 동네 친환경 카페"
            />
          </Field>
          <Field
            label="설립연도"
            error={errors.foundedYear?.message}
          >
            <input
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              {...register('foundedYear', {
                setValueAs: (v) =>
                  v === '' || v === null || v === undefined
                    ? undefined
                    : Number(v),
              })}
              className={INPUT_CLS}
              placeholder="2020"
            />
          </Field>
        </div>

        <Field label="사업자 형태" error={errors.businessType?.message}>
          <div className="flex flex-wrap gap-3">
            {BUSINESS_TYPES.map((t) => (
              <label
                key={t}
                className="flex items-center gap-1.5 text-sm text-gray-700"
              >
                <input
                  type="radio"
                  value={t}
                  {...register('businessType')}
                />
                <span>{BUSINESS_TYPE_LABEL[t]}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="사업장 소재지 (시/도)" error={errors.sido?.message}>
            <select {...register('sido')} className={INPUT_CLS}>
              <option value="">선택</option>
              {SIDOS.map((s) => (
                <option key={s} value={s}>
                  {SIDO_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="시/군/구"
            error={errors.sigungu?.message}
          >
            <input
              {...register('sigungu')}
              className={INPUT_CLS}
              placeholder="예: 서구"
            />
          </Field>
        </div>

        <Field
          label="업종 / 사업 분야"
          error={errors.industryCategory?.message}
        >
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {INDUSTRIES.map((c) => (
              <CardButton
                key={c}
                selected={industryCategory === c}
                icon={INDUSTRY_CATEGORY_ICON[c]}
                label={INDUSTRY_CATEGORY_LABEL[c]}
                onClick={() =>
                  setValue('industryCategory', c as IndustryCategory, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </div>
        </Field>

        <Field
          label="주요 제품·서비스"
          error={errors.product?.message}
        >
          <textarea
            {...register('product')}
            rows={3}
            className={INPUT_CLS}
            placeholder="주요 제품이나 서비스에 대해 소개해 주세요."
          />
        </Field>
      </Section>

      <Section title="지역사회 기여 활동 *">
        <div className="flex items-center justify-end">
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

        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="space-y-2 rounded border border-gray-200 bg-surface p-4"
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
                  className={INPUT_CLS}
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
                  className={INPUT_CLS}
                  placeholder="예: 다회용 컵 캠페인"
                />
              </Field>

              <Field
                label="설명"
                error={errors.activities?.[idx]?.description?.message}
              >
                <textarea
                  {...register(`activities.${idx}.description` as const)}
                  className={INPUT_CLS}
                  rows={3}
                  placeholder="활동 내용을 자유롭게 적어주세요."
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title="타겟 / 목표">
        <Field
          label="주요 타겟 고객"
          error={errors.targetAudience?.message}
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TARGETS.map((t) => (
              <CardButton
                key={t}
                selected={targetAudience === t}
                icon=""
                label={TARGET_AUDIENCE_LABEL[t]}
                onClick={() =>
                  setValue('targetAudience', t as TargetAudience, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </div>
        </Field>

        <Field label="홍보 목표" error={errors.promoGoal?.message}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROMO_GOALS.map((g) => (
              <CardButton
                key={g}
                selected={promoGoal === g}
                icon=""
                label={PROMO_GOAL_LABEL[g]}
                onClick={() =>
                  setValue('promoGoal', g as PromoGoal, {
                    shouldDirty: true,
                  })
                }
              />
            ))}
          </div>
        </Field>
      </Section>

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        className="w-full rounded bg-accent-500 px-4 py-3 font-medium text-white hover:bg-accent-600 disabled:bg-gray-400"
      >
        {state.kind === 'submitting' ? '저장 중...' : '기업 등록'}
      </button>

      {state.kind === 'success' && (
        <div className="rounded border border-green-300 bg-green-50 p-4 text-green-800">
          ✅ 등록 완료 — <strong>{state.name}</strong>
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

// --- helpers -------------------------------------------------------------

const INPUT_CLS = 'w-full rounded border border-gray-300 px-3 py-2'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="space-y-3 rounded border border-border bg-surface p-5">
      <legend className="px-2 text-sm font-semibold text-gray-700">
        {title}
      </legend>
      {children}
    </fieldset>
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

function CardButton({
  selected,
  icon,
  label,
  onClick,
}: {
  selected: boolean
  icon: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded border px-2 py-2 text-xs transition-colors ${
        selected
          ? 'border-accent-500 bg-accent-500/10 text-accent-600 font-semibold'
          : 'border-gray-200 bg-white text-gray-700 hover:border-accent-500 hover:bg-accent-500/5'
      }`}
    >
      {icon && <span className="text-base" aria-hidden>{icon}</span>}
      <span>{label}</span>
    </button>
  )
}
