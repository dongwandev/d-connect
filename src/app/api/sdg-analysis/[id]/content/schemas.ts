import { z } from 'zod'
import {
  AspectRatioSchema,
  GENERATABLE_CONTENT_TYPES,
  ImageStyleSchema,
  SdgGoalSchema,
  SnsPlatformSchema,
} from '@/lib/enums'

/**
 * POST /api/sdg-analysis/[id]/content 요청 body (#92, #104).
 *
 * - type: 신규 생성 가능 4유형만 (CAMPAIGN_SLOGAN은 구버전 데이터 표시 전용)
 * - focusSdg: 홍보할 SDG 단일 선택 — 해당 분석의 매칭에 존재해야 함 (route에서 검증)
 * - 세부 설정(#104): 대상 SNS·비율·이미지 스타일 필수, 장 수는 CARD_NEWS 전용
 */
export const CreateContentSchema = z
  .object({
    type: z.enum(GENERATABLE_CONTENT_TYPES, {
      message: '생성할 수 없는 콘텐츠 유형입니다.',
    }),
    focusSdg: SdgGoalSchema,
    platform: SnsPlatformSchema,
    aspectRatio: AspectRatioSchema,
    imageStyle: ImageStyleSchema,
    slideCount: z
      .number()
      .int()
      .min(3, '카드 수는 3~8장 사이로 선택해주세요.')
      .max(8, '카드 수는 3~8장 사이로 선택해주세요.')
      .optional(),
    extraRequest: z
      .string()
      .max(200, '추가 요청은 200자 이내로 입력해주세요.')
      .optional(),
  })
  .refine((v) => v.type !== 'CARD_NEWS' || v.slideCount !== undefined, {
    message: '카드뉴스는 카드 수를 선택해주세요.',
    path: ['slideCount'],
  })

export type CreateContentInput = z.infer<typeof CreateContentSchema>