import { z } from 'zod'
import { SocialCategorySchema } from '@/lib/enums'

/**
 * POST /api/companies 요청 body.
 *
 * 사양: docs/API.md §3.1 (atomic — 기업 + 1개 이상의 활동을 한 번에 생성).
 *
 * 메시지는 모두 사용자 노출용 한글. zod의 영문 default를 덮어쓴다.
 */
export const CreateCompanySchema = z.object({
  name: z
    .string({ message: '기업명을 입력해주세요.' })
    .min(1, '기업명을 입력해주세요.')
    .max(100, '기업명은 100자 이내로 입력해주세요.'),
  industry: z
    .string()
    .max(50, '업종은 50자 이내로 입력해주세요.')
    .optional(),
  region: z
    .string()
    .max(50, '소재 지역은 50자 이내로 입력해주세요.')
    .optional(),
  product: z
    .string()
    .max(200, '제품·서비스는 200자 이내로 입력해주세요.')
    .optional(),
  purpose: z
    .string()
    .max(500, '홍보 목적은 500자 이내로 입력해주세요.')
    .optional(),
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
