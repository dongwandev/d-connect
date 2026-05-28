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
])
export type ContentType = z.infer<typeof ContentTypeSchema>

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

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  SNS_POST: 'SNS 게시글',
  CARD_NEWS: '카드뉴스 문안',
  SHORT_VIDEO_SCRIPT: '숏폼 영상 대본',
  CAMPAIGN_SLOGAN: '캠페인 슬로건',
}
