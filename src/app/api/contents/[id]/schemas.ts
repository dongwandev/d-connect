import { z } from 'zod'

/**
 * PATCH /api/contents/[id] 요청 body.
 * 사양: docs/API.md §5.3
 *
 * 모든 필드 optional, 단 하나 이상 제공 필수.
 */
export const UpdateContentSchema = z
  .object({
    body: z
      .string()
      .min(1, '본문을 입력해주세요.')
      .max(5000, '본문은 5000자 이내로 입력해주세요.')
      .optional(),
    hashtags: z
      .array(z.string().max(50, '해시태그는 50자 이내로 입력해주세요.'))
      .max(20, '해시태그는 최대 20개까지 입력 가능합니다.')
      .optional(),
    imagePrompt: z
      .string()
      .max(500, '이미지 프롬프트는 500자 이내로 입력해주세요.')
      .nullable()
      .optional(),
  })
  .refine(
    (v) =>
      v.body !== undefined ||
      v.hashtags !== undefined ||
      v.imagePrompt !== undefined,
    { message: '하나 이상의 필드가 필요합니다.' },
  )

export type UpdateContentInput = z.infer<typeof UpdateContentSchema>
