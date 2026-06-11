/**
 * 시스템 프롬프트 / 사용자 프롬프트 빌더.
 *
 * 각 분석 종류별로 파일을 분리한다.
 *   - sdg-analysis.ts — SDGs 분석
 *   - content-generation.ts — 콘텐츠 생성
 */

/**
 * 분석·생성 함수가 공통으로 받는 기업 입력 (#92 — 등록 폼 전체 필드 반영).
 *
 * enum 필드는 호출 측(toCompanyInput)에서 한국어 라벨로 변환해 담는다 —
 * 프롬프트는 'FOOD_BEVERAGE'가 아니라 '식품·음료'를 받아야 한다.
 */
export interface CompanyInput {
  name: string
  foundedYear?: number | null
  /** 사업자 형태 한국어 라벨 (예: 협동조합) */
  businessType?: string | null
  /** 업종 한국어 라벨 (예: 식품·음료) */
  industry?: string | null
  /** 지역 (예: 대전광역시 유성구) */
  region?: string | null
  product?: string | null
  /** 타겟 한국어 라벨 목록 (예: 청년, 지역주민) */
  targetAudiences?: ReadonlyArray<string>
  /** 홍보 목표 한국어 라벨 목록 (예: 지역사회 인식 개선) */
  promoGoals?: ReadonlyArray<string>
  activities: ReadonlyArray<{
    title: string
    description: string
  }>
}

/** 프롬프트 공용 — [기업 정보] 블록. 미입력 필드는 줄 자체를 생략한다. */
export function buildCompanyBlock(company: CompanyInput): string {
  const lines = [
    `- 이름: ${company.name}`,
    company.foundedYear ? `- 설립연도: ${company.foundedYear}년` : null,
    company.businessType ? `- 사업자 형태: ${company.businessType}` : null,
    company.industry ? `- 업종: ${company.industry}` : null,
    company.region ? `- 지역: ${company.region}` : null,
    company.product ? `- 제품·서비스: ${company.product}` : null,
    company.targetAudiences?.length
      ? `- 홍보 타겟: ${company.targetAudiences.join(', ')}`
      : null,
    company.promoGoals?.length
      ? `- 홍보 목표: ${company.promoGoals.join(', ')}`
      : null,
  ]
  return lines.filter(Boolean).join('\n')
}

// SDGs 분석 — sdg-analysis.ts에 본문 구현. 호출자는 이쪽에서 가져올 것:
export {
  SDG_ANALYSIS_SYSTEM_PROMPT,
  buildSdgAnalysisPrompt,
} from './sdg-analysis'
