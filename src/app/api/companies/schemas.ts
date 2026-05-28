import { z } from 'zod'
import { SocialCategorySchema } from '@/lib/enums'

/**
 * POST /api/companies 요청 body.
 *
 * 사양: docs/API.md §3.1 (atomic — 기업 + 1개 이상의 활동을 한 번에 생성).
 */
export const CreateCompanySchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().max(50).optional(),
  region: z.string().max(50).optional(),
  product: z.string().max(200).optional(),
  purpose: z.string().max(500).optional(),
  activities: z
    .array(
      z.object({
        category: SocialCategorySchema,
        title: z.string().min(1).max(100),
        description: z.string().min(1).max(1000),
      }),
    )
    .min(1, '활동을 1개 이상 입력해주세요.'),
})

export type CreateCompanyInput = z.infer<typeof CreateCompanySchema>
