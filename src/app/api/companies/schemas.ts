import { z } from 'zod'
import {
  BusinessTypeSchema,
  IndustryCategorySchema,
  PromoGoalSchema,
  SidoSchema,
  SocialCategorySchema,
  TargetAudienceSchema,
} from '@/lib/enums'

/**
 * POST /api/companies 요청 body.
 * 사양: docs/API.md §3.1 + D2 풍부한 폼 필드 (디자인 이미지 2).
 */
export const CreateCompanySchema = z.object({
  name: z
    .string({ message: '기업명을 입력해주세요.' })
    .min(1, '기업명을 입력해주세요.')
    .max(100, '기업명은 100자 이내로 입력해주세요.'),

  foundedYear: z
    .number()
    .int()
    .min(1900, '1900년 이후 값을 입력해주세요.')
    .max(2100, '2100년 이전 값을 입력해주세요.')
    .optional(),

  businessType: BusinessTypeSchema.optional(),

  sido: SidoSchema.optional(),
  sigungu: z
    .string()
    .max(50, '시/군/구는 50자 이내로 입력해주세요.')
    .optional(),

  industryCategory: IndustryCategorySchema.optional(),

  product: z
    .string()
    .max(300, '제품·서비스는 300자 이내로 입력해주세요.')
    .optional(),

  targetAudience: TargetAudienceSchema.optional(),
  promoGoal: PromoGoalSchema.optional(),

  activities: z
    .array(
      z.object({
        category: SocialCategorySchema,
        title: z
          .string({ message: '활동 제목을 입력해주세요.' })
          .min(1, '활동 제목을 입력해주세요.')
          .max(100, '활동 제목은 100자 이내로 입력해주세요.'),
        description: z
          .string({ message: '활동 설명을 입력해주세요.' })
          .min(1, '활동 설명을 입력해주세요.')
          .max(1000, '활동 설명은 1000자 이내로 입력해주세요.'),
      }),
    )
    .min(1, '활동을 1개 이상 입력해주세요.'),
})

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>
