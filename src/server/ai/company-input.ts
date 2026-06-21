import 'server-only'
import {
  BUSINESS_TYPE_LABEL,
  INDUSTRY_CATEGORY_LABEL,
  SIDO_LABEL,
  SOCIAL_CATEGORY_LABEL,
  TARGET_AUDIENCE_LABEL,
  PROMO_GOAL_LABEL,
  type BusinessType,
  type IndustryCategory,
  type PromoGoal,
  type Sido,
  type SocialCategory,
  type TargetAudience,
} from '@/lib/enums'
import { parseJsonArray } from '@/lib/json-array'
import type { Activity, Company } from '@/generated/prisma/client'
import type { CompanyInput } from './prompts'

/**
 * Prisma Company → 프롬프트용 CompanyInput 변환 (#92).
 *
 * enum 코드를 한국어 라벨로 풀고, 신규 폼 필드(industryCategory, sido/sigungu)를
 * 우선 사용하되 구버전 데이터의 deprecated 자유 텍스트(industry, region)로 폴백.
 */
export function toCompanyInput(
  company: Company & { activities: Activity[] },
): CompanyInput {
  const industry = company.industryCategory
    ? INDUSTRY_CATEGORY_LABEL[company.industryCategory as IndustryCategory]
    : company.industry

  const sidoLabel = company.sido ? SIDO_LABEL[company.sido as Sido] : null
  const region = sidoLabel
    ? [sidoLabel, company.sigungu].filter(Boolean).join(' ')
    : company.region

  const targetAudiences = parseJsonArray<TargetAudience>(
    company.targetAudiences,
  ).map((t) => TARGET_AUDIENCE_LABEL[t] ?? t)

  const promoGoals = parseJsonArray<PromoGoal>(company.promoGoals).map(
    (g) => PROMO_GOAL_LABEL[g] ?? g,
  )

  return {
    name: company.name,
    foundedYear: company.foundedYear,
    businessType: company.businessType
      ? BUSINESS_TYPE_LABEL[company.businessType as BusinessType]
      : null,
    industry,
    region,
    product: company.product,
    mission: company.purpose,
    targetAudiences,
    promoGoals,
    activities: company.activities.map((a) => ({
      title: a.title,
      description: a.description,
      // 등록 시 사람이 지정한 사회적 기능 분류 — 강한 매칭 신호 (#125)
      category: SOCIAL_CATEGORY_LABEL[a.category as SocialCategory] ?? undefined,
    })),
  }
}
