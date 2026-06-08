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
 *
 * 폼 미선택('') → undefined 정규화는 client form 쪽에서 setValueAs로 처리한다.
 * (schema에서 preprocess를 쓰면 react-hook-form zodResolver와 input/output 타입이 어긋남.)
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

  // .catch(undefined) — 라디오/select 미선택 시 form state가 ''이면 zod가 invalid_enum_value로
  // 영문 raw 메시지를 띄우므로, optional enum은 invalid 값을 만나도 undefined로 fallback.
  businessType: BusinessTypeSchema.optional().catch(undefined),

  sido: SidoSchema.optional().catch(undefined),
  sigungu: z
    .string()
    .max(50, '시/군/구는 50자 이내로 입력해주세요.')
    .optional(),

  industryCategory: IndustryCategorySchema.optional().catch(undefined),

  product: z
    .string()
    .max(300, '제품·서비스는 300자 이내로 입력해주세요.')
    .optional(),

  /// 다중 선택 (D6). 비어 있어도 OK.
  targetAudiences: z.array(TargetAudienceSchema).max(6).optional(),
  promoGoals: z.array(PromoGoalSchema).max(6).optional(),

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
