import { z } from 'zod'
import {
  ContentTypeSchema,
  SdgGoalSchema,
  SocialCategorySchema,
} from '@/lib/enums'

/**
 * AI 응답의 표준 zod 스키마.
 *
 * 기본 enum은 클라이언트와 공유 가능한 `@/lib/enums`에서 가져온다.
 * 실제 키워드/카테고리는 DB 모델과 정합 (DB_SCHEMA.md, API.md 참고).
 */

// --- Re-export (호출자 편의) -------------------------------------------------

export type { ContentType, SdgGoal, SocialCategory } from '@/lib/enums'

// --- SDGs 분석 ---------------------------------------------------------------

export const SdgMatchSchema = z.object({
  sdg: SdgGoalSchema,
  score: z.number().int().min(0).max(100),
  keywords: z.array(z.string()).min(1),
  rationale: z.string().min(1),
})
export type SdgMatch = z.infer<typeof SdgMatchSchema>

export const SdgAnalysisResultSchema = z.object({
  matches: z.array(SdgMatchSchema).min(1),
  socialFunctions: z.array(SocialCategorySchema).min(1),
  publicMeaning: z.string().min(1),
})
export type SdgAnalysisResult = z.infer<typeof SdgAnalysisResultSchema>

// --- 콘텐츠 생성 -------------------------------------------------------------

export const GeneratedContentSchema = z
  .object({
    type: ContentTypeSchema,
    body: z.string().min(1),
    hashtags: z.array(z.string()),
    imagePrompt: z.string().optional(),
  })
  .refine(
    // 숏폼·포스터는 외부 생성형 AI용 영어 프롬프트가 산출물의 핵심 (#92) —
    // 누락 시 검증 실패로 처리해 mock fallback이 동작하게 한다
    (v) =>
      !['SHORT_VIDEO_SCRIPT', 'POSTER'].includes(v.type) ||
      Boolean(v.imagePrompt?.trim()),
    { message: '숏폼·포스터는 imagePrompt(생성 프롬프트)가 필수입니다.' },
  )
export type GeneratedContent = z.infer<typeof GeneratedContentSchema>
