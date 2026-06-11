import { z } from 'zod'

/**
 * Prisma 모델 enum의 클라이언트 친화 zod 미러.
 *
 * Prisma generated client(`@/generated/prisma`)은 server-only 코드를 끌어오므로
 * 클라이언트 컴포넌트가 import할 수 없다. 본 모듈은 같은 값을 순수 zod로
 * 정의해 server/client 양쪽에서 사용 가능하게 한다.
 *
 * **반드시 `prisma/schema.prisma`의 enum 값과 일치시켜야 한다.**
 * 값이 어긋나면 런타임 DB 쓰기 시 Prisma가 거부한다.
 */

export const SdgGoalSchema = z.enum(['SDG_8', 'SDG_11', 'SDG_12', 'SDG_17'])
export type SdgGoal = z.infer<typeof SdgGoalSchema>

export const ContentTypeSchema = z.enum([
  'SNS_POST',
  'CARD_NEWS',
  'SHORT_VIDEO_SCRIPT',
  'CAMPAIGN_SLOGAN',
  'POSTER',
])
export type ContentType = z.infer<typeof ContentTypeSchema>

/**
 * 신규 생성 가능한 콘텐츠 유형 (#92 파이프라인 개편).
 * CAMPAIGN_SLOGAN은 기존 데이터 표시용으로만 남고 신규 생성에서 제외.
 */
export const GENERATABLE_CONTENT_TYPES = [
  'SNS_POST',
  'CARD_NEWS',
  'SHORT_VIDEO_SCRIPT',
  'POSTER',
] as const satisfies readonly ContentType[]

export const SocialCategorySchema = z.enum([
  'EMPLOYMENT',
  'ENVIRONMENT',
  'LOCAL_ECONOMY',
  'COMMUNITY',
  'COOPERATION',
])
export type SocialCategory = z.infer<typeof SocialCategorySchema>

/**
 * UI 표시용 한글 라벨.
 */
export const SOCIAL_CATEGORY_LABEL: Record<SocialCategory, string> = {
  EMPLOYMENT: '고용',
  ENVIRONMENT: '환경',
  LOCAL_ECONOMY: '지역경제',
  COMMUNITY: '공동체',
  COOPERATION: '협력',
}

export const SDG_GOAL_LABEL: Record<SdgGoal, string> = {
  SDG_8: 'SDG 8 · 양질의 일자리와 경제성장',
  SDG_11: 'SDG 11 · 지속가능한 도시와 공동체',
  SDG_12: 'SDG 12 · 책임 있는 소비와 생산',
  SDG_17: 'SDG 17 · 목표를 위한 파트너십',
}

/** UN 공식 SDG 컬러 (sdgs.un.org 브랜드 가이드) — 카드·배지 공용 */
export const SDG_COLOR: Record<SdgGoal, string> = {
  SDG_8: '#A21942',
  SDG_11: '#FD9D24',
  SDG_12: '#BF8B2E',
  SDG_17: '#19486A',
}

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  SNS_POST: 'SNS 게시글',
  CARD_NEWS: '카드뉴스 문안',
  SHORT_VIDEO_SCRIPT: '숏폼 생성 프롬프트',
  CAMPAIGN_SLOGAN: '캠페인 슬로건',
  POSTER: '포스터',
}

/** 유형별 산출물 한 줄 설명 — 생성 버튼·콘텐츠 카드 안내용 (#92) */
export const CONTENT_TYPE_HINT: Record<ContentType, string> = {
  SNS_POST: '바로 게시할 수 있는 완성 텍스트',
  CARD_NEWS: '슬라이드별 문안 (3~5장)',
  SHORT_VIDEO_SCRIPT: '영상 생성 AI에 붙여넣는 영어 프롬프트 + 한국어 안내',
  CAMPAIGN_SLOGAN: '캠페인 슬로건 후보 (구버전)',
  POSTER: '이미지 생성 AI용 영어 프롬프트 + 포스터 문구',
}

// --- D2 enum 라벨 (디자인 이미지 2 기반) -------------------------------------

