import { z } from 'zod'

/**
 * AI 응답의 표준 zod 스키마.
 *
 * 실제 키워드/카테고리 enum은 DB 모델 확정(다음 회의/PR) 후 채운다.
 * 본 PR은 골격만 — 후속 PR에서 SDG 목표 / 사회적 기능 카테고리 등을 정형화한다.
 */

// --- SDGs 분석 ---------------------------------------------------------------

export const SdgGoalSchema = z.enum(['SDG_8', 'SDG_11', 'SDG_12', 'SDG_17'])
export type SdgGoal = z.infer<typeof SdgGoalSchema>

export const SdgMatchSchema = z.object({
  sdg: SdgGoalSchema,
  score: z.number().min(0).max(100),
  keywords: z.array(z.string()),
  rationale: z.string(),
})
export type SdgMatch = z.infer<typeof SdgMatchSchema>

export const SdgAnalysisResultSchema = z.object({
  matches: z.array(SdgMatchSchema),
  socialFunctions: z.array(z.string()), // 추후 enum 정형화 (고용/환경/지역경제/공동체/협력)
  publicMeaning: z.string(),
})
export type SdgAnalysisResult = z.infer<typeof SdgAnalysisResultSchema>

// --- 콘텐츠 생성 -------------------------------------------------------------

export const ContentTypeSchema = z.enum([
  'SNS_POST',
  'CARD_NEWS',
  'SHORT_VIDEO_SCRIPT',
  'CAMPAIGN_SLOGAN',
])
export type ContentType = z.infer<typeof ContentTypeSchema>

export const GeneratedContentSchema = z.object({
  type: ContentTypeSchema,
  body: z.string(),
  hashtags: z.array(z.string()),
  imagePrompt: z.string().optional(),
})
export type GeneratedContent = z.infer<typeof GeneratedContentSchema>
