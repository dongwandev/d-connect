'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useToast } from '@/components/Toast'
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

type SubmitState = { kind: 'idle' } | { kind: 'submitting' }

const SOCIAL_CATEGORIES = SocialCategorySchema.options
const BUSINESS_TYPES = BusinessTypeSchema.options
const SIDOS = SidoSchema.options
const INDUSTRIES = IndustryCategorySchema.options
const TARGETS = TargetAudienceSchema.options
const PROMO_GOALS = PromoGoalSchema.options

interface CompanyFormProps {
  /**
   * 편집 모드: companyId가 있으면 PATCH /api/companies/[id] 호출.
   * 등록 모드: 비어 있으면 POST /api/companies.
   */
  mode?: 'create' | 'edit'
  companyId?: string
  /** 편집 모드의 초기값. mode='edit'일 때만 의미 있음. */
  initial?: Partial<CreateCompanyInput>
}

export function CompanyForm({
  mode = 'create',
  companyId,
  initial,
}: CompanyFormProps = {}) {
  const router = useRouter()
  const toast = useToast()
  const isEdit = mode === 'edit' && companyId

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCompanyInput>({
    // 라디오 group register는 setValueAs를 무시하므로(미선택 시 form state에 ''이 남음)
    // resolver를 wrap해서 zod 검증 직전에 빈 string을 undefined로 정규화한다.
    resolver: (values, context, options) => {
      const cleaned = { ...values } as Record<string, unknown>
      for (const k of ['businessType', 'sido', 'industryCategory']) {
        if (cleaned[k] === '') cleaned[k] = undefined
      }
      return zodResolver(CreateCompanySchema)(
        cleaned as CreateCompanyInput,
        context,
        options,
      )
    },
    defaultValues: {
      name: initial?.name ?? '',
      foundedYear: initial?.foundedYear,
      businessType: initial?.businessType,
      sido: initial?.sido,
      sigungu: initial?.sigungu ?? '',
      industryCategory: initial?.industryCategory,
      product: initial?.product ?? '',
      targetAudiences: initial?.targetAudiences ?? [],
      promoGoals: initial?.promoGoals ?? [],
      activities:
        initial?.activities && initial.activities.length > 0
          ? initial.activities
          : [{ category: 'ENVIRONMENT', title: '', description: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'activities',
  })

  const [state, setState] = useState<SubmitState>({ kind: 'idle' })

  // 단일 선택 카드 버튼용 watch 값
  const industryCategory = watch('industryCategory')
  const targetAudiences = watch('targetAudiences') ?? []
  const promoGoals = watch('promoGoals') ?? []

  function toggleTarget(t: TargetAudience) {
    const next = targetAudiences.includes(t)
      ? targetAudiences.filter((x) => x !== t)
      : [...targetAudiences, t]
    setValue('targetAudiences', next, { shouldDirty: true })
  }

  function togglePromo(g: PromoGoal) {
    const next = promoGoals.includes(g)
      ? promoGoals.filter((x) => x !== g)
      : [...promoGoals, g]
    setValue('promoGoals', next, { shouldDirty: true })
  }

  async function onSubmit(values: CreateCompanyInput) {
    setState({ kind: 'submitting' })
    try {
      const url = isEdit
        ? `/api/companies/${companyId}`
        : '/api/companies'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
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
        toast.error(isEdit ? '수정 실패' : '등록 실패', message)
        setState({ kind: 'idle' })
        return
      }

      toast.success(
        isEdit ? '수정되었습니다' : '등록되었습니다',
        json.data.name,
      )
      if (!isEdit) reset()
      router.push(`/companies/${json.data.id}`)
      router.refresh()
    } catch (e) {
      toast.error(
        isEdit ? '수정 실패' : '등록 실패',
        e instanceof Error ? e.message : '알 수 없는 오류',
      )
      setState({ kind: 'idle' })
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
                  {...register('businessType', {
                    setValueAs: (v) => (v === '' ? undefined : v),
                  })}
                />
                <span>{BUSINESS_TYPE_LABEL[t]}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="사업장 소재지 (시/도)" error={errors.sido?.message}>
            <select
              {...register('sido', {
                setValueAs: (v) => (v === '' ? undefined : v),
              })}
              className={INPUT_CLS}
            >
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

      <Section title="타겟 / 목표 (다중 선택)">
        <Field
          label="주요 타겟 고객"
          error={errors.targetAudiences?.message}
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {TARGETS.map((t) => (
              <CardButton
                key={t}
                selected={targetAudiences.includes(t)}
                icon=""
                label={TARGET_AUDIENCE_LABEL[t]}
                onClick={() => toggleTarget(t)}
              />
            ))}
          </div>
        </Field>

        <Field label="홍보 목표" error={errors.promoGoals?.message}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PROMO_GOALS.map((g) => (
              <CardButton
                key={g}
                selected={promoGoals.includes(g)}
                icon=""
                label={PROMO_GOAL_LABEL[g]}
                onClick={() => togglePromo(g)}
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
        {state.kind === 'submitting'
          ? '저장 중...'
          : isEdit
            ? '수정 저장'
            : '기업 등록'}
      </button>

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
