import { z } from 'zod'
import { GENERATABLE_CONTENT_TYPES, SdgGoalSchema } from '@/lib/enums'

/**
 * POST /api/sdg-analysis/[id]/content 요청 body (#92).
 *
 * - type: 신규 생성 가능 4유형만 (CAMPAIGN_SLOGAN은 구버전 데이터 표시 전용)
 * - focusSdg: 홍보할 SDG 단일 선택 — 해당 분석의 매칭에 존재해야 함 (route에서 검증)
 */
export const CreateContentSchema = z.object({
  type: z.enum(GENERATABLE_CONTENT_TYPES, {
    message: '생성할 수 없는 콘텐츠 유형입니다.',
  }),
  focusSdg: SdgGoalSchema,
})

export type CreateContentInput = z.infer<typeof CreateContentSchema>