export const BusinessTypeSchema = z.enum([
  'INDIVIDUAL',
  'CORPORATION',
  'SOCIAL_ENTERPRISE',
  'COOPERATIVE',
  'OTHER',
])
export type BusinessType = z.infer<typeof BusinessTypeSchema>
export const BUSINESS_TYPE_LABEL: Record<BusinessType, string> = {
  INDIVIDUAL: '개인사업자',
  CORPORATION: '법인사업자',
  SOCIAL_ENTERPRISE: '사회적기업',
  COOPERATIVE: '협동조합',
  OTHER: '기타',
}

export const SidoSchema = z.enum([
  'SEOUL',
  'BUSAN',
  'DAEGU',
  'INCHEON',
  'GWANGJU',
  'DAEJEON',
  'ULSAN',
  'SEJONG',
  'GYEONGGI',
  'GANGWON',
  'CHUNGBUK',
  'CHUNGNAM',
  'JEONBUK',
  'JEONNAM',
  'GYEONGBUK',
  'GYEONGNAM',
  'JEJU',
])
export type Sido = z.infer<typeof SidoSchema>
export const SIDO_LABEL: Record<Sido, string> = {
  SEOUL: '서울특별시',
  BUSAN: '부산광역시',
  DAEGU: '대구광역시',
  INCHEON: '인천광역시',
  GWANGJU: '광주광역시',
  DAEJEON: '대전광역시',
  ULSAN: '울산광역시',
  SEJONG: '세종특별자치시',
  GYEONGGI: '경기도',
  GANGWON: '강원특별자치도',
  CHUNGBUK: '충청북도',
  CHUNGNAM: '충청남도',
  JEONBUK: '전북특별자치도',
  JEONNAM: '전라남도',
  GYEONGBUK: '경상북도',
  GYEONGNAM: '경상남도',
  JEJU: '제주특별자치도',
}

export const IndustryCategorySchema = z.enum([
  'FOOD_BEVERAGE',
  'RETAIL',
  'SERVICE',
  'EDUCATION',
  'CULTURE_ARTS',
  'ENVIRONMENT_IND',
  'MANUFACTURING',
  'OTHER',
])
export type IndustryCategory = z.infer<typeof IndustryCategorySchema>
export const INDUSTRY_CATEGORY_LABEL: Record<IndustryCategory, string> = {
  FOOD_BEVERAGE: '식품·음료',
  RETAIL: '소매·유통',
  SERVICE: '서비스',
  EDUCATION: '교육',
  CULTURE_ARTS: '문화·예술',
  ENVIRONMENT_IND: '환경',
  MANUFACTURING: '제조',
  OTHER: '기타',
}
export const INDUSTRY_CATEGORY_ICON: Record<IndustryCategory, string> = {
  FOOD_BEVERAGE: '🍴',
  RETAIL: '🛒',
  SERVICE: '🧑‍💼',
  EDUCATION: '📘',
  CULTURE_ARTS: '🎨',
  ENVIRONMENT_IND: '🌿',
  MANUFACTURING: '🏭',
  OTHER: '⋯',
}

export const TargetAudienceSchema = z.enum([
  'ALL',
  'YOUTH',
  'FAMILY',
  'SENIOR',
  'LOCAL_RESIDENT',
  'OTHER',
])
export type TargetAudience = z.infer<typeof TargetAudienceSchema>
export const TARGET_AUDIENCE_LABEL: Record<TargetAudience, string> = {
  ALL: '전체',
  YOUTH: '청년',
  FAMILY: '가족',
  SENIOR: '시니어',
  LOCAL_RESIDENT: '지역주민',
  OTHER: '기타',
}

export const PromoGoalSchema = z.enum([
  'BRAND_AWARENESS',
  'PRODUCT_PROMO',
  'SALES_GROWTH',
  'LOCAL_AWARENESS',
  'INVESTMENT',
  'OTHER',
])
export type PromoGoal = z.infer<typeof PromoGoalSchema>
export const PROMO_GOAL_LABEL: Record<PromoGoal, string> = {
  BRAND_AWARENESS: '브랜드 인지도 향상',
  PRODUCT_PROMO: '제품·서비스 홍보',
  SALES_GROWTH: '판매·매출 증대',
  LOCAL_AWARENESS: '지역사회 인식 개선',
  INVESTMENT: '투자·후원 유치',
  OTHER: '기타',
}